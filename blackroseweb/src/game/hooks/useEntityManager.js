/**
 * useEntityManager.js — Gestión de entidades (mobs, NPCs, otros players)
 * con suavizado de movimiento y filtro de outliers.
 *
 * PROBLEMA: ENTITY_MOVE se recibe cada 2-3 frames con valores que saltan
 * (dstX=134 → dstZ=-4 → luego dstX=141 → luego dstX=132).
 * Esto causa que las entidades se "teletransporten" en lugar de moverse suavemente.
 *
 * SOLUCIÓN:
 * 1. Buffer de últimas 3 posiciones por entityId
 * 2. Promedio móvil para suavizar
 * 3. Rechazar outliers (>10 unidades del promedio)
 * 4. DETECTAR CAMBIOS DE REGIÓN: si dstRegion cambia, NO promediar
 *    (es un teletransporte válido)
 * 5. LÍMITE DE VELOCIDAD: si la distancia > 30 unidades en <100ms, ignorar
 *    (paquete corrupto)
 *
 * @returns {{ processEntityMove: Function, clearEntityBuffer: Function, clearAllBuffers: Function }}
 */

const MAX_BUFFER_SIZE = 3;
const OUTLIER_THRESHOLD = 10; // unidades world
const SMOOTHING_FACTOR = 0.3; // 30% hacia el promedio por actualización
const MAX_SPEED_WU_PER_100MS = 30; // velocidad máxima para considerar válido
const SPEED_TIME_WINDOW_MS = 100;

// ── ALMACÉN GLOBAL DE BUFFERS (persiste toda la sesión) ──
const entityBuffers = new Map();

/**
 * Crea un buffer circular para almacenar posiciones recientes de una entidad.
 */
function createPositionBuffer() {
  const buffer = [];

  return {
    push(pos) {
      buffer.push(pos);
      if (buffer.length > MAX_BUFFER_SIZE) {
        buffer.shift();
      }
    },

    getAverage() {
      if (buffer.length === 0) return null;
      const sum = buffer.reduce(
        (acc, p) => ({ worldX: acc.worldX + p.worldX, worldZ: acc.worldZ + p.worldZ }),
        { worldX: 0, worldZ: 0 }
      );
      return {
        worldX: sum.worldX / buffer.length,
        worldZ: sum.worldZ / buffer.length,
      };
    },

    isOutlier(pos) {
      if (buffer.length < 2) return false;
      const avg = this.getAverage();
      if (!avg) return false;
      const dx = pos.worldX - avg.worldX;
      const dz = pos.worldZ - avg.worldZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      return dist > OUTLIER_THRESHOLD;
    },

    getLast() {
      return buffer.length > 0 ? buffer[buffer.length - 1] : null;
    },

    clear() {
      buffer.length = 0;
    },

    size() {
      return buffer.length;
    },
  };
}

/**
 * Procesa un movimiento de entidad con suavizado (promedio móvil + filtro outliers).
 * Función pura exportable — no necesita hook, funciona como módulo.
 *
 * @param {Object|null} entityData — Datos actuales de la entidad (prev), o null si es nuevo
 * @param {Object} moveData — Datos del movimiento: { uniqueId, dstRegion, dstX, dstZ, dstY }
 * @param {Function} regionToWorldFn — región+offset → worldX/worldZ
 * @returns {Object|null} Datos actualizados de la entidad, o null si se rechazó
 */
