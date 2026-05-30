// 📁 game/utils/entityNames.js
// Carga los JSON de public/data/ y resuelve nombres de entidades
// usando mob_names.json y npc_names.json (del textdata_object.txt)
// relacionados por refObjId a través de mobs.json y npcs.json.

let mobLookup = null;   // { refObjId: 'nombre_real' }
let npcLookup = null;   // { refObjId: 'nombre_real' }
let loadPromise = null;

/**
 * Carga y relaciona los datos.
 */
export async function loadEntityData() {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
        try {
            const [mobsRes, npcsRes, mobNamesRes, npcNamesRes] = await Promise.all([
                fetch('/data/mobs.json'),
                fetch('/data/npcs.json'),
                fetch('/data/mob_names.json'),
                fetch('/data/npc_names.json'),
            ]);
            const mobs = await mobsRes.json();
            const npcs = await npcsRes.json();
            const mobNames = await mobNamesRes.json();
            const npcNames = await npcNamesRes.json();

            // Relacionar mobs: CodeName128 'MOB_CH_MANGNYANG' -> key 'SN_MOB_CH_MANGNYANG'
            mobLookup = {};
            for (const mob of mobs) {
                const snKey = 'SN_' + mob.CodeName128;
                if (mobNames[snKey]) {
                    mobLookup[mob.ID] = mobNames[snKey];
                }
            }

            // Relacionar npcs
            npcLookup = {};
            for (const npc of npcs) {
                const snKey = 'SN_' + npc.CodeName128;
                if (npcNames[snKey]) {
                    npcLookup[npc.ID] = npcNames[snKey];
                }
            }

            console.log(`[entityNames] Cargados ${Object.keys(mobLookup).length} mobs, ${Object.keys(npcLookup).length} npcs`);
        } catch (err) {
            console.warn('[entityNames] Failed to load entity data:', err);
            mobLookup = {};
            npcLookup = {};
        }
    })();
    return loadPromise;
}

/**
 * Busca el nombre real de una entidad por refObjId y tipo.
 */
export function getEntityName(refObjId, entityType) {
    const id = Number(refObjId);

    if (entityType === 'MOB' && mobLookup) {
        return mobLookup[id] || null;
    }

    if ((entityType === 'NPC' || entityType === 'CHAR') && npcLookup) {
        return npcLookup[id] || null;
    }

    return null;
}
