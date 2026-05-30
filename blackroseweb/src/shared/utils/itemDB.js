/**
 * itemDB.js - Base de datos de items de Silkroad Online (VALIDADA)
 *
 * Carga el archivo /data/items_normalized.json que ya ha pasado
 * por el pipeline de validación (lowercase, sin espacios, rutas consistentes).
 *
 * Uso:
 *   import { getItem, getItemIcon } from '../utils/itemDB';
 *
 *   const item = await getItem(481883);
 *   const icon = getItemIcon(item); // → "/icon/item/china/weapon/sword_12.png"
 */

let itemsMap = null;
let loadPromise = null;

/**
 * Carga el JSON de items normalizados una sola vez y lo indexa por ID.
 * Si ya se cargó antes, no vuelve a hacer fetch.
 * Retorna el Map<number, object> con todos los items indexados.
 */
export async function loadItemDB() {
    if (itemsMap) return itemsMap;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        const response = await fetch('/data/items_normalized.json');
        if (!response.ok) {
            // Fallback al JSON original si el normalizado no existe
            const fallbackResp = await fetch('/data/items.json');
            if (!fallbackResp.ok) {
                throw new Error(`Error al cargar items: ${fallbackResp.status}`);
            }
            const fallbackData = await fallbackResp.json();
            const fallbackArray = fallbackData.items || fallbackData;
            itemsMap = new Map();
            for (const item of fallbackArray) {
                itemsMap.set(item.ID, item);
            }
            return itemsMap;
        }
        const data = await response.json();

        // El JSON viene con estructura { items: [...] }
        const itemsArray = data.items || data;

        itemsMap = new Map();
        for (const item of itemsArray) {
            itemsMap.set(item.ID, item);
        }

        return itemsMap;
    })();

    return loadPromise;
}

/**
 * Busca y devuelve un item por su ID instantáneamente.
 * Si la base de datos no se ha cargado aún, la carga automáticamente.
 *
 * @param {number} id - ID único del item
 * @returns {Promise<object|null>} El item encontrado o null si no existe
 */
export async function getItem(id) {
    const map = await loadItemDB();
    return map.get(id) || null;
}

/**
 * Convierte el campo AssocFileIcon128 (ruta .ddj con barras invertidas)
 * a una ruta PNG accesible desde /public/icon/.
 *
 * La ruta se normaliza a minúsculas para garantizar compatibilidad
 * en servidores Linux (case-sensitive).
 *
 * Ejemplo:
 *   "item\\china\\weapon\\sword_12.ddj"
 *   → "/icon/item/china/weapon/sword_12.png"
 *
 * @param {object} item - Objeto del item con campo AssocFileIcon128
 * @returns {string|null} Ruta completa del icono PNG o null si no hay icono
 */
export function getItemIcon(item) {
    if (!item || !item.AssocFileIcon128) return null;
    // Si ya es fallback, devolver directamente
    if (item.AssocFileIcon128 === 'icon_default.png') {
        return '/icon/icon_default.png';
    }
    return (
        '/icon/' +
        item.AssocFileIcon128
            .replace(/\\\\/g, '/')
            .replace(/\\/g, '/')
            .replace('.ddj', '.png')
            .toLowerCase()
    );
}
