// Handlers for CharacterData opcodes: 0x34A5, 0x3013, 0x34A6
// Extracted from PacketRouter.js
import Logger from '../../utils/Logger.js';
import { parseItem } from '../../InventoryParser.js';
import { calcWorldCoords } from '../../utils/coordUtils.js';

export function createCharDataHandlers(router) {
    return {
        handleCharDataBegin(rawPacket, packetObj) {
            router._charDataBuffer = Buffer.alloc(0);
            Logger.info('[CHAR_DATA] Begin accumulating', 'CharData');
        },

        handleCharData(rawPacket, packetObj) {
            if (!router._charDataBuffer) router._charDataBuffer = Buffer.alloc(0);
            const payload = rawPacket.slice(6);
            router._charDataBuffer = Buffer.concat([router._charDataBuffer, payload]);
            Logger.info('[CHAR_DATA] 0x3013 fragment - accumulated ' + router._charDataBuffer.length + ' bytes total', 'CharData');
        },

        handleCharDataEnd(rawPacket, packetObj) {
            const endPayload = rawPacket.slice(6);
            if (endPayload.length > 0 && router._charDataBuffer) {
                router._charDataBuffer = Buffer.concat([router._charDataBuffer, endPayload]);
            }
            if (!router._charDataBuffer || router._charDataBuffer.length < 62) {
                Logger.warn('[CHAR_DATA] Buffer insuficiente al final (' + (router._charDataBuffer?.length || 0) + ' bytes)', 'CharData');
                router._charDataBuffer = null;
                return;
            }
            const data = router._charDataBuffer;
            Logger.info('[CHAR_DATA] End - parseando ' + data.length + ' bytes del buffer completo', 'CharData');

            try {
                let pos = 0;
                pos += 4; // serverTimestamp
                const modelId = data.readUInt32LE(pos); pos += 4;
                const scale = data.readUInt8(pos); pos += 1;
                const level = data.readUInt8(pos); pos += 1;
                const levelMax = data.readUInt8(pos); pos += 1;
                const currentExp = Number(data.readBigUInt64LE(pos)); pos += 8;
                pos += 4; // skillExp
                const gold = Number(data.readBigUInt64LE(pos)); pos += 8;
                const sp = data.readUInt32LE(pos); pos += 4;
                pos += 2; // statPoints
                pos += 1; // berserkPoints
                pos += 4; // expChunk
                const hp = data.readUInt32LE(pos); pos += 4;
                const mp = data.readUInt32LE(pos); pos += 4;
                pos += 1; pos += 1; pos += 2; pos += 4; pos += 1; pos += 1;

                const maxSlots = data.readUInt8(pos); pos += 1;
                const itemCount = data.readUInt8(pos); pos += 1;
                Logger.info('[CHAR_DATA] Stats: Lv=' + level + ' HP=' + hp + ' MP=' + mp + ' gold=' + gold + ' slots=' + maxSlots + ' itemCount=' + itemCount, 'CharData');

                const inventory = [];
                const seenSlots = new Set();
                for (let i = 0; i < itemCount && pos < data.length; i++) {
                    if (pos + 1 > data.length) break;
                    const slot = data.readUInt8(pos); pos += 1;
                    const { item: parsedItem, offset: newPos } = parseItem(data, pos);
                    pos = newPos;
                    if (parsedItem && parsedItem.id > 0 && parsedItem.id < 1000000 && slot >= 0 && slot < maxSlots + 13 && !seenSlots.has(slot)) {
                        seenSlots.add(slot);
                        inventory.push({ slot, id: parsedItem.id, plus: parsedItem.plus || 0, variance: parsedItem.variance || 0, durability: parsedItem.durability || 0, quantity: parsedItem.quantity || 1 });
                    }
                }
                router.inventory = inventory;

                router._pendingPlayerInfo = { level, hp, mp, sp, exp: currentExp, refObjId: modelId, playerName: 'Player', uniqueId: modelId };

                // ═══════════════════════════════════════════════════════════════
                // PARSEO SECUENCIAL COMPLETO DEL 0x34A6
                // Basado en la estructura de DaxterSoul (elitepvpers)
                // ═══════════════════════════════════════════════════════════════

                // ── AvatarInventory ──
                const avatarSize = data.readUInt8(pos); pos += 1;
                const avatarCount = data.readUInt8(pos); pos += 1;
                const inventoryAvatar = [];
                for (let a = 0; a < avatarCount && pos < data.length; a++) {
                    if (pos + 5 > data.length) break;
                    const slot = data.readUInt8(pos); pos += 1;
                    const rentType = data.readUInt32LE(pos); pos += 4;
                    // Saltar rent info
                    if (rentType === 1) { pos += 10; }
                    else if (rentType === 2) { pos += 8; }
                    else if (rentType === 3) { pos += 14; }
                    if (pos + 4 > data.length) break;
                    const itemId = data.readUInt32LE(pos); pos += 4;
                    // Saltar datos del item (simplificado)
                    pos += 1; // optLevel
                    pos += 8; // variance
                    pos += 4; // durability
                    const magCount = data.readUInt8(pos); pos += 1;
                    pos += magCount * 8; // mag params
                    pos += 8; // binding (simplificado)
                    inventoryAvatar.push({ slot, id: itemId });
                }

                // ── unkByte1 ──
                if (pos < data.length) { pos += 1; }

                // ── Masteries ──
                const masteries = [];
                while (pos < data.length) {
                    const next = data.readUInt8(pos); pos += 1;
                    if (next !== 1) break;
                    if (pos + 5 > data.length) break;
                    const mId = data.readUInt32LE(pos); pos += 4;
                    const mLv = data.readUInt8(pos); pos += 1;
                    masteries.push({ id: mId, level: mLv });
                }

                // ── unkByte2 ──
                if (pos < data.length) { pos += 1; }

                // ── Skills ──
                const skills = [];
                while (pos < data.length) {
                    const next = data.readUInt8(pos); pos += 1;
                    if (next !== 1) break;
                    if (pos + 5 > data.length) break;
                    const sId = data.readUInt32LE(pos); pos += 4;
                    const sEnabled = data.readUInt8(pos); pos += 1;
                    skills.push({ id: sId, enabled: sEnabled === 1 });
                }

                // ── Quests (simplificado: solo contar) ──
                let questCount = 0;
                if (pos + 2 <= data.length) {
                    const completedCount = data.readUInt16LE(pos); pos += 2;
                    pos += completedCount * 4; // completed quest IDs
                    if (pos < data.length) {
                        const activeCount = data.readUInt8(pos); pos += 1;
                        questCount = activeCount;
                        for (let q = 0; q < activeCount && pos < data.length; q++) {
                            if (pos + 7 > data.length) break;
                            const questId = data.readUInt32LE(pos); pos += 4;
                            pos += 1; // achievementCount
                            pos += 1; // requiresAutoShare
                            const questType = data.readUInt8(pos); pos += 1;
                            if (questType === 28) { pos += 4; }
                            if (pos >= data.length) break;
                            pos += 1; // status
                            if (questType !== 8) {
                                if (pos >= data.length) break;
                                const objCount = data.readUInt8(pos); pos += 1;
                                for (let o = 0; o < objCount && pos < data.length; o++) {
                                    if (pos + 2 > data.length) break;
                                    pos += 1; // objective ID
                                    pos += 1; // status
                                    if (pos + 2 > data.length) break;
                                    const nameLen = data.readUInt16LE(pos); pos += 2;
                                    pos += nameLen; // name
                                    if (pos >= data.length) break;
                                    const taskCount = data.readUInt8(pos); pos += 1;
                                    pos += taskCount * 4; // tasks
                                }
                            }
                            if (questType === 88) {
                                if (pos >= data.length) break;
                                const refCount = data.readUInt8(pos); pos += 1;
                                pos += refCount * 4;
                            }
                        }
                    }
                }

                // ── unkByte3 ──
                if (pos < data.length) { pos += 1; }

                // ── CollectionBook ──
                const collectionThemes = [];
                if (pos + 4 <= data.length) {
                    const themeCount = data.readUInt32LE(pos); pos += 4;
                    for (let t = 0; t < themeCount && pos + 12 <= data.length; t++) {
                        const idx = data.readUInt32LE(pos); pos += 4;
                        const startTime = data.readUInt32LE(pos); pos += 4;
                        const pages = data.readUInt32LE(pos); pos += 4;
                        collectionThemes.push({ index: idx, startTime, pages });
                    }
                }

                // ── UniqueID + Position (ParseBionicDetails) ──
                // [4] uniqueId + [2] region + [4] x + [4] z + [4] y + [2] angle = 20 bytes
                let initPos = { region: 0, posX: 0, posY: 0, posZ: 0 };
                let playerUniqueId = modelId;
                let angle = 0;
                if (pos + 20 <= data.length) {
                    const uid = data.readUInt32LE(pos); pos += 4;
                    const region = data.readUInt16LE(pos); pos += 2;
                    const xs = region & 0xFF, ys = (region >> 8) & 0xFF;
                    if (xs > 0 && ys > 0 && xs <= 252 && ys <= 126) {
                        const xo = data.readFloatLE(pos); pos += 4;
                        const zo = data.readFloatLE(pos); pos += 4;
                        const yo = data.readFloatLE(pos); pos += 4;
                        angle = data.readInt16LE(pos); pos += 2;
                        if (!isNaN(xo) && !isNaN(zo) && !isNaN(yo) &&
                            Math.abs(xo) < 2000 && Math.abs(zo) < 2000 && Math.abs(yo) < 2000 &&
                            !(Math.abs(xo) < 0.001 && Math.abs(zo) < 0.001 && Math.abs(yo) < 0.001)) {
                            playerUniqueId = uid;
                            const coords = calcWorldCoords(xs, ys, xo, yo, zo, 'spawn');
                            initPos = { region: coords.region, posX: coords.posX, posZ: coords.posZ, posY: coords.posY };
                            Logger.info('[CHAR_DATA] Position found (sequential): region=' + region + ' (' + xs + ',' + ys + ') x=' + (xo / 10).toFixed(1) + ' z=' + (yo / 10).toFixed(1) + ' y=' + (zo / 10).toFixed(1) + ' uid=' + uid, 'CharData');
                        } else {
                            pos -= 20; // retroceder si no es válida
                            Logger.info('[CHAR_DATA] Position at sequential pos invalid, will scan backward', 'CharData');
                        }
                    } else {
                        pos -= 6; // retroceder (region no válida)
                        Logger.info('[CHAR_DATA] Region at sequential pos invalid (' + xs + ',' + ys + '), will scan backward', 'CharData');
                    }
                }

                // Fallback: si la posición secuencial no funcionó, buscar hacia atrás
                if (initPos.region === 0) {
                    const SEARCH_START = Math.max(pos, 50);
                    for (let i = data.length - 20; i >= SEARCH_START; i--) {
                        if (i + 20 > data.length) continue;
                        const uid = data.readUInt32LE(i);
                        if (uid === 0 || uid > 10000000) continue;
                        const region = data.readUInt16LE(i + 4);
                        if (region === 0) continue;
                        const xs = region & 0xFF, ys = (region >> 8) & 0xFF;
                        if (xs === 0 || ys === 0 || xs > 252 || ys > 126) continue;
                        const xo = data.readFloatLE(i + 6);
                        const zo = data.readFloatLE(i + 10);
                        const yo = data.readFloatLE(i + 14);
                        if (isNaN(xo) || isNaN(zo) || isNaN(yo)) continue;
                        if (Math.abs(xo) > 2000 || Math.abs(zo) > 2000 || Math.abs(yo) > 2000) continue;
                        if (Math.abs(xo) < 0.001 && Math.abs(zo) < 0.001 && Math.abs(yo) < 0.001) continue;
                        playerUniqueId = uid;
                        const coords = calcWorldCoords(xs, ys, xo, yo, zo, 'spawn');
                        initPos = { region: coords.region, posX: coords.posX, posZ: coords.posZ, posY: coords.posY };
                        Logger.info('[CHAR_DATA] Position found (backward scan): region=' + region + ' (' + xs + ',' + ys + ') x=' + (xo / 10).toFixed(1) + ' z=' + (yo / 10).toFixed(1) + ' y=' + (zo / 10).toFixed(1) + ' uid=' + uid, 'CharData');
                        break;
                    }
                }

                // Guardar datos completos del personaje
                router._charFullData = {
                    level, levelMax, hp, mp, sp, exp: currentExp, gold,
                    modelId, scale,
                    masteries, skills,
                    questCount,
                    inventory, inventoryAvatar,
                    position: initPos,
                };

                router._selectedCharName = router.tcpSession?._selectedCharName || 'Player';
                router.setExpectedUniqueId(playerUniqueId);

                // ── Sincronizar _pendingPlayerInfo con la posición real ──
                if (router._pendingPlayerInfo && initPos.region > 0) {
                    router._pendingPlayerInfo.region = initPos.region;
                    router._pendingPlayerInfo.posX = initPos.posX;
                    router._pendingPlayerInfo.posY = initPos.posY;
                    router._pendingPlayerInfo.posZ = initPos.posZ;
                    // Inicializar región actual para 0x7031
                    router._currentRegion = initPos.region;
                }

                // ── Enviar eventos al frontend ──
                if (router.session && router.session.wsSession) {
                    if (initPos.region > 0) {
                        router._initPosSent = true;
                        router.session.wsSession.sendEvent('PLAYER_POSITION_INIT', {
                            type: 'PLAYER_POSITION_INIT', region: initPos.region,
                            posX: initPos.posX, posY: initPos.posY, posZ: initPos.posZ,
                        });
                        // También enviar PLAYER_SPAWNED para que el frontend cargue el mundo
                        router.session.wsSession.sendEvent('', {
                            type: 'PLAYER_SPAWNED', region: initPos.region,
                            posX: initPos.posX, posY: initPos.posY, posZ: initPos.posZ,
                            level: level || '?', hp: hp || '?', mp: mp || '?',
                            maxHp: hp || 0, maxMp: mp || 0,
                            sp: sp || 0, exp: currentExp ?? 0,
                            refObjId: modelId, playerName: 'Player',
                        });
                    } else {
                        Logger.info('[CHAR_DATA] No valid position found, waiting for 0xB023 or 0x3020', 'CharData');
                    }
                }
                if (router.session && router.session.wsSession) {
                    router.session.wsSession.sendEvent('INVENTORY_DATA', {
                        type: 'INVENTORY_DATA', inventory, inventoryAvatar, maxSlots, gold: gold || 0,
                    });
                }
                if (router.session && router.session.wsSession) {
                    router.session.wsSession.sendEvent('', {
                        type: 'PLAYER_UPDATE', hp, maxHp: hp, mp, maxMp: mp, level, sp, exp: currentExp,
                        region: initPos.region, posX: initPos.posX, posY: initPos.posY, posZ: initPos.posZ,
                    });
                    Logger.info('[CHAR_DATA] Stats sent to frontend: HP=' + hp + '/' + hp + ' MP=' + mp + '/' + mp + ' Lv=' + level + ' SP=' + sp, 'CharData');
                }
                // Enviar skills al frontend
                if (router.session && router.session.wsSession && skills.length > 0) {
                    router.session.wsSession.sendEvent('', {
                        type: 'SKILL_UPDATE', skills,
                    });
                }
                // Enviar masteries al frontend
                if (router.session && router.session.wsSession && masteries.length > 0) {
                    router.session.wsSession.sendEvent('', {
                        type: 'MASTERY_UPDATE', masteries,
                    });
                }

                // Enviar 0x3012 CONFIRM_SPAWN para que el servidor sepa que recibimos los datos
                // y proceda a enviar los spawns del mundo
                try {
                    const confirmPacket = router.tcpSession.security.formatPacket(0x3012, Buffer.alloc(0), true);
                    router.tcpSession.send(confirmPacket);
                    Logger.info('[CHAR_DATA] 0x3012 sent successfully', 'CharData');
                } catch (e) {
                    Logger.warn('[CHAR_DATA] Failed to send 0x3012: ' + e.message, 'CharData');
                }

                // Forzar spawn readiness después de 3s si el server no envía 0x34B5
                if (router._spawnReadyTimer) clearTimeout(router._spawnReadyTimer);
                router._spawnReadyTimer = setTimeout(() => {
                    if (!router._spawnSent && router.tcpSession) {
                        Logger.info('[CHAR_DATA] Server did not send 0x34B5, forcing spawn readiness (0x34B6)', 'CharData');
                        try {
                            const confirm = router.tcpSession.security.formatPacket(0x34b6, Buffer.alloc(0), true);
                            router.tcpSession.send(confirm);
                            if (router.session && router.session.wsSession) {
                                router.session.wsSession.sendEvent('Spawn readiness auto-enviado');
                            }
                        } catch (e) {
                            Logger.error('[CHAR_DATA] Error forcing 0x34B6: ' + e.message, 'CharData');
                        }
                    }
                }, 3000);
            } catch (e) {
                Logger.warn('0x3013: ' + e.message, 'CharData');
            }
        },

        handleCharacterStatsUpdate(rawPacket, packetObj) {
            const payload = rawPacket.slice(6);
            if (payload.length < 36) return;
            try {
                let pos = 0;
                const phyAtkMin = payload.readUInt32LE(pos); pos += 4;
                const phyAtkMax = payload.readUInt32LE(pos); pos += 4;
                const magAtkMin = payload.readUInt32LE(pos); pos += 4;
                const magAtkMax = payload.readUInt32LE(pos); pos += 4;
                const phyDef = payload.readUInt16LE(pos); pos += 2;
                const magDef = payload.readUInt16LE(pos); pos += 2;
                const hitRate = payload.readUInt16LE(pos); pos += 2;
                const parryRatio = payload.readUInt16LE(pos); pos += 2;
                const maxHp = payload.readUInt32LE(pos); pos += 4;
                const maxMp = payload.readUInt32LE(pos); pos += 4;
                const str = payload.readUInt16LE(pos); pos += 2;
                const intl = payload.readUInt16LE(pos); pos += 2;

                Logger.info('[0x303D] Stats: maxHP=' + maxHp + ' maxMP=' + maxMp + ' STR=' + str + ' INT=' + intl +
                    ' phyAtk=' + phyAtkMin + '~' + phyAtkMax + ' magAtk=' + magAtkMin + '~' + magAtkMax +
                    ' phyDef=' + phyDef + ' magDef=' + magDef, 'CharData');

                // Actualizar _pendingPlayerInfo con maxHP/maxMP
                if (router._pendingPlayerInfo) {
                    router._pendingPlayerInfo.maxHp = maxHp;
                    router._pendingPlayerInfo.maxMp = maxMp;
                }

                // Enviar al frontend como PLAYER_UPDATE con todos los stats
                if (router.session && router.session.wsSession) {
                    router.session.wsSession.sendEvent('', {
                        type: 'PLAYER_UPDATE',
                        maxHp, maxMp,
                        phyAtk: phyAtkMin + ' ~ ' + phyAtkMax,
                        magAtk: magAtkMin + ' ~ ' + magAtkMax,
                        phyDef, magDef, hitRate, parryRatio,
                        str, int: intl,
                    });
                }
            } catch (e) {
                Logger.warn('[0x303D] Parse error: ' + e.message, 'CharData');
            }
        }
    };
}
