/**
 * packetQueue.js — Cola de prioridad para paquetes de posición del jugador.
 *
 * PROBLEMA: PLAYER_MOVE_CONFIRMED (0xB021) y PLAYER_UPDATE (0xB023) compiten
 * para actualizar posX/posZ del jugador. El servidor envía valores ligeramente
 * distintos en cada flujo, causando oscilación de la cámara.
 *
 * SOLUCIÓN:
 * 1. Priorizar PLAYER_MOVE_CONFIRMED sobre PLAYER_UPDATE
 * 2. Rate limiting: máximo 20 actualizaciones por segundo (50ms mínimo entre updates)
 * 3. Filtro de paquetes duplicados (misma región+posX+posZ en menos de 16ms)
 * 4. Emitir la mejor posición disponible a un callback
 */

const MIN_INTERVAL_MS = 50; // 20 updates/sec
const DUPLICATE_WINDOW_MS = 16; // ~1 frame a 60fps

/**
 * Crea una cola de paquetes de posición.
 * @param {Function} onPosition — callback(mergedPosition) cuando hay una posición lista
 * @returns {{ push: Function, reset: Function }}
 */
export function createPacketQueue(onPosition) {
  let pending = null; // { type, region, posX, posZ, posY, timestamp }
  let lastEmitted = null; // { region, posX, posZ, timestamp }
  let rafId = null;
  let lastEmitTime = 0;

  /**
   * Determina si un nuevo paquete debe sobrescribir el pendiente.
   * PLAYER_MOVE_CONFIRMED siempre gana. Si es del mismo tipo, el más reciente gana.
   */
  function mergeIncoming(packet) {
    if (!pending) {
      pending = { ...packet };
      return;
    }

    // PLAYER_MOVE_CONFIRMED tiene prioridad absoluta
    if (packet.type === 'PLAYER_MOVE_CONFIRMED') {
      pending = { ...packet };
      return;
    }

    // PLAYER_UPDATE solo sobrescribe si no hay un CONFIRMED pendiente
    if (pending.type !== 'PLAYER_MOVE_CONFIRMED') {
      pending = { ...packet };
    }
    // Si pending es CONFIRMED, ignoramos PLAYER_UPDATE
  }

  /**
   * Verifica si el paquete es duplicado del último emitido.
   */
  function isDuplicate(packet) {
    if (!lastEmitted) return false;
    const timeDiff = packet.timestamp - lastEmitted.timestamp;
    if (timeDiff > DUPLICATE_WINDOW_MS) return false;
    return (
      packet.region === lastEmitted.region &&
      Math.abs(packet.posX - lastEmitted.posX) < 0.01 &&
      Math.abs(packet.posZ - lastEmitted.posZ) < 0.01
    );
  }

  /**
   * Procesa el paquete pendiente y lo emite si cumple las condiciones.
   */
  function flush() {
    rafId = null;
    if (!pending) return;

    const now = performance.now();

    // Rate limiting
    if (now - lastEmitTime < MIN_INTERVAL_MS) {
      // Esperar al próximo frame
      rafId = requestAnimationFrame(flush);
      return;
    }

    // Filtro de duplicados
    if (isDuplicate(pending)) {
      console.log('[packetQueue] ⏭ Paquete duplicado ignorado (menos de 16ms, misma posición)');
      pending = null;
      return;
    }

    // Si es PLAYER_UPDATE y hay un CONFIRMED más reciente, verificar umbral
    if (pending.type === 'PLAYER_UPDATE' && lastEmitted) {
      const posDiff = Math.abs(pending.posX - lastEmitted.posX) + Math.abs(pending.posZ - lastEmitted.posZ);
      if (posDiff < 0.5 && (now - lastEmitted.timestamp) < 100) {
        console.log(`[packetQueue] ⏭ PLAYER_UPDATE ignorado por umbral (diff=${posDiff.toFixed(2)} < 0.5)`);
        pending = null;
        return;
      }
    }

    // Emitir
    lastEmitTime = now;
    lastEmitted = {
      region: pending.region,
      posX: pending.posX,
      posZ: pending.posZ,
      timestamp: pending.timestamp,
    };

    const emitData = {
      region: pending.region,
      posX: pending.posX,
      posZ: pending.posZ,
      posY: pending.posY,
      _source: pending.type, // para diagnóstico
    };

    console.log(`[packetQueue] ✅ Emitiendo posición desde ${pending.type} (reg=${pending.region}, x=${pending.posX}, z=${pending.posZ})`);
    pending = null;
    onPosition(emitData);
  }

  /**
   * Agrega un paquete a la cola.
   * @param {'PLAYER_MOVE_CONFIRMED'|'PLAYER_UPDATE'} type
   * @param {number} region
   * @param {number} posX
   * @param {number} posZ
   * @param {number} [posY]
   */
  function push(type, region, posX, posZ, posY) {
    const packet = {
      type,
      region,
      posX,
      posZ,
      posY,
      timestamp: performance.now(),
    };

    mergeIncoming(packet);

    // Programar flush si no hay uno pendiente
    if (!rafId) {
      rafId = requestAnimationFrame(flush);
    }
  }

  /**
   * Resetea la cola (útil al reconectar).
   */
  function reset() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    pending = null;
    lastEmitted = null;
    lastEmitTime = 0;
  }

  return { push, reset };
}
