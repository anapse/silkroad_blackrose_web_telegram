import Logger from '../gamegateway/utils/Logger.js';
import { parseOpcode, getOpcodeDefinition } from './opcodes/OPCODE_DEFINITIONS.js';
import { LoginHandler } from './handlers/LoginHandler.js';
import { LoginRequestBuilder } from './builders/LoginRequestBuilder.js';
import { OPCODE_LOGIN_REQUEST } from '../config/gameConstants.js';

export default class PacketRouter {
    constructor(tcpSession, session) {
        this.tcpSession = tcpSession;
        this.session = session;
        this.loginHandler = new LoginHandler();

        this.handlers = {
            '0x5000': this.handleHandshake.bind(this),
            '0x2001': this.handleHandshakeComplete.bind(this),
            '0xa102': this.handleLoginResponse.bind(this),
            '0xa103': this.handleGameLoginResponse.bind(this),
            '0x600d': this.handleServerList.bind(this),
            '0xb007': this.handleCharacterList.bind(this),
        };
    }

    route(rawPacket, packetObj) {
        const opcode = packetObj.opcode.toLowerCase();
        const handler = this.handlers[opcode];

        if (!handler) {
            Logger.debug(`PacketRouter: no handler for opcode=${packetObj.opcode}`, 'PacketRouter');
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
            if (this.session.wsSession) {
                this.session.wsSession.sendStatus('HANDSHAKE_COMPLETE');
                this.session.wsSession.sendEvent('🔄 Handshake completado');
            }

            this.sendLoginAfterHandshake();
        }
    }

