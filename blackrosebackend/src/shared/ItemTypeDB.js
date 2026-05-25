/**
 * ItemTypeDB.js - Lookup rápido de TypeID2 por itemID
 * 
 * Carga el items.json una sola vez y proporciona
 * una búsqueda O(1) del TypeID2 para cada item.
 * 
 * TypeID2: 1 = Equipable, 2 = CoS/Pet, 3 = Etc
 */

import fs from 'fs';
import path from 'path';

let itemTypeMap = null;

/**
 * Carga el items.json y lo indexa por ID para lookup O(1).
 * Solo almacena TypeID2 para minimizar memoria.
 */
export function loadItemTypeDB() {
    if (itemTypeMap) return itemTypeMap;

    const jsonPath = path.resolve(process.cwd(), '../blackroseweb/public/data/items.json');
    console.log('[ItemTypeDB] Loading items from:', jsonPath);

    const raw = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(raw);
    const itemsArray = data.items || data;

    itemTypeMap = new Map();
    for (const item of itemsArray) {
        itemTypeMap.set(item.ID, {
            TypeID2: item.TypeID2,
            TypeID3: item.TypeID3,
            TypeID4: item.TypeID4,
        });
    }

    console.log(`[ItemTypeDB] Loaded ${itemTypeMap.size} item types`);
    return itemTypeMap;
}

/**
 * Devuelve TypeID2 para un item dado su ID.
 * @param {number} id - ItemRefID
 * @returns {number} TypeID2 (1=Equipable, 2=CoS, 3=Etc) o 0 si no encontrado
 */
export function getTypeID2(id) {
    if (!itemTypeMap) return 0;
    const info = itemTypeMap.get(id);
    return info ? info.TypeID2 : 0;
}

/**
 * Devuelve TypeID4 para un item dado su ID.
 * @param {number} id - ItemRefID
 * @returns {number} TypeID4 o 0 si no encontrado
 */
export function getTypeID4(id) {
    if (!itemTypeMap) return 0;
    const info = itemTypeMap.get(id);
    return info ? info.TypeID4 : 0;
}
