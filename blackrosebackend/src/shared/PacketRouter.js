import Logger from '../gamegateway/utils/Logger.js';
import { parseOpcode, getOpcodeDefinition } from './opcodes/OPCODE_DEFINITIONS.js';
import { LoginHandler } from './handlers/LoginHandler.js';
import { LoginRequestBuilder } from './builders/LoginRequestBuilder.js';
import { OPCODE_LOGIN_REQUEST, GAME_VERSION, LOCALE_VIETNAM } from '../config/gameConstants.js';

export default class PacketRouter {
    constructor(tcpSession, session) {
        this.tcpSession = tcpSession;
        this.session = session;
        this.loginHandler = new LoginHandler();
        this.patchSent = false;
        this.shardListRequested = false;
        this.shardListCount = 0;
        this.shardListReceived = false;
        this.autoLoginSent = false;
        this.captchaReplySent = false;
        this.isAgent = false; // true cuando estamos conectados al Agent (no Gateway)

        // Reensamblaje de "massive packets" (0x600d) en modo Agent
        this._massiveParts = [];       // chunks de datos acumulados
        this._massiveTotalParts = 0;   // número total de partes esperadas
        this._massiveOpcode = null;    // opcode original del paquete masivo

        // Acumulador de character data (0x3013) como en xBot
        this._charDataBuffer = null;
        this._pendingPlayerInfo = null; // stats parciales, posición llega en 0x3020

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
            '0x34a5': this.handleCharDataBegin.bind(this),
            '0x3013': this.handleCharData.bind(this),
            '0x34a6': this.handleCharDataEnd.bind(this),
            '0x34b5': this.handleSpawnRequest.bind(this),
            '0x3015': this.handleSingleSpawn.bind(this),
            '0x3016': this.handleSingleDespawn.bind(this),
            '0x3017': this.handleGroupSpawnBegin.bind(this),
            '0x3018': this.handleGroupSpawnEnd.bind(this),
            '0x3019': this.handleGroupSpawnData.bind(this),
            '0x3020': this.handlePositionUpdate.bind(this),
            '0x3026': this.handleChat.bind(this),
            '0x059c': this.handleUnknown059c.bind(this),
            '0xf54e': this.handleUnknownF54e.bind(this),
        };
    }

    route(rawPacket, packetObj) {
        const opcode = packetObj.opcode.toLowerCase();
        const handler = this.handlers[opcode];

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
            Logger.error(`PacketRouter error handling opcode=${packetObj.opcode}`, err, 'PacketRouter');
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
                const reader = new (require('../gamegateway/packet/PacketReader'))(rawPacket);
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

        const packet = new (require('../gamegateway/packet/PacketWriter'))();
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

        const packet = new (require('../gamegateway/packet/PacketWriter'))();
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
                const emptyPacket = new (require('../gamegateway/packet/PacketWriter'))();
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
            const emptyPacket = new (require('../gamegateway/packet/PacketWriter'))();
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

        // Login automático solo si hay credenciales
        this.sendAutoLogin();
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
            const PacketReader = require('../gamegateway/packet/PacketReader');
            // El payload real empieza en offset 6 (size 2 + opcode 2 + securityCount 1 + securityCRC 1)
            const payload = rawPacket.slice(6);

            // Leer primer byte directamente (result)
            const result = payload.readUInt8(0);
            Logger.info(`[A102] result=${result}`, 'PacketRouter');

            if (result === 1) {
                // Login exitoso formato xBot: result(1) + token(4) + agentIP(string) + agentPort(word)
                // Payload hex: 01 22 00 00 00 0D 00 32 36 2E 37 34 2E 32 31 32 2E 32 34 36 0C 3E
                //              ↑result ↑──token──↑ ↑─len─↑ ↑───────agent IP──────────────↑ ↑port↑
                let pos = 1;
                const token = payload.readUInt32LE(pos); pos += 4;
                const agentHostLen = payload.readUInt16LE(pos); pos += 2;
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
            this.session.wsSession.sendStatus('LOGIN_FAILED', { error: 'Parse error: ' + err.message });
            this.session.wsSession.sendEvent(`❌ Login fallido: error al parsear respuesta`);
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
                const PacketWriter = require('../gamegateway/packet/PacketWriter');
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
     * Envía el login 0x6102 automáticamente si hay credenciales guardadas
     */
    sendAutoLogin() {
        if (this.autoLoginSent || this.isAgent) return;
        if (!this.session || !this.session.loginCredentials) {
            Logger.warn('PacketRouter: cannot auto-login, no credentials', 'PacketRouter');
            return;
        }

        const { username, password, serverId } = this.session.loginCredentials;
        if (!username || !password) {
            Logger.warn('PacketRouter: incomplete credentials for auto-login', 'PacketRouter');
            return;
        }

        this.autoLoginSent = true;
        Logger.info(`PacketRouter: auto-sending LOGIN_REQUEST (0x6102) for user=${username}`, 'PacketRouter');
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
            this.session.wsSession.sendEvent('📤 Login automático enviado');
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
            this.session.wsSession.sendStatus('CHARACTER_SELECT_OK');
            this.session.wsSession.sendEvent('✅ Personaje seleccionado — entrando al mundo');
        }
    }

    /**
     * 0x34A5 - CHARACTER_DATA_BEGIN: Inicia acumulación de datos del personaje
     */
    handleCharDataBegin(rawPacket, packetObj) {
        this._charDataBuffer = Buffer.alloc(0);
        Logger.info(`[CHAR_DATA] Begin accumulating`, 'PacketRouter');
    }

    /**
     * 0x3013 - CHARACTER_DATA: Acumula datos del personaje
     */
    handleCharData(rawPacket, packetObj) {
        if (!this._charDataBuffer) this._charDataBuffer = Buffer.alloc(0);
        const payload = rawPacket.slice(6);
        this._charDataBuffer = Buffer.concat([this._charDataBuffer, payload]);
        Logger.debug(`[CHAR_DATA] Accumulated ${this._charDataBuffer.length} bytes`, 'PacketRouter');
    }

    /**
     * 0x34A6 - CHARACTER_DATA_END: Procesa datos acumulados y extrae info del jugador
     * Estructura (xBot CharacterDataEnd):
     *   serverTime(4) + refObjId(4) + scale(1) + level(1) + levelMax(1) +
     *   exp(8) + SPExp(4) + gold(8) + SP(4) + statPoints(2) + berserkPoints(1) +
     *   gatheredExp(4) + HP(4) + MP(4) + ...muchos campos... +
     *   AL FINAL: uniqueID(4) + region(2) + X(float4) + Z(float4) + Y(float4) + angle(2)
     */
    handleCharDataEnd(rawPacket, packetObj) {
        if (!this._charDataBuffer || this._charDataBuffer.length < 10) {
            Logger.warn(`[CHAR_DATA] No accumulated data to parse`, 'PacketRouter');
            return;
        }
        const data = this._charDataBuffer;
        Logger.info(`[CHAR_DATA] End — parsing ${data.length} bytes`, 'PacketRouter');

        try {
            let pos = 0;
            const serverTime = data.readUInt32LE(pos); pos += 4;
            const refObjId = data.readUInt32LE(pos); pos += 4;
            const scale = data.readUInt8(pos); pos += 1;
            const level = data.readUInt8(pos); pos += 1;
            const levelMax = data.readUInt8(pos); pos += 1;
            pos += 8; // exp (uint64)
            pos += 4; // spExp
            pos += 8; // gold (uint64)
            pos += 4; // skillPoints
            pos += 2; // statPoints
            pos += 1; // berserkPoints
            pos += 4; // gatheredExpPoint
            const hp = data.readUInt32LE(pos); pos += 4;
            const mp = data.readUInt32LE(pos); pos += 4;

            Logger.info(`[CHAR_DATA] Stats parsed — Lv=${level} HP=${hp} MP=${mp} refObjId=${refObjId}`, 'PacketRouter');

            // Extraer playerName del final del buffer (formato xBot: ...uniqueID(4) + region(2) + X(4) + Z(4) + Y(4) + angle(2) + ... + name(ascii))
            let playerName = '';
            try {
                // El nombre está cerca del final, buscamos el string "testing" o similar
                // Estructura xBot: ...al final: name(ascii) + jobName(ascii) + jobType(1) + ...
                // Buscar desde el final hacia atrás un string ASCII válido (len 4-16)
                for (let i = data.length - 20; i > data.length - 200 && i > 0; i--) {
                    const nameLen = data.readUInt16LE(i);
                    if (nameLen >= 4 && nameLen <= 16 && i + 2 + nameLen <= data.length) {
                        let valid = true;
                        for (let j = 0; j < nameLen; j++) {
                            const c = data.readUInt8(i + 2 + j);
                            if (c < 0x20 || c > 0x7E) { valid = false; break; }
                        }
                        if (valid) {
                            playerName = data.toString('ascii', i + 2, i + 2 + nameLen);
                            break;
                        }
                    }
                }
            } catch (e) { /* ignorar */ }
            Logger.info(`[CHAR_DATA] PlayerName=${playerName}`, 'PacketRouter');

            // Guardar stats parciales — posición llegará en 0x3020
            this._pendingPlayerInfo = { level, hp, mp, refObjId, scale, playerName };

            if (this.session && this.session.wsSession) {
                this.session.wsSession.sendEvent(`📊 Stats: Lv${level} HP=${hp} MP=${mp}`, {
                    type: 'CHAR_STATS',
                    level, hp, mp, refObjId, scale,
                });
            }

            // Enviar 0x3012 (CLIENT_CHARACTER_CONFIRM_SPAWN) después de char data.
            // Según bot/Clases/opcode.cs: CLIENT_CHARACTER_CONFIRM_SPAWN = 0x3012
            // 0x34B5/0x34B6 son TELEPORT_READY, no spawn.
            try {
                const confirmSpawn = this.tcpSession.security.formatPacket(0x3012, Buffer.alloc(0), true);
                this.tcpSession.send(confirmSpawn);
                Logger.info(`[SPAWN] Sent CLIENT_CHARACTER_CONFIRM_SPAWN (0x3012)`, 'PacketRouter');
            } catch (e) {
                Logger.error(`[SPAWN] Error sending 0x3012: ${e.message}`, 'PacketRouter');
            }
        } catch (e) {
            Logger.error(`[CHAR_DATA] Parse error: ${e.message}`, 'PacketRouter');
        }
        this._charDataBuffer = null;
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

    /**
     * 0x3020 - SERVER_CONFIRMSPAWN: El servidor envía la posición inicial del jugador.
     * Payload: region(2) + X(2) + Y(2) + Z(2) = 8 bytes (ushort LE)
     * 
     * RESPUESTA REQUERIDA: 0x34C5 (CLIENT_CONFIRMSPAWN).
     * El 0x34B6 ya se envió en handleCharDataEnd (0x34A6).
     * Sin 0x34C5, el servidor cierra la conexión ~240ms después.
     */
    handlePositionUpdate(rawPacket, packetObj) {
        const payload = rawPacket.slice(6);
        const hex = payload.toString('hex').toUpperCase();
        Logger.info(`[POS] 0x3020 payload=${hex} (${payload.length}B)`, 'PacketRouter');

        if (payload.length >= 8) {
            const region = payload.readUInt16LE(0);
            const posX = payload.readUInt16LE(2);
            const posY = payload.readUInt16LE(4);
            const posZ = payload.readUInt16LE(6);

            Logger.info(`[POS] Region=${region} X=${posX} Y=${posY} Z=${posZ}`, 'PacketRouter');

            const info = this._pendingPlayerInfo || {};
            const level = info.level || '?';
            const hp = info.hp || '?';
            const mp = info.mp || '?';
            const refObjId = info.refObjId || 0;
            const playerName = info.playerName || 'Player';

            if (this.session && this.session.wsSession) {
                this.session.wsSession.sendEvent(`🌟 Jugador en mundo: Lv${level} HP=${hp} MP=${mp} Region=${region} (${posX},${posY},${posZ})`, {
                    type: 'PLAYER_SPAWNED',
                    region, posX, posY, posZ,
                    level, hp, mp, refObjId, playerName,
                });
                this.session.wsSession.sendStatus('IN_GAME', {
                    region, posX, posY, posZ,
                    level, hp, mp, refObjId, playerName,
                });
            }
        }

        // NO enviar 0x34C5 - este servidor no usa este protocolo.
        // El 0x3020 es solo posición, no espera respuesta.
        this._pendingPlayerInfo = null;

        this._pendingPlayerInfo = null;
    }

    /**
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
    // sendLoginAfterHandshake eliminado — su lógica está unificada en sendAutoLogin()

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
