/* ═══════════════════════════════════════════════════════════
   MARKERS.js — botones superpuestos en el mapa mundo
   action.type:
     "citymap" → abre el mapa de ciudad (CITY_MAPS.js)
     "dialog"  → popup de texto
     "url"     → abre enlace externo
═══════════════════════════════════════════════════════════ */

export const MARKERS = [

    /* ────────────────────────────────────────────────────────
          Ciudades / Cities
       ──────────────────────────────────────────────────────── */
    {
        id: "city_jangan",
        regionId: 25001,
        type: "city",
        label: "Jangan",
        icon: "/interface/worldmap/map/city_jangan_focus.png",
        iconFocus: "/interface/worldmap/map/city_jangan_press.png",
        action: { type: "citymap", map: "jangan" },   // ← abre mapa ciudad
        offset: { x: -7, y: 0 },
        labelOffset: { x: 0, y: -40 },
    },

    {
        id: "city_donhwang",
        regionId: 26266,
        type: "city",
        label: "Donwhang",
        icon: "/interface/worldmap/map/city_donhwang.png",
        iconFocus: "/interface/worldmap/map/city_donhwang_focus.png",
        labelOffset: { x: 0, y: -40 },
        action: { type: "citymap", map: "donhwang" },
    },

    /* ────────────────────────────────────────────────────────
         FORTALEZAS / FORTRESSES
    ──────────────────────────────────────────────────────── */
    {
        id: "fort_jangan",
        regionId: 23719,
        type: "fort",
        icon: "/interface/worldmap/map/fort_worldmap.png",
        labelOffset: { x: 0, y: -40 },
        action: { type: "dialog", text: "Jangan Fortress — Zona de combate PvP." },
    },

    {
        id: "bandid_fort",
        regionId: 23970,          // China West Ferry (x:158, z:91)
        type: "fort",
        label: "Bandid Fortress",
        icon: "/interface/worldmap/map/fort_small_worldmap.png",
        action: { type: "dialog", text: "Bandid Fortress — Zona de combate" },
        offset: { x: 20, y: 34 },
        labelOffset: { x: 0, y: -40 },
    },

    /* ────────────────────────────────────────────────────────
       PUERTAS / GATES
    ──────────────────────────────────────────────────────── */
    {
        id: "gate_china_east",
        regionId: 24990,          // China East Ferry (x:158, z:91)
        type: "poi",
        label: "China East Ferry",
        icon: "/interface/worldmap/map/xy_ferry.png",
        action: { type: "dialog", text: "China East Ferry — Punto de paso hacia el oeste" },
        offset: { x: 7, y: 18 },
    },
    {
        id: "gate_china_west",
        regionId: 24991,          // China West Ferry (x:158, z:91)
        type: "poi",
        label: "China West Ferry",
        icon: "/interface/worldmap/map/xy_ferry.png",
        action: { type: "dialog", text: "China West Ferry — Punto de paso hacia el Oeste" },
        offset: { x: 37, y: -2 },
    },


];
