import { useState, useMemo, useRef, useEffect } from "react";
import { GAME_CONSTANTS } from "../../shared/constants/gameConstants.js";

const MAP_CANVAS_W = GAME_CONSTANTS.MAP.CANVAS_W;
const MAP_CANVAS_H = GAME_CONSTANTS.MAP.CANVAS_H;
const TILE_RADIUS = GAME_CONSTANTS.MAP.TILE_RADIUS;

/**
 * Hook para procesar los datos iniciales del jugador y el personaje.
 * Se re-ejecuta cuando wsPlayer cambia (llega PLAYER_POSITION_INIT, PLAYER_UPDATE, etc).
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

  // Sincronizar wsPlayer → players (sin causar loops)
  useEffect(() => {
    if (!wsPlayer || wsPlayer.region == null || wsPlayer.posX == null) return;

    const regionId = Number(wsPlayer.region);
    const regionX = regionId & 0xFF;
    const regionZ = (regionId >> 8) & 0xFF;
    const posX = Number(wsPlayer.posX);
    const posZ = Number(wsPlayer.posZ ?? 0);
    const worldX = ((regionX - 135) * UNITS_PER_REGION) + posX;
    const worldZ = ((regionZ - 92) * UNITS_PER_REGION) + posZ;
    const posY = wsPlayer?.posY ?? null;

    // Inicializar cámara solo la primera vez
    if (!hasPositionRef.current) {
      hasPositionRef.current = true;
      cameraRef.current = { wx: worldX, wz: worldZ };
    }

    // Detectar si el servidor detuvo al jugador (PLAYER_STOPPED)
    const stopped = wsPlayer._stopped;
    
    setPlayers((prev) => {
      const prevMe = prev?.me;
      // Preservar cameraWX/cameraWZ y estado de movimiento
      const me = {
        id: "me",
        charName: character?.name || user?.username,
        worldX, worldZ,
        cameraWX: prevMe?.cameraWX ?? cameraRef.current.wx ?? worldX,
        cameraWZ: prevMe?.cameraWZ ?? cameraRef.current.wz ?? worldZ,
        isFollowingPlayer: true,
        // renderX/Z: posición del jugador en píxeles del canvas
        // tile central empieza en TILE_RADIUS * UNITS_PER_REGION = 960
        renderX: (TILE_RADIUS * UNITS_PER_REGION) + posX,
        renderZ: (TILE_RADIUS * UNITS_PER_REGION) - posZ,
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
        _targetWX: prevMe?._targetWX,
        _targetWZ: prevMe?._targetWZ,
      };
      
      // Si el servidor detuvo al jugador, marcar _stopped para que useGameLoop cancele interpolación
      if (stopped) {
        me._stopped = stopped;
        me._targetWX = undefined;
        me._targetWZ = undefined;
        me.moving = false;
      }
      
      return { me };
    });
  }, [wsPlayer, character, UNITS_PER_REGION, WALK_SPEED_WU, race]);

  return { players, setPlayers, race };
}
