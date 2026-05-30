import { useState } from "react";
import { worldToRender } from "../utils/geo.js";

/**
 * Hook para procesar los datos iniciales del jugador y el personaje.
 * Solo se ejecuta UNA VEZ al montar el componente.
 * 
 * IMPORTANTE: NO usa API REST. NO usa fallbacks por raza. NO usa useMemo.
 * La posición viene EXCLUSIVAMENTE del WebSocket (opcodes del gameserver).
 * Si el WebSocket aún no tiene posición, todo queda en null
 * hasta que llegue PLAYER_POSITION_INIT o PLAYER_UPDATE.
 */
export function usePlayerInit({ user, character, constants, wsPlayer }) {
  const { UNITS_PER_REGION, WALK_SPEED_WU } = constants || {};

  // Determinar Raza (esto sí puede calcularse de entrada)
  const rid = Number(character?.refObjId || 0);
  const race = ((rid >= 14722 && rid <= 15000) || (rid >= 1919 && rid <= 1930)) ? "euro" : "china";

  // Posición: SOLO desde WebSocket — si no hay datos, todo null
  let worldX = null, worldZ = null;
  let regionX = null, regionZ = null;
  let posX = null, posZ = null;
  let renderX = null, renderZ = null;
  let posY = null;

  if (wsPlayer && wsPlayer.region != null && wsPlayer.posX != null) {
    const regionId = Number(wsPlayer.region);
    regionX = regionId & 0xFF;
    regionZ = (regionId >> 8) & 0xFF;
    posX = Math.max(0, Math.min(UNITS_PER_REGION, Number(wsPlayer.posX)));
    posZ = Math.max(0, Math.min(UNITS_PER_REGION, Number(wsPlayer.posZ || 0)));
    worldX = ((regionX - 135) * UNITS_PER_REGION) + posX;
    worldZ = ((regionZ - 92) * UNITS_PER_REGION) + posZ;
    posY = wsPlayer?.posY ?? null;
    const render = worldToRender(worldX, worldZ);
    renderX = render.renderX;
    renderZ = render.renderZ;
  }

  const [players, setPlayers] = useState({
    me: {
      id: "me",
      charName: character?.name || user?.username,
      worldX,
      worldZ,
      cameraWX: worldX,
      cameraWZ: worldZ,
      isFollowingPlayer: true,
      renderX,
      renderZ,
      hp: wsPlayer?.hp || 0,
      maxHp: wsPlayer?.maxHp || 0,
      mp: wsPlayer?.mp || 0,
      maxMp: wsPlayer?.maxMp || 0,
      level: character?.level || 1,
      race,
      regionX,
      regionZ,
      posX,
      posZ,
      posY,
      angle: 0, moving: false, speed: WALK_SPEED_WU,
      timestamp: Date.now(),
    }
  });

  return { players, setPlayers, race };
}
