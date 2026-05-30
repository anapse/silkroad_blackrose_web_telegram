import { worldRegionKey, cityPlayArea, normalizedWorldInCity } from "./geo.js";
import { pointInRect } from "./math.js";

/**
 * Verifica si hay un portal en una coordenada mundial específica.
 */
function cityPortalAtWorld(city, worldX, worldZ, side = "worldRect") {
  const point = normalizedWorldInCity(city, worldX, worldZ);
  return city.portals?.find(portal => portal[side] && pointInRect(point, portal[side])) ?? null;
}

/**
 * Verifica si hay un portal en una coordenada de imagen (píxeles).
 */
function cityPortalAtImage(city, px, py, fitMode = "gridToImage") {
  const area = cityPlayArea(city);
  const areaX = fitMode === "imageToGrid" ? 0 : area.x;
  const areaY = fitMode === "imageToGrid" ? 0 : area.y;
  const point = {
    x: (px - areaX) / area.w,
    y: (py - areaY) / area.h,
  };
  return city.portals?.find(portal => portal.cityRect && pointInRect(point, portal.cityRect)) ?? null;
}

/**
 * Verifica si una coordenada mundial está dentro de los límites técnicos de una ciudad.
 */
function isWorldInsideCity(city, worldX, worldZ, R) {
  return (
    worldX >= city.worldMinX && worldX < city.worldMaxX &&
    worldZ >= city.worldMinZ && worldZ < city.worldMaxZ &&
    city.regionSet.has(worldRegionKey(worldX, worldZ, R))
  );
}

/**
 * Busca la ciudad correspondiente a una posición mundial.
 */
function cityForPlayer(worldX, worldZ, cityRegions, R) {
  return cityRegions.find(city => (
    worldX >= city.worldMinX && worldX < city.worldMaxX &&
    worldZ >= city.worldMinZ && worldZ < city.worldMaxZ &&
    city.regionSet.has(worldRegionKey(worldX, worldZ, R))
  )) ?? null;
}

/**
 * Convierte coordenadas mundiales a píxeles locales de la imagen de la ciudad.
 */
function cityWorldToImage(city, worldX, worldZ, fitMode = "gridToImage") {
  const area = cityPlayArea(city);
  const cW = city.worldMaxX - city.worldMinX;
  const cH = city.worldMaxZ - city.worldMinZ;
  const localX = ((worldX - city.worldMinX) / cW) * area.w;
  const localY = (1 - (worldZ - city.worldMinZ) / cH) * area.h;

  return {
    x: fitMode === "imageToGrid" ? localX : area.x + localX,
    y: fitMode === "imageToGrid" ? localY : area.y + localY,
  };
}

/**
 * Convierte píxeles locales de la imagen de la ciudad a coordenadas mundiales.
 */
function cityImageToWorld(city, px, py, fitMode = "gridToImage") {
  const area = cityPlayArea(city);
  const cW = city.worldMaxX - city.worldMinX;
  const cH = city.worldMaxZ - city.worldMinZ;
  const areaX = fitMode === "imageToGrid" ? 0 : area.x;
  const areaY = fitMode === "imageToGrid" ? 0 : area.y;
  const x = Math.max(areaX, Math.min(areaX + area.w, px));
  const y = Math.max(areaY, Math.min(areaY + area.h, py));
  
  return {
    worldX: city.worldMinX + ((x - areaX) / area.w) * cW,
    worldZ: city.worldMinZ + (1 - ((y - areaY) / area.h)) * cH,
  };
}

/**
 * Limita una coordenada mundial a los límites de la ciudad.
 */
function clampWorldToCity(city, worldX, worldZ, R) {
  const edge = 0.001;
  const clampedX = Math.max(city.worldMinX, Math.min(city.worldMaxX - edge, worldX));
  const clampedZ = Math.max(city.worldMinZ, Math.min(city.worldMaxZ - edge, worldZ));

  if (isWorldInsideCity(city, clampedX, clampedZ, R)) {
    return { worldX: clampedX, worldZ: clampedZ };
  }

  let nearest = null;
  for (const region of city.regions) {
    const minX = region.x * R;
    const maxX = (region.x + 1) * R - edge;
    const minZ = region.z * R;
    const maxZ = (region.z + 1) * R - edge;
    const x = Math.max(minX, Math.min(maxX, clampedX));
    const z = Math.max(minZ, Math.min(maxZ, clampedZ));
    const dist = Math.hypot(x - clampedX, z - clampedZ);
    if (!nearest || dist < nearest.dist) nearest = { worldX: x, worldZ: z, dist };
  }

  return nearest ?? { worldX: clampedX, worldZ: clampedZ };
}

/**
 * Empuja al jugador fuera de la ciudad al cruzar un portal de salida.
 */
function nudgeWorldOutsideCity(city, worldX, worldZ, R, nudgeAmount) {
  if (!isWorldInsideCity(city, worldX, worldZ, R)) return { worldX, worldZ };

  const distances = [
    { side: "left", value: Math.abs(worldX - city.worldMinX) },
    { side: "right", value: Math.abs(city.worldMaxX - worldX) },
    { side: "bottom", value: Math.abs(worldZ - city.worldMinZ) },
    { side: "top", value: Math.abs(city.worldMaxZ - worldZ) },
  ].sort((a, b) => a.value - b.value);

  switch (distances[0].side) {
    case "left":   return { worldX: city.worldMinX - nudgeAmount, worldZ };
    case "right":  return { worldX: city.worldMaxX + nudgeAmount, worldZ };
    case "bottom": return { worldX, worldZ: city.worldMinZ - nudgeAmount };
    case "top":    return { worldX, worldZ: city.worldMaxZ + nudgeAmount };
    default:       return { worldX, worldZ };
  }
}

export {
  cityPortalAtWorld,
  cityPortalAtImage,
  isWorldInsideCity,
  cityForPlayer,
  cityWorldToImage,
  cityImageToWorld,
  clampWorldToCity,
  nudgeWorldOutsideCity
};
