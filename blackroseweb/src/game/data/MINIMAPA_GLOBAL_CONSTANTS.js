/* ═══════════════════════════════════════════════════════════
   MINIMAPA_GLOBAL_CONSTANTS.js — Nuevo sistema de mapa global
   Usa los tiles detallados de /interface/minimapa/mapa_global/
   Formato: XxZ.webp (1 tile = 1 región)
═══════════════════════════════════════════════════════════ */

export const MINIMAPA_GLOBAL = {
    MIN_X: 26,
    MAX_X: 252,
    MIN_Z: 35,
    MAX_Z: 126,
    BASE_TILE_SZ: 256,    // Tamaño base de cada tile en píxeles del canvas
    TILE_STEP: 1,          // 1 tile = 1 región (mucho más detallado)
    UNITS_PER_REGION: 192,
    TILE_PATH: "/interface/minimapa/mapa_global/",
    TILE_EXT: ".webp",
};

// Derived values
const { MIN_X, MAX_X, MIN_Z, MAX_Z, BASE_TILE_SZ, TILE_STEP, UNITS_PER_REGION } = MINIMAPA_GLOBAL;

MINIMAPA_GLOBAL.WORLD_SCALE = (TILE_STEP * UNITS_PER_REGION) / BASE_TILE_SZ;
MINIMAPA_GLOBAL.CANVAS_W = ((MAX_X - MIN_X) / TILE_STEP + 1) * BASE_TILE_SZ;
MINIMAPA_GLOBAL.CANVAS_H = ((MAX_Z - MIN_Z) / TILE_STEP + 1) * BASE_TILE_SZ;
