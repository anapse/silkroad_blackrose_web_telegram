// Handlers for Spawn opcodes: 0x34B5, 0x3015, 0x3016, 0x3017, 0x3018, 0x3019, 0xB023
// Basado en la documentación de DaxterSoul (elitepvpers)
import Logger from '../../utils/Logger.js';
import { broadcastEvent } from '../../PacketRouter.js';
import { calcWorldCoords } from '../../utils/coordUtils.js';

export function createSpawnHandlers(router) {
    function getEntityType(refObjId) {
        // CHAR: personajes jugables (humanos) - según chars.json
        // Chinos: 1907-1932, Europeos: 14875-14900
        if ((refObjId >= 1907 && refObjId <= 1932) || (refObjId >= 14875 && refObjId <= 14900)) return 'CHAR';
        // MOB: monstruos / animales / plantas (después de chars, antes de NPCs especiales)
        if (refObjId >= 10000 && refObjId < 14722) return 'MOB';
        // NPCs por rango específico
        const npcRanges = [[3000, 3999], [5000, 5999], [9000, 9999]];
        for (const [min, max] of npcRanges) {
            if (refObjId >= min && refObjId <= max) return 'NPC';
        }
        // COS: mascotas, cosplay, monturas
        if (refObjId >= 20000 && refObjId < 30000) return 'COS';
        // NPC: resto con refObjId alto
        if (refObjId >= 30000 && refObjId < 40000) return 'NPC';
        // Si está entre 1941-2999 o 4000-4999, probablemente es MOB o NPC especial
        if (refObjId >= 1941 && refObjId < 3000) return 'MOB';
        if (refObjId >= 4000 && refObjId < 5000) return 'MOB';
        // CHAR rango 1-1906 (excluyendo NPCs ya capturados arriba)
        if (refObjId >= 1 && refObjId < 1907) return 'CHAR';
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
            if (payload.length >= 26) {
                let pos = 0;
                const refObjId = payload.readUInt32LE(pos); pos += 4;
                const entityType = getEntityType(refObjId);
                let uniqueId, xSector, ySector, xOffset, zOffset, yOffset, angle, moving, running;
                let charName = null;
                let guildName = null, grantName = null, stallName = null;
                let guildId = 0, jobType = 0, jobLevel = 0, stallFlag = 0;

                if (entityType === 'CHAR') {
                    // ===== CHAR: inventory/avatar/mask BEFORE position (como MerchBot) =====
                    pos += 5; // scale(1)+rank(1)+icons(1)+unknown(1)+maxSlots(1)
                    // Items
                    const itemCount = payload.readUInt8(pos); pos += 1;
                    for (let a = 0; a < itemCount; a++) {
                        const itemId = payload.readUInt32LE(pos); pos += 4;
                        if ((itemId >= 1 && itemId < 50000) || itemId > 200000) {
                            if (pos < payload.length) pos += 1;
                        }
                    }
                    // Avatars
                    pos += 1; // maxAvatarSlots
                    const avatarCount = payload.readUInt8(pos); pos += 1;
                    for (let a = 0; a < avatarCount; a++) {
                        pos += 5; // refItemId(4) + plus(1)
                    }
                    // Mask
                    const mask = payload.readUInt8(pos); pos += 1;
                    if (mask === 1 && pos + 4 <= payload.length) {
                        const maskId = payload.readUInt32LE(pos); pos += 4;
                        const maskEntityType = getEntityType(maskId);
                        if (maskEntityType === 'CHAR' && pos + 2 <= payload.length) {
                            const unkByte = payload.readUInt8(pos); pos += 1;
                            const maskCount = payload.readUInt8(pos); pos += 1;
                            pos += maskCount * 4;
                        }
                    }
                    // UniqueId + posición
                    if (pos + 26 > payload.length) return;
                    uniqueId = payload.readUInt32LE(pos); pos += 4;
                    xSector = payload.readUInt8(pos); pos += 1;
                    ySector = payload.readUInt8(pos); pos += 1;
                    xOffset = payload.readFloatLE(pos); pos += 4;
                    yOffset = payload.readFloatLE(pos); pos += 4; // 2do = altitud
                    zOffset = payload.readFloatLE(pos); pos += 4; // 3er = norte-sur (MerchBot)
                    angle = payload.readUInt16LE(pos); pos += 2;
                    moving = payload.readUInt8(pos); pos += 1;
                    running = payload.readUInt8(pos); pos += 1;
                    // Movement data (según MerchBot ParseChar)
                    if (moving === 1 && pos + 2 <= payload.length) {
                        const destXsec = payload.readUInt8(pos); pos += 1;
                        const destYsec = payload.readUInt8(pos); pos += 1;
                        if (destYsec === 0x80 && pos + 12 <= payload.length) {
                            pos += 12; // dungeon format
                        } else if (pos + 6 <= payload.length) {
                            pos += 6;
                        }
                    } else if (pos + 3 <= payload.length) {
                        pos += 3; // NoDestination(1) + angle(2)
                    }
                    // State + speeds + skills + name
                    if (pos + 4 <= payload.length) pos += 4; // alive + 3 unknowns
                    if (pos + 12 <= payload.length) pos += 12; // walk/run/zerk speeds
                    if (pos + 1 <= payload.length) {
                        const skillCount = payload.readUInt8(pos); pos += 1;
                        for (let a = 0; a < skillCount && pos + 8 <= payload.length; a++) {
                            pos += 8; // skillId(4) + tempId(4)
                        }
                    }
                    // NAME
                    if (pos + 2 <= payload.length) {
                        const nameLen = payload.readUInt16LE(pos); pos += 2;
                        if (nameLen > 0 && pos + nameLen <= payload.length) {
                            charName = payload.slice(pos, pos + nameLen).toString('ascii');
                            pos += nameLen;
                        }
                    }
                    // ── Datos post-name: job, pvp, guild ──
                    if (pos < payload.length) {
                        pos += 1; // Unknown byte after name
                        if (pos + 2 <= payload.length) {
                            jobType = payload.readUInt8(pos); pos += 1;
                            jobLevel = payload.readUInt8(pos); pos += 1;
                        }
                        if (pos + 1 <= payload.length) {
                            const cnt = payload.readUInt8(pos); pos += 1;
                            if (pos < payload.length) pos += 1;
                            if (cnt === 1 && pos + 4 <= payload.length) pos += 4;
                        }
                        if (pos + 1 <= payload.length) pos += 1;
                        if (pos + 1 <= payload.length) { stallFlag = payload.readUInt8(pos); pos += 1; }
                        if (pos + 1 <= payload.length) pos += 1;
                        if (pos + 2 <= payload.length) {
                            const guildLen = payload.readUInt16LE(pos); pos += 2;
                            if (guildLen > 0 && pos + guildLen <= payload.length) {
                                guildName = payload.slice(pos, pos + guildLen).toString('ascii');
                                pos += guildLen;
                            }
                        }
                        if (pos + 4 <= payload.length) {
                            guildId = payload.readUInt32LE(pos); pos += 4;
                            if (pos + 2 <= payload.length) {
                                const gNameLen = payload.readUInt16LE(pos); pos += 2;
                                if (gNameLen > 0 && pos + gNameLen <= payload.length) {
                                    grantName = payload.slice(pos, pos + gNameLen).toString('ascii');
                                    pos += gNameLen;
                                }
                            }
                            if (pos + 12 <= payload.length) pos += 12;
                            if (pos + 2 <= payload.length) pos += 2;
                            if (stallFlag === 4 && pos + 2 <= payload.length) {
                                const sNameLen = payload.readUInt16LE(pos); pos += 2;
                                if (sNameLen > 0 && pos + sNameLen <= payload.length) {
                                    stallName = payload.slice(pos, pos + sNameLen).toString('ascii');
                                    pos += sNameLen;
                                }
                                if (pos + 6 <= payload.length) pos += 6;
                            } else if (pos + 2 <= payload.length) pos += 2;
                        }
                    }
                    Logger.info('[SPAWN] 0x3015 CHAR: uid=' + uniqueId + ' name=' + (charName || '?') + ' guild=' + (guildName || '?') + ' stall=' + (stallName || (stallFlag ? 'flag='+stallFlag : 'no')) + ' sector=(' + xSector + ',' + ySector + ')', 'Spawn');
                } else {
                    // ===== NPC/MOB/COS: posición DIRECTA después de refObjId =====
                    uniqueId = payload.readUInt32LE(pos); pos += 4;
                    xSector = payload.readUInt8(pos); pos += 1;
                    ySector = payload.readUInt8(pos); pos += 1;
                    xOffset = payload.readFloatLE(pos); pos += 4;
                    yOffset = payload.readFloatLE(pos); pos += 4; // 2do = altitud
                    zOffset = payload.readFloatLE(pos); pos += 4; // 3er = norte-sur (MerchBot)
                    angle = payload.readUInt16LE(pos); pos += 2;
                    moving = payload.readUInt8(pos); pos += 1;
                    running = payload.readUInt8(pos); pos += 1;
                    // No necesitamos consumir más datos para NPC/MOB en single spawn
                    // (solo hay una entidad por paquete 0x3015)
                }
                Logger.info('[SPAWN] 0x3015 refObjId=' + refObjId + ' uniqueId=' + uniqueId + ' sector=(' + xSector + ',' + ySector + ') offset=(' + xOffset.toFixed(1) + ',' + zOffset.toFixed(1) + ',' + yOffset.toFixed(1) + ') angle=' + angle + ' moving=' + moving, 'Spawn');
                const coords = calcWorldCoords(xSector, ySector, xOffset, yOffset, zOffset, 'spawn');
                const region = coords.region;
                const posX_sql = coords.posX;
                const posZ_sql = coords.posZ;
                const posY_sql = coords.posY;
                if (posY_sql > 0) router._lastPlayerPosY = posY_sql;
                // ⚠️ Usar uniqueId para detectar propio spawn (refObjId es el modelo,
                // otros jugadores pueden tener el mismo refObjId y serían ignorados)
                const isMySpawn = (uniqueId === router._expectedUniqueId);
                console.log('[SPAWN]', JSON.stringify({ uniqueId, refObjId, expected: router._expectedUniqueId, accepted: isMySpawn }));
                const info = router._pendingPlayerInfo || {};
                if (isMySpawn && !router._spawnSent && router.session && router.session.wsSession) {
                    router._spawnSent = true;
                    router._playerUniqueId = uniqueId;
                    Logger.info(`[SPAWN] 0x3015 PLAYER_SPAWNED uid=${uniqueId} refObjId=${refObjId}`, 'Spawn');
                    // Enviar PLAYER_SPAWNED e IN_GAME status
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
                } else if (!isMySpawn) {
                    // ENTITY_SPAWN: otras entidades (mobs, npcs, otros players)
                    const entityType = getEntityType(refObjId);
                    const typeLabel = entityType === 'MOB' ? 'Mob' : entityType === 'NPC' ? 'NPC' : entityType === 'COS' ? 'Pet' : entityType === 'CHAR' ? 'Player' : 'Entity';
                    // Usar nombre real del paquete si está disponible, si no generar genérico
                    const entityName = (entityType === 'CHAR' && charName) ? charName : `${typeLabel}#${uniqueId}`;
                    if (entityType === 'CHAR') {
                        Logger.info('[SPAWN] ⭐ OTRO PLAYER detectado! refObjId=' + refObjId + ' uniqueId=' + uniqueId + ' sector=(' + xSector + ',' + ySector + ') pos=' + Math.round(xOffset/10) + ',' + Math.round(zOffset/10) + ' isMySpawn=' + isMySpawn + ' expectedUid=' + router._expectedUniqueId, 'Spawn');
                    }
                    const spawnData = {
                        type: 'ENTITY_SPAWN', uniqueId, refObjId, entityType,
                        region, posX: posX_sql, posY: posY_sql, posZ: posZ_sql,
                        angle, moving, running,
                        name: entityName,
                        ...(entityType === 'CHAR' && { guildName, guildId, grantName, jobType, jobLevel, stallFlag, stallName }),
                    };
                    if (router.session && router.session.wsSession) {
                        Logger.info('[SPAWN] ENTITY_SPAWN uid=' + uniqueId + ' refObjId=' + refObjId + ' type=' + entityType + ' region=' + region, 'Spawn');
                        router.session.wsSession.sendEvent('', spawnData);
                    }
                    broadcastEvent(router.session?.id, '', spawnData);
                }
            }
        },

        handleSingleDespawn(rawPacket, packetObj) {
            const payload = rawPacket.slice(6);
            if (payload.length >= 4) {
                const uniqueId = payload.readUInt32LE(0);
                Logger.info('[DESPAWN] 0x3016 uniqueId=' + uniqueId, 'Spawn');
                const despawnData = { type: 'ENTITY_DESPAWN', uniqueId };
                if (router.session && router.session.wsSession) {
                    router.session.wsSession.sendEvent('', despawnData);
                }
                // Broadcast a todos los demás clientes
                broadcastEvent(router.session?.id, '', despawnData);
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
            Logger.info('[GROUP_SPAWN] ═══ 0x3018 END ═══ action=' + router._groupSpawnAction + ' count=' + (router._groupSpawnCount || '?') + ' dataLen=' + (router._groupSpawnData?.length || 0), 'Spawn');
            Logger.info('[GROUP_SPAWN] HEX=' + (router._groupSpawnData ? router._groupSpawnData.slice(0, 128).toString('hex').toUpperCase() : 'NO_DATA'), 'Spawn');

            // ── ACCIÓN 0: DESPAWN EN GRUPO ──
            // El servidor envía 0x3017 con action=0 cuando el player cambia de región
            // y las entidades antiguas dejan de ser visibles.
            // Los datos son solo uniqueIds (4 bytes cada uno).
            if (router._groupSpawnAction === 0 && router._groupSpawnData && router._groupSpawnCount > 0) {
                let data = router._groupSpawnData;
                let pos = 0;
                Logger.info('[GROUP_SPAWN] Procesando DESPAWN de ' + router._groupSpawnCount + ' entidades', 'Spawn');
                for (let i = 0; i < router._groupSpawnCount; i++) {
                    if (pos + 4 > data.length) {
                        Logger.warn('[GROUP_SPAWN] ⚠️ DESPAWN: pos=' + pos + ' + 4 > data.length=' + data.length, 'Spawn');
                        break;
                    }
                    const uniqueId = data.readUInt32LE(pos); pos += 4;
                    Logger.info('[GROUP_SPAWN] DESPAWN uid=' + uniqueId, 'Spawn');
                    const despawnData = { type: 'ENTITY_DESPAWN', uniqueId };
                    if (router.session && router.session.wsSession) {
                        router.session.wsSession.sendEvent('', despawnData);
                    }
                    broadcastEvent(router.session?.id, '', despawnData);
                }
            }

            // ── ACCIÓN 1: SPAWN EN GRUPO (nuevas entidades) ──
            if (router._groupSpawnAction === 1 && router._groupSpawnData && router._groupSpawnCount > 0) {
                let data = router._groupSpawnData;
                let pos = 0;
                const info = router._pendingPlayerInfo || {};
                Logger.info('[GROUP_SPAWN] Procesando ' + router._groupSpawnCount + ' entidades desde pos=0 dataLen=' + data.length, 'Spawn');
                for (let i = 0; i < router._groupSpawnCount; i++) {
                    Logger.info('[GROUP_SPAWN] --- Entidad #' + (i+1) + ' pos=' + pos + ' restantes=' + (data.length - pos) + ' bytes ---', 'Spawn');
                    if (pos + 20 > data.length) {
                        Logger.warn('[GROUP_SPAWN] ⚠️ pos=' + pos + ' + 20 > data.length=' + data.length + ' — ROMPIENDO', 'Spawn');
                        break;
                    }
                    const refObjId = data.readUInt32LE(pos); pos += 4;
                    const entityType = getEntityType(refObjId);

                    let uniqueId, xSector, ySector, xOffset, zOffset, yOffset, angle, moving, running;
                    let charName = null;
                    let guildName = null, grantName = null, stallName = null;
                    let guildId = 0, jobType = 0, jobLevel = 0, stallFlag = 0;
                    if (entityType === 'CHAR') {
                        // ===== CHAR: inventory/avatar/mask BEFORE position =====
                        // Según MerchBot ParseChar: refObjId(4) + scale(1)+rank(1)+icons(1)+unknown(1)+maxSlots(5)
                        pos += 5;
                        // Items count + items
                        const itemCount = data.readUInt8(pos); pos += 1;
                        for (let a = 0; a < itemCount; a++) {
                            const itemId = data.readUInt32LE(pos); pos += 4;
                            // Si es equip (ITEM_CH o ITEM_EU), tiene plus byte
                            if ((itemId >= 1 && itemId < 50000) || itemId > 200000) {
                                // Equipment has plus byte
                                if (pos < data.length) pos += 1;
                            }
                        }
                        // Avatar slots
                        pos += 1; // maxAvatarSlots
                        const avatarCount = data.readUInt8(pos); pos += 1;
                        for (let a = 0; a < avatarCount; a++) {
                            pos += 5; // refItemId(4) + plus(1)
                        }
                        // Mask — según MerchBot ParseChar: solo lee bytes extra si el tipo del mask es CHAR
                        const mask = data.readUInt8(pos); pos += 1;
                        if (mask === 1 && pos + 4 <= data.length) {
                            const maskId = data.readUInt32LE(pos); pos += 4;
                            // Determinar tipo del mask usando getEntityType (como hace MerchBot con mobstypelist)
                            const maskEntityType = getEntityType(maskId);
                            if (maskEntityType === 'CHAR' && pos + 2 <= data.length) {
                                const unkByte = data.readUInt8(pos); pos += 1;
                                const maskCount = data.readUInt8(pos); pos += 1;
                                pos += maskCount * 4;
                            }
                        }
                        // AHORA sí viene uniqueId + posición
                        if (pos + 26 > data.length) break;
                        uniqueId = data.readUInt32LE(pos); pos += 4;
                        xSector = data.readUInt8(pos); pos += 1;
                        ySector = data.readUInt8(pos); pos += 1;
                        xOffset = data.readFloatLE(pos); pos += 4;
                        yOffset = data.readFloatLE(pos); pos += 4; // 2do = altitud
                        zOffset = data.readFloatLE(pos); pos += 4; // 3er = norte-sur (MerchBot)
                        angle = data.readUInt16LE(pos); pos += 2;
                        moving = data.readUInt8(pos); pos += 1;
                        running = data.readUInt8(pos); pos += 1;

                        // Movement data — según MerchBot ParseChar
                        if (moving === 1 && pos + 2 <= data.length) {
                            const destXsec = data.readUInt8(pos); pos += 1;  // Destination X sector
                            const destYsec = data.readUInt8(pos); pos += 1;  // Destination Y sector
                            if (destYsec === 0x80 && pos + 12 <= data.length) {
                                // Dungeon: xcoord = ReadUShort - ReadUShort + 2 shorts + ycoord = ReadUShort - ReadUShort
                                pos += 12;
                            } else if (pos + 6 <= data.length) {
                                // Non-dungeon: xcoord(short) + zcoord(short) + ycoord(short)
                                pos += 6;
                            }
                        } else if (pos + 3 <= data.length) {
                            pos += 3; // NoDestination(1) + angle(2)
                        }

                        // Status: alive + 3 unknowns
                        if (pos + 4 <= data.length) pos += 4;
                        // Speeds: walk(4) + run(4) + zerk(4) = 12
                        if (pos + 12 <= data.length) pos += 12;
                        // Active skills — según MerchBot ParseChar
                        if (pos + 1 <= data.length) {
                            const skillCount = data.readUInt8(pos); pos += 1;
                            for (let a = 0; a < skillCount && pos + 8 <= data.length; a++) {
                                const skillId = data.readUInt32LE(pos); pos += 4;
                                const tempId = data.readUInt32LE(pos); pos += 4;
                                // Algunos skills (SKILL_EU_CLERIC_RECOVERYA_GROUP, etc.) tienen 1 byte extra
                                // Como no tenemos acceso al skill type list, NO leemos ese byte extra aquí.
                                // Si hay problemas con nombres corruptos, revisar si skills específicos
                                // están causando desync.
                            }
                        }
                        // NAME (Ascii string con prefijo de longitud)
                        if (pos + 2 <= data.length) {
                            const nameLen = data.readUInt16LE(pos); pos += 2;
                            if (nameLen > 0 && pos + nameLen <= data.length) {
                                charName = data.slice(pos, pos + nameLen).toString('ascii');
                                pos += nameLen;
                            }
                        }
                        // ── Datos post-name: job, pvp, guild (según MerchBot ParseChar) ──
                        if (pos < data.length) {
                            pos += 1; // Unknown byte after name
                            if (pos + 2 <= data.length) {
                                jobType = data.readUInt8(pos); pos += 1;
                                jobLevel = data.readUInt8(pos); pos += 1;
                            }
                            if (pos + 1 <= data.length) {
                                const cnt = data.readUInt8(pos); pos += 1; // PVP state?
                                if (pos < data.length) pos += 1; // unk
                                if (cnt === 1 && pos + 4 <= data.length) pos += 4; // transport uniqueId
                            }
                            if (pos + 1 <= data.length) pos += 1; // scroll mode?
                            if (pos + 1 <= data.length) {
                                stallFlag = data.readUInt8(pos); pos += 1;
                            }
                            if (pos + 1 <= data.length) pos += 1; // unk
                            // Guild name
                            if (pos + 2 <= data.length) {
                                const guildLen = data.readUInt16LE(pos); pos += 2;
                                if (guildLen > 0 && pos + guildLen <= data.length) {
                                    guildName = data.slice(pos, pos + guildLen).toString('ascii');
                                    pos += guildLen;
                                }
                            }
                            // Guild data (asumiendo trade != 1, no tenemos item types para detectar trade)
                            if (pos + 4 <= data.length) {
                                guildId = data.readUInt32LE(pos); pos += 4;
                                if (pos + 2 <= data.length) {
                                    const gNameLen = data.readUInt16LE(pos); pos += 2;
                                    if (gNameLen > 0 && pos + gNameLen <= data.length) {
                                        grantName = data.slice(pos, pos + gNameLen).toString('ascii');
                                        pos += gNameLen;
                                    }
                                }
                                if (pos + 12 <= data.length) pos += 12; // 3 UInts
                                if (pos + 2 <= data.length) pos += 2; // ushort
                                if (stallFlag === 4 && pos + 2 <= data.length) {
                                    const sNameLen = data.readUInt16LE(pos); pos += 2;
                                    if (sNameLen > 0 && pos + sNameLen <= data.length) {
                                        stallName = data.slice(pos, pos + sNameLen).toString('ascii');
                                        pos += sNameLen;
                                    }
                                    if (pos + 6 <= data.length) pos += 6; // uint + ushort
                                } else if (pos + 2 <= data.length) {
                                    pos += 2; // ushort final
                                }
                            }
                        }
                        Logger.info('[GROUP_SPAWN] CHAR: uid=' + uniqueId + ' sector=(' + xSector + ',' + ySector + ') offset=(' + xOffset.toFixed(1) + ',' + zOffset.toFixed(1) + ',' + yOffset.toFixed(1) + ') name=' + (charName || '?') + ' guild=' + (guildName || '?') + ' stall=' + (stallName || (stallFlag ? 'flag='+stallFlag : 'no')) + ' restantes=' + (data.length - pos), 'Spawn');
                    } else {
                        // ===== NPC/MOB/COS: posición DIRECTA después de refObjId =====
                        uniqueId = data.readUInt32LE(pos); pos += 4;
                        xSector = data.readUInt8(pos); pos += 1;
                        ySector = data.readUInt8(pos); pos += 1;
                        xOffset = data.readFloatLE(pos); pos += 4;
                    yOffset = data.readFloatLE(pos); pos += 4; // 2do = altitud
                    zOffset = data.readFloatLE(pos); pos += 4; // 3er = norte-sur (MerchBot)
                    angle = data.readUInt16LE(pos); pos += 2;
                    moving = data.readUInt8(pos); pos += 1;
                    running = data.readUInt8(pos); pos += 1;
                    Logger.info('[GROUP_SPAWN] ' + entityType + ': refObjId=' + refObjId + ' uid=' + uniqueId + ' sector=(' + xSector + ',' + ySector + ') offset=(' + xOffset.toFixed(1) + ',' + yOffset.toFixed(1) + ',' + zOffset.toFixed(1) + ') moving=' + moving + ' running=' + running, 'Spawn');
                        // Saltar datos extra de NPC/MOB (movement, state, buffs)
                        const tempEntity = {};
                        const afterPos = parseBionicSpawn(data, pos, tempEntity);
                        if (afterPos > pos) {
                            Logger.info('[GROUP_SPAWN] ' + entityType + ' extra data parsed: ' + (afterPos - pos) + ' bytes', 'Spawn');
                            pos = afterPos;
                        }
                    }
                    router.spawnStats.group++;
                    // Detectar spawn del jugador por uniqueId (más confiable que refObjId)
                    const isPlayerSpawn = (uniqueId === router._expectedUniqueId) ||
                                          (refObjId === router._pendingPlayerInfo?.refObjId);
                    // Log para debug de spawn
                    if (entityType === 'CHAR' || refObjId === 1922) {
                        Logger.info('[GROUP_SPAWN] entity refObjId=' + refObjId + ' uniqueId=' + uniqueId + ' isPlayerSpawn=' + isPlayerSpawn + ' _spawnSent=' + router._spawnSent + ' _pendingRefObj=' + router._pendingPlayerInfo?.refObjId + ' _expectedUid=' + router._expectedUniqueId, 'Spawn');
                    }
                    const coords = calcWorldCoords(xSector, ySector, xOffset, yOffset, zOffset, 'spawn');
                    const region = coords.region;
                    const posX_sql = coords.posX;
                    const posZ_sql = coords.posZ;
                    const posY_sql = coords.posY;
                    const typeLabel = entityType === 'MOB' ? 'Mob' : entityType === 'NPC' ? 'NPC' : entityType === 'COS' ? 'Pet' : entityType === 'CHAR' ? 'Player' : 'Entity';
                    const entityName = (entityType === 'CHAR' && charName) ? charName : `${typeLabel}#${uniqueId}`;
                    const spawnData = {
                        type: 'ENTITY_SPAWN', uniqueId, refObjId, entityType,
                        region, posX: posX_sql, posY: posY_sql, posZ: posZ_sql,
                        angle, moving, running,
                        name: entityName,
                        ...(entityType === 'CHAR' && { guildName, guildId, grantName, jobType, jobLevel, stallFlag, stallName }),
                    };
                    if (router.session && router.session.wsSession) {
                        Logger.info('[SPAWN] ENTITY_SPAWN uid=' + uniqueId + ' refObjId=' + refObjId + ' type=' + entityType + ' region=' + region, 'Spawn');
                        router.session.wsSession.sendEvent('', spawnData);
                    }
                    // Broadcast a todos los demás clientes
                    broadcastEvent(router.session?.id, '', spawnData);
                    if (isPlayerSpawn) {
                        // Guardar altitud real del spawn (posY del servidor)
                        if (posY_sql > 0) router._lastPlayerPosY = posY_sql;
                        // Guardar también la altitud RAW (yOffset = tercer float = altitud real)
                        router._lastPlayerPosYRaw = yOffset;
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
            // NOTA: No enviamos 0x3012 aquí porque CharDataHandlers ya lo envió
            // Enviar 0x3012 dos veces puede causar desconexión del servidor
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

            // LOG DETALLADO del 0xB023
            Logger.info('[0xB023] RAW payload=' + payload.toString('hex').toUpperCase() + ' len=' + payload.length, 'Spawn');
            Logger.info('[0xB023] uniqueId=' + uniqueId + ' region=' + region + ' (' + (region & 0xFF) + ',' + ((region >> 8) & 0xFF) + ') x=' + xF.toFixed(1) + ' z=' + zF.toFixed(1) + ' y=' + yF.toFixed(1) + ' angle=' + angle, 'Spawn');

            const isPlayer = (uniqueId === router._playerUniqueId) || (uniqueId === router._expectedUniqueId);

            // Si es el player y _playerUniqueId no está establecido, establecerlo ahora
            if (isPlayer && !router._playerUniqueId) {
                router._playerUniqueId = uniqueId;
                Logger.info('[0xB023] _playerUniqueId establecido a ' + uniqueId + ' desde 0xB023', 'Spawn');
            }

            // Actualizar _lastPlayerPosY con la altitud real del servidor
            if (isPlayer && yF !== 0 && !isNaN(yF)) {
                const altY = Math.round(yF / 10);
                if (altY > 0) router._lastPlayerPosY = altY;
            }

            // Enviar PLAYER_POSITION_INIT si es la primera posición válida que llega
            if (!router._initPosSent && region > 0 && region < 40000 && router.session && router.session.wsSession) {
                router._initPosSent = true;
                router.session.wsSession.sendEvent('Posicion inicial (desde 0xB023)', {
                    type: 'PLAYER_POSITION_INIT', region,
                    posX: Math.round(xF / 10),
                    posZ: Math.round(zF / 10),
                    posY: Math.round(yF / 10),
                });
                Logger.info('[0xB023] PLAYER_POSITION_INIT: region=' + region + ' x=' + xF.toFixed(1) + ' z=' + zF.toFixed(1) + ' y=' + yF.toFixed(1), 'Spawn');
            }

            if (router.session && router.session.wsSession) {
                if (isPlayer) {
                    // El servidor detuvo al jugador (colisión o llegada a destino)
                    // Enviar PLAYER_STOPPED para que el frontend detenga la interpolación
                    router.session.wsSession.sendEvent('', {
                        type: 'PLAYER_STOPPED', region,
                        posX: Math.round(xF / 10),
                        posZ: Math.round(zF / 10),
                        posY: Math.round(yF / 10),
                        uniqueId,
                    });
                } else {
                    router.session.wsSession.sendEvent('', {
                        type: 'PLAYER_UPDATE', region,
                        posX: Math.round(xF / 10),
                        posZ: Math.round(zF / 10),
                        posY: Math.round(yF / 10),
                    });
                }
            }
        }
    };
}
