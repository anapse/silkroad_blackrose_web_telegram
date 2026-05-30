// 📁 data/NPCS.js
// Base de datos de NPCs — refObjId → nombre, oficio, etc.
// Formato: { [refObjId]: { name, job, type, ... } }

const NPCS = {
    // ── NPCs comunes VSRO (refObjId 1907-1940 aprox) ───
    // 1907: { name: "Stable Keeper",    job: "stable" },
    // 1908: { name: "Item Mall",        job: "mall" },
    // 1909: { name: "Gate Keeper",      job: "gate" },
    // 1910: { name: "Blacksmith",       job: "blacksmith" },
    // 1911: { name: "Potion Seller",    job: "potion" },
    // 1912: { name: "Storage Keeper",   job: "storage" },
    // 1913: { name: "Fortress Admin",   job: "fortress" },
    // 1914: { name: "Academy Teacher",  job: "academy" },
    // 1915: { name: "Pet Trainer",      job: "pet" },
    // 1916: { name: "Guild Master",     job: "guild" },
    // 1917: { name: "Arena Manager",    job: "arena" },
    // 1918: { name: "Event Master",     job: "event" },
    // 1919: { name: "Weapon Merchant",  job: "weapon" },
    // 1920: { name: "Armor Merchant",   job: "armor" },
    // 1921: { name: "Accessory Merchant", job: "accessory" },
    // 1922: { name: "Alchemist",        job: "alchemist" },
    // 1923: { name: "Trainer",          job: "trainer" },
    // 1924: { name: "Scroll Merchant",  job: "scroll" },
    // 1925: { name: "Union Manager",    job: "union" },
    // 1926: { name: "Banker",           job: "bank" },
    // 1927: { name: "Travel Merchant",  job: "travel" },
    // 1928: { name: "Fortification",    job: "fortify" },
    // 1929: { name: "Elite Merchant",   job: "elite" },
    // 1930: { name: "Job Manager",      job: "job" },
    // 1931: { name: "Arena Guard",      job: "guard" },
    // 1932: { name: "Herald",           job: "herald" },
    // 1933: { name: "Town Crier",       job: "crier" },
    // 1934: { name: "Stable Hand",      job: "stable_hand" },
    // 1935: { name: "Inn Keeper",       job: "inn" },
    // 1936: { name: "Merchant",         job: "merchant" },
};

export default NPCS;
