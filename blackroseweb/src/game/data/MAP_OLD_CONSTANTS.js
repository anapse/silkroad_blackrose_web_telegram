/* ═══════════════════════════════════════════════════════════
   MAP_OLD_CONSTANTS.js — Backup del sistema de mapa anterior
   (worldmap con tiles map_world_XxZ.png, TILE_STEP=4)
   Conservado por si se necesita restaurar.
═══════════════════════════════════════════════════════════ */

export const MAP_OLD = {
    MIN_X: 46,
    MAX_X: 174,
    MIN_Z: 73,
    MAX_Z: 113,
    BASE_TILE_SZ: 256,
    TILE_STEP: 4,
    UNITS_PER_REGION: 192,
    TILE_PATH: "/interface/worldmap/map/map_world_",
    TILE_EXT: ".png",
};

// Derived
const { MIN_X, MAX_X, MIN_Z, MAX_Z, BASE_TILE_SZ, TILE_STEP, UNITS_PER_REGION } = MAP_OLD;
MAP_OLD.WORLD_SCALE = (TILE_STEP * UNITS_PER_REGION) / BASE_TILE_SZ;
MAP_OLD.CANVAS_W = ((MAX_X - MIN_X) / TILE_STEP + 1) * BASE_TILE_SZ;
MAP_OLD.CANVAS_H = ((MAX_Z - MIN_Z) / TILE_STEP + 1) * BASE_TILE_SZ;
