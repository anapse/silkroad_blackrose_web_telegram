// Handlers for Movement & Environment opcodes: 0xB021, 0x3020
// Extracted from PacketRouter.js
import Logger from '../../utils/Logger.js';

export function createMovementHandlers(router) {
    return {
        handleCelestialPosition(rawPacket, packetObj) {
            const payload = rawPacket.slice(6);
            if (payload.length >= 4) {
                const uniqueId = payload.readUInt32LE(0);
                Logger.info('[0x3020 CELESTIAL] uniqueId=' + uniqueId + ' hex=' + payload.toString('hex'), 'Movement');
                // Este uniqueId es el que el servidor asignó al player
                // Se usa para detectar el spawn del player en 0x3015/0x3019
                if (uniqueId > 0 && uniqueId < 1000000) {
                    router._expectedUniqueId = uniqueId;
                    Logger.info('[0x3020] _expectedUniqueId actualizado a ' + uniqueId, 'Movement');

                    // Reintentar búsqueda de posición en CHAR_DATA buffer con el uniqueId real
                    // Solo para actualizar _pendingPlayerInfo, NO se envía al frontend
                    // La posición inicial ya fue enviada por CharDataHandlers.js desde 0x3013
                    if (router._charDataBuffer && router._charDataScanPos !== undefined) {
                        const data = router._charDataBuffer;
                        const SEARCH_START = Math.max(router._charDataScanPos, 50);
                        const uidBytes = Buffer.alloc(4);
                        uidBytes.writeUInt32LE(uniqueId, 0);
                        Logger.info('[0x3020] Searching for uid=' + uniqueId + ' bytes=' + uidBytes.toString('hex') + ' in buffer len=' + data.length + ' from=' + SEARCH_START, 'Movement');
                        for (let i = SEARCH_START; i <= data.length - 15; i++) {
                            if (data[i] === uidBytes[0] && data[i + 1] === uidBytes[1] &&
                                data[i + 2] === uidBytes[2] && data[i + 3] === uidBytes[3]) {
                                const xs = data.readUInt8(i + 4);
                                const ys = data.readUInt8(i + 5);
                                if (xs > 0 && ys > 0 && xs <= 252 && ys <= 126) {
                                    const xo = data.readFloatLE(i + 6);
                                    const zo = data.readFloatLE(i + 10);
                                    const yo = data.readFloatLE(i + 14);
                                    if (!isNaN(xo) && !isNaN(zo) && !isNaN(yo) &&
                                        Math.abs(xo) < 2000 && Math.abs(zo) < 2000 && Math.abs(yo) < 2000 &&
                                        !(Math.abs(xo) < 0.001 && Math.abs(zo) < 0.001 && Math.abs(yo) < 0.001)) {
                                        const region = xs | (ys << 8);
                                        const posX = Math.round(xo / 10);
                                        const posY = Math.round(zo / 10);
                                        const posZ = Math.round(yo / 10);
                                        Logger.info('[0x3020] Position found in CHAR_DATA buffer: region=' + region + ' x=' + xo.toFixed(1) + ' z=' + zo.toFixed(1) + ' y=' + yo.toFixed(1), 'Movement');
                                        // Solo actualizar _pendingPlayerInfo con la posición real
                                        // El frontend ya recibió la posición vía PLAYER_POSITION_INIT desde CharDataHandlers
                                        if (router._pendingPlayerInfo) {
                                            router._pendingPlayerInfo.region = region;
                                            router._pendingPlayerInfo.posX = posX;
                                            router._pendingPlayerInfo.posY = posY;
                                            router._pendingPlayerInfo.posZ = posZ;
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                        // Limpiar buffer después de intentar
                        router._charDataBuffer = null;
                        router._charDataScanPos = null;
                    }
                }
                // PLAYER_SPAWNED lo maneja SpawnHandlers.js, no aquí
            }
        },

        handleServerMove(rawPacket, packetObj) {
            const payload = rawPacket.slice(6);
            if (payload.length < 6) return;
            try {
                let pos = 0;
                const entityUniqueId = payload.readUInt32LE(pos); pos += 4;
                const hasDestination = payload.readUInt8(pos); pos += 1;
                const isMyMove = (entityUniqueId === router._playerUniqueId);
                if (hasDestination === 1) {
                    const dstRegion = payload.readUInt16LE(pos); pos += 2;
                    const dstX = payload.readInt16LE(pos); pos += 2;
                    const dstY = payload.readInt16LE(pos); pos += 2;
                    const dstZ = payload.readInt16LE(pos); pos += 2;
                    const eventName = isMyMove ? 'PLAYER_MOVE_CONFIRMED' : 'ENTITY_MOVE';
                    if (router.session && router.session.wsSession) {
                        router.session.wsSession.sendEvent('', {
                            type: eventName, uniqueId: entityUniqueId, dstRegion,
                            dstX: Math.round(dstX / 10), dstY: Math.round(dstY / 10), dstZ: Math.round(dstZ / 10),
                        });
                    }
                    // Solo enviar PLAYER_MOVED si NO es el player (entidades)
                    // Para el player, 0xB021 es la confirmación del destino de su propio movimiento
                    // El frontend ya está interpolando hacia ese destino, no necesita saltar
                    if (!isMyMove) {
                        router._lastPlayerPosY = Math.round(dstZ / 10);
                    }
                }
            } catch (e) {
                Logger.warn('[MOVE] Error parsing 0xB021: ' + e.message, 'Movement');
            }
        }
    };
}
