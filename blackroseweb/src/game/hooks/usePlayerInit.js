import { useState, useMemo, useRef, useEffect } from "react";
import { GAME_CONSTANTS } from "../../shared/constants/gameConstants.js";
import { playerToCanvas, regionXYToWorld } from "../utils/geo.js";
import { createPacketQueue } from "../../protocol/packetQueue.js";

const MAP_CANVAS_W = GAME_CONSTANTS.MAP.CANVAS_W;
const MAP_CANVAS_H = GAME_CONSTANTS.MAP.CANVAS_H;
const TILE_RADIUS = GAME_CONSTANTS.MAP.TILE_RADIUS;

/**
 * Umbral mínimo de cambio de posición (world units) para actualizar el estado.
 * Cambios menores a este valor se ignoran a menos que haya pasado el tiempo máximo.
 */
const POSITION_THRESHOLD = 0.5;
const MAX_TIME_BETWEEN_UPDATES_MS = 100;

/**
 * Hook para procesar los datos iniciales del jugador y el personaje.
 * Se re-ejecuta cuando wsPlayer cambia (llega PLAYER_POSITION_INIT, PLAYER_UPDATE, etc).
 * 
 * Incluye sistema de cola de paquetes para evitar oscilación de cámara
 * causada por PLAYER_MOVE_CONFIRMED vs PLAYER_UPDATE compitiendo.
 * 
 * La posición viene EXCLUSIVAMENTE del WebSocket (opcodes del gameserver).
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

  // ── COLA DE PAQUETES ──
  const packetQueueRef = useRef(null);
  // Ref para mantener siempre actualizada la función applyPosition dentro del callback de la cola
  const applyPositionRef = useRef(null);

  // Inicializar la cola de paquetes
  if (!packetQueueRef.current) {
    const queueCallback = (mergedPos) => {
      // Usar la última versión de applyPosition (evita closure stale)
      if (applyPositionRef.current) {
        applyPositionRef.current(mergedPos);
      }
    };
    packetQueueRef.current = createPacketQueue(queueCallback);
  }

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

  /**
   * Aplica una posición ya filtrada por la cola de paquetes.
   * Este método se llama desde el rAF de packetQueue.
   */
  function applyPosition(wsData) {
    if (!wsData || wsData.region == null || wsData.posX == null) return;

    const regionId = Number(wsData.region);
    const posX = Number(wsData.posX);
    const posZ = Number(wsData.posZ ?? 0);
    const { regionX, regionZ, worldX, worldZ } = regionXYToWorld(
      regionId & 0xFF, (regionId >> 8) & 0xFF, posX, posZ
    );
    const posY = wsData?.posY ?? null;

    // Verificar umbral de cambio mínimo
    const lastPos = lastConfirmedPos.current;
    const now = performance.now();
    const hasLastPos = lastPos.worldX != null && lastPos.worldZ != null;
    const dist = hasLastPos
      ? Math.sqrt((worldX - lastPos.worldX) ** 2 + (worldZ - lastPos.worldZ) ** 2)
      : Infinity;
    const timeSinceLastUpdate = hasLastPos ? now - lastPos.time : Infinity;

    if (hasLastPos && dist < POSITION_THRESHOLD && timeSinceLastUpdate < MAX_TIME_BETWEEN_UPDATES_MS) {
      console.log(`[usePlayerInit] ⏭ Posición ignorada por umbral (dist=${dist.toFixed(2)} < ${POSITION_THRESHOLD})`);
      return;
    }

    // Actualizar caché
    lastConfirmedPos.current = { worldX, worldZ, time: now };

    // Inicializar cámara solo la primera vez
    if (!hasPositionRef.current) {
      hasPositionRef.current = true;
      cameraRef.current = { wx: worldX, wz: worldZ };
    }

    setPlayers((prev) => {
      const prevMe = prev?.me;

      // Si no hay prevMe o no tiene posición, actualizar directamente
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
          hp: wsData?.hp ?? prevMe?.hp ?? 0,
          maxHp: wsData?.maxHp ?? prevMe?.maxHp ?? 0,
          mp: wsData?.mp ?? prevMe?.mp ?? 0,
          maxMp: wsData?.maxMp ?? prevMe?.maxMp ?? 0,
          level: wsData?.level ?? prevMe?.level ?? character?.level ?? 1,
          race,
          regionX, regionZ,
          posX, posZ, posY,
          angle: prevMe?.angle ?? 0,
          moving: prevMe?.moving ?? false,
          speed: WALK_SPEED_WU,
        };
        return { me };
      }

      // Preservar cameraWX/cameraWZ y estado de movimiento
      const me = {
        ...prevMe,
        worldX, worldZ,
        renderX: playerToCanvas(regionX, regionZ, posX, posZ).canvasX,
        renderZ: playerToCanvas(regionX, regionZ, posX, posZ).canvasZ,
        regionX, regionZ,
        posX, posZ, posY,
      };

      // Si el servidor detuvo al jugador, marcar _stopped
      if (wsData._stopped) {
        me._stopped = wsData._stopped;
        me.moving = false;
      }

      return { me };
    });
  }

  // Sincronizar applyPositionRef con la última versión (evita closures stale en packetQueue)
  applyPositionRef.current = applyPosition;

  // ── SINCRONIZAR wsPlayer → cola de paquetes ──
  useEffect(() => {
    if (!wsPlayer) return;

    // Detectar qué tipo de actualización es por la marca _source
    const type = wsPlayer._source === 'PLAYER_MOVE_CONFIRMED' ? 'PLAYER_MOVE_CONFIRMED' : 'PLAYER_UPDATE';

    // Caso especial: PLAYER_STOPPED
    if (wsPlayer._stopped) {
      // Aplicar directamente (STOPPED no debe filtrarse)
      if (wsPlayer.region != null && wsPlayer.posX != null) {
        applyPosition({
          region: wsPlayer.region,
          posX: wsPlayer.posX,
          posZ: wsPlayer.posZ,
          posY: wsPlayer.posY,
          _stopped: wsPlayer._stopped,
        });
      }
      return;
    }

    // Caso especial: primera posición (PLAYER_POSITION_INIT)
    if (!hasPositionRef.current && wsPlayer.region != null && wsPlayer.posX != null) {
      applyPosition({
        region: wsPlayer.region,
        posX: wsPlayer.posX,
        posZ: wsPlayer.posZ,
        posY: wsPlayer.posY,
      });
      return;
    }

    // Encolar para procesamiento con rate limiting
    if (wsPlayer.region != null && wsPlayer.posX != null) {
      packetQueueRef.current.push(
        type,
        wsPlayer.region,
        wsPlayer.posX,
        wsPlayer.posZ,
        wsPlayer.posY
      );
    }
  }, [wsPlayer]);

  // Resetear la cola cuando el personaje cambia
  useEffect(() => {
    packetQueueRef.current?.reset();
    hasPositionRef.current = false;
    lastConfirmedPos.current = { worldX: null, worldZ: null, time: 0 };
  }, [character?.refObjId]);

  return { players, setPlayers, race };
}
