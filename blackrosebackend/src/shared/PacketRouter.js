import Logger from '../shared/utils/Logger.js';
import { parseOpcode, getOpcodeDefinition } from './opcodes/OPCODE_DEFINITIONS.js';
import { LoginHandler } from './handlers/LoginHandler.js';
import { LoginRequestBuilder } from './builders/LoginRequestBuilder.js';
import { OPCODE_LOGIN_REQUEST, GAME_VERSION, LOCALE_VIETNAM } from '../config/gameConstants.js';
import { parseInventory, parseInventoryMovement, parseInventoryUpdate, parseDurabilityUpdate, parseCapacityUpdate, StorageAccumulator, InventoryMovementType, parseItem } from './InventoryParser.js';
import { getTypeID2 } from './ItemTypeDB.js';
import { createSpawnHandlers } from './handlers/packet/SpawnHandlers.js';
import { createCharDataHandlers } from './handlers/packet/CharDataHandlers.js';
import { createMovementHandlers } from './handlers/packet/MovementHandlers.js';
import sessionManager from '../game/sessions/SessionManager.js';

// Helper: enviar evento a TODOS los clientes conectados excepto el remitente
export function broadcastEvent(senderSessionId, eventName, detail = {}) {
    const sessions = sessionManager.getAllSessions();
    for (const sess of sessions) {
        if (sess.id === senderSessionId) continue; // saltar al que ya recibió el paquete TCP
        if (sess.wsSession && !sess.wsSession.isClosed) {
            try {
                sess.wsSession.sendEvent(eventName, detail);
            } catch (err) {
                Logger.error(`[Broadcast] Error sending to session ${sess.id}: ${err.message}`, 'PacketRouter');
            }
        }
    }
}

export default class PacketRouter {
    constructor(tcpSession, session) {
        this.tcpSession = tcpSession;
        this.session = session;
        this.loginHandler = new LoginHandler();
        this.patchSent = false;
        this.shardListRequested = false;
        this.shardListCount = 0;
        this.shardListReceived = false;
        this.captchaReplySent = false;
        this.isAgent = false; // true cuando estamos conectados al Agent (no Gateway)

        // Reensamblaje de "massive packets" (0x600d) en modo Agent
        this._massiveParts = [];       // chunks de datos acumulados
        this._massiveTotalParts = 0;   // número total de partes esperadas
        this._massiveOpcode = null;    // opcode original del paquete masivo

        // Acumulador de character data (0x3013) como en xBot
        this._charDataBuffer = null;
        this._pendingPlayerInfo = null; // stats parciales, posición llega en 0x3020

        // Propiedades para CharDataHandlers y SpawnHandlers
        this._expectedUniqueId = null;
        this._initPosSent = false;
        this._spawnSent = false;
        this._spawnReadyTimer = null;
        this._lastPlayerPosY = 0;
        this._selectedCharName = 'Player';
        this._charFullData = null;

        // Acumulador de storage/bodega (0x3047 → 0x3049 → 0x304A)
        this._storageAccumulator = new StorageAccumulator();

        // Spawn handlers from SpawnHandlers.js
        this.spawnHandlers = createSpawnHandlers(this);
        this.spawnStats = { single: 0, group: 0 };

        // CharData handlers from CharDataHandlers.js
        this.charDataHandlers = createCharDataHandlers(this);

        // Movement handlers from MovementHandlers.js
        this.movementHandlers = createMovementHandlers(this);

        // Inventario actual del jugador (mapa slot → item)
        this.inventory = [];
        this.inventoryAvatar = [];

        this.handlers = {
            '0x5000': this.handleHandshake.bind(this),
            '0x2001': this.handleHandshakeComplete.bind(this),
            '0xa100': this.handlePatchResponse.bind(this),
            '0xa101': this.handleShardListResponse.bind(this),
            '0x600d': this.handleShardListResponse.bind(this),
            '0x2322': this.handleCaptchaRequest.bind(this),
            '0xa323': this.handleCaptchaResult.bind(this),
            '0xa102': this.handleLoginResponse.bind(this),
            '0xa103': this.handleGameLoginResponse.bind(this),
            '0xb007': this.handleCharacterList.bind(this),
            '0xb001': this.handleCharacterSelectConfirm.bind(this),
            // Game world - character data accumulator (xBot pattern)
            '0x34a5': (rawPacket, packetObj) => this.charDataHandlers.handleCharDataBegin(rawPacket, packetObj),
            '0x3013': (rawPacket, packetObj) => this.charDataHandlers.handleCharData(rawPacket, packetObj),
            '0x34a6': (rawPacket, packetObj) => this.charDataHandlers.handleCharDataEnd(rawPacket, packetObj),
            '0x34b5': this.handleSpawnRequest.bind(this),
            '0x3015': (rawPacket, packetObj) => this.spawnHandlers.handleSingleSpawn(rawPacket, packetObj),
            '0x3016': (rawPacket, packetObj) => this.spawnHandlers.handleSingleDespawn(rawPacket, packetObj),
            '0x3017': (rawPacket, packetObj) => this.spawnHandlers.handleGroupSpawnBegin(rawPacket, packetObj),
            '0x3018': (rawPacket, packetObj) => this.spawnHandlers.handleGroupSpawnEnd(rawPacket, packetObj),
            '0x3019': (rawPacket, packetObj) => this.spawnHandlers.handleGroupSpawnData(rawPacket, packetObj),
            '0x3020': (rawPacket, packetObj) => this.movementHandlers.handleCelestialPosition(rawPacket, packetObj),
            '0xb021': (rawPacket, packetObj) => this.movementHandlers.handleServerMove(rawPacket, packetObj),
            '0xb023': (rawPacket, packetObj) => this.spawnHandlers.handleMoveBegin(rawPacket, packetObj),
            '0x3026': this.handleChat.bind(this),
            '0x059c': this.handleUnknown059c.bind(this),
            '0xf54e': this.handleUnknownF54e.bind(this),
            // Inventory handlers (xBot pattern)
            '0xb034': this.handleInventoryMovement.bind(this),
            '0x3040': this.handleInventoryUpdate.bind(this),
            '0x3052': this.handleDurabilityUpdate.bind(this),
            '0x3092': this.handleCapacityUpdate.bind(this),
            '0x3047': this.handleStorageBegin.bind(this),
            '0x3049': this.handleStorageData.bind(this),
            '0x304a': this.handleStorageEnd.bind(this),
            // VSROMAX custom opcodes (free version)
            '0x7596': (rawPacket, packetObj) => Logger.info(`[VSROMAX] opcode=${packetObj.opcode} size=${packetObj.size}`, 'PacketRouter'),
            '0x7090': (rawPacket, packetObj) => Logger.info(`[VSROMAX] opcode=${packetObj.opcode} size=${packetObj.size}`, 'PacketRouter'),
            '0x7093': (rawPacket, packetObj) => Logger.info(`[VSROMAX] opcode=${packetObj.opcode} size=${packetObj.size}`, 'PacketRouter'),
            '0x7310': (rawPacket, packetObj) => Logger.info(`[VSROMAX] opcode=${packetObj.opcode} size=${packetObj.size}`, 'PacketRouter'),
            '0x7311': (rawPacket, packetObj) => Logger.info(`[VSROMAX] opcode=${packetObj.opcode} size=${packetObj.size}`, 'PacketRouter'),
            '0x7312': (rawPacket, packetObj) => Logger.info(`[VSROMAX] opcode=${packetObj.opcode} size=${packetObj.size}`, 'PacketRouter'),
            '0x74f8': (rawPacket, packetObj) => Logger.info(`[VSROMAX] opcode=${packetObj.opcode} size=${packetObj.size}`, 'PacketRouter'),
            // Unhandled opcodes seen in logs — log contents for analysis
            '0x34e1': (rawPacket, packetObj) => Logger.info(`[UNHANDLED] opcode=${packetObj.opcode} size=${packetObj.size}`, 'PacketRouter'),
            '0x33a6': (rawPacket, packetObj) => Logger.info(`[UNHANDLED] opcode=${packetObj.opcode} size=${packetObj.size}`, 'PacketRouter'),
            '0x3320': (rawPacket, packetObj) => Logger.info(`[UNHANDLED] opcode=${packetObj.opcode} size=${packetObj.size}`, 'PacketRouter'),
            '0x385f': (rawPacket, packetObj) => Logger.info(`[UNHANDLED] opcode=${packetObj.opcode} size=${packetObj.size}`, 'PacketRouter'),
            '0x3077': (rawPacket, packetObj) => Logger.info(`[UNHANDLED] opcode=${packetObj.opcode} size=${packetObj.size}`, 'PacketRouter'),
            '0x3153': (rawPacket, packetObj) => Logger.info(`[UNHANDLED] opcode=${packetObj.opcode} size=${packetObj.size}`, 'PacketRouter'),
            '0x3305': (rawPacket, packetObj) => Logger.info(`[UNHANDLED] opcode=${packetObj.opcode} size=${packetObj.size}`, 'PacketRouter'),
            '0x303d': (rawPacket, packetObj) => this.charDataHandlers.handleCharacterStatsUpdate(rawPacket, packetObj),
            // Stall / State update opcodes
            '0x30bf': (rawPacket, packetObj) => {
                const payload = rawPacket.slice(6);
                if (payload.length >= 5) {
                    const uniqueId = payload.readUInt32LE(0);
                    const state = payload.readUInt8(4); // 0=closed, 4=open
                    Logger.info(`[STALL] 0x30BF uid=${uniqueId} state=${state}`, 'PacketRouter');
                    if (this.session?.wsSession) {
                        this.session.wsSession.sendEvent('', {
                            type: 'ENTITY_UPDATE',
                            uniqueId,
                            stallFlag: state,
                        });
                    }
                }
            },
            '0x30b8': (rawPacket, packetObj) => {
                const payload = rawPacket.slice(6);
                let stallName = null;
                if (payload.length >= 6) {
                    const uniqueId = payload.readUInt32LE(0);
                    // Leer stall name (Ascii con prefijo de longitud)
                    if (payload.length >= 8) {
                        const nameLen = payload.readUInt16LE(4);
                        if (nameLen > 0 && 6 + nameLen <= payload.length) {
                            stallName = payload.slice(6, 6 + nameLen).toString('ascii');
                        }
                    }
                    Logger.info(`[STALL] 0x30B8 CREATE uid=${uniqueId} name=${stallName || '?'}`, 'PacketRouter');
                    if (this.session?.wsSession) {
                        this.session.wsSession.sendEvent('', {
                            type: 'ENTITY_UPDATE',
                            uniqueId,
                            stallFlag: 4,
                            stallName,
                        });
                    }
                }
            },
            '0x30b9': (rawPacket, packetObj) => {
                const payload = rawPacket.slice(6);
                if (payload.length >= 4) {
                    const uniqueId = payload.readUInt32LE(0);
                    Logger.info(`[STALL] 0x30B9 DESTROY uid=${uniqueId}`, 'PacketRouter');
                    if (this.session?.wsSession) {
                        this.session.wsSession.sendEvent('', {
                            type: 'ENTITY_UPDATE',
                            uniqueId,
                            stallFlag: 0,
                            stallName: null,
                        });
                    }
                }
            },
            '0x30bb': (rawPacket, packetObj) => {
                const payload = rawPacket.slice(6);
                if (payload.length >= 8) {
                    const uniqueId = payload.readUInt32LE(0);
                    const nameLen = payload.readUInt16LE(4);
                    let stallName = null;
                    if (nameLen > 0 && 6 + nameLen <= payload.length) {
                        stallName = payload.slice(6, 6 + nameLen).toString('ascii');
                    }
                    Logger.info(`[STALL] 0x30BB TITLE_UPDATE uid=${uniqueId} name=${stallName || '?'}`, 'PacketRouter');
                    if (this.session?.wsSession) {
                        this.session.wsSession.sendEvent('', {
                            type: 'ENTITY_UPDATE',
                            uniqueId,
                            stallName,
                        });
                    }
                }
            },
            '0x3122': (rawPacket, packetObj) => Logger.info(`[UNHANDLED] opcode=${packetObj.opcode} size=${packetObj.size}`, 'PacketRouter'),
        };
    }

