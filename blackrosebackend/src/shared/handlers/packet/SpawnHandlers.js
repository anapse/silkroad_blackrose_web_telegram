// Handlers for Spawn opcodes: 0x34B5, 0x3015, 0x3016, 0x3017, 0x3018, 0x3019, 0xB023
// Basado en la documentación de DaxterSoul (elitepvpers)
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

    function getTypeID1(refObjId) {
        // Extraer TypeID1 del RefObjID según la estructura Silkroad
        // TypeID1: 1=BIONIC, 3=ITEM, 4=PORTAL
        if (refObjId >= 1 && refObjId < 20000) return 1; // BIONIC
        if (refObjId >= 30000 && refObjId < 40000) return 1; // NPC
        if (refObjId >= 40000 && refObjId < 50000) return 3; // ITEM
        if (refObjId >= 50000 && refObjId < 60000) return 4; // PORTAL
        return 1; // Default BIONIC
    }

    /**
     * Parsea los datos comunes de posición/movimiento/state de un spawn BIONIC
     * según la estructura de DaxterSoul para 0x3015/0x3019
     */
    function parseBionicSpawn(data, pos, entity) {
        // Después de los datos específicos del tipo, viene:
        // 4   uint    UniqueID
        // 2   ushort  Position.RegionID
        // 4   float   Position.X
        // 4   float   Position.Y
        // 4   float   Position.Z
        // 2   ushort  Position.Angle

        if (pos + 20 > data.length) return pos;
        entity.uniqueId = data.readUInt32LE(pos); pos += 4;
        const regionId = data.readUInt16LE(pos); pos += 2;
        const xF = data.readFloatLE(pos); pos += 4;
        const yF = data.readFloatLE(pos); pos += 4;
        const zF = data.readFloatLE(pos); pos += 4;
        const angle = data.readUInt16LE(pos); pos += 2;

        entity.region = regionId;
        entity.regionX = regionId & 0xFF;
        entity.regionZ = (regionId >> 8) & 0xFF;

        // Convertir floats a unidades enteras (escala 1/10)
        entity.posX = Math.round(xF / 10);
        entity.posY = Math.round(yF / 10);
        entity.posZ = Math.round(zF / 10);
        entity.angle = angle;

        // Movement
        if (pos + 2 > data.length) return pos;
        const hasDest = data.readUInt8(pos); pos += 1;
        const moveType = data.readUInt8(pos); pos += 1;
        entity.hasDestination = hasDest === 1;
        entity.moveType = moveType;

        if (entity.hasDestination) {
            if (pos + 2 > data.length) return pos;
            const destRegion = data.readUInt16LE(pos); pos += 2;
            entity.destRegion = destRegion;
            if (regionId < 32767) {
                // World
                if (pos + 6 > data.length) return pos;
                entity.destX = data.readInt16LE(pos); pos += 2;
                entity.destY = data.readInt16LE(pos); pos += 2;
                entity.destZ = data.readInt16LE(pos); pos += 2;
            } else {
                // Dungeon
                if (pos + 12 > data.length) return pos;
                entity.destX = data.readInt32LE(pos); pos += 4;
                entity.destY = data.readInt32LE(pos); pos += 4;
                entity.destZ = data.readInt32LE(pos); pos += 4;
            }
        } else {
            if (pos + 3 > data.length) return pos;
            entity.moveSource = data.readUInt8(pos); pos += 1;
            entity.moveAngle = data.readUInt16LE(pos); pos += 2;
        }

        // State
        if (pos + 16 > data.length) return pos;
        entity.lifeState = data.readUInt8(pos); pos += 1;     // 1=Alive, 2=Dead
        entity.unkByte0 = data.readUInt8(pos); pos += 1;
        entity.motionState = data.readUInt8(pos); pos += 1;   // 0=None, 2=Walking, 3=Running, 4=Sitting
        entity.status = data.readUInt8(pos); pos += 1;        // 0=None, 1=Hwan, etc
        entity.walkSpeed = data.readFloatLE(pos); pos += 4;
        entity.runSpeed = data.readFloatLE(pos); pos += 4;
        entity.hwanSpeed = data.readFloatLE(pos); pos += 4;

        // Buffs
        if (pos + 1 > data.length) return pos;
        const buffCount = data.readUInt8(pos); pos += 1;
        entity.buffCount = buffCount;
        entity.buffs = [];
        for (let i = 0; i < buffCount && pos + 8 <= data.length; i++) {
            const skillId = data.readUInt32LE(pos); pos += 4;
            const duration = data.readUInt32LE(pos); pos += 4;
            const buff = { skillId, duration };
            // Verificar si tiene IsCreator (atfe = 1701213281)
            if (pos + 1 <= data.length && (skillId === 1701213281 || i === buffCount - 1)) {
                // No podemos saber si tiene IsCreator sin el skill real
            }
            entity.buffs.push(buff);
        }

        return pos;
    }

    /**
     * Parsea los datos de CHARACTER dentro del spawn (TypeID2 == 1)
     */
    function parseCharacterSpawnData(data, pos, entity) {
        if (pos + 4 > data.length) return pos;
        const scale = data.readUInt8(pos); pos += 1;
        const hwanLevel = data.readUInt8(pos); pos += 1;
        const pvpCape = data.readUInt8(pos); pos += 1;
        const autoInvestExp = data.readUInt8(pos); pos += 1;
        entity.scale = scale;
        entity.hwanLevel = hwanLevel;
        entity.pvpCape = pvpCape;
        entity.autoInvestExp = autoInvestExp;

        // Inventory
        if (pos + 2 > data.length) return pos;
        const invSize = data.readUInt8(pos); pos += 1;
        const invCount = data.readUInt8(pos); pos += 1;
        entity.inventorySize = invSize;
        entity.inventoryItems = [];
        for (let i = 0; i < invCount && pos + 4 <= data.length; i++) {
            const refItemId = data.readUInt32LE(pos); pos += 4;
            const item = { refItemId };
            // Si es equip (TypeID1=3, TypeID2=1) tiene OptLevel
            if (refItemId >= 1 && refItemId < 10000 && pos < data.length) {
                // Simplificado: siempre leemos 1 byte extra
                // item.optLevel = data.readUInt8(pos); pos += 1;
            }
            entity.inventoryItems.push(item);
        }

        // AvatarInventory
        if (pos + 2 > data.length) return pos;
        const avSize = data.readUInt8(pos); pos += 1;
        const avCount = data.readUInt8(pos); pos += 1;
        entity.avatarSize = avSize;
        for (let i = 0; i < avCount && pos + 4 <= data.length; i++) {
            pos += 4; // refItemId
        }

        // Mask
        if (pos + 1 > data.length) return pos;
        const hasMask = data.readUInt8(pos); pos += 1;
        entity.hasMask = hasMask === 1;
        if (entity.hasMask && pos + 6 <= data.length) {
            pos += 4; // mask.RefObjID
            const maskType = data.readUInt8(pos); pos += 1;
            if (maskType !== 0 && pos + 1 <= data.length) {
                const maskCount = data.readUInt8(pos); pos += 1;
                for (let i = 0; i < maskCount && pos + 4 <= data.length; i++) {
                    pos += 4;
                }
            }
        }

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
                        console.log('[SPAWN] Enviando ENTITY_SPAWN al frontend', JSON.stringify({ uniqueId, refObjId, entityType, region }));
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
                    type: 'PLAYER_POSITION_INIT', region, posX: Math.round(xF), posZ: Math.round(zF), posY: Math.round(yF),
                });
                Logger.info('[0xB023] PLAYER_POSITION_INIT: region=' + region + ' x=' + xF.toFixed(1) + ' z=' + zF.toFixed(1) + ' y=' + yF.toFixed(1), 'Spawn');
            }
            if (router.session && router.session.wsSession) {
                router.session.wsSession.sendEvent('', { type: 'PLAYER_UPDATE', region, posX: Math.round(xF), posZ: Math.round(zF), posY: Math.round(yF) });
            }
        }
    };
}