    handleLoginResponse(rawPacket, packetObj) {
        Logger.info(`PacketRouter: LOGIN_RESPONSE received opcode=${packetObj.opcode}`, 'PacketRouter');
        const parsed = parseOpcode(rawPacket, packetObj.opcode);

        if (!this.session || !this.session.wsSession) {
            return;
        }

        if (!parsed) {
            this.session.wsSession.sendStatus('LOGIN_FAILED', { error: 'Parser error' });
            this.session.wsSession.sendEvent('❌ Login fallido: error al parsear respuesta');
            return;
        }

        if (parsed.success) {
            const agentHost = parsed.agentIP;
            const agentPort = parsed.agentPort;
            const token = parsed.token;

            this.session.loginCredentials = {
                ...(this.session.loginCredentials || {}),
                agentHost,
                agentPort,
                token,
            };

            this.session.wsSession.sendStatus('LOGIN_OK', {
                host: agentHost,
                port: agentPort,
                token,
            });
            this.session.wsSession.sendEvent(`✅ Login exitoso - Agent ${agentHost}:${agentPort}`, {
                agentHost,
                agentPort,
                token,
            });

            if (this.tcpSession.connectionManager) {
                this.session.wsSession.sendStatus('AGENT_REDIRECT');
                this.tcpSession.connectionManager.reconnectToAgent(
                    agentHost,
                    agentPort,
                    token
                ).then(() => {
                    this.tcpSession.handshakeStarted = false;
                    this.tcpSession.handshakeComplete = false;
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
            this.session.wsSession.sendStatus('LOGIN_FAILED', {
                error: parsed.errorMessage,
                subcode: parsed.subcode,
            });
            this.session.wsSession.sendEvent(`❌ Login fallido: ${parsed.errorMessage || 'Desconocido'}`, {
                error: parsed.errorMessage,
                subcode: parsed.subcode,
            });
        }
    }

    handleGameLoginResponse(rawPacket, packetObj) {
        Logger.info(`PacketRouter: GAME_LOGIN_REPLY received opcode=${packetObj.opcode}`, 'PacketRouter');
        const parsed = parseOpcode(rawPacket, packetObj.opcode);

        if (parsed && parsed.success) {
            Logger.success(`PacketRouter: Agent login successful`, 'PacketRouter');
            if (this.session && this.session.wsSession) {
                this.session.wsSession.sendStatus('AGENT_LOGIN_OK');
            }
            return;
        }

        Logger.error(`PacketRouter: Agent login failed`, null, 'PacketRouter');
        if (this.session && this.session.wsSession) {
            this.session.wsSession.sendStatus('AGENT_LOGIN_FAILED', {
                code: parsed?.code,
                subcode: parsed?.subcode,
            });
            this.session.wsSession.sendEvent(`❌ Agent login fallido: ${parsed?.code || 'Error desconocido'}`);
        }
    }

    handleServerList(rawPacket, packetObj) {
        Logger.info(`PacketRouter: SERVER_LIST received opcode=${packetObj.opcode}`, 'PacketRouter');
        const parsed = parseOpcode(rawPacket, packetObj.opcode);
        const detail = parsed || { opcode: packetObj.opcode, size: packetObj.size };

        if (this.session && this.session.wsSession) {
            this.session.wsSession.sendStatus('SERVER_LIST_RECEIVED', {
                detail,
            });
        }
    }

    handleCharacterList(rawPacket, packetObj) {
        Logger.info(`PacketRouter: CHARACTER_LIST received opcode=${packetObj.opcode}`, 'PacketRouter');
        const result = this.loginHandler.processCharacterList(packetObj);

        if (this.session && this.session.wsSession) {
            if (result.success) {
                this.session.wsSession.sendStatus('CHARACTER_LIST_RECEIVED', {
                    charCount: result.charCount,
                    characters: result.characters.map((char) => ({
                        index: char.index,
                        name: char.name,
                        level: char.level,
                        refObjId: char.refObjId,
                        exp: char.exp.toString(),
                        hp: char.hp,
                        mp: char.mp,
                        deleted: char.deleted,
                    })),
                });

                // Enviar evento con lista de personajes
                const charNames = result.characters
                    .filter((c) => !c.deleted)
                    .map((c) => `${c.name} (Lv${c.level})`)
                    .join(', ');
                this.session.wsSession.sendEvent(`👤 Personajes: ${charNames}`, {
                    characters: result.characters,
                    charCount: result.charCount,
                });
            } else {
                this.session.wsSession.sendStatus('CHARACTER_LIST_FAILED', {
                    error: result.error,
                });
            }
        }

        if (result.success) {
            if (this.session && this.session.wsSession) {
                this.session.wsSession.sendEvent('✅ Listo para seleccionar personaje');
            }
            const selection = this.loginHandler.selectFirstAvailableCharacter();
            if (selection.success) {
                Logger.info(`PacketRouter: auto-selecting character ${selection.character.name}`, 'PacketRouter');
                this.tcpSession.send(selection.packet);
            } else {
                Logger.warn(`PacketRouter: no character available to auto-select`, 'PacketRouter');
            }
        }
    }

    sendLoginAfterHandshake() {
        if (!this.session || !this.session.loginCredentials) {
            Logger.warn('PacketRouter: login credentials missing; cannot auto-send login', 'PacketRouter');
            return;
        }

        const { username, password, serverId, token } = this.session.loginCredentials;
        const isAgentConnection = this.tcpSession.connectionManager?.isConnectedToAgent;

        if (isAgentConnection) {
            if (!token) {
                Logger.warn('PacketRouter: missing token for agent login', 'PacketRouter');
                return;
            }
            Logger.info(`PacketRouter: sending GAME_LOGIN (0x6103) after agent handshake`, 'PacketRouter');
            const packet = LoginRequestBuilder.buildGameLogin(token);
            this.tcpSession.send(packet);
            if (this.session.wsSession) {
                this.session.wsSession.sendStatus('AGENT_LOGIN_SENT');
                this.session.wsSession.sendEvent('📤 Conectando al Agent');
            }
            return;
        }

        if (!username || !password) {
            Logger.warn('PacketRouter: incomplete login credentials; aborting auto login', 'PacketRouter');
            return;
        }

        Logger.info(`PacketRouter: sending LOGIN_REQUEST after handshake for user=${username}`, 'PacketRouter');
        const loginPacket = LoginRequestBuilder.buildLoginRequest(username, password, serverId);
        const encryptedPacket = this.tcpSession.security.formatPacket(OPCODE_LOGIN_REQUEST, loginPacket.payload, loginPacket.encrypted);
        this.tcpSession.send(encryptedPacket);
        if (this.session.wsSession) {
            this.session.wsSession.sendStatus('LOGIN_SENT');
            this.session.wsSession.sendEvent('📤 Login enviado');
        }
    }
}