    route(rawPacket, packetObj) {
        const opcode = packetObj.opcode.toLowerCase();
        const handler = this.handlers[opcode];

        // LOG MASIVO: mostrar TODOS los opcodes que pasan por aquí
        const size = packetObj.size || rawPacket.length;
        const showOpcodes = ['0x3015','0x3016','0x3017','0x3018','0x3019','0x34b5','0x34a5','0x34a6','0x3013','0xb023','0x3020','0xb021'];
        if (opcode !== '0x2002') {
            const hex = rawPacket.length < 500 ? rawPacket.slice(0, 80).toString('hex').toUpperCase() : rawPacket.slice(0, 40).toString('hex').toUpperCase() + '...';
            const isInteresting = showOpcodes.includes(opcode);
            if (isInteresting) {
                Logger.info(`[ROUTE] ═══ ${packetObj.opcode} size=${size} hex=${hex}`, 'PacketRouter');
            } else {
                Logger.debug(`[ROUTE] ${packetObj.opcode} size=${size}`, 'PacketRouter');
            }
        }

        if (!handler) {
            // Solo loggear opcodes sin handler que no sean heartbeats
            if (opcode !== '0x2002') {
                Logger.debug(`PacketRouter: no handler for opcode=${packetObj.opcode}`, 'PacketRouter');
            }
            return false;
        }

        try {
            handler(rawPacket, packetObj);
            return true;
        } catch (err) {
            Logger.error(`PacketRouter error handling opcode=${packetObj.opcode} - ${err.message}\n${err.stack}`, 'PacketRouter');
            return false;
        }
    }

    handleHandshake(rawPacket, packetObj) {
        Logger.info(`PacketRouter: HANDSHAKE received opcode=${packetObj.opcode}`, 'PacketRouter');
        this.tcpSession.handleHandshake(rawPacket, this.session);
    }

