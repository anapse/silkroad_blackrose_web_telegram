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
 * El centro del canvas (CANVAS_CENTER) corresponde a la posición del jugador (playerWX, playerWZ).
 * Cualquier punto (wx, wz) se posiciona relativo al centro.
 */
export const worldToRender = (wx, wz, playerWX = 0, playerWZ = 0) => ({
  renderX: CANVAS_CENTER + (wx - playerWX) / WORLD_SCALE,
  renderZ: CANVAS_CENTER - (wz - playerWZ) / WORLD_SCALE,
});

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
