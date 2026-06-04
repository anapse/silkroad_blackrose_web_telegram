import { useState, useRef, useEffect } from "react";
import { playerToCanvas, regionXYToWorld } from "../utils/geo.js";

/**
 * Hook para procesar los datos del jugador desde el WebSocket.
 * La ÚNICA fuente de posición es PLAYER_UPDATE (0xB023).
 * PLAYER_MOVE_CONFIRMED (0xB021) ya no actualiza posición (solo log).
 * 
 * El clic en el mapa solo envía el paquete MOVE al servidor.
 * La posición se actualiza exclusivamente cuando el servidor responde.
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

  // Sincronizar wsPlayer → players
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

    // Inicializar cámara solo la primera vez
    if (!hasPositionRef.current) {
      hasPositionRef.current = true;
      cameraRef.current = { wx: worldX, wz: worldZ };
    }

    setPlayers((prev) => {
      const prevMe = prev?.me;
      if (!prevMe || prevMe.worldX == null) {
        return {
          me: {
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
            regionX, regionZ, posX, posZ, posY,
            angle: 0, moving: false, speed: WALK_SPEED_WU,
          }
        };
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