    handleHandshakeComplete(rawPacket, packetObj) {
        if (this.tcpSession.handshakeStarted && !this.tcpSession.handshakeComplete) {
            this.tcpSession.handshakeComplete = true;
            Logger.info(`PacketRouter: HANDSHAKE_COMPLETE opcode=${packetObj.opcode} session=${this.session.id}`, 'PacketRouter');

            // Leer el string de identificación del servidor (GatewayServer/AgentServer)
            try {
                const reader = new (require('../game/packet/PacketReader'))(rawPacket);
                const serviceName = reader.readString(true);
                Logger.info(`[IDENTIFICATION] service=${serviceName}`, 'PacketRouter');

                if (this.session.wsSession) {
                    this.session.wsSession.sendStatus('HANDSHAKE_COMPLETE');
                    const displayName = serviceName === 'GlobalManager' ? 'GatewayServer' : serviceName;
                    this.session.wsSession.sendEvent(`🔄 Handshake completado (${displayName})`);
                    this.session.wsSession.sendEvent(`🏷️ Servidor identificado: ${displayName}`);
                }

                if (serviceName === 'GatewayServer' || serviceName === 'GlobalManager') {
                    Logger.info(`PacketRouter: ${serviceName} identified, sending 0x6100`, 'PacketRouter');
                    this.sendPatchRequest();
                } else if (serviceName === 'AgentServer') {
                    this.isAgent = true; // Marcar que estamos en modo Agent
                    Logger.info('PacketRouter: AgentServer identification received, sending GAME_LOGIN (0x6103)', 'PacketRouter');
                    this.sendGameLogin();
                } else {
                    Logger.warn(`PacketRouter: Unknown server identification: ${serviceName}`, 'PacketRouter');
                }
            } catch (err) {
                Logger.error('PacketRouter: Failed to parse identification packet', err, 'PacketRouter');
                if (this.session.wsSession) {
                    this.session.wsSession.sendStatus('HANDSHAKE_COMPLETE');
                    this.session.wsSession.sendEvent('🔄 Handshake completado');
                }
                this.sendPatchRequest();
            }
        }
    }

    sendPatchRequest() {
        if (this.patchSent || this.isAgent) return;
        this.patchSent = true;

        const locale = this.session.loginCredentials?.locale || LOCALE_VIETNAM;
        const version = GAME_VERSION;

        Logger.info(`PacketRouter: sending PATCH_REQUEST (0x6100) locale=${locale} version=${version}`, 'PacketRouter');

        const packet = new (require('../game/packet/PacketWriter'))();
        packet.writeByte(locale);
        packet.writeString("SR_Client");
        packet.writeDWord(version);

        const encryptedPacket = this.tcpSession.security.formatPacket(0x6100, packet.getBytes(), true);
        this.tcpSession.send(encryptedPacket);

        if (this.session.wsSession) {
            this.session.wsSession.sendStatus('PATCH_REQUEST_SENT');
            this.session.wsSession.sendEvent(`📤 Patch request enviado (v${version})`);
        }
    }

    sendGameLogin() {
        if (!this.session || !this.session.loginCredentials) {
            Logger.warn('PacketRouter: cannot send GAME_LOGIN, no credentials', 'PacketRouter');
            return;
        }
        const { username, password, token } = this.session.loginCredentials;
        if (!token) {
            Logger.warn('PacketRouter: missing token for GAME_LOGIN', 'PacketRouter');
            return;
        }

        Logger.info(`PacketRouter: sending GAME_LOGIN (0x6103) for user=${username} token=${token}`, 'PacketRouter');

        const packet = new (require('../game/packet/PacketWriter'))();
        packet.writeDWord(Number(token));
        packet.writeString(username || '');
        packet.writeString(password || '');
        packet.writeByte(LOCALE_VIETNAM);  // 1 byte, no 2 (xBot: WriteUInt8(0x16))
        packet.writeDWord(0);  // MAC vacío
        packet.writeWord(0);   // padding

        const encryptedPacket = this.tcpSession.security.formatPacket(0x6103, packet.getBytes(), true);
        this.tcpSession.send(encryptedPacket);

        if (this.session.wsSession) {
            this.session.wsSession.sendStatus('AGENT_LOGIN_SENT');
            this.session.wsSession.sendEvent('📤 GAME_LOGIN enviado al Agent');
        }
    }

    handlePatchResponse(rawPacket, packetObj) {
        Logger.info(`PacketRouter: PATCH_RESPONSE received opcode=${packetObj.opcode}`, 'PacketRouter');
        const parsed = parseOpcode(rawPacket, packetObj.opcode);

        if (parsed && parsed.result === 1) {
            Logger.success('PacketRouter: Patch accepted', 'PacketRouter');
            if (this.session.wsSession) {
                this.session.wsSession.sendStatus('PATCH_OK');
                this.session.wsSession.sendEvent('✅ Versión aceptada');
            }

            // Enviar 0x6101 (SHARD_LIST_REQUEST) vacío
            if (!this.shardListRequested) {
                this.shardListRequested = true;
                Logger.info('PacketRouter: sending SHARD_LIST_REQUEST (0x6101)', 'PacketRouter');
                const emptyPacket = new (require('../game/packet/PacketWriter'))();
                const encPacket = this.tcpSession.security.formatPacket(0x6101, emptyPacket.getBytes(), true);
                this.tcpSession.send(encPacket);
                if (this.session.wsSession) {
                    this.session.wsSession.sendStatus('SHARD_LIST_REQUEST_SENT');
                }
            }
        } else {
            Logger.error(`PacketRouter: Patch rejected (result=${parsed?.result})`, null, 'PacketRouter');
            if (this.session.wsSession) {
                this.session.wsSession.sendStatus('PATCH_REJECTED', { result: parsed?.result });
                this.session.wsSession.sendEvent('❌ Versión del cliente rechazada');
            }
        }
    }

    handleShardListResponse(rawPacket, packetObj) {
        Logger.info(`PacketRouter: SHARD_LIST received opcode=${packetObj.opcode}`, 'PacketRouter');

        // En modo Agent, 0x600d/0xa101 pueden ser "massive packets" envolviendo otra respuesta.
        // Reensamblamos las partes para obtener el paquete real.
        if (this.isAgent) {
            this._handleAgentMassivePacket(rawPacket, packetObj);
            return;
        }

        // Si el servidor no envió 0xA100, enviamos 0x6101 al recibir el primer shard list
        if (!this.shardListRequested) {
            this.shardListRequested = true;
            Logger.info('PacketRouter: sending SHARD_LIST_REQUEST (0x6101) on first shard list', 'PacketRouter');
            const emptyPacket = new (require('../game/packet/PacketWriter'))();
            const encPacket = this.tcpSession.security.formatPacket(0x6101, emptyPacket.getBytes(), true);
            this.tcpSession.send(encPacket);
            if (this.session.wsSession) {
                this.session.wsSession.sendStatus('SHARD_LIST_REQUEST_SENT');
            }
        }

        // Contar paquetes 0x600d para saber cuándo terminó la lista
        if (packetObj.opcode === '0x600d') {
            this.shardListCount++;
            if (this.shardListCount >= 4) {
                this.shardListReceived = true;
                Logger.info('PacketRouter: shard list complete (received 4x 0x600d)', 'PacketRouter');
                if (this.session.wsSession) {
                    this.session.wsSession.sendStatus('SHARD_LIST_COMPLETE');
                }
            }
        }

        const parsed = parseOpcode(rawPacket, packetObj.opcode);
        const detail = parsed || { opcode: packetObj.opcode, size: packetObj.size };

        if (this.session && this.session.wsSession) {
            this.session.wsSession.sendStatus('SERVER_LIST_RECEIVED', { detail });
        }

        // Si el shard list se completó y hay credenciales guardadas (enviadas por el frontend),
        // enviar el login ahora. El frontend ya pidió loguearse pero el shard list no había llegado.
        if (this.shardListReceived && this.session && this.session.loginCredentials) {
            const { username, password, serverId } = this.session.loginCredentials;
            if (username && password) {
                Logger.info('PacketRouter: shard list complete with pending credentials, sending login now', 'PacketRouter');
                this.sendLogin(username, password, serverId);
            }
        }
    }

