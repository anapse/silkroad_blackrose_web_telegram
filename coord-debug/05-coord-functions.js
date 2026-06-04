// ================================================================
// Archivo: 05-coord-functions.js
// Todas las funciones de conversión de coordenadas
// ================================================================

// ----------------------------------------------------------------
// De: blackroseweb/src/game/utils/geo.js — Frontend
// Contenido completo
// ----------------------------------------------------------------
import { GAME_CONSTANTS } from "../../shared/constants/gameConstants.js";

/**
 * Sistema de coordenadas basado en xSROMap.
 * IG (In Game): worldX = (regionX - 135) * 192 + localX, worldZ = (regionZ - 92) * 192 + localZ
 * IC (Internal Client): x = localX * 10, z = localZ * 10
 * Mapa: lat = worldZ/192 + 92, lng = worldX/192 + 135
 */

// Acceso directo para evitar problemas de desestructuración con módulos
const UNITS_PER_REGION = GAME_CONSTANTS.MAP.UNITS_PER_REGION;
const WORLD_SCALE = GAME_CONSTANTS.MAP.WORLD_SCALE;
const TILE_RADIUS = GAME_CONSTANTS.MAP.TILE_RADIUS;
const BASE_TILE_SZ = GAME_CONSTANTS.MAP.BASE_TILE_SZ;

// Centro del canvas en píxeles (mismo origen que worldToRender)
const CANVAS_CENTER = TILE_RADIUS * BASE_TILE_SZ;

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
    canvasZ: (TILE_RADIUS - dz) * BASE_TILE_SZ + (BASE_TILE_SZ - posZ),
  };
}

/**
 * Helper para el player: calcula su posición en el canvas.
 * Usa la misma fórmula coordToCanvas pero con región del player.
 */
export function playerToCanvas(playerRegionX, playerRegionZ, playerPosX, playerPosZ) {
  return coordToCanvas(playerRegionX, playerRegionZ, playerPosX, playerPosZ, playerRegionX, playerRegionZ);
}

/**
 * Convierte coordenadas de región (sectorX, sectorZ) + offset a worldX/worldZ.
 * Versión que recibe sectorX y sectorZ ya separados, útil cuando ya se extrajo
 * el regionId en sus componentes.
 * @param {number} regionX - Sector X (low byte del regionId)
 * @param {number} regionZ - Sector Z (high byte del regionId)
 * @param {number} posX - Offset X dentro de la región (0-UNITS_PER_REGION)
 * @param {number} posZ - Offset Z dentro de la región (0-UNITS_PER_REGION)
 * @returns {{ regionX, regionZ, posX, posZ, worldX, worldZ }}
 */
