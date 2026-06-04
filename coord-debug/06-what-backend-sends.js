// ================================================================
// Archivo: 06-what-backend-sends.js
// Objetos exactos que el backend envía al frontend
// ================================================================

// ----------------------------------------------------------------
// De: CharDataHandlers.js — PLAYER_POSITION_INIT
// ----------------------------------------------------------------
                    router.session.wsSession.sendEvent('PLAYER_POSITION_INIT', {
                        type: 'PLAYER_POSITION_INIT', region: initPos.region,
                        posX: initPos.posX, posY: initPos.posY, posZ: initPos.posZ,
                    });

// ----------------------------------------------------------------
// De: CharDataHandlers.js — PLAYER_SPAWNED (desde 0x3013)
// ----------------------------------------------------------------
                    router.session.wsSession.sendEvent('', {
                        type: 'PLAYER_SPAWNED', region: initPos.region,
                        posX: initPos.posX, posY: initPos.posY, posZ: initPos.posZ,
                        level: level || '?', hp: hp || '?', mp: mp || '?',
                        maxHp: hp || 0, maxMp: mp || 0,
                        sp: sp || 0, exp: currentExp ?? 0,
                        refObjId: modelId, playerName: 'Player',
                    });

// ----------------------------------------------------------------
// De: CharDataHandlers.js — PLAYER_UPDATE (desde 0x3013)
// ----------------------------------------------------------------
                    router.session.wsSession.sendEvent('', {
                        type: 'PLAYER_UPDATE', hp, maxHp: hp, mp, maxMp: mp, level, sp, exp: currentExp,
                        region: initPos.region, posX: initPos.posX, posY: initPos.posY, posZ: initPos.posZ,
                    });

// ----------------------------------------------------------------
// De: SpawnHandlers.js — PLAYER_SPAWNED (desde 0x3015, spawn real)
// ----------------------------------------------------------------
                    router.session.wsSession.sendEvent('Jugador en mundo: Lv' + (info.level || '?') + ' Region=' + region + ' (' + posX_sql + ',' + posZ_sql + ')', {
                        type: 'PLAYER_SPAWNED', region, posX: posX_sql, posY: posY_sql, posZ: posZ_sql,
                        level: info.level || '?', hp: info.hp || '?', mp: info.mp || '?',
                        maxHp: info.hp || 0, maxMp: info.mp || 0,
                        sp: info.sp || 0, exp: info.exp ?? 0,
                        refObjId, playerName: info.playerName || 'Player',
                    });

// ----------------------------------------------------------------
// De: SpawnHandlers.js — IN_GAME status (desde 0x3015)
// ----------------------------------------------------------------
                    router.session.wsSession.sendStatus('IN_GAME', {
                        region, posX: posX_sql, posY: posY_sql, posZ: posZ_sql,
                        level: info.level || '?', hp: info.hp || '?', mp: info.mp || '?',
                        maxHp: info.hp || 0, maxMp: info.mp || 0,
                        sp: info.sp || 0, exp: info.exp ?? 0,
                        refObjId, playerName: info.playerName || 'Player',
                    });

// ----------------------------------------------------------------
// De: SpawnHandlers.js — ENTITY_SPAWN (desde 0x3015)
// ----------------------------------------------------------------
                    const spawnData = {
                        type: 'ENTITY_SPAWN', uniqueId, refObjId, entityType,
                        region, posX: posX_sql, posY: posY_sql, posZ: posZ_sql,
                        angle, moving, running,
                        name: entityName,
                        ...(entityType === 'CHAR' && { guildName, guildId, grantName, jobType, jobLevel, stallFlag, stallName }),
                    };
                    router.session.wsSession.sendEvent('', spawnData);

// ----------------------------------------------------------------
// De: MovementHandlers.js — PLAYER_MOVE_CONFIRMED / ENTITY_MOVE
//     (desde 0xB021, el mismo objeto para ambos casos)
// ----------------------------------------------------------------
                    router.session.wsSession.sendEvent('', {
                        type: eventName, uniqueId: entityUniqueId,
                        dstRegion: hasDestination ? dstRegion : undefined,
                        dstX: hasDestination ? Math.round(dstX / 10) : undefined,
                        dstZ: hasDestination ? Math.round(dstZ / 10) : undefined,   // norte-sur
                        dstY: hasDestination ? Math.round(dstY / 10) : undefined,   // altura
                        hasSource,
                        srcRegion: hasSource ? srcRegion : undefined,
                        srcX: hasSource ? Math.round(srcX) : undefined,
                        srcZ: hasSource ? Math.round(srcZ / 10) : undefined,
                        srcY: hasSource ? Math.round(srcY) : undefined,
                        angle,
                    });
