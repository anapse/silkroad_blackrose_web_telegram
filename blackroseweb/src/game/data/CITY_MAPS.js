/* ═══════════════════════════════════════════════════════════
   CITY_MAPS.js
   Define cada mapa de ciudad:
     - id        → debe coincidir con action.map en MARKERS.js
     - name      → nombre visible
     - image     → ruta de la imagen (desde /public)
     - npcs      → lista de NPCs/tiendas sobre el mapa
                   x/y en porcentaje (0-100) sobre la imagen
                     x:0   = borde izquierdo
                     x:100 = borde derecho
                     y:0   = borde superior
                     y:100 = borde inferior
═══════════════════════════════════════════════════════════ */

export const CITY_MAPS = {

    /* ────────────────────────────────────────────────────────
       JANGAN
    ──────────────────────────────────────────────────────── */
    jangan: {
        id: "jangan",
        name: "Jangan",
        townName: "Town_Jangan",
        image: "/interface/worldmap/map/map_jangan.png",  // ← pon tu ruta real aquí
        imageWidth: 900,
        imageHeight: 600,
        playArea: { x: 0, y: 0, w: 900, h: 600 },
        portals: [
            {
                id: "jangan_west_gate",
                label: "West Gate",
                cityRect: { x1: 0.00, y1: 0.48, x2: 0.08, y2: 0.62 },
                worldRect: { x1: 0.00, y1: 0.48, x2: 0.08, y2: 0.62 },
            },
            {
                id: "jangan_east_gate",
                label: "East Gate",
                cityRect: { x1: 0.92, y1: 0.48, x2: 1.00, y2: 0.62 },
                worldRect: { x1: 0.92, y1: 0.48, x2: 1.00, y2: 0.62 },
            },
            {
                id: "jangan_south_gate",
                label: "South Gate",
                cityRect: { x1: 0.45, y1: 0.88, x2: 0.56, y2: 1.00 },
                worldRect: { x1: 0.45, y1: 0.88, x2: 0.56, y2: 1.00 },
            },
        ],
        npcs: [
            {
                id: "jangan_blacksmith",
                label: "Blacksmith",
                icon: "/interface/worldmap/map/npc_blacksmith.png",
                x: 42,   // % horizontal sobre la imagen
                y: 35,   // % vertical sobre la imagen
                action: { type: "dialog", text: "Blacksmith — Mejora tus armas y armaduras." },
            },
            {
                id: "jangan_storage",
                label: "Storage",
                icon: "/interface/worldmap/map/npc_storage.png",
                x: 52,
                y: 48,
                action: { type: "dialog", text: "Storage — Guarda tus objetos aquí." },
            },
            {
                id: "jangan_potion",
                label: "Drug Store",
                icon: "/interface/worldmap/map/npc_drugstore.png",
                x: 62,
                y: 30,
                action: { type: "dialog", text: "Drug Store — Compra pociones de vida y mana." },
            },
            {
                id: "jangan_stable",
                label: "Stable",
                icon: "/interface/worldmap/map/npc_stable.png",
                x: 38,
                y: 68,
                action: { type: "dialog", text: "Stable — Compra y cuida tus mascotas." },
            },
            {
                id: "jangan_grocery",
                label: "Grocery Shop",
                icon: "/interface/worldmap/map/npc_grocery.png",
                x: 60,
                y: 48,
                action: { type: "dialog", text: "Grocery Shop — Artículos básicos de aventura." },
            },
            {
                id: "jangan_specialty",
                label: "Specialty Shop",
                icon: "/interface/worldmap/map/npc_specialty.png",
                x: 62,
                y: 60,
                action: { type: "dialog", text: "Specialty Shop — Productos especiales de Jangan." },
            },
            {
                id: "jangan_gambling",
                label: "Gambling House",
                icon: "/interface/worldmap/map/npc_gambling.png",
                x: 72,
                y: 40,
                action: { type: "dialog", text: "Gambling House — ¡Prueba tu suerte!" },
            },
            {
                id: "jangan_trader",
                label: "Trader Yusuп",
                icon: "/interface/worldmap/map/npc_trader.png",
                x: 55,
                y: 60,
                action: { type: "dialog", text: "Trader — Comercia goods entre ciudades." },
            },

            /* ── Agrega más NPCs aquí ──
            {
              id:    "jangan_xxx",
              label: "Nombre NPC",
              icon:  "/interface/worldmap/map/npc_xxx.png",
              x: 50,   // ajusta con modo DEBUG
              y: 50,
              action: { type: "dialog", text: "Descripción del NPC." },
            },
            ── */
        ],
    },

    /* ────────────────────────────────────────────────────────
       DONWHANG — agrega su imagen y NPCs cuando los tengas
    ──────────────────────────────────────────────────────── */
    donhwang: {
        id: "donhwang",
        name: "Donwhang",
        townName: "Town_Dunhwang",
        image: "/interface/worldmap/donhwang_map.png",
        imageWidth: 900,
        imageHeight: 600,
        playArea: { x: 0, y: 0, w: 900, h: 600 },
        portals: [],
        npcs: [
            // igual que jangan, agrega los NPCs
        ],
    },

    /* ────────────────────────────────────────────────────────
       AGREGA MÁS CIUDADES AQUÍ
       Patrón:
       nombre_id: {
         id:    "nombre_id",
         name:  "Nombre Ciudad",
         image: "/interface/worldmap/nombre_map.png",
         npcs:  [ ... ],
       },
    ──────────────────────────────────────────────────────── */
};
