import { GAME_CONSTANTS } from "../../shared/constants/gameConstants.js";

const { MAP } = GAME_CONSTANTS;
const {
  MIN_X: MAP_MIN_X,
  MAX_Z: MAP_MAX_Z,
  UNITS_PER_REGION,
  WORLD_SCALE,
} = MAP;

// Offset para centrar coordenadas (como xSROMap: centro en region 135,91)
// gameX = worldX - 135*192, gameY = worldY - 91*192
const CENTER_REGION_X = 135;
const CENTER_REGION_Z = 91;
const CENTER_OFFSET_X = CENTER_REGION_X * UNITS_PER_REGION; // 25920
const CENTER_OFFSET_Z = CENTER_REGION_Z * UNITS_PER_REGION; // 17472

/**
 * Convierte píxeles de canvas a World Units de Silkroad.
 * Usa el sistema centrado de xSROMap para compatibilidad.
 */
export const renderToWorld = (rx, rz) => {
  return {
    worldX: MAP_MIN_X * UNITS_PER_REGION + rx * WORLD_SCALE,
    worldZ: (MAP_MAX_Z + 1) * UNITS_PER_REGION - rz * WORLD_SCALE,
  };
};

/**
 * Convierte World Units de Silkroad a píxeles de canvas.
 */
export const worldToRender = (wx, wz) => {
  return {
    renderX: (wx - MAP_MIN_X * UNITS_PER_REGION) / WORLD_SCALE,
    renderZ: ((MAP_MAX_Z + 1) * UNITS_PER_REGION - wz) / WORLD_SCALE,
  };
};

/**
 * Convierte World Units (region*192 + local) a Game Units (centrado en 0, como xSROMap).
 * Silkroad usa coordenadas IG (In Game) donde el centro del mapa está en (0,0).
 * Jangan: world=(32256,18624) -> game=(6336,1152)
 */
export const worldToGame = (wx, wz) => ({
  gameX: wx - CENTER_OFFSET_X,
  gameY: wz - CENTER_OFFSET_Z,
});

/**
 * Convierte Game Units (centrado en 0) a World Units.
 */
export const gameToWorld = (gx, gy) => ({
  worldX: gx + CENTER_OFFSET_X,
  worldZ: gy + CENTER_OFFSET_Z,
});

/**
 * Genera la clave de región (X_Z) basada en coordenadas mundiales.
 */
export const worldRegionKey = (worldX, worldZ) => {
  const R = UNITS_PER_REGION;
  return `${Math.floor(worldX / R)}_${Math.floor(worldZ / R)}`;
};

/**
 * Obtiene el área jugable de una ciudad.
 */
export const cityPlayArea = (city) => {
  return city.playArea ?? { x: 0, y: 0, w: city.imageWidth, h: city.imageHeight };
};

/**
 * Normaliza una posición dentro de una ciudad (de 0.0 a 1.0).
 */
export const normalizedWorldInCity = (city, worldX, worldZ) => {
  return {
    x: (worldX - city.worldMinX) / (city.worldMaxX - city.worldMinX),
    y: 1 - (worldZ - city.worldMinZ) / (city.worldMaxZ - city.worldMinZ),
  };
};

/**
 * Calcula el estilo y dimensiones del marco de vista de la ciudad.
 */
export const cityViewFrame = (city, fitMode) => {
  const area = cityPlayArea(city);
  if (fitMode === "imageToGrid") {
    return {
      width: area.w,
      height: area.h,
      imageStyle: {
        position: "absolute",
        left: -area.x,
        top: -area.y,
        width: city.imageWidth,
        height: city.imageHeight,
      },
    };
  }

  return {
    width: city.imageWidth,
    height: area.y + area.h,
    imageStyle: {
      position: "absolute",
      left: 0,
      top: 0,
      width: city.imageWidth,
      height: city.imageHeight,
    },
  };
};
