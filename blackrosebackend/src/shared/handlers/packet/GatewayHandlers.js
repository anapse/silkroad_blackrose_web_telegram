// Handlers for Gateway/Login opcodes: 0x6100, 0x6101, 0x600d, 0x2322, 0xa323, 0xa102, 0xa103, 0xb007, 0xb001
// Extracted from PacketRouter.js
import Logger from '../../utils/Logger.js';
import { LoginHandler } from '../LoginHandler.js';
import { LoginRequestBuilder } from '../../builders/LoginRequestBuilder.js';
import { OPCODE_LOGIN_REQUEST, GAME_VERSION, LOCALE_VIETNAM } from '../../../config/gameConstants.js';
import PacketWriter from '../../../game/packet/PacketWriter.js';
import zlib from 'zlib';
import { parseOpcode } from '../../opcodes/OPCODE_DEFINITIONS.js';

export function createGatewayHandlers(router) {
    const loginHandler = new LoginHandler();

    return {
        sendPatchRequest() {
            if (router.patchSent || router.isAgent) return;
            router.patchSent = true;
            const locale = router.session.loginCredentials?.locale || LOCALE_VIETNAM;
            const version = GAME_VERSION;
            Logger.info('PacketRouter: sending PATCH_REQUEST (0x6100) locale=' + locale + ' version=' + version, 'Gateway');
            try {
                const p = new PacketWriter();
                p.writeByte(locale);
                p.writeString("SR_Client");
                p.writeDWord(version);
                const payload = p.getBytes();
                const encPacket = router.tcpSession.security.formatPacket(0x6100, payload, true);
                router.tcpSession.send(encPacket);
            } catch (err) {
                Logger.error('PacketRouter: Failed sending 0x6100', err, 'Gateway');
            }
        },

        sendGameLogin() {
            if (!router.session || !router.session.loginCredentials) {
                Logger.warn('PacketRouter: cannot send GAME_LOGIN, no credentials', 'Gateway');
                return;
            }
            const { username, password } = router.session.loginCredentials;
            const token = router.tcpSession._token || router.tcpSession?._sessionData?.token || 0;
            if (!token) {
                Logger.warn('PacketRouter: missing token for GAME_LOGIN', 'Gateway');
                return;
            }
            Logger.info('PacketRouter: sending GAME_LOGIN (0x6103) for user=' + username + ' token=' + token, 'Gateway');
            try {
                const p = new PacketWriter();
                p.writeDWord(Number(token));
                p.writeString(username || '');
                p.writeString(password || '');
                p.writeByte(LOCALE_VIETNAM);
                p.writeDWord(0);  // MAC vacio
                p.writeWord(0);   // padding
                const encPacket = router.tcpSession.security.formatPacket(0x6103, p.getBytes(), true);
                router.tcpSession.send(encPacket);
            } catch (err) {
                Logger.error('PacketRouter: Failed sending 0x6103', err, 'Gateway');
            }
        },

        handlePatchResponse(rawPacket, packetObj) {
            Logger.info('PacketRouter: PATCH_RESPONSE received opcode=' + packetObj.opcode, 'Gateway');
        },

        handleShardListResponse(rawPacket, packetObj) {
            Logger.info('PacketRouter: SHARD_LIST received opcode=' + packetObj.opcode, 'Gateway');

            // En modo Agent, 0x600d puede ser "massive packets". No enviar 0x6101.
            if (router.isAgent) {
                router._handleAgentMassivePacket(rawPacket, packetObj);
                return;
            }

            // Si el servidor no envio 0xA100, enviamos 0x6101 al recibir el primer shard list
            if (!router.shardListRequested) {
                router.shardListRequested = true;
                Logger.info('PacketRouter: sending SHARD_LIST_REQUEST (0x6101) on first shard list', 'Gateway');
                try {
                    const p = new PacketWriter();
                    const encPacket = router.tcpSession.security.formatPacket(0x6101, p.getBytes(), true);
                    router.tcpSession.send(encPacket);
                    if (router.session.wsSession) {
                        router.session.wsSession.sendStatus('SHARD_LIST_REQUEST_SENT');
                    }
                } catch (err) {
                    Logger.error('PacketRouter: Failed sending 0x6101', err, 'Gateway');
                }
            }

            // Contar paquetes 0x600d para saber cuando termino la lista
            if (packetObj.opcode === '0x600d') {
                router.shardListCount++;
                if (router.shardListCount >= 4) {
                    router.shardListReceived = true;
                    Logger.info('PacketRouter: shard list complete (received 4x 0x600d)', 'Gateway');
                    if (router.session.wsSession) {
                        router.session.wsSession.sendStatus('SHARD_LIST_COMPLETE');
                    }
                    // Auto-login si ya tenemos credenciales guardadas
                    if (router.session && router.session.loginCredentials && !router.autoLoginSent) {
                        const { username, password, serverId } = router.session.loginCredentials;
                        if (username && password) {
                            router.sendLogin(username, password, serverId);
                        }
                    }
                }
            }

            if (router.session && router.session.wsSession) {
                const parsed = parseOpcode(rawPacket, packetObj.opcode);
                const detail = parsed || { opcode: packetObj.opcode, size: packetObj.size };
                router.session.wsSession.sendStatus('SERVER_LIST_RECEIVED', { detail });
            }
        },

        handleCaptchaRequest(rawPacket, packetObj) {
            Logger.info('PacketRouter: CAPTCHA_REQUEST received opcode=' + packetObj.opcode, 'Gateway');
            try {
                const payload = rawPacket.slice(4); // saltar size(2) + opcode(2)
                const decompressed = zlib.inflateSync(payload);
                const base64Image = decompressed.toString('base64');
                const dataUri = 'data:image/png;base64,' + base64Image;
                Logger.info('PacketRouter: CAPTCHA decompressed (' + decompressed.length + ' bytes -> base64)', 'Gateway');
                if (router.session && router.session.wsSession) {
                    router.session.wsSession.send({ type: 'CAPTCHA', image: dataUri });
                    router.session.wsSession.sendStatus('CAPTCHA_REQUESTED');
                    router.session.wsSession.sendEvent('Captcha solicitado por el servidor - imagen enviada al frontend');
                }
            } catch (e) {
                Logger.warn('PacketRouter: CAPTCHA decompress failed (no zlib data?)', 'Gateway');
                if (router.session && router.session.wsSession) {
                    router.session.wsSession.sendStatus('CAPTCHA_REQUESTED');
                    router.session.wsSession.sendEvent('Captcha solicitado por el servidor');
                }
                Logger.info('PacketRouter: captcha image sent to frontend, waiting for user to submit', 'Gateway');
            }
        },

        handleCaptchaResult(rawPacket, packetObj) {
            Logger.info('PacketRouter: CAPTCHA_RESULT received opcode=' + packetObj.opcode, 'Gateway');
            const payload = rawPacket.slice(6);
            const result = payload.length >= 2 ? payload.readUInt8(1) : 0;
            Logger.info('[A323] Captcha result=' + result, 'Gateway');
            if (result === 1) {
                Logger.success('PacketRouter: Captcha accepted', 'Gateway');
                if (router.session.wsSession) {
                    router.session.wsSession.sendEvent('Captcha aceptado - iniciando login');
                }
            }
        },

        handleLoginResponse(rawPacket, packetObj) {
            Logger.info('PacketRouter: LOGIN_RESPONSE received opcode=' + packetObj.opcode, 'Gateway');
            const payload = rawPacket.slice(6);
            const result = payload.length > 0 ? payload.readUInt8(0) : 0;
            Logger.info('[A102] result=' + result + ' payloadLen=' + (payload.length), 'Gateway');
            if (result === 1 && payload.length >= 9) {
                const token = payload.readUInt32LE(1);
                const ipLen = payload.readUInt16LE(5);
                const agentHost = payload.toString('utf8', 7, 7 + ipLen);
                const agentPort = payload.readUInt16LE(7 + ipLen);
                Logger.info('[A102] LOGIN OK -> token=' + token + ' agent=' + agentHost + ':' + agentPort, 'Gateway');

                // Guardar token para usarlo en sendGameLogin
                if (router.tcpSession) router.tcpSession._token = token;
                if (router.session && router.session.loginCredentials) {
                    router.session.loginCredentials.token = token;
                }

                if (router.session.wsSession) {
                    router.session.wsSession.sendStatus('LOGIN_OK', { host: agentHost, port: agentPort, token });
                    router.session.wsSession.sendEvent('Login exitoso - Agent ' + agentHost + ':' + agentPort, { agentHost, agentPort, token });
                }

                if (router.tcpSession.connectionManager) {
                    router.session.wsSession.sendStatus('AGENT_REDIRECT');
                    router.tcpSession.stopHeartbeat();
                    router.tcpSession.connectionManager.reconnectToAgent(agentHost, agentPort, token).then(() => {
                        router.tcpSession.handshakeStarted = false;
                        router.tcpSession.handshakeComplete = false;
                        router.tcpSession.packetRouter = null;
                        router.tcpSession.packetAssembler.reset();
                        router.tcpSession.security.resetHandshakeState();
                        if (router.session.wsSession) router.session.wsSession.sendStatus('AGENT_CONNECTED');
                    }).catch((err) => {
                        Logger.error('PacketRouter: Failed reconnecting to Agent', err, 'Gateway');
                        if (router.session.wsSession) {
                            router.session.wsSession.sendStatus('AGENT_CONNECT_FAILED', { error: err.message || 'Agent reconnect failed' });
                            router.session.wsSession.sendEvent('\u274C Login fallido: ' + (err.message || 'Error al reconectar Agent'));
                        }
                    });
                }
            } else {
                Logger.warn('[A102] Login failed, result=' + result, 'Gateway');
            }
        },

        handleGameLoginResponse(rawPacket, packetObj) {
            Logger.info('PacketRouter: GAME_LOGIN_REPLY received opcode=' + packetObj.opcode, 'Gateway');
            const payload = rawPacket.slice(6);
            const result = payload.length > 0 ? payload.readUInt8(0) : 0;
            if (result === 1) {
                Logger.success('PacketRouter: Agent login successful, requesting character list', 'Gateway');
                try {
                    const p = new PacketWriter();
                    p.writeByte(2);  // Tipo: 2 = solicitar lista
                    const encPacket = router.tcpSession.security.formatPacket(0x7007, p.getBytes(), false);
                    router.tcpSession.send(encPacket);
                    Logger.info('PacketRouter: sent CHARACTER_LIST_REQUEST (0x7007)', 'Gateway');
                } catch (err) {
                    Logger.error('PacketRouter: Failed sending 0x7007', err, 'Gateway');
                }
            }
        },

        sendLogin(username, password, serverId) {
            if (router.autoLoginSent || router.isAgent) return;
            router.autoLoginSent = true;
            Logger.info('PacketRouter: auto-sending LOGIN_REQUEST (0x6102) for user=' + username, 'Gateway');
            try {
                const loginPacket = LoginRequestBuilder.buildLoginRequest(username, password, serverId);
                const encryptedPacket = router.tcpSession.security.formatPacket(OPCODE_LOGIN_REQUEST, loginPacket.payload, loginPacket.encrypted);
                Logger.info('PacketRouter: 0x6102 hex=' + encryptedPacket.toString('hex').toUpperCase(), 'Gateway');
                router.tcpSession.send(encryptedPacket);
                if (router.session.wsSession) {
                    router.session.wsSession.sendStatus('LOGIN_SENT');
                    router.session.wsSession.sendEvent('Login automatico enviado');
                }
            } catch (err) {
                Logger.error('PacketRouter: Failed sending 0x6102', err, 'Gateway');
            }
        },

        handleCharacterSelectConfirm(rawPacket, packetObj) {
            const result = rawPacket.length > 6 ? rawPacket.readUInt8(6) : 0;
            Logger.info('[B001] Character select confirmed, result=' + result, 'Gateway');
            if (result === 1 && router.session && router.session.wsSession) {
                const charName = router.tcpSession?._selectedCharName || '';
                let region = 0, posX = 0, posZ = 0, posY = 0, angle = 0;
                if (charName && router._charPositions?.[charName]) {
                    const pos = router._charPositions[charName];
                    region = pos.region;
                    angle = pos.angle || 0;
                    const hasValidPos = (pos.posX !== 0 || pos.posZ !== 0);
                    if (hasValidPos) { posX = pos.posX; posZ = pos.posZ; posY = pos.posY; }
                    Logger.info('[B001] Using position from 0xB007 for "' + charName + '": region=' + region + ' pos=[' + posX + ', ' + posZ + ', ' + posY + '] (valid=' + hasValidPos + ')', 'Gateway');
                } else {
                    Logger.warn('[B001] No saved position for "' + charName + '", sending 0', 'Gateway');
                }
                router.session.wsSession.sendEvent('Personaje seleccionado - entrando al mundo');
            }
        },

        handleCharacterList(rawPacket, packetObj) {
            Logger.info('PacketRouter: CHARACTER_LIST received opcode=' + packetObj.opcode, 'Gateway');
            const payload = rawPacket.slice(6);
            const characters = [];
            try {
                const type = payload.readUInt8(0);
                const success = payload.readUInt8(1);
                const charCount = payload.readUInt8(2);
                Logger.info('[0xb007] type=' + type + ' success=' + success + ' charCount=' + charCount, 'Gateway');

                let pos = 3;
                const offsets = [];
                while (pos < payload.length - 6 && offsets.length < charCount) {
                    const nameLen = payload.readUInt16LE(pos + 4);
                    if (nameLen >= 4 && nameLen <= 16 && pos + 6 + nameLen <= payload.length) {
                        let printable = true;
                        for (let j = 0; j < nameLen; j++) {
                            const c = payload.readUInt8(pos + 6 + j);
                            if (c < 0x20 || c > 0x7E) { printable = false; break; }
                        }
                        if (printable) { offsets.push(pos); pos += 6 + nameLen + 2; continue; }
                    }
                    pos += 1;
                }

                for (let i = 0; i < offsets.length; i++) {
                    const start = offsets[i];
                    const end = (i + 1 < offsets.length) ? offsets[i + 1] : payload.length;
                    const refObjId = payload.readUInt32LE(start);
                    const nameLen = payload.readUInt16LE(start + 4);
                    const name = payload.toString('utf8', start + 6, start + 6 + nameLen);
                    const level = payload.readUInt8(start + 6 + nameLen + 1);
                    const posOffset = end - 16;
                    let region = 0, posX = 0, posZ = 0, posY = 0, angle = 0;
                    if (posOffset > start + 6 + nameLen + 2) {
                        region = payload.readUInt16LE(posOffset);
                        posX = Math.round(payload.readFloatLE(posOffset + 2));
                        posZ = Math.round(payload.readFloatLE(posOffset + 6));
                        posY = Math.round(payload.readFloatLE(posOffset + 10));
                        angle = payload.readUInt16LE(posOffset + 14);
                    }
                    characters.push({ index: i, name, level, refObjId, deleted: false, region, posX, posZ, posY, angle });
                    Logger.info('[0xb007] ' + name + ' Lv' + level + ' refObjId=' + refObjId + ' pos=[' + posX + ', ' + posZ + ', ' + posY + '] region=' + region, 'Gateway');
                }
            } catch (e) {
                Logger.error('[0xb007] Scan error', e, 'Gateway');
            }

            Logger.info('[0xb007] Parsed ' + characters.length + ' characters', 'Gateway');
            if (router.session && router.session.wsSession) {
                if (characters.length > 0) {
                    router.session.wsSession.sendStatus('CHARACTER_LIST_RECEIVED', {
                        charCount: characters.length,
                        characters: characters.map((c) => ({ index: c.index, name: c.name, level: c.level, refObjId: c.refObjId, deleted: c.deleted, region: c.region, posX: c.posX, posZ: c.posZ, posY: c.posY, angle: c.angle })),
                    });
                    const charNames = characters.filter((c) => !c.deleted).map((c) => c.name + ' (Lv' + c.level + ')').join(', ');
                    router.session.wsSession.sendEvent('\u{1F464} Personajes: ' + charNames, { characters, charCount: characters.length });
                    router._charPositions = {};
                    for (const c of characters) {
                        if (!c.deleted) router._charPositions[c.name] = { region: c.region, posX: c.posX, posZ: c.posZ, posY: c.posY, angle: c.angle };
                    }
                    Logger.info('PacketRouter: character list sent to frontend (' + characters.length + ' chars) - waiting for user selection', 'Gateway');
                } else {
                    router.session.wsSession.sendStatus('CHARACTER_LIST_FAILED', { error: 'No characters parsed' });
                    router.session.wsSession.sendEvent('Error al obtener lista de personajes');
                }
            }
        }
    };
}
