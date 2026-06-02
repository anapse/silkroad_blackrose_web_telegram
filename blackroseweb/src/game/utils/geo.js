import { GAME_CONSTANTS } from "../../shared/constants/gameConstants.js";

/**
 * Sistema de coordenadas basado en xSROMap.
 * IG (In Game): worldX = (regionX - 135) * 192 + localX, worldZ = (regionZ - 91) * 192 + localZ
 * IC (Internal Client): x = localX * 10, z = localZ * 10
 * Mapa: lat = worldZ/192 + 91, lng = worldX/192 + 135
 */

// Acceso directo para evitar problemas de desestructuración con módulos
const UNITS_PER_REGION = GAME_CONSTANTS.MAP.UNITS_PER_REGION;
const WORLD_SCALE = GAME_CONSTANTS.MAP.WORLD_SCALE;
const TILE_RADIUS = GAME_CONSTANTS.MAP.TILE_RADIUS;
const BASE_TILE_SZ = GAME_CONSTANTS.MAP.BASE_TILE_SZ;

// Centro del canvas en píxeles
const CANVAS_CENTER = TILE_RADIUS * BASE_TILE_SZ + BASE_TILE_SZ / 2;

/**
 * World Units → píxeles de canvas.
 * Sistema centrado en el jugador (playerWX, playerWZ).
 * El canvas se desplaza con CSS translate3d, por lo que el punto (0,0) del canvas
 * es la esquina superior izquierda. La posición del jugador en píxeles se calcula
 * desde el tile central (TILE_RADIUS, TILE_RADIUS).
 * Cualquier otra entidad se posiciona RELATIVA al jugador en el viewport.
 *
 * Para otros players/entities, se usa worldToRender(wx, wz, playerWX, playerWZ)
 * que da la posición en píxeles RELATIVA al canvas (0,0).
 *
 * El offset del canvas (CSS translate3d) se encarga de centrar la vista.
 */
/**
 * Sistema de coordenadas de canvas BASADO EN TILES (único y estandarizado).
 * Convierte (regionX, regionZ, posX, posZ) de una entidad a píxeles absolutos
 * del canvas, usando la región del jugador como referencia (igual que los tiles).
 *
 * @param {number} regionX - Región X de la entidad
 * @param {number} regionZ - Región Z de la entidad (norte-sur)
 * @param {number} posX - Offset X dentro de la región (0-191, este positivo)
 * @param {number} posZ - Offset Z dentro de la región (0-191, norte positivo)
 * @param {number} playerRegionX - Región X del jugador
 * @param {number} playerRegionZ - Región Z del jugador
 * @returns {{ canvasX, canvasZ }} Coordenadas absolutas en píxeles del canvas
 */
export function coordToCanvas(regionX, regionZ, posX, posZ, playerRegionX, playerRegionZ) {
  const dx = regionX - playerRegionX;
  const dz = regionZ - playerRegionZ;
  return {
    canvasX: (TILE_RADIUS + dx) * BASE_TILE_SZ + posX,
    canvasZ: (TILE_RADIUS - dz) * BASE_TILE_SZ + posZ,
  };
}

/**
 * Helper para el player: calcula su posición en el canvas.
 * Usa la misma fórmula coordToCanvas pero con región del player.
 */
export function playerToCanvas(playerRegionX, playerRegionZ, playerPosX, playerPosZ) {
  return coordToCanvas(playerRegionX, playerRegionZ, playerPosX, playerPosZ, playerRegionX, playerRegionZ);
}

export const worldToRender = (wx, wz, playerWX = 0, playerWZ = 0) => {
  const dwx = wx - playerWX;
  const dwz = wz - playerWZ;
  return {
    renderX: (dwx / WORLD_SCALE) + (TILE_RADIUS * BASE_TILE_SZ),
    renderZ: -(dwz / WORLD_SCALE) + (TILE_RADIUS * BASE_TILE_SZ),
  };
};

export const renderToWorld = (rx, rz, playerWX = 0, playerWZ = 0) => ({
  worldX: playerWX + (rx - CANVAS_CENTER) * WORLD_SCALE,
  worldZ: playerWZ - (rz - CANVAS_CENTER) * WORLD_SCALE,
});

export const worldToGame = (wx, wz) => ({
  gameX: wx - 135 * UNITS_PER_REGION,
  gameY: wz - 91 * UNITS_PER_REGION,
});

export const gameToWorld = (gx, gy) => ({
  worldX: gx + 135 * UNITS_PER_REGION,
  worldZ: gy + 91 * UNITS_PER_REGION,
});

export const worldRegionKey = (worldX, worldZ) => {
  const R = UNITS_PER_REGION;
  return `${Math.floor(worldX / R)}_${Math.floor(worldZ / R)}`;
};

export const cityPlayArea = (city) =>
  city.playArea ?? { x: 0, y: 0, w: city.imageWidth, h: city.imageHeight };

export const normalizedWorldInCity = (city, worldX, worldZ) => ({
  x: (worldX - city.worldMinX) / (city.worldMaxX - city.worldMinX),
  y: 1 - (worldZ - city.worldMinZ) / (city.worldMaxZ - city.worldMinZ),
});

export const cityViewFrame = (city, fitMode) => {
  const area = cityPlayArea(city);
  if (fitMode === "imageToGrid") {
    return {
      width: area.w,
      height: area.h,
      imageStyle: { position: "absolute", left: -area.x, top: -area.y, width: city.imageWidth, height: city.imageHeight },
    };
  }
  return {
    width: city.imageWidth,
    height: area.y + area.h,
    imageStyle: { position: "absolute", left: 0, top: 0, width: city.imageWidth, height: city.imageHeight },
  };
};