    handleCaptchaRequest(rawPacket, packetObj) {
        const zlib = require('zlib');
        Logger.info(`PacketRouter: CAPTCHA_REQUEST received opcode=${packetObj.opcode}`, 'PacketRouter');

        // Descomprimir payload con zlib (los datos vienen después del opcode)
        try {
            const payload = rawPacket.slice(4); // saltar size(2) + opcode(2)
            const decompressed = zlib.inflateSync(payload);
            const base64Image = decompressed.toString('base64');
            const dataUri = `data:image/png;base64,${base64Image}`;

            Logger.info(`PacketRouter: CAPTCHA decompressed (${decompressed.length} bytes → base64)`, 'PacketRouter');

            if (this.session && this.session.wsSession) {
                this.session.wsSession.send({
                    type: 'CAPTCHA',
                    image: dataUri,
                });
                this.session.wsSession.sendStatus('CAPTCHA_REQUESTED');
                this.session.wsSession.sendEvent('🔑 Captcha solicitado por el servidor — imagen enviada al frontend');
            }
        } catch (err) {
            Logger.warn(`PacketRouter: CAPTCHA decompress failed (no zlib data?)`, 'PacketRouter');
            if (this.session && this.session.wsSession) {
                this.session.wsSession.sendStatus('CAPTCHA_REQUESTED');
                this.session.wsSession.sendEvent('🔑 Captcha solicitado por el servidor');
            }
        }

        // NO enviar 0x6323 automáticamente. El captcha se envía solo cuando
        // el usuario hace clic en "Enviar Captcha" desde el frontend.
        Logger.info('PacketRouter: captcha image sent to frontend, waiting for user to submit', 'PacketRouter');
    }

    handleLoginResponse(rawPacket, packetObj) {
        Logger.info(`PacketRouter: LOGIN_RESPONSE received opcode=${packetObj.opcode}`, 'PacketRouter');

        if (!this.session || !this.session.wsSession) {
            return;
        }

        try {
            const PacketReader = require('../game/packet/PacketReader');
            // El payload real empieza en offset 6 del rawPacket (size 2 + opcode 2 + securityCount 1 + securityCRC 1)
            const payload = rawPacket.slice(6);

            // ═══════════════════════════════════════════════════════════
            // ESTRUCTURA REAL DEL PAYLOAD 0xA102 (desde offset 6):
            //
            //   [1] result (uint8)           — 0=fail, 1=success
            //   [4] loginId / token (uint32) — usado para reconectar al Agent
            //   [2] agentIP_len (uint16)     — longitud del string IP
            //   [N] agentIP (ASCII string)   — ej. "26.74.212.246"
            //   [2] agentPort (uint16)       — puerto del AgentServer
            //
            // Ejemplo real decryptado (offset 6 en adelante):
            //   01 34000000 0D00 32362E37342E3231322E323436 0C3E
            //   ↑result  ↑token=52  ↑len=13 ↑"26.74.212.246"  ↑port=15884
            // ═══════════════════════════════════════════════════════════

            if (payload.length < 1) {
                Logger.warn(`[A102] Payload vacío — no se puede parsear`, 'PacketRouter');
                this.session.wsSession.sendStatus('LOGIN_FAILED', { error: 'Empty payload' });
                this.session.wsSession.sendEvent('❌ Login fallido: payload vacío');
                return;
            }

            const result = payload.readUInt8(0);
            Logger.info(`[A102] result=${result} payloadLen=${payload.length}`, 'PacketRouter');

            if (result === 1) {
                // Validar que el payload tenga al menos 9 bytes (result 1 + token 4 + ipLen 2 + port 2 mínimo)
                if (payload.length < 9) {
                    throw new Error(`Payload demasiado corto para login exitoso: ${payload.length} bytes`);
                }

                let pos = 1; // saltar result
                const token = payload.readUInt32LE(pos); pos += 4;
                const agentHostLen = payload.readUInt16LE(pos); pos += 2;

                // Validar que agentHostLen sea razonable y quepa en el payload
                if (agentHostLen === 0 || agentHostLen > 100 || pos + agentHostLen + 2 > payload.length) {
                    throw new Error(`agentHostLen inválido: ${agentHostLen} (payloadLen=${payload.length}, pos=${pos})`);
                }

                const agentHost = payload.toString('utf8', pos, pos + agentHostLen); pos += agentHostLen;
                const agentPort = payload.readUInt16LE(pos); pos += 2;

                Logger.info(`[A102] LOGIN OK → token=${token} agent=${agentHost}:${agentPort}`, 'PacketRouter');

                this.session.loginCredentials = {
                    ...(this.session.loginCredentials || {}),
                    agentHost,
                    agentPort,
                    token,
                };

                this.session.wsSession.sendStatus('LOGIN_OK', { host: agentHost, port: agentPort, token });
                this.session.wsSession.sendEvent(`✅ Login exitoso - Agent ${agentHost}:${agentPort}`, {
                    agentHost, agentPort, token,
                });

                if (this.tcpSession.connectionManager) {
                    this.session.wsSession.sendStatus('AGENT_REDIRECT');
                    this.tcpSession.connectionManager.reconnectToAgent(
                        agentHost, agentPort, token
                    ).then(() => {
                        // Resetear estado del handshake para la nueva conexión al Agent
                        this.tcpSession.handshakeStarted = false;
                        this.tcpSession.handshakeComplete = false;
                        this.tcpSession.packetRouter = null; // Se recreará en el próximo paquete
                        this.tcpSession.packetAssembler.reset(); // Limpiar buffer residual del Gateway
                        this.tcpSession.security.resetHandshakeState();
                        if (this.session.wsSession) {
                            this.session.wsSession.sendStatus('AGENT_CONNECTED');
                        }
                    }).catch((err) => {
                        Logger.error(`PacketRouter: Failed reconnecting to Agent`, err, 'PacketRouter');
                        if (this.session.wsSession) {
                            this.session.wsSession.sendStatus('AGENT_CONNECT_FAILED', {
                                error: err.message || 'Agent reconnect failed',
                            });
                            this.session.wsSession.sendEvent(`❌ Login fallido: ${err.message || 'Error al reconectar Agent'}`);
                        }
                    });
                }
            } else {
                // Login fallido: usar parseOpcode para obtener mensaje de error detallado
                const parsed = parseOpcode(rawPacket, packetObj.opcode);
                const errorMsg = parsed?.errorMessage || `Login failed (result=${result})`;
                const subcode = parsed?.subcode || result;
                Logger.info(`[A102] LOGIN FAILED → result=${result} subcode=${subcode} msg="${errorMsg}"`, 'PacketRouter');

                this.session.wsSession.sendStatus('LOGIN_FAILED', { error: errorMsg, subcode });
                this.session.wsSession.sendEvent(`❌ Login fallido: ${errorMsg}`, { error: errorMsg, subcode });
            }
        } catch (err) {
            Logger.error(`PacketRouter: Error parsing 0xA102`, err, 'PacketRouter');
            // Enviar error al frontend
            try {
                if (this.session?.wsSession) {
                    this.session.wsSession.sendStatus('LOGIN_FAILED', { error: 'Parse error: ' + err.message });
                    this.session.wsSession.sendEvent(`❌ Login fallido: error al parsear respuesta`);
                }
            } catch (_) { /* ignorar errores al enviar */ }
        }
    }

