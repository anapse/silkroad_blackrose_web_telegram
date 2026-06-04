import { useState, useRef, useEffect } from "react";
import { playerToCanvas, regionXYToWorld } from "../utils/geo.js";

/**
 * Umbral mínimo de cambio de posición (world units) para actualizar el estado.
 * Cambios menores a este valor se ignoran a menos que haya pasado el tiempo máximo.
 * 
 * Nota: Con el sistema de posición autoritativa (PLAYER_MOVE_CONFIRMED como única
 * fuente de escritura), este umbral actúa como defensa en profundidad contra
 * fluctuaciones sub-pixel.
 */
const POSITION_THRESHOLD = 0.5;
const MAX_TIME_BETWEEN_UPDATES_MS = 100;

/**
 * Hook para procesar los datos iniciales del jugador y el personaje.
 * Se re-ejecuta cuando wsPlayer cambia (llega PLAYER_POSITION_INIT, PLAYER_UPDATE, etc).
 * 
 * La posición autoritativa viene de PLAYER_MOVE_CONFIRMED (0xB021).
 * PLAYER_UPDATE (0xB023) ya no modifica posX/posZ a menos que haya
 * una corrección > 3.0 unidades (manejado en GameSocketContext).
 */
export function usePlayerInit({ user, character, constants, wsPlayer }) {
  const { UNITS_PER_REGION = 192, WALK_SPEED_WU = 0.375 } = constants || {};

  // Determinar Raza (esto sí puede calcularse de entrada)
  const rid = Number(character?.refObjId || 0);
  const race = ((rid >= 14722 && rid <= 15000) || (rid >= 1919 && rid <= 1930)) ? "euro" : "china";

  // Referencia para saber si es la primera posición recibida
  const hasPositionRef = useRef(false);
  // Referencia para preservar cameraWX/cameraWZ entre actualizaciones
  const cameraRef = useRef({ wx: null, wz: null });

  // ── CACHE DE ÚLTIMA POSICIÓN CONFIRMADA (para umbral) ──
  const lastConfirmedPos = useRef({ worldX: null, worldZ: null, time: 0 });

  // Estado del jugador
  const [players, setPlayers] = useState({
    me: {
      id: "me",
      charName: character?.name || user?.username,
      worldX: null, worldZ: null,
      cameraWX: null, cameraWZ: null,
      isFollowingPlayer: true,
      renderX: null, renderZ: null,
      hp: 0, maxHp: 0, mp: 0, maxMp: 0,
      level: character?.level || 1,
      race,
      regionX: null, regionZ: null,
      posX: null, posZ: null, posY: null,
      angle: 0, moving: false, speed: WALK_SPEED_WU,
    }
  });

  // Sincronizar wsPlayer → players con filtro de umbral
  useEffect(() => {
    if (!wsPlayer || wsPlayer.region == null || wsPlayer.posX == null) return;

    const regionId = Number(wsPlayer.region);
    const posX = Number(wsPlayer.posX);
    const posZ = Number(wsPlayer.posZ ?? 0);
    const { regionX, regionZ, worldX, worldZ } = regionXYToWorld(
      regionId & 0xFF, (regionId >> 8) & 0xFF, posX, posZ
    );
    const posY = wsPlayer?.posY ?? null;
    const stopped = wsPlayer._stopped;

    // ── FILTRO DE UMBRAL ──
    // Solo se salta si la fuente NO es PLAYER_MOVE_CONFIRMED y el cambio es mínimo.
    // PLAYER_MOVE_CONFIRMED siempre pasa (es la fuente autoritativa).
    const isAuthoritative = wsPlayer._source === 'PLAYER_MOVE_CONFIRMED' || stopped;
    if (!isAuthoritative && hasPositionRef.current) {
      const lastPos = lastConfirmedPos.current;
      const now = performance.now();
      if (lastPos.worldX != null && lastPos.worldZ != null) {
        const dx = worldX - lastPos.worldX;
        const dz = worldZ - lastPos.worldZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const timeSinceLastUpdate = now - lastPos.time;

        if (dist < POSITION_THRESHOLD && timeSinceLastUpdate < MAX_TIME_BETWEEN_UPDATES_MS) {
          // Silencioso — no loguear para no saturar consola
          return;
        }
      }
    }

    // Actualizar caché
    lastConfirmedPos.current = { worldX, worldZ, time: performance.now() };

    // Inicializar cámara solo la primera vez
    if (!hasPositionRef.current) {
      hasPositionRef.current = true;
      cameraRef.current = { wx: worldX, wz: worldZ };
    }

    setPlayers((prev) => {
      const prevMe = prev?.me;

      if (!prevMe || prevMe.worldX == null) {
        const me = {
          id: "me",
          charName: character?.name || user?.username,
          worldX, worldZ,
          cameraWX: cameraRef.current.wx ?? worldX,
          cameraWZ: cameraRef.current.wz ?? worldZ,
          isFollowingPlayer: true,
          renderX: playerToCanvas(regionX, regionZ, posX, posZ).canvasX,
          renderZ: playerToCanvas(regionX, regionZ, posX, posZ).canvasZ,
          hp: wsPlayer?.hp ?? prevMe?.hp ?? 0,
          maxHp: wsPlayer?.maxHp ?? prevMe?.maxHp ?? 0,
          mp: wsPlayer?.mp ?? prevMe?.mp ?? 0,
          maxMp: wsPlayer?.maxMp ?? prevMe?.maxMp ?? 0,
          level: wsPlayer?.level ?? prevMe?.level ?? character?.level ?? 1,
          race,
          regionX, regionZ,
          posX, posZ, posY,
          angle: prevMe?.angle ?? 0,
          moving: prevMe?.moving ?? false,
          speed: WALK_SPEED_WU,
        };
        return { me };
      }

      const me = {
        ...prevMe,
        worldX, worldZ,
        renderX: playerToCanvas(regionX, regionZ, posX, posZ).canvasX,
        renderZ: playerToCanvas(regionX, regionZ, posX, posZ).canvasZ,
        regionX, regionZ,
        posX, posZ, posY,
      };

      if (stopped) {
        me._stopped = stopped;
        me.moving = false;
      }

      return { me };
    });
  }, [wsPlayer, character, UNITS_PER_REGION, WALK_SPEED_WU, race]);

  return { players, setPlayers, race };
}
