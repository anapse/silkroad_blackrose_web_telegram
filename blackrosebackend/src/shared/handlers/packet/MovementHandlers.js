// Handlers for Movement & Environment opcodes: 0xB021, 0x3020
// Extracted from PacketRouter.js
import Logger from '../../utils/Logger.js';
import { calcWorldCoords } from '../../utils/coordUtils.js';

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
                                        const posZ = Math.round(zo / 10);
                                        const posY = Math.round(yo / 10);
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
                const isMyMove = (entityUniqueId === router._playerUniqueId) || (entityUniqueId === router._expectedUniqueId);

                let dstRegion = 0, dstX = 0, dstZ = 0, dstY = 0;
                let hasSource = false, srcRegion = 0, srcX = 0, srcZ = 0, srcY = 0;
                let angle = 0;

                Logger.info(`[0xB021] entityUniqueId=${entityUniqueId} _playerUniqueId=${router._playerUniqueId} _expectedUniqueId=${router._expectedUniqueId} isMyMove=${isMyMove} payloadLen=${payload.length}`, 'Movement');

                if (hasDestination === 1) {
                    dstRegion = payload.readUInt16LE(pos); pos += 2;
                    // Orden en 0xB021 según JellyBitz: X, Z(norte-sur), Y(altitud)
                    dstX = payload.readInt16LE(pos); pos += 2;   // X offset
                    dstZ = payload.readInt16LE(pos); pos += 2;   // Z = norte-sur
                    dstY = payload.readInt16LE(pos); pos += 2;   // Y = altitud (height)
                } else {
                    // Sin destino, puede tener ángulo
                    const moveType = payload.readUInt8(pos); pos += 1; // 0=spinning, 1=sky/key-walking
                }

                // Parsear hasSource (siempre presente según RSBot MotionFromPacket)
                if (pos < payload.length) {
                    hasSource = payload.readUInt8(pos) === 1; pos += 1;
                    if (hasSource && pos + 6 <= payload.length) {
                        srcRegion = payload.readUInt16LE(pos); pos += 2;
                        const isDungeon = (srcRegion >= 32768);
                        if (isDungeon) {
                            // Dungeon: XOffset=ReadInt()/10, ZOffset=ReadFloat(), YOffset=ReadInt()/10
                            if (pos + 12 <= payload.length) {
                                srcX = payload.readInt32LE(pos) / 10; pos += 4;
                                srcZ = payload.readFloatLE(pos); pos += 4;
                                srcY = payload.readInt32LE(pos) / 10; pos += 4;
                            }
                        } else {
                            // Normal: XOffset=ReadShort()/10, ZOffset=ReadFloat(), YOffset=ReadShort()/10
                            if (pos + 8 <= payload.length) {
                                srcX = payload.readInt16LE(pos) / 10; pos += 2;
                                srcZ = payload.readFloatLE(pos); pos += 4;
                                srcY = payload.readInt16LE(pos) / 10; pos += 2;
                            }
                        }
                    }
                }

                // Parsear angle (último campo)
                if (pos + 2 <= payload.length) {
                    angle = payload.readInt16LE(pos); pos += 2;
                }

                // Enviar evento al frontend
                if (router.session && router.session.wsSession) {
                    const eventName = isMyMove ? 'PLAYER_MOVE_CONFIRMED' : 'ENTITY_MOVE';
                    router.session.wsSession.sendEvent('', {
                        type: eventName, uniqueId: entityUniqueId,
                        dstRegion: hasDestination ? dstRegion : undefined,
                        dstX: hasDestination ? Math.round(dstX / 10) : undefined,
                        dstZ: hasDestination ? Math.round(dstZ / 10) : undefined,   // norte-sur
                        dstY: hasDestination ? Math.round(dstY / 10) : undefined,   // altura
                        hasSource,
                        srcRegion: hasSource ? srcRegion : undefined,
                        srcX: hasSource ? Math.round(srcX) : undefined,
                        srcZ: hasSource ? Math.round(srcZ) : undefined,
                        srcY: hasSource ? Math.round(srcY) : undefined,
                        angle,
                    });
                }

                // Actualizar última altitud conocida
                // dstY es raw Int16 (altitud, necesita /10). srcY ya viene como float (altitud real).
                if (isMyMove) {
                    if (hasDestination && dstY !== 0) {
                        router._lastPlayerPosY = Math.round(dstY / 10);
                    } else if (hasSource && srcY !== 0) {
                        router._lastPlayerPosY = Math.round(srcY);
                    } else if (hasDestination && dstY === 0) {
                        // dstY=0 es terreno plano, mantener altitud mínima
                        if (!router._lastPlayerPosY || router._lastPlayerPosY <= 0) {
                            router._lastPlayerPosY = 1;
                        }
                    }
                }

            } catch (e) {
                Logger.warn('[MOVE] Error parsing 0xB021: ' + e.message, 'Movement');
            }
        }
    };
}