    handleGameLoginResponse(rawPacket, packetObj) {
        Logger.info(`PacketRouter: GAME_LOGIN_REPLY received opcode=${packetObj.opcode}`, 'PacketRouter');
        const parsed = parseOpcode(rawPacket, packetObj.opcode);

        if (parsed && parsed.success) {
            Logger.success(`PacketRouter: Agent login successful, requesting character list`, 'PacketRouter');
            if (this.session && this.session.wsSession) {
                this.session.wsSession.sendStatus('AGENT_LOGIN_OK');
                this.session.wsSession.sendEvent('✅ Agent login exitoso — solicitando lista de personajes');
            }
            // Enviar 0x7007 con byte 2 para solicitar lista de personajes
            try {
                const PacketWriter = require('../game/packet/PacketWriter');
                const p = new PacketWriter();
                p.writeByte(2);
                const encPacket = this.tcpSession.security.formatPacket(0x7007, p.getBytes(), false);
                this.tcpSession.send(encPacket);
                Logger.info('PacketRouter: sent CHARACTER_LIST_REQUEST (0x7007)', 'PacketRouter');
            } catch (err) {
                Logger.error('PacketRouter: Failed to send character list request', err, 'PacketRouter');
            }
            return;
        }

        Logger.error(`PacketRouter: Agent login failed`, null, 'PacketRouter');
        if (this.session && this.session.wsSession) {
            this.session.wsSession.sendStatus('AGENT_LOGIN_FAILED', {
                code: parsed?.code,
                subcode: parsed?.subcode,
                errorMessage: parsed?.errorMessage,
            });
            this.session.wsSession.sendEvent(`❌ Agent login fallido: ${parsed?.errorMessage || parsed?.code || 'Error desconocido'}`);
        }
    }

    /**
     * Envía el login 0x6102 al servidor de juego.
     * Solo se llama cuando el frontend envía { type: "LOGIN" }.
     */
    sendLogin(username, password, serverId) {
        Logger.info(`PacketRouter: sending LOGIN_REQUEST (0x6102) for user=${username}`, 'PacketRouter');
        const loginPacket = LoginRequestBuilder.buildLoginRequest(username, password, serverId);
        const rawPayload = loginPacket.payload || loginPacket;
        console.log('[LOGIN HEX]', Buffer.from(rawPayload).toString('hex'));
        console.log('[LOGIN SIZE]', rawPayload.length);
        console.log('[LOGIN CREDS]', { username, password, serverId, locale: this.session.loginCredentials?.locale });
        const encryptedPacket = this.tcpSession.security.formatPacket(OPCODE_LOGIN_REQUEST, loginPacket.payload, loginPacket.encrypted);
        Logger.info(`PacketRouter: 0x6102 hex=${encryptedPacket.toString('hex').toUpperCase()}`, 'PacketRouter');
        this.tcpSession.send(encryptedPacket);
        if (this.session.wsSession) {
            this.session.wsSession.sendStatus('LOGIN_SENT');
            this.session.wsSession.sendEvent('📤 Login enviado al servidor de juego');
        }
    }

    handleCaptchaResult(rawPacket, packetObj) {
        Logger.info(`PacketRouter: CAPTCHA_RESULT received opcode=${packetObj.opcode}`, 'PacketRouter');
        try {
            // El paquete tiene header de 6 bytes: size(2) + opcode(2) + count(1) + check(1)
            // El payload comienza en offset 6
            const result = rawPacket.readUInt8(6);
            Logger.info(`[A323] Captcha result=${result}`, 'PacketRouter');

            if (result === 0 || result === 1) {
                // Result 0 = accepted (test script), Result 1 = accepted (xBot ReadBool)
                Logger.success('PacketRouter: Captcha accepted', 'PacketRouter');
                if (this.session && this.session.wsSession) {
                    this.session.wsSession.sendStatus('CAPTCHA_OK');
                    this.session.wsSession.sendEvent('✅ Captcha aceptado');
                }
            } else if (result === 2) {
                const maxTry = rawPacket.readUInt32LE(7);
                const curTry = rawPacket.readUInt32LE(11);
                const remaining = maxTry - curTry;
                Logger.info(`[A323] Captcha failed: maxTry=${maxTry} curTry=${curTry} remaining=${remaining}`, 'PacketRouter');
                if (this.session && this.session.wsSession) {
                    this.session.wsSession.sendStatus('CAPTCHA_FAILED', { maxTry, curTry, remaining });
                    this.session.wsSession.sendEvent(`❌ Captcha incorrecto: ${remaining} intentos restantes`);
                }
            } else {
                Logger.info(`[A323] Unknown captcha result=${result}`, 'PacketRouter');
            }
        } catch (err) {
            Logger.error('PacketRouter: Error parsing 0xA323', err, 'PacketRouter');
        }
    }

    handleUnknownF54e(rawPacket, packetObj) {
        const hex = Buffer.isBuffer(rawPacket) ? rawPacket.toString('hex').toUpperCase() : '';
        Logger.info(`[F54E] Full hex (28 bytes): ${hex}`, 'PacketRouter');
        Logger.info(`[F54E] size=${packetObj.size} opcode=${packetObj.opcode}`, 'PacketRouter');
        if (this.session && this.session.wsSession) {
            this.session.wsSession.sendEvent(`📦 Paquete 0xf54e recibido (${packetObj.size} bytes)`);
        }
    }

    handleUnknown059c(rawPacket, packetObj) {
        const hex = Buffer.isBuffer(rawPacket) ? rawPacket.toString('hex').toUpperCase() : '';
        Logger.info(`[059C] Full hex: ${hex}`, 'PacketRouter');
        Logger.info(`[059C] size=${packetObj.size} opcode=${packetObj.opcode}`, 'PacketRouter');
        if (this.session && this.session.wsSession) {
            this.session.wsSession.sendEvent(`📦 Paquete 0x059c recibido (${packetObj.size} bytes)`);
        }
    }

    /**
     * 0xB001 - CHARACTER_SELECT_CONFIRM
     * El servidor confirma la selección de personaje
     */
    handleCharacterSelectConfirm(rawPacket, packetObj) {
        const result = rawPacket.length > 6 ? rawPacket.readUInt8(6) : 0;
        Logger.info(`[B001] Character select confirmed, result=${result}`, 'PacketRouter');
        if (result === 1 && this.session && this.session.wsSession) {
            const info = this._pendingPlayerInfo || {};
            // Solo incluir posición si está disponible (evita sobreescribir con null)
            const posData = (info.region && info.region > 0) ? {
                region: info.region,
                posX: info.posX,
                posZ: info.posZ,
                posY: info.posY,
            } : {};
            this.session.wsSession.sendStatus('CHARACTER_SELECT_OK', {
                ...posData,
                hp: info.hp ?? null,
                mp: info.mp ?? null,
                maxHp: info.maxHp ?? info.hp ?? null,
                maxMp: info.maxMp ?? info.mp ?? null,
                level: info.level ?? null,
                refObjId: info.refObjId ?? null,
                playerName: info.playerName ?? null,
            });
            this.session.wsSession.sendEvent('✅ Personaje seleccionado — entrando al mundo');
        }
    }

    /**
     * 0x34B5 - SPAWN_REQUEST: El servidor pregunta si el cliente está listo para spawnear.
     * Respuesta: 0x34B6 (sin payload)
     */
    handleSpawnRequest(rawPacket, packetObj) {
        Logger.info(`[SPAWN] Server requests spawn readiness — sending 0x34B6`, 'PacketRouter');
        try {
            const spawnConfirm = this.tcpSession.security.formatPacket(0x34b6, Buffer.alloc(0), true);
            this.tcpSession.send(spawnConfirm);
            if (this.session && this.session.wsSession) {
                this.session.wsSession.sendEvent('✅ Spawn confirmado — jugador visible en el mundo');
            }
        } catch (e) {
            Logger.error(`[SPAWN] Error sending 0x34B6: ${e.message}`, 'PacketRouter');
        }
    }

    setExpectedUniqueId(uid) {
        this._expectedUniqueId = uid;
        Logger.info(`[PacketRouter] Expected uniqueId set to ${uid}`, 'PacketRouter');
    }

