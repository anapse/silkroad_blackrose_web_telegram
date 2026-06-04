// 📁 game/utils/entityNames.js
// Carga mobs.json / npc_names.json y relaciona por refObjId
// para obtener el nombre real de cada entidad.

let mobLookup = null;   // { refObjId: 'nombre_real' }
let npcLookup = null;   // { refObjId: 'nombre_real' }
let typeLookup = null;  // { refObjId: 'MOB' | 'NPC' | 'CHAR' } según CodeName128
let charIds = null;     // Set de IDs de personajes (chars.json)

// Set para evitar logs repetidos de nombres faltantes
const loggedMissingIds = new Set();

/**
 * Carga datos: mobs.json + mob_names.json + chars.json, etc.
 */
export async function loadEntityData() {
  try {
    const ts = Date.now();
    const [mobsRes, npcsRes, mobNamesRes, npcNamesRes, charsRes] = await Promise.all([
      fetch(`/data/mobs.json?_t=${ts}`),
      fetch(`/data/npcs.json?_t=${ts}`),
      fetch(`/data/mob_names.json?_t=${ts}`),
      fetch(`/data/npc_names.json?_t=${ts}`),
      fetch(`/data/chars.json?_t=${ts}`),
    ]);
    const mobs = await mobsRes.json();
    const npcs = await npcsRes.json();
    const mobNames = await mobNamesRes.json();
    const npcNames = await npcNamesRes.json();
    const chars = await charsRes.json();
    
    // Construir Set de IDs de personajes
    charIds = new Set(chars?.map(c => c.ID) || []);
    console.log(`[entityNames] chars.json=${chars?.length} IDs cargados, ejemplo: ${[...(charIds||[])].slice(0,3).join(',')}`);

    // Relacionar: CodeName128 + 'SN_' → key en mob_names.json
    mobLookup = {};
    typeLookup = {};
    for (const mob of mobs) {
      const snKey = 'SN_' + mob.CodeName128;
      if (mobNames[snKey]) {
        mobLookup[mob.ID] = mobNames[snKey];
      }
      if (mob.CodeName128.startsWith('MOB_')) typeLookup[mob.ID] = 'MOB';
      else if (mob.CodeName128.startsWith('CHAR_')) {
        // Si está en chars.json → CHAR, si no → NPC
        typeLookup[mob.ID] = charIds.has(mob.ID) ? 'CHAR' : 'NPC';
      }
    }

    // NPCs: intentar 'SN_' + CodeName128 y 'SN_NPC_' + sufijo
    npcLookup = {};
    for (const npc of npcs) {
      let name = npcNames['SN_' + npc.CodeName128];
      if (!name && npc.CodeName128.startsWith('CHAR_')) {
        const suffix = npc.CodeName128.substring(5);
        name = npcNames['SN_NPC_' + suffix];
      }
      if (name) npcLookup[npc.ID] = name;
    }

    console.log(`[entityNames] Cargados ${Object.keys(mobLookup).length} mobs, ${Object.keys(npcLookup).length} npcs`);
  } catch (err) {
    console.warn('[entityNames] Error:', err);
    mobLookup = {};
    npcLookup = {};
  }
}

/**
 * Busca nombre real por refObjId. Busca en ambos lookups (mob y npc)
 * porque el servidor clasifica por rango de IDs, no por tipo real.
 * Ej: refObjId=1935 (MOB_CH_BIGEYEGHOST) pero el servidor lo etiqueta como 'NPC'.
 * Si no encuentra nombre en los lookups pero el refObjId está en chars.json,
 * devuelve el nombre del personaje (CHAR) si está disponible.
 */
export function getEntityName(refObjId, entityType) {
  const id = Number(refObjId);
  if (!id) {
    console.log(`[getEntityName] ⚠️ sin refObjId, entityType=${entityType}`);
    return null;
  }

  // Buscar en ambos lookups siempre
  if (mobLookup && mobLookup[id]) {
    return mobLookup[id];
  }
  if (npcLookup && npcLookup[id]) {
    return npcLookup[id];
  }

  // Si es CHAR (está en chars.json), devolver null sin log
  // El nombre real vendrá del paquete spawn (name=) o del nameCache
  if (charIds && charIds.has(id)) {
    return null;
  }

  // Solo log una vez por refObjId (evita miles de logs repetidos)
  if (!typeLookup?.[id]) {
    if (!loggedMissingIds.has(id)) {
      loggedMissingIds.add(id);
      console.log(`[getEntityName] ❌ NO NAME for refObjId=${id} entityType=${entityType}`);
    }
  }
  return null;
}

/**
 * Determina el tipo REAL de la entidad según su CodeName128 (prefijo) + chars.json.
 * El servidor clasifica por rango de IDs, pero eso es incorrecto para el color.
 * Ej: refObjId=1935 tiene CodeName128=MOB_CH_BIGEYEGHOST → realType='MOB'
 *     refObjId=1908 está en chars.json (CHAR_CH_MAN_BOGY) → realType='CHAR'
 *     refObjId=14722 está en npcs.json pero NO en chars.json → realType='NPC'
 */
export function getRealEntityType(refObjId) {
  const id = Number(refObjId);
  if (!id) return null;
  
  // 1) Si typeLookup tiene el ID, usar ese (MOB, NPC o CHAR)
  if (typeLookup && typeLookup[id]) return typeLookup[id];
  
  // 2) Si está en chars.json → CHAR (aunque no esté en mobs.json)
  if (charIds && charIds.has(id)) return 'CHAR';
  
  // 3) No se pudo determinar
  return null;
}