export function regionXYToWorld(regionX, regionZ, posX, posZ) {
  const worldX = (regionX - 135) * UNITS_PER_REGION + Math.round(posX);
  const worldZ = (regionZ - 92) * UNITS_PER_REGION + Math.round(posZ);
  return { regionX, regionZ, posX: Math.round(posX), posZ: Math.round(posZ), worldX, worldZ };
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

/**
 * Convierte regionId + offsets a worldX/worldZ.
 * @param {number} regionId - ID de región (ushort)
 * @param {number} rawX - Offset X (0-191)
 * @param {number} rawZ - Offset Z norte-sur (0-191)
 * @param {number} [rawY] - Altitud (opcional)
 * @param {'spawn'|'movement'} [type='spawn'] - spawn: X,Y,Z | movement: X,Z,Y
 */
export function regionToWorld(regionId, rawX, rawZ, rawY, type = 'spawn') {
  const sectorX = regionId & 0xFF;
  const sectorZ = (regionId >> 8) & 0xFF;
  let offsetX, offsetZ;
  if (type === 'movement') {
    offsetX = rawX;
    offsetZ = rawZ;
  } else {
    // spawn: raw1=X, raw2=altitud, raw3=Z, pero acá llaman (rawX, rawZ, rawY)
    // rawX=posX, rawZ=posZ, rawY=altitud
    offsetX = rawX;
    offsetZ = rawZ;
  }
  const posX = Math.round(offsetX);
  const posZ = Math.round(offsetZ);
  const worldX = (sectorX - 135) * UNITS_PER_REGION + posX;
  const worldZ = (sectorZ - 92) * UNITS_PER_REGION + posZ;
  return { regionX: sectorX, regionZ: sectorZ, posX, posZ, worldX, worldZ };
}

export const worldToGame = (wx, wz) => ({
  gameX: wx - 135 * UNITS_PER_REGION,
  gameY: wz - 92 * UNITS_PER_REGION,
});

export const gameToWorld = (gx, gy) => ({
  worldX: gx + 135 * UNITS_PER_REGION,
  worldZ: gy + 92 * UNITS_PER_REGION,
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


// ----------------------------------------------------------------
// De: blackrosebackend/src/shared/utils/coordUtils.js — Backend
// Contenido completo
// ----------------------------------------------------------------
/**
 * 📐 CoordUtils - Conversión estandarizada de coordenadas Silkroad
 * 
 * Todos los cálculos de posición pasan por AQUÍ. Si hay que cambiar algo,
 * se cambia SOLO en esta función, no en los handlers.
 * 
 * Órdenes de ejes según cada opcode:
 * - spawn (0x3015/0x3019): X(1º), Y altitud(2º), Z norte-sur(3º) ← MerchBot
 * - chardata (0x3013):      X(1º), Y altitud(2º), Z norte-sur(3º) ← MerchBot
 * - movement (0xB021):      X(1º), Z norte-sur(2º), Y altitud(3º)
 */

const UNITS_PER_REGION = 192;
const CENTER_X = 135;
const CENTER_Z = 92;
const RATIO = 10;

/**
 * Calcula coordenadas mundial desde valores raw del paquete.
 * @param {number} sectorX - Sector X
 * @param {number} sectorZ - Sector Z (norte-sur)
 * @param {number} raw1 - 1er valor (float o short) Siempre X
 * @param {number} raw2 - 2do valor (float o short)
 * @param {number} raw3 - 3er valor (float o short)
 * @param {'spawn'|'chardata'|'movement'} type - Tipo de paquete
 * @returns {{ region, regionX, regionZ, posX, posZ, posY, worldX, worldZ }}
 */
export function calcWorldCoords(sectorX, sectorZ, raw1, raw2, raw3, type = 'spawn') {
    const region = sectorX | (sectorZ << 8);
    const regionX = sectorX;
    const regionZ = sectorZ;

    let offsetX, offsetZ, offsetY;

    if (type === 'movement') {
        // 0xB021: X(1º), Z norte-sur(2º), Y altitud(3º)
        offsetX = raw1;
        offsetZ = raw2;  // 2do = norte-sur
        offsetY = raw3;  // 3ro = altitud
    } else {
        // spawn y chardata: X(1º), Y altitud(2º), Z norte-sur(3º) ← MerchBot
        offsetX = raw1;  // 1ro = X
        offsetY = raw2;  // 2do = altitud
        offsetZ = raw3;  // 3ro = norte-sur
    }

    const posX = Math.round(offsetX / RATIO);
    const posZ = Math.round(offsetZ / RATIO);
    const posY = Math.round(offsetY / RATIO);
    const worldX = (sectorX - CENTER_X) * UNITS_PER_REGION + posX;
    const worldZ = (sectorZ - CENTER_Z) * UNITS_PER_REGION + posZ;

    return { region, regionX, regionZ, posX, posZ, posY, worldX, worldZ };
}

/**
 * Calcula worldX/worldZ desde regionId + offsets raw.
 */
export function regionToWorld(regionId, rawX, rawZ, rawY, type = 'spawn') {
    const sectorX = regionId & 0xFF;
    const sectorZ = (regionId >> 8) & 0xFF;
    return calcWorldCoords(sectorX, sectorZ, rawX, rawZ, rawY, type);
}