    /**
     * 0x3020 - SERVER_AGENT_CHARACTER_CELESTIAL_POSITION
     * Payload: UniqueID(4) + MoonPosition(2) + Hour(1) + Minute(1) = 8 bytes
     * NO es posición del jugador. La posición real viene del 0x3013.
     */
    handlePositionUpdate(rawPacket, packetObj) {
        const payload = rawPacket.slice(6);
        const hex = payload.toString('hex').toUpperCase();
        Logger.info(`[CELESTIAL] 0x3020 payload=${hex} (${payload.length}B)`, 'PacketRouter');

        if (payload.length >= 8) {
            const uniqueId = payload.readUInt32LE(0);
            const moonPosition = payload.readUInt16LE(4);
            const hour = payload.readUInt8(6);
            const minute = payload.readUInt8(7);
            Logger.info(`[CELESTIAL] UniqueID=${uniqueId} MoonPos=${moonPosition} Time=${hour}:${minute}`, 'PacketRouter');
            // Comparar con el uniqueId del character data
            if (this._expectedUniqueId) {
                Logger.info(`[CELESTIAL] Comparación: uniqueId del paquete=${uniqueId} expectedUniqueId=${this._expectedUniqueId}`, 'PacketRouter');
            }
        }
    }

    /**
     * 0x3015 - SERVER_SINGLESPAWN: El servidor spawna una entidad individual (incluyendo al jugador).
 * 0x3015 - SERVER_SINGLESPAWN: El servidor spawna una entidad individual (incluyendo al jugador).
 * Cuando recibimos nuestro propio spawn, también debemos confirmar.
 */
    handleSingleSpawn(rawPacket, packetObj) {
        const payload = rawPacket.slice(6);
        const hex = payload.slice(0, Math.min(payload.length, 64)).toString('hex').toUpperCase();
        Logger.info(`[SPAWN] 0x3015 SINGLE_SPAWN payload=${hex} (${payload.length}B)`, 'PacketRouter');

        // Si el payload tiene datos suficientes, intentar extraer refObjId
        // El refObjId está típicamente en los primeros 4 bytes
        if (payload.length >= 4) {
            const refObjId = payload.readUInt32LE(0);
            Logger.info(`[SPAWN] 0x3015 refObjId=${refObjId}`, 'PacketRouter');
        }
    }

    /**
     * 0x3016 - SERVER_SINGLEDESPAWN: Una entidad desaparece del mundo.
     */
    handleSingleDespawn(rawPacket, packetObj) {
        const payload = rawPacket.slice(6);
        if (payload.length >= 4) {
            const refObjId = payload.readUInt32LE(0);
            Logger.info(`[DESPAWN] 0x3016 refObjId=${refObjId}`, 'PacketRouter');
        }
    }

    /**
     * 0x3017 - SERVER_GROUPSPAWNB: Inicia group spawn.
     */
    handleGroupSpawnBegin(rawPacket, packetObj) {
        const payload = rawPacket.slice(6);
        Logger.info(`[GROUP_SPAWN] 0x3017 BEGIN payload=${payload.toString('hex').toUpperCase()}`, 'PacketRouter');
    }

    /**
     * 0x3019 - SERVER_GROUPESPAWN: Datos de group spawn (partes).
     */
    handleGroupSpawnData(rawPacket, packetObj) {
        const payload = rawPacket.slice(6);
        Logger.info(`[GROUP_SPAWN] 0x3019 DATA size=${payload.length}`, 'PacketRouter');
    }

    /**
     * 0x3018 - SERVER_GROUPSPAWNEND: Fin de group spawn.
     */
    handleGroupSpawnEnd(rawPacket, packetObj) {
        Logger.info(`[GROUP_SPAWN] 0x3018 END — todas las entidades spawneadas`, 'PacketRouter');
        if (this.session && this.session.wsSession) {
            this.session.wsSession.sendEvent('🌍 Entidades del mundo cargadas');
        }
    }

    /**
     * 0x3026 - SERVER_CHAT_UPDATE: Mensaje de chat recibido del servidor.
     * Estructura (según bot/Clases/Agent.cs):
     *   [1] chatType:
     *       1 = private chat (recibido) → uniqueID(4) + message(ascii)
     *       2 = private chat (enviado)  → charname(ascii) + message(ascii)
     *       6 = global chat             → charname(ascii) + message(ascii)
     *       7 = notice                  → message(ascii)
     *       3 = all chat               → uniqueID(4) + message(ascii)
     *       4 = party chat             → charname(ascii) + message(ascii)
     *       5 = guild chat             → charname(ascii) + message(ascii)
     */
    handleChat(rawPacket, packetObj) {
        const payload = rawPacket.slice(6);
        if (payload.length < 1) return;

        const chatType = payload.readUInt8(0);
        let pos = 1;
        let charname = '';
        let message = '';
        let uniqueID = 0;

        try {
            switch (chatType) {
                case 1: // private chat received
                    uniqueID = payload.readUInt32LE(pos); pos += 4;
                    message = this._readAscii(payload, pos);
                    charname = `[UID:${uniqueID}]`;
                    break;
                case 2: // private chat sent
                    charname = this._readAscii(payload, pos);
                    pos += charname.length + 2; // len word + string
                    message = this._readAscii(payload, pos);
                    break;
                case 3: // all chat
                    uniqueID = payload.readUInt32LE(pos); pos += 4;
                    message = this._readAscii(payload, pos);
                    charname = `[UID:${uniqueID}]`;
                    break;
                case 4: // party chat
                    charname = this._readAscii(payload, pos);
                    pos += charname.length + 2;
                    message = this._readAscii(payload, pos);
                    break;
                case 5: // guild chat
                    charname = this._readAscii(payload, pos);
                    pos += charname.length + 2;
                    message = this._readAscii(payload, pos);
                    break;
                case 6: // global chat
                    charname = this._readAscii(payload, pos);
                    pos += charname.length + 2;
                    message = this._readAscii(payload, pos);
                    break;
                case 7: // notice
                    message = this._readAscii(payload, pos);
                    charname = 'Notice';
                    break;
                default:
                    message = `[Chat type ${chatType}]`;
                    charname = 'Unknown';
            }

            Logger.info(`[CHAT] type=${chatType} from=${charname}: ${message}`, 'PacketRouter');

            // Si tenemos el playerName y el uniqueID coincide, usar el nombre real
            if (this._pendingPlayerInfo && this._pendingPlayerInfo.playerName && uniqueID) {
                // El refObjId del jugador es su uniqueID también
                if (uniqueID === this._pendingPlayerInfo.refObjId) {
                    charname = this._pendingPlayerInfo.playerName;
                }
            }

            if (this.session && this.session.wsSession) {
                this.session.wsSession.sendEvent(`💬 ${charname}: ${message}`, {
                    type: 'CHAT_MESSAGE',
                    chatType,
                    charname,
                    message,
                    uniqueID,
                });
            }
        } catch (e) {
            Logger.error(`[CHAT] Parse error: ${e.message}`, 'PacketRouter');
        }
    }

    /**
     * Lee un string ASCII del payload: [len:2][chars:N]
     */
    _readAscii(buffer, offset) {
        if (offset + 2 > buffer.length) return '';
        const len = buffer.readUInt16LE(offset);
        if (offset + 2 + len > buffer.length) return '';
        return buffer.toString('ascii', offset + 2, offset + 2 + len);
    }

    /**
     * Maneja otros paquetes del mundo del juego
     */
    handleGamePacket(rawPacket, packetObj) {
        const hex = rawPacket.slice(0, Math.min(rawPacket.length, 32)).toString('hex').toUpperCase();
        Logger.info(`[GAME] opcode=${packetObj.opcode} size=${packetObj.size} hex=${hex}`, 'PacketRouter');
    }

