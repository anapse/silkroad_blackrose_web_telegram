// Handlers for Spawn opcodes: 0x34B5, 0x3015, 0x3016, 0x3017, 0x3018, 0x3019, 0xB023
// Extracted from PacketRouter.js
import Logger from '../../utils/Logger.js';

export function createSpawnHandlers(router) {
    function getEntityType(refObjId) {
        const npcRanges = [[1907, 1940], [3000, 3999], [5000, 5999], [9000, 9999]];
        for (const [min, max] of npcRanges) {
            if (refObjId >= min && refObjId <= max) return 'NPC';
        }
        if (refObjId >= 1 && refObjId < 10000) return 'CHAR';
        if (refObjId >= 10000 && refObjId < 20000) return 'MOB';
        if (refObjId >= 20000 && refObjId < 30000) return 'COS';
        if (refObjId >= 30000 && refObjId < 40000) return 'NPC';
        return 'OTHER';
    }

    function parseCharSpawn(data, pos) {
        const before = pos;
        if (pos + 6 > data.length) return pos;
        const volume = data.readUInt8(pos); pos += 1;
        const rank = data.readUInt8(pos); pos += 1;
        const icons = data.readUInt8(pos); pos += 1;
        const unknown1 = data.readUInt8(pos); pos += 1;
        const maxSlots = data.readUInt8(pos); pos += 1;
        const itemCount = data.readUInt8(pos); pos += 1;
        for (let j = 0; j < itemCount && pos + 4 <= data.length; j++) { pos += 4; if (pos < data.length) pos += 1; }
        if (pos + 2 > data.length) return pos;
        const maxAvatarSlots = data.readUInt8(pos); pos += 1;
        const avatarCount = data.readUInt8(pos); pos += 1;
        for (let j = 0; j < avatarCount && pos + 5 <= data.length; j++) { pos += 4; pos += 1; }
        if (pos >= data.length) return pos;
        const mask = data.readUInt8(pos); pos += 1;
        if (mask === 1 && pos + 6 <= data.length) {
            pos += 4;
            const maskType = data.readUInt8(pos); pos += 1;
            if (maskType !== 0 && pos + 1 <= data.length) {
                const maskCount = data.readUInt8(pos); pos += 1;
                for (let j = 0; j < maskCount && pos + 4 <= data.length; j++) { pos += 4; }
            }
        }
        if (pos + 12 > data.length) return pos;
        const walkingSpeed = data.readUInt32LE(pos); pos += 4;
        const runningSpeed = data.readUInt32LE(pos); pos += 4;
        const berserkerSpeed = data.readUInt32LE(pos); pos += 4;
        const after = pos;
        console.log('[CHAR SPAWN]', JSON.stringify({ before, after, bytesConsumed: after - before, volume, rank, maxSlots, itemCount, walkingSpeed, runningSpeed }));
        return pos;
    }

    return {
        handleSpawnRequest(rawPacket, packetObj) {
            Logger.info('[SPAWN] Server requests spawn readiness - sending 0x34B6', 'Spawn');
            // Cancelar el timer de auto-spawn si existe
            if (router._spawnReadyTimer) {
                clearTimeout(router._spawnReadyTimer);
                router._spawnReadyTimer = null;
            }
            try {
                const spawnConfirm = router.tcpSession.security.formatPacket(0x34b6, Buffer.alloc(0), true);
                router.tcpSession.send(spawnConfirm);
                if (router.session && router.session.wsSession) {
                    router.session.wsSession.sendEvent('Spawn confirmado - jugador visible en el mundo');
                }
            } catch (e) {
                Logger.error('[SPAWN] Error sending 0x34B6: ' + e.message, 'Spawn');
            }
        },

        handleSingleSpawn(rawPacket, packetObj) {
            router.spawnStats.single++;
            const payload = rawPacket.slice(6);
            Logger.info('[SPAWN] 0x3015 SINGLE_SPAWN payload=' + payload.slice(0, 64).toString('hex').toUpperCase() + ' (' + payload.length + 'B)', 'Spawn');
            if (payload.length >= 20) {
                let pos = 0;
                const refObjId = payload.readUInt32LE(pos); pos += 4;
                const uniqueId = payload.readUInt32LE(pos); pos += 4;
                const xSector = payload.readUInt8(pos); pos += 1;
                const ySector = payload.readUInt8(pos); pos += 1;
                const xOffset = payload.readFloatLE(pos); pos += 4;
                const zOffset = payload.readFloatLE(pos); pos += 4;
                const yOffset = payload.readFloatLE(pos); pos += 4;
                Logger.info('[SPAWN] 0x3015 refObjId=' + refObjId + ' uniqueId=' + uniqueId + ' sector=(' + xSector + ',' + ySector + ') offset=(' + xOffset + ',' + zOffset + ',' + yOffset + ')', 'Spawn');
                const region = xSector | (ySector << 8);
                const posX_sql = Math.round(xOffset / 10);
                const posZ_sql = Math.round(zOffset / 10);
                const posY_sql = Math.round(yOffset / 10);
                if (posY_sql > 0) router._lastPlayerPosY = posY_sql;
                const isMySpawn = ((refObjId === router._pendingPlayerInfo?.refObjId) || (uniqueId === router._expectedUniqueId));
                console.log('[SPAWN]', JSON.stringify({ uniqueId, refObjId, accepted: isMySpawn }));
                const info = router._pendingPlayerInfo || {};
                if (isMySpawn && !router._spawnSent && router.session && router.session.wsSession) {
                    router._spawnSent = true;
                    router.session.wsSession.sendEvent('Jugador en mundo: Lv' + (info.level || '?') + ' Region=' + region + ' (' + posX_sql + ',' + posZ_sql + ')', {
                        type: 'PLAYER_SPAWNED', region, posX: posX_sql, posY: posY_sql, posZ: posZ_sql,
                        level: info.level || '?', hp: info.hp || '?', mp: info.mp || '?',
                        maxHp: info.hp || 0, maxMp: info.mp || 0,
                        sp: info.sp || 0, exp: info.exp ?? 0,
                        refObjId, playerName: info.playerName || 'Player',
                    });
                    router.session.wsSession.sendStatus('IN_GAME', {
                        region, posX: posX_sql, posY: posY_sql, posZ: posZ_sql,
                        level: info.level || '?', hp: info.hp || '?', mp: info.mp || '?',
                        maxHp: info.hp || 0, maxMp: info.mp || 0,
                        sp: info.sp || 0, exp: info.exp ?? 0,
                        refObjId, playerName: info.playerName || 'Player',
                    });
                } else if (!isMySpawn && router.session && router.session.wsSession) {
                    // Enviar ENTITY_SPAWN para otras entidades (mobs, otros players, NPCs)
                    const entityType = getEntityType(refObjId);
                    router.session.wsSession.sendEvent('', {
                        type: 'ENTITY_SPAWN', uniqueId, refObjId, entityType,
                        region, posX: posX_sql, posY: posY_sql, posZ: posZ_sql,
                        angle: 0, moving: 0, running: 0,
                    });
                }
            }
        },

        handleSingleDespawn(rawPacket, packetObj) {
            const payload = rawPacket.slice(6);
            if (payload.length >= 4) {
                const uniqueId = payload.readUInt32LE(0);
                Logger.info('[DESPAWN] 0x3016 uniqueId=' + uniqueId, 'Spawn');
                if (router.session && router.session.wsSession) {
                    router.session.wsSession.sendEvent('', { type: 'ENTITY_DESPAWN', uniqueId });
                }
            }
        },

        handleGroupSpawnBegin(rawPacket, packetObj) {
            const payload = rawPacket.slice(6);
            if (payload.length >= 3) {
                router._groupSpawnAction = payload.readUInt8(0);
                router._groupSpawnCount = payload.readUInt16LE(1);
                router._groupSpawnData = Buffer.alloc(0);
                Logger.info('[GROUP_SPAWN] 0x3017 BEGIN action=' + router._groupSpawnAction + ' count=' + router._groupSpawnCount, 'Spawn');
            }
        },

        handleGroupSpawnData(rawPacket, packetObj) {
            const payload = rawPacket.slice(6);
            if (router._groupSpawnData) {
                router._groupSpawnData = Buffer.concat([router._groupSpawnData, payload]);
            }
            Logger.info('[GROUP_SPAWN] 0x3019 DATA accumulated ' + (router._groupSpawnData?.length || payload.length) + ' bytes', 'Spawn');
        },

        handleGroupSpawnEnd(rawPacket, packetObj) {
            Logger.info('[GROUP_SPAWN] 0x3018 END - ' + (router._groupSpawnCount || '?') + ' entidades', 'Spawn');
            if (router._groupSpawnAction === 1 && router._groupSpawnData && router._groupSpawnCount > 0) {
                let data = router._groupSpawnData;
                let pos = 0;
                const info = router._pendingPlayerInfo || {};
                for (let i = 0; i < router._groupSpawnCount; i++) {
                    if (pos + 20 > data.length) break;
                    const refObjId = data.readUInt32LE(pos); pos += 4;
                    const uniqueId = data.readUInt32LE(pos); pos += 4;
                    const xSector = data.readUInt8(pos); pos += 1;
                    const ySector = data.readUInt8(pos); pos += 1;
                    const xOffset = data.readFloatLE(pos); pos += 4;
                    const zOffset = data.readFloatLE(pos); pos += 4;
                    const yOffset = data.readFloatLE(pos); pos += 4;
                    const angle = data.readUInt16LE(pos); pos += 2;
                    const moving = data.readUInt8(pos); pos += 1;
                    const running = data.readUInt8(pos); pos += 1;
                    const entityType = getEntityType(refObjId);
                    if (entityType === 'CHAR') { pos = parseCharSpawn(data, pos); }
                    router.spawnStats.group++;
                    const isPlayerSpawn = ((refObjId === router._pendingPlayerInfo?.refObjId) || (uniqueId === router._expectedUniqueId));
                    // Log para debug de spawn
                    if (entityType === 'CHAR' || refObjId === 1922) {
                        Logger.info('[GROUP_SPAWN] entity refObjId=' + refObjId + ' uniqueId=' + uniqueId + ' isPlayerSpawn=' + isPlayerSpawn + ' _spawnSent=' + router._spawnSent + ' _pendingRefObj=' + router._pendingPlayerInfo?.refObjId + ' _expectedUid=' + router._expectedUniqueId, 'Spawn');
                    }
                    const region = xSector | (ySector << 8);
                    const posX_sql = Math.round(xOffset / 10);
                    const posZ_sql = Math.round(zOffset / 10);
                    const posY_sql = Math.round(yOffset / 10);
                    if (router.session && router.session.wsSession) {
                        router.session.wsSession.sendEvent('', {
                            type: 'ENTITY_SPAWN', uniqueId, refObjId, entityType,
                            region, posX: posX_sql, posY: posY_sql, posZ: posZ_sql,
                            angle, moving, running,
                        });
                    }
                    if (isPlayerSpawn) {
                        if (posY_sql > 0) router._lastPlayerPosY = posY_sql;
                        if (!router._spawnSent && router.session && router.session.wsSession) {
                            router._spawnSent = true;
                            router._playerUniqueId = uniqueId;
                            Logger.info('[GROUP_SPAWN] Primer spawn - enviando posicion: sector=(' + xSector + ',' + ySector + ') posX=' + posX_sql + ' posZ=' + posZ_sql + ' posY=' + posY_sql, 'Spawn');
                            router.session.wsSession.sendEvent('Jugador en mundo: Lv' + (info.level || '?') + ' Region=' + region + ' (' + posX_sql + ',' + posZ_sql + ')', {
                                type: 'PLAYER_SPAWNED', region, posX: posX_sql, posY: posY_sql, posZ: posZ_sql,
                                level: info.level || '?', hp: info.hp || '?', mp: info.mp || '?',
                                maxHp: info.hp || 0, maxMp: info.mp || 0,
                                sp: info.sp || 0, exp: info.exp ?? 0,
                                refObjId, playerName: info.playerName || 'Player',
                            });
                            router.session.wsSession.sendStatus('IN_GAME', {
                                region, posX: posX_sql, posY: posY_sql, posZ: posZ_sql,
                                level: info.level || '?', hp: info.hp || '?', mp: info.mp || '?',
                                maxHp: info.hp || 0, maxMp: info.mp || 0,
                                sp: info.sp || 0, exp: info.exp ?? 0,
                                refObjId, playerName: info.playerName || 'Player',
                            });
                        }
                    }
                }
            }
            if (router.session && router.session.wsSession) {
                router.session.wsSession.sendEvent('Entidades del mundo cargadas');
            }
            router._groupSpawnData = null;
            router._groupSpawnCount = 0;
            router._groupSpawnAction = 0;
        },

        handleMoveBegin(rawPacket, packetObj) {
            const payload = rawPacket.slice(6);
            if (payload.length < 20) return;
            const uniqueId = payload.readUInt32LE(0);
            const region = payload.readUInt16LE(4);
            const xF = payload.readFloatLE(6);
            const zF = payload.readFloatLE(10);
            const yF = payload.readFloatLE(14);
            const angle = payload.readInt16LE(18);
            // Enviar PLAYER_POSITION_INIT si es la primera posición válida que llega
            if (!router._initPosSent && region > 0 && region < 40000 && router.session && router.session.wsSession) {
                router._initPosSent = true;
                router.session.wsSession.sendEvent('Posicion inicial (desde 0xB023)', {
                    type: 'PLAYER_POSITION_INIT', region, posX: Math.round(xF), posY: Math.round(zF), posZ: Math.round(yF),
                });
                Logger.info('[0xB023] PLAYER_POSITION_INIT: region=' + region + ' x=' + xF.toFixed(1) + ' y=' + zF.toFixed(1) + ' z=' + yF.toFixed(1), 'Spawn');
            }
            if (router.session && router.session.wsSession) {
                router.session.wsSession.sendEvent('', { type: 'PLAYER_UPDATE', region, posX: Math.round(xF), posZ: Math.round(zF), posY: Math.round(yF) });
            }
        }
    };
}
