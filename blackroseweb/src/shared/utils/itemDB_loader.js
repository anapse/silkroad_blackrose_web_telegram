/**
 * itemDB_loader.js — Sistema de carga de items por chunks (VALIDADO)
 *
 * Carga el índice global una sola vez y los chunks bajo demanda.
 * Mantiene caché en memoria para acceso rápido.
 * Todos los items pasan por el pipeline de validación (lowercase, sin espacios).
 *
 * Uso:
 *   import { initItemDB, getItemById, getItemIcon } from '../utils/itemDB_loader';
 *
 *   await initItemDB();
 *   const item = getItemById(3652);
 *   const icon = getItemIcon(item); // → "/icon/item/china/woman_item/clothes_10_ba.png"
 */

const INDEX_URL = '/items_db/index.json';
const CHUNK_BASE = '/items_db/';
const FALLBACK_ICON = '/icon/icon_default.png';

let indexData = null;
let chunksCache = {};     // { chunkIndex: { range, items } }
let itemsMap = null;      // Map<number, object> — todos los items indexados por ID
let initPromise = null;

/**
 * Inicializa el sistema: carga el índice y el primer chunk.
 * Se puede llamar múltiples veces sin efecto secundario.
 */
export async function initItemDB() {
    if (itemsMap) return itemsMap;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        // 1. Cargar índice
        const idxResp = await fetch(INDEX_URL);
        if (!idxResp.ok) {
            throw new Error(`Error al cargar índice: ${idxResp.status}`);
        }
        indexData = await idxResp.json();

        // 2. Inicializar mapa
        itemsMap = new Map();

        // 3. Cargar primer chunk inmediatamente (más rápido para el arranque)
        await loadChunk(0);

        return itemsMap;
    })();

    return initPromise;
}

/**
 * Carga un chunk específico desde el servidor y lo indexa en memoria.
 * @param {number} chunkIndex - Índice del chunk a cargar
 */
async function loadChunk(chunkIndex) {
    if (chunksCache[chunkIndex]) return; // ya cargado

    const chunkInfo = indexData.chunks[chunkIndex];
    if (!chunkInfo) throw new Error(`Chunk ${chunkIndex} no existe en el índice`);

    const resp = await fetch(CHUNK_BASE + chunkInfo.file);
    if (!resp.ok) {
        throw new Error(`Error al cargar chunk ${chunkIndex}: ${resp.status}`);
    }

    const chunkData = await resp.json();
    chunksCache[chunkIndex] = chunkData;

    // Indexar items en el mapa global
    for (const item of chunkData.items) {
        itemsMap.set(item.ID, item);
    }

}

/**
 * Determina qué chunk contiene un ID dado.
 * @param {number} id - ID del item
 * @returns {number|null} Índice del chunk o null si no se encuentra
 */
function getChunkIndexForId(id) {
    if (!indexData) return null;
    for (let i = 0; i < indexData.chunks.length; i++) {
        const ch = indexData.chunks[i];
        if (id >= ch.start && id <= ch.end) return i;
    }
    return null;
}

/**
 * Obtiene un item por su ID.
 * Carga el chunk correspondiente bajo demanda si no está en caché.
 *
 * @param {number} id - ID del item
 * @returns {Promise<object|null>} El item encontrado o null
 */
export async function getItemById(id) {
    if (!itemsMap) await initItemDB();

    // Si ya está en el mapa, devolverlo directamente
    if (itemsMap.has(id)) return itemsMap.get(id);

    // Si no está, determinar qué chunk lo contiene y cargarlo
    const chunkIdx = getChunkIndexForId(id);
    if (chunkIdx === null) return null;

    await loadChunk(chunkIdx);
    return itemsMap.get(id) || null;
}

/**
 * Obtiene múltiples items por sus IDs de forma eficiente.
 * Carga los chunks necesarios una sola vez.
 *
 * @param {number[]} ids - Array de IDs de items
 * @returns {Promise<object[]>} Array con los items encontrados
 */
export async function getItemsByIds(ids) {
    if (!itemsMap) await initItemDB();

    const chunksToLoad = new Set();
    const result = [];

    // IDs que ya tenemos en caché
    const missingIds = ids.filter(id => {
        if (itemsMap.has(id)) {
            result.push(itemsMap.get(id));
            return false;
        }
        return true;
    });

    if (missingIds.length === 0) return result;

    // Determinar qué chunks cargar
    for (const id of missingIds) {
        const chunkIdx = getChunkIndexForId(id);
        if (chunkIdx !== null) chunksToLoad.add(chunkIdx);
    }

    // Cargar chunks faltantes en paralelo
    await Promise.all([...chunksToLoad].map(idx => loadChunk(idx)));

    // Recuperar todos los items solicitados
    for (const id of ids) {
        if (itemsMap.has(id)) result.push(itemsMap.get(id));
    }

    return result;
}

/**
 * Busca items por nombre (CodeName128).
 * Búsqueda case-insensitive.
 *
 * @param {string} query - Texto a buscar
 * @returns {Promise<object[]>} Items que coinciden
 */
export async function searchItemsByName(query) {
    if (!itemsMap) await initItemDB();

    // Asegurar que todos los chunks estén cargados para búsqueda global
    await loadAllChunks();

    const q = query.toLowerCase();
    const results = [];
    for (const item of itemsMap.values()) {
        if (item.CodeName128 && item.CodeName128.toLowerCase().includes(q)) {
            results.push(item);
        }
    }
    return results;
}

/**
 * Carga todos los chunks en memoria.
 * Útil para búsquedas globales o precarga completa.
 */
export async function loadAllChunks() {
    if (!indexData) await initItemDB();

    const loaders = [];
    for (let i = 0; i < indexData.chunks.length; i++) {
        if (!chunksCache[i]) loaders.push(loadChunk(i));
    }
    await Promise.all(loaders);
}

/**
 * Convierte el campo AssocFileIcon128 (ruta .ddj con barras invertidas)
 * a una ruta PNG accesible desde /public/icon/.
 *
 * La ruta se normaliza a minúsculas para garantizar compatibilidad
 * en servidores Linux (case-sensitive). Si el item usó fallback,
 * retorna directamente el icono por defecto.
 *
 * @param {object} item - Objeto del item con campo AssocFileIcon128
 * @returns {string} Ruta completa del icono PNG
 */
export function getItemIcon(item) {
    if (!item || !item.AssocFileIcon128) return FALLBACK_ICON;
    if (item.AssocFileIcon128 === 'icon_default.png') return FALLBACK_ICON;
    return (
        '/icon/' +
        item.AssocFileIcon128
            .replace(/\\\\/g, '/')
            .replace(/\\/g, '/')
            .replace('.ddj', '.png')
            .toLowerCase()
    );
}

/**
 * Obtiene estadísticas del sistema.
 * @returns {object} Estadísticas actuales
 */
export function getDBStats() {
    const loadedChunks = Object.keys(chunksCache).length;
    return {
        totalItems: indexData?.total || 0,
        totalChunks: indexData?.chunks?.length || 0,
        loadedChunks,
        cachedItems: itemsMap?.size || 0,
        isReady: itemsMap !== null,
    };
}