    // NOTA: handleLoginResponse (0xa102) está definido arriba.
    // El duplicado que llamaba a processCharacterList fue eliminado.
    // sendAutoLogin fue reemplazado por sendLogin(username, password, serverId)
    // que solo se invoca desde WebSocketLoginHandler cuando el frontend lo solicita.

    handleCharacterList(rawPacket, packetObj) {
        Logger.info(`PacketRouter: CHARACTER_LIST received opcode=${packetObj.opcode}`, 'PacketRouter');
        const payload = rawPacket.slice(6);
        const characters = [];

        try {
            const type = payload.readUInt8(0);
            const success = payload.readUInt8(1);
            const charCount = payload.readUInt8(2);
            Logger.info(`[0xb007] type=${type} success=${success} charCount=${charCount}`, 'PacketRouter');

            // Escanear todo el payload buscando nombres (patrón: [4 bytes refObjId][2 bytes len][ASCII])
            let pos = 3; // empezar después del header
            while (pos < payload.length - 6 && characters.length < charCount) {
                // Verificar que los próximos bytes parezcan un nombre válido
                const nameLen = payload.readUInt16LE(pos + 4);
                if (nameLen >= 4 && nameLen <= 16 && pos + 6 + nameLen <= payload.length) {
                    // Verificar ASCII imprimible
                    let printable = true;
                    for (let j = 0; j < nameLen; j++) {
                        const c = payload.readUInt8(pos + 6 + j);
                        if (c < 0x20 || c > 0x7E) { printable = false; break; }
                    }
                    if (printable) {
                        const refObjId = payload.readUInt32LE(pos);
                        const name = payload.toString('utf8', pos + 6, pos + 6 + nameLen);
                        // Leer level (está a nameLen + 1 bytes después del nombre: scale(1) + level(1))
                        const level = payload.readUInt8(pos + 6 + nameLen + 1);
                        characters.push({ index: characters.length, name, level, refObjId, deleted: false });
                        Logger.info(`[0xb007] Found: ${name} Lv${level} refObjId=${refObjId}`, 'PacketRouter');
                        pos += 6 + nameLen + 2; // avanzar después del nombre + scale + level
                        continue;
                    }
                }
                pos += 1;
            }
        } catch (e) {
            Logger.error(`[0xb007] Scan error`, e, 'PacketRouter');
        }

        Logger.info(`[0xb007] Parsed ${characters.length} characters`, 'PacketRouter');

        if (this.session && this.session.wsSession) {
            if (characters.length > 0) {
                this.session.wsSession.sendStatus('CHARACTER_LIST_RECEIVED', {
                    charCount: characters.length,
                    characters: characters.map((c) => ({
                        index: c.index,
                        name: c.name,
                        level: c.level,
                        refObjId: c.refObjId,
                        deleted: c.deleted,
                    })),
                });

                const charNames = characters
                    .filter((c) => !c.deleted)
                    .map((c) => `${c.name} (Lv${c.level})`)
                    .join(', ');
                this.session.wsSession.sendEvent(`👤 Personajes: ${charNames}`, {
                    characters,
                    charCount: characters.length,
                });

                // NO auto-select — el usuario elige desde el frontend
                Logger.info(`PacketRouter: character list sent to frontend (${characters.length} chars) — waiting for user selection`, 'PacketRouter');
            } else {
                this.session.wsSession.sendStatus('CHARACTER_LIST_FAILED', { error: 'No characters parsed' });
                this.session.wsSession.sendEvent('❌ Error al obtener lista de personajes');
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // INVENTORY HANDLERS (xBot pattern)
    // ═══════════════════════════════════════════════════════════════

    /**
     * 0xB034 - SERVER_INVENTORY_ITEM_MOVEMENT: Movimiento de items en inventario.
     */
    handleInventoryMovement(rawPacket, packetObj) {
        const payload = rawPacket.slice(6);
        const result = parseInventoryMovement(payload);
        if (!result) {
            Logger.warn(`[INV] Failed to parse inventory movement`, 'PacketRouter');
            return;
        }

        if (result.result !== 1) {
            Logger.warn(`[INV] Movement failed result=${result.result}`, 'PacketRouter');
            return;
        }

        const typeName = Object.keys(InventoryMovementType).find(
            k => InventoryMovementType[k] === result.type
        ) || `UNKNOWN_${result.type}`;

        Logger.info(`[INV] Movement type=${typeName}(${result.type})`, 'PacketRouter');

        // Actualizar inventario local según el tipo de movimiento
        switch (result.type) {
            case InventoryMovementType.InventoryToInventory: {
                // Swap entre slots
                const src = this.inventory[result.data.slotSrc];
                const dst = this.inventory[result.data.slotDst];
                if (result.data.quantity === 0 || result.data.quantity === src?.quantity) {
                    // Movimiento completo
                    this.inventory[result.data.slotSrc] = dst || null;
                    this.inventory[result.data.slotDst] = src || null;
                }
                break;
            }
            case InventoryMovementType.GroundToInventory: {
                if (result.data.slotInventory === 0xFE) {
                    // Es oro
                    Logger.info(`[INV] Gold picked up: +${result.data.gold}`, 'PacketRouter');
                } else if (result.data.item) {
                    this.inventory[result.data.slotInventory] = result.data.item;
                }
                break;
            }
            case InventoryMovementType.InventoryToGround: {
                this.inventory[result.data.slotInventory] = null;
                break;
            }
            case InventoryMovementType.InventoryToStorage: {
                this.inventory[result.data.slotInventory] = null;
                break;
            }
            case InventoryMovementType.StorageToInventory: {
                // El item vendrá en un paquete separado o ya está en storage
                break;
            }
            case InventoryMovementType.InventoryToShop:
            case InventoryMovementType.InventoryToQuest: {
                this.inventory[result.data.slotInventory] = null;
                break;
            }
            case InventoryMovementType.QuestToInventory: {
                if (result.data.item) {
                    this.inventory[result.data.slotInventory] = result.data.item;
                }
                break;
            }
            case InventoryMovementType.InventoryToExchange:
            case InventoryMovementType.ExchangeToInventory: {
                // Intercambio — no modificamos inventario local
                break;
            }
        }

        // Enviar evento al frontend
        if (this.session && this.session.wsSession) {
            this.session.wsSession.sendEvent(`📦 Item movido: ${typeName}`, {
                type: 'INVENTORY_MOVEMENT',
                movementType: result.type,
                movementName: typeName,
                data: result.data,
            });
        }
    }

    /**
     * 0x3040 - SERVER_INVENTORY_ITEM_UPDATE: Actualización de item (cantidad, estado).
     */
    handleInventoryUpdate(rawPacket, packetObj) {
        const payload = rawPacket.slice(6);
        const update = parseInventoryUpdate(payload);
        if (!update) return;

        Logger.info(`[INV] Update slot=${update.slot} type=${update.updateType}`, 'PacketRouter');

        if (update.updateType === 8 && this.inventory[update.slot]) {
            // Quantity update
            if (update.quantity === 0) {
                this.inventory[update.slot] = null; // Item consumido
            } else {
                this.inventory[update.slot].quantity = update.quantity;
            }
        }

        if (this.session && this.session.wsSession) {
            this.session.wsSession.sendEvent(`📦 Item actualizado slot=${update.slot}`, {
                type: 'INVENTORY_UPDATE',
                slot: update.slot,
                updateType: update.updateType,
                quantity: update.quantity,
                petState: update.petState,
            });
        }
    }

    /**
     * 0x3052 - SERVER_INVENTORY_ITEM_DURABILITY_UPDATE
     */
    handleDurabilityUpdate(rawPacket, packetObj) {
        const payload = rawPacket.slice(6);
        const update = parseDurabilityUpdate(payload);
        if (!update) return;

        if (this.inventory[update.slot]) {
            this.inventory[update.slot].durability = update.durability;
        }

        if (this.session && this.session.wsSession) {
            this.session.wsSession.sendEvent(`🔧 Durabilidad slot=${update.slot}: ${update.durability}`, {
                type: 'DURABILITY_UPDATE',
                slot: update.slot,
                durability: update.durability,
            });
        }
    }

    /**
     * 0x3092 - SERVER_INVENTORY_CAPACITY_UPDATE
     */
    handleCapacityUpdate(rawPacket, packetObj) {
        const payload = rawPacket.slice(6);
        const update = parseCapacityUpdate(payload);
        if (!update) return;

        Logger.info(`[INV] Capacity updated to ${update.maxSlots}`, 'PacketRouter');

        if (this.session && this.session.wsSession) {
            this.session.wsSession.sendEvent(`📦 Capacidad de inventario: ${update.maxSlots} slots`, {
                type: 'CAPACITY_UPDATE',
                maxSlots: update.maxSlots,
            });
        }
    }

    /**
     * 0x3047 - SERVER_STORAGE_DATA_BEGIN: Inicio de datos de bodega.
     */
    handleStorageBegin(rawPacket, packetObj) {
        const payload = rawPacket.slice(6);
        this._storageAccumulator.begin(payload);
        Logger.info(`[STORAGE] Begin — gold=${this._storageAccumulator.gold}`, 'PacketRouter');
    }

    /**
     * 0x3049 - SERVER_STORAGE_DATA: Datos de bodega (partes).
     */
    handleStorageData(rawPacket, packetObj) {
        const payload = rawPacket.slice(6);
        this._storageAccumulator.add(payload);
        Logger.debug(`[STORAGE] Data part — ${payload.length} bytes`, 'PacketRouter');
    }

    /**
     * 0x304A - SERVER_STORAGE_DATA_END: Fin de datos de bodega.
     */
    handleStorageEnd(rawPacket, packetObj) {
        const storage = this._storageAccumulator.end();
        if (!storage) {
            Logger.warn(`[STORAGE] End — no data accumulated`, 'PacketRouter');
            return;
        }

        Logger.info(`[STORAGE] End — ${storage.items.length} items, gold=${storage.gold}`, 'PacketRouter');

        if (this.session && this.session.wsSession) {
            this.session.wsSession.sendEvent(`📦 Bodega: ${storage.items.length} items, ${storage.gold} gold`, {
                type: 'STORAGE_DATA',
                gold: storage.gold,
                maxSlots: storage.maxSlots,
                items: storage.items,
            });
        }

        this._storageAccumulator.reset();
    }

    /**
     * Reensambla "massive packets" (0x600d) en modo Agent.
     * 
     * El Agent usa 0x600d para transferir paquetes grandes divididos en partes:
     * - Header: flag=1, numParts(2), originalOpcode(2)
     * - Data:   flag=0, chunk(N bytes)
     * 
     * Cuando todas las partes se reciben, se reensambla el paquete original
     * y se rutea normalmente.
     */
    _handleAgentMassivePacket(rawPacket, packetObj) {
        try {
            // El payload está en offset 6 (después del header de 6 bytes)
            const payload = rawPacket.slice(6);
            if (payload.length < 1) return;

            const flag = payload.readUInt8(0);

            if (flag === 1) {
                // Header: partes totales + opcode original
                if (payload.length < 5) {
                    Logger.warn('PacketRouter: massive header too short', 'PacketRouter');
                    return;
                }
                this._massiveTotalParts = payload.readUInt16LE(1);
                this._massiveOpcode = '0x' + payload.readUInt16LE(3).toString(16).padStart(4, '0');
                this._massiveParts = [];
                Logger.info(`PacketRouter: massive packet header — parts=${this._massiveTotalParts} opcode=${this._massiveOpcode}`, 'PacketRouter');
            } else if (flag === 0) {
                // Data part
                const data = payload.slice(1); // skip flag byte
                this._massiveParts.push(data);
                Logger.debug(`PacketRouter: massive part ${this._massiveParts.length}/${this._massiveTotalParts} size=${data.length}`, 'PacketRouter');

                // ¿Recibimos todas las partes?
                if (this._massiveParts.length >= this._massiveTotalParts && this._massiveOpcode) {
                    // Reensamblar
                    const totalData = Buffer.concat(this._massiveParts);

                    // El inner packet tiene: [size:2][encrypted: opcode(2)+count(1)+check(1)+payload(N)]
                    // Los primeros 2 bytes (size) NO están encriptados — vienen del FormatPacket original.
                    if (totalData.length < 6) {
                        Logger.warn('PacketRouter: massive inner data too short', 'PacketRouter');
                        return;
                    }

                    const innerSize = totalData.readUInt16LE(0) & 0x7fff;
                    const encStart = 2;
                    const encLen = innerSize + 4;
                    const alignedLen = Math.ceil(encLen / 8) * 8;

                    let decryptedData;
                    if (this.tcpSession.security) {
                        const toDecrypt = Buffer.alloc(alignedLen);
                        totalData.copy(toDecrypt, 0, encStart, Math.min(encStart + encLen, totalData.length));
                        try {
                            decryptedData = this.tcpSession.security.decode(toDecrypt, 0, alignedLen);
                        } catch (e) {
                            Logger.warn(`PacketRouter: massive inner decrypt failed: ${e.message}`, 'PacketRouter');
                            decryptedData = totalData.slice(encStart);
                        }
                    } else {
                        decryptedData = totalData.slice(encStart);
                    }

                    // decryptedData: [realOpcode:2][count:1][check:1][payload:N]
                    const realOpcode = decryptedData.readUInt16LE(0);
                    const realPayload = decryptedData.slice(4, 4 + innerSize);

                    // Construir paquete completo para ruteo
                    const reassembled = Buffer.alloc(realPayload.length + 6);
                    reassembled.writeUInt16LE(realPayload.length, 0);
                    reassembled.writeUInt16LE(realOpcode, 2);
                    reassembled.writeUInt16LE(0, 4); // count+check placeholder
                    realPayload.copy(reassembled, 6);

                    const hex = reassembled.toString('hex').toUpperCase();
                    Logger.info(`PacketRouter: massive reassembled → opcode=0x${realOpcode.toString(16).padStart(4, '0')} size=${reassembled.length} hex=${hex}`, 'PacketRouter');

                    // Resetear estado massive
                    this._massiveTotalParts = 0;
                    this._massiveOpcode = null;
                    this._massiveParts = [];

                    // Rutear el paquete reensamblado
                    const realOpcodeHex = '0x' + realOpcode.toString(16).padStart(4, '0');
                    const newPacketObj = {
                        opcode: realOpcodeHex,
                        size: reassembled.length,
                        payload: reassembled,
                    };
                    this.route(reassembled, newPacketObj);
                }
            } else {
                Logger.warn(`PacketRouter: unknown massive flag=${flag}`, 'PacketRouter');
            }
        } catch (err) {
            Logger.error('PacketRouter: error reassembling massive packet', err, 'PacketRouter');
            this._massiveParts = [];
            this._massiveTotalParts = 0;
            this._massiveOpcode = null;
        }
    }
}
