// 📁 data/MOBS.js
// Base de datos de mobs — refObjId → nombre, nivel, raza, etc.
// Formato: { [refObjId]: { name, level, race, type, ... } }

const MOBS = {
    // ── Ejemplos (VSRO) ─────────────────────────────────
    // 10001: { name: "Wild Wolf",       level: 1,  race: "animal" },
    // 10002: { name: "Brown Bear",      level: 5,  race: "animal" },
    // 10101: { name: "Bandit Swordsman", level: 10, race: "human" },
    // 10201: { name: "Oni Axe",         level: 20, race: "oni" },
    // 10301: { name: "Tiger Girl",      level: 30, race: "beast" },
    // 10401: { name: "Hell Knight",     level: 40, race: "undead" },
    // 10501: { name: "Yeti",            level: 50, race: "giant" },
    // 10601: { name: "Stone Golem",     level: 60, race: "construct" },
    // 10701: { name: "Fire Dragon",     level: 70, race: "dragon" },
    // 10801: { name: "Dark Elf Mage",   level: 80, race: "elf" },
    // 10901: { name: "Demon Lord",      level: 90, race: "demon" },
};

export default MOBS;