export function processEntityMove(entityData, moveData, regionToWorldFn) {
  const uid = moveData.uniqueId;
  if (uid == null) return null;

  // Calcular worldX/worldZ del destino
  const regionId = Number(moveData.dstRegion) || 0;
  const { worldX: dstWorldX, worldZ: dstWorldZ, regionX: dstRegionX, regionZ: dstRegionZ } =
    regionToWorldFn(regionId, moveData.dstX, moveData.dstZ, moveData.dstY, 'movement');

  // Obtener o crear buffer para esta entidad
  if (!entityBuffers.has(uid)) {
    entityBuffers.set(uid, createPositionBuffer());
  }
  const buf = entityBuffers.get(uid);

  // ── DETECCIÓN DE CAMBIO DE REGIÓN ──
  // Si dstRegion es diferente a la última región conocida, es un teletransporte válido.
  // No promediamos — aceptamos la nueva posición directamente.
  if (entityData && entityData.region && moveData.dstRegion && entityData.region !== moveData.dstRegion) {
    console.log(`[EntityManager] 🚀 Entidad ${uid}: región cambiada de ${entityData.region} a ${moveData.dstRegion}, aplicando teletransporte`);
    buf.clear();
    buf.push({ worldX: dstWorldX, worldZ: dstWorldZ });
    return {
      ...entityData,
      region: moveData.dstRegion,
      regionX: dstRegionX, regionZ: dstRegionZ,
      posX: moveData.dstX, posZ: moveData.dstZ,
      worldX: dstWorldX, worldZ: dstWorldZ,
      _targetWX: dstWorldX, _targetWZ: dstWorldZ,
    };
  }

  const newPos = { worldX: dstWorldX, worldZ: dstWorldZ };

  // Caso: entidad nueva — sin buffer previo
  if (!entityData) {
    buf.push(newPos);
    return {
      uniqueId: uid,
      entityType: moveData.entityType || 'CHAR',
      region: moveData.dstRegion,
      regionX: dstRegionX, regionZ: dstRegionZ,
      posX: moveData.dstX, posZ: moveData.dstZ,
      worldX: dstWorldX, worldZ: dstWorldZ,
      _targetWX: dstWorldX, _targetWZ: dstWorldZ,
    };
  }

  // ── LÍMITE DE VELOCIDAD ──
  // Si la distancia desde la última posición es > 30 unidades y no hay cambio de región,
  // es probablemente un paquete corrupto. Ignorar.
  const lastPos = buf.getLast();
  if (lastPos && entityData.region && moveData.dstRegion === entityData.region) {
    const dx = dstWorldX - lastPos.worldX;
    const dz = dstWorldZ - lastPos.worldZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > MAX_SPEED_WU_PER_100MS) {
      console.log(`[EntityManager] ⚠ Entidad ${uid}: velocidad excesiva (${dist.toFixed(0)} > ${MAX_SPEED_WU_PER_100MS}), ignorando`);
      return null;
    }
  }

  // Verificar si es un outlier
  if (buf.isOutlier(newPos)) {
    const avg = buf.getAverage();
    console.log(
      `[useEntityManager] ⚠ Entidad ${uid}: outlier detectado, aplicando promedio ` +
      `(dst=(${dstWorldX.toFixed(0)},${dstWorldZ.toFixed(0)}) ` +
      `avg=(${avg.worldX.toFixed(0)},${avg.worldZ.toFixed(0)}))`
    );
    // Aplicar promedio suavizado
    const smoothedX = dstWorldX + (avg.worldX - dstWorldX) * SMOOTHING_FACTOR;
    const smoothedZ = dstWorldZ + (avg.worldZ - dstWorldZ) * SMOOTHING_FACTOR;
    buf.push({ worldX: smoothedX, worldZ: smoothedZ });
    console.log(`[useEntityManager] ✅ Entidad ${uid}: promedio de posición aplicado → (${smoothedX.toFixed(1)},${smoothedZ.toFixed(1)})`);

    const avgPos = buf.getAverage();
    return {
      ...entityData,
      region: moveData.dstRegion,
      regionX: dstRegionX, regionZ: dstRegionZ,
      posX: moveData.dstX, posZ: moveData.dstZ,
      worldX: smoothedX, worldZ: smoothedZ,
      _targetWX: avgPos ? avgPos.worldX : smoothedX,
      _targetWZ: avgPos ? avgPos.worldZ : smoothedZ,
    };
  }

  // No es outlier: agregar al buffer normalmente
  buf.push(newPos);

  // Aplicar promedio móvil como target suavizado
  const avg = buf.getAverage();
  let targetWX, targetWZ;
  if (avg && buf.size() >= 2) {
    targetWX = avg.worldX;
    targetWZ = avg.worldZ;
  } else {
    targetWX = dstWorldX;
    targetWZ = dstWorldZ;
  }

  return {
    ...entityData,
    region: moveData.dstRegion,
    regionX: dstRegionX, regionZ: dstRegionZ,
    posX: moveData.dstX, posZ: moveData.dstZ,
    worldX: targetWX, worldZ: targetWZ,
    _targetWX: targetWX, _targetWZ: targetWZ,
  };
}

/**
 * Limpia el buffer de una entidad (útil al despawneer).
 * @param {number|string} uid
 */
export function clearEntityBuffer(uid) {
  entityBuffers.delete(uid);
}

/**
 * Limpia todos los buffers (útil al reconectar).
 */
export function clearAllBuffers() {
  entityBuffers.clear();
}
