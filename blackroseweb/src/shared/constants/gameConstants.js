/* ═══════════════════════════════════════════════════════════
   gameConstants.js
   ═══════════════════════════════════════════════════════════
   MAP usa los tiles detallados de /interface/minimap/
   (tile por región, formato XxZ.webp)
═══════════════════════════════════════════════════════════ */

export const GAME_CONSTANTS = {
  MAP: {
    MIN_X: 45,
    MAX_X: 116,
    MIN_Z: 57,
    MAX_Z: 101,
    BASE_TILE_SZ: 256,
    TILE_STEP: 1,
    UNITS_PER_REGION: 192,
  },
  MOVEMENT: {
    WALK_SPEED_WU: 0.375,
    MAX_CLICK_WU: 800,
    CITY_EXIT_NUDGE_WU: 0.01,
  },
  ICONS: {
    CITY: { w: 40, h: 40 },
    FORT: { w: 30, h: 30 },
    DUNGEON: { w: 48, h: 48 },
    NPC: { w: 32, h: 32 },
    POI: { w: 25, h: 25 },
  },
  STATS: {
    MAX_HP: 20000,
    MAX_MP: 20000,
  },
  // Character defaults based on race
  SPAWN: {
    CHINA: {
      REGION_X: 168,
      REGION_Z: 97,
      POS_X: 98.2,
      POS_Z: 14,
    },
    EUROPE: {
      REGION_X: 68,
      REGION_Z: 104,
      POS_X: 50,
      POS_Z: 50,
    }
  }
};

// Derived values
const { MIN_X, MAX_X, MIN_Z, MAX_Z, BASE_TILE_SZ, TILE_STEP, UNITS_PER_REGION } = GAME_CONSTANTS.MAP;

GAME_CONSTANTS.MAP.WORLD_SCALE = (TILE_STEP * UNITS_PER_REGION) / BASE_TILE_SZ;
GAME_CONSTANTS.MAP.CANVAS_W = ((MAX_X - MIN_X) / TILE_STEP + 1) * BASE_TILE_SZ;
GAME_CONSTANTS.MAP.CANVAS_H = ((MAX_Z - MIN_Z) / TILE_STEP + 1) * BASE_TILE_SZ;
