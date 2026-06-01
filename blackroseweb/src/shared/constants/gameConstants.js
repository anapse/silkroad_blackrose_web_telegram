/* ═══════════════════════════════════════════════════════════
   gameConstants.js
   ═══════════════════════════════════════════════════════════
   MAP usa los tiles detallados de /interface/minimap/
   (tile por región, formato XxZ.webp)
═══════════════════════════════════════════════════════════ */

export const GAME_CONSTANTS = {
  MAP: {
    MIN_X: 26,
    MAX_X: 252,
    MIN_Z: 37,
    MAX_Z: 126,
    BASE_TILE_SZ: 192,
    TILE_STEP: 1,
    UNITS_PER_REGION: 192,
    WORLD_SCALE: 192 / 192,
    TILE_RADIUS: 5,
    CANVAS_W: (2 * 5 + 1) * 192,
    CANVAS_H: (2 * 5 + 1) * 192,
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

// (Derived values are now inline in the MAP object above)
