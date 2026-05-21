import TcpConnectionManager from './TcpConnectionManager.js';
import PacketTranslator from '../../shared/PacketTranslator.js';
import PacketAssembler from '../packet/PacketAssembler.js';
import Logger from '../utils/Logger.js';
import { GATEWAY_CONFIG } from '../config/gateway.config.js';
import sessionManager from '../sessions/SessionManager.js';
import { LoginHandler } from '../../shared/handlers/LoginHandler.js';
import PacketRouter from '../../shared/PacketRouter.js';

const Security = require('../security/Security.js');
const PacketReader = require('../packet/PacketReader.js');
const PacketWriter = require('../packet/PacketWriter.js');

class TcpSession {
  /**
   * Manages the TCP session state, handling buffering and hooks for game server communication.
   * @param {string} sessionId Unique ID matching the client session.
   */
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.activeClient = null;
    this.connectionManager = new TcpConnectionManager(sessionId);
    this.packetAssembler = new PacketAssembler();
    this.security = new Security();
    this.isClosed = false;
    this.handshakeStarted = false;
    this.handshakeComplete = false;
    this.packetRouter = null;

    // Future-proof Hook Placeholders (for packet filters, parsers, telegram integration)
    this.onPacketReceivedHook = null; // Hook triggered when TCP GameServer sends data to gateway
    this.onPacketSendingHook = null;  // Hook triggered when gateway is sending data to TCP GameServer

    this.setupEvents();
  }

  /**
   * Hooks events from the raw TCP client.
   */
  setupEvents() {
    this.connectionManager.onGatewayConnected = (client) => this.attachClient(client);
    this.connectionManager.onAgentConnected = (client) => this.attachClient(client);
    this.connectionManager.onConnectionError = (phase, err) => {
      const session = sessionManager.getSession(this.sessionId);
      if (session?.wsSession) {
        session.wsSession.sendEvent(`❌ Desconectado: ${err.message || phase}`, {
          phase,
          error: err.message,
        });
      }
      Logger.error(`TCP connection error during ${phase} for ${this.sessionId}:`, err, 'TcpSession');
      sessionManager.destroySession(this.sessionId);
    };
    this.connectionManager.onPhaseChange = (oldPhase, newPhase) => {
      const session = sessionManager.getSession(this.sessionId);
      if (!session?.wsSession) return;

      if (newPhase === 'GATEWAY_CONNECTED') {
        session.wsSession.sendEvent(`✅ Conectado al Gateway :${GATEWAY_CONFIG.GAME_PORT}`);
      } else if (newPhase === 'AGENT_CONNECTED') {
        const port = this.connectionManager.sessionData.agentPort || GATEWAY_CONFIG.AGENT_PORT;
        session.wsSession.sendEvent(`🔄 Conectado al Agent :${port}`);
      }
    };
  }

  attachClient(client) {
    this.activeClient = client;

    client.onDataCallback = (data) => {
      this.handleIncomingData(data).catch((err) => {
        Logger.error(`Error processing incoming data for ${this.sessionId}:`, err, 'TcpSession');
      });
    };

    client.onCloseCallback = (hadError) => {
      const session = sessionManager.getSession(this.sessionId);
      if (session?.wsSession) {
        session.wsSession.sendEvent(`❌ Desconectado: ${hadError ? 'error de socket' : 'cierre de conexión'}`);
      }
      Logger.info(`TCP session closed for ${this.sessionId}. Disconnecting session.`, 'TcpSession');
      sessionManager.destroySession(this.sessionId);
    };

    client.onErrorCallback = (err) => {
      Logger.error(`TCP session error in ${this.sessionId}:`, err, 'TcpSession');
      sessionManager.destroySession(this.sessionId);
    };
  }

  /**
   * Establishes TCP connection to Silkroad GameServer.
   * @returns {Promise<void>} Resolves when connection succeeds.
   */
  async connect() {
    await this.connectionManager.connectToGateway();
  }

  /**
   * Processes data received from Silkroad GameServer.
   * In a pure relay, data is instantly routed, but hooks allow future packet parser / opcode handler integration.
   * @param {Buffer} data Raw binary buffer.
   */
  async handleIncomingData(data) {
    Logger.debug(`TCP -> Gateway [${data.length} bytes] in session ${this.sessionId}`, 'TcpSession');

    let processedData = data;
    if (this.onPacketReceivedHook) {
      try {
        processedData = this.onPacketReceivedHook(data);
        if (!processedData) {
          Logger.debug(`Packet dropped by TCP incoming hook for session ${this.sessionId}`, 'TcpSession');
          return; // Dropped by hook
        }
      } catch (err) {
        Logger.error(`Error in TCP onPacketReceivedHook for session ${this.sessionId}`, err, 'TcpSession');
      }
    }

    const session = sessionManager.getSession(this.sessionId);
    if (!session || !session.relayManager) {
      Logger.warn(`TCP packet received but relay is missing for ${this.sessionId}`, 'TcpSession');
      return;
    }

    let packets;
    try {
      packets = this.packetAssembler.push(processedData);
    } catch (err) {
      Logger.error(`Packet assembly failed for session ${this.sessionId}:`, err, 'TcpSession');
      sessionManager.destroySession(this.sessionId);
      return;
    }

    if (!this.packetRouter) {
      this.packetRouter = new PacketRouter(this, session);
    }

    for (const packet of packets) {
      const packetObj = PacketTranslator.translate(packet, "RX");
      session.rxPackets += 1;
      session.lastOpcode = packetObj.opcode;
      session.lastPacketAt = packetObj.timestamp;
      session.lastRxAt = packetObj.timestamp;
      Logger.info(`[RX] opcode=${packetObj.opcode} size=${packetObj.size} session=${this.sessionId}`, 'TcpSession');
      session.relayManager.handleTcpData(packetObj);
      const handled = this.packetRouter.route(packet.payload, packetObj);
      if (!handled) {
        this.handleGatewayPacket(packet.payload, packetObj, session);
      }
    }
  }

  handleGatewayPacket(rawPacket, packetObj, session) {
    // HANDSHAKE (0x5000) - Inicia el handshake de seguridad
    if (packetObj.opcode === '0x5000') {
      this.handleHandshake(rawPacket, session);
      return;
    }

    // HANDSHAKE_COMPLETE (0x2001) - Handshake finalizado
    if (packetObj.opcode === '0x2001' && this.handshakeStarted && !this.handshakeComplete) {
      this.handshakeComplete = true;
      Logger.info(`HANDSHAKE_COMPLETE session=${this.sessionId}`, 'TcpSession');
      if (session.wsSession) {
        session.wsSession.sendStatus('HANDSHAKE_COMPLETE');
      }
      return;
    }

    // LOGIN_RESPONSE (0xa102) - Respuesta a login
    if (packetObj.opcode === '0xa102') {
      this.handleLoginResponse(packetObj, session);
      return;
    }

    // CHARACTER_LIST (0xb007) - Lista de personajes
    if (packetObj.opcode === '0xb007') {
      this.handleCharacterList(packetObj, session);
      return;
    }

    // CHARACTER_SELECT (0xb001) - Confirmación de selección
    if (packetObj.opcode === '0xb001') {
      Logger.info(`CHARACTER_SELECT confirmed session=${this.sessionId}`, 'TcpSession');
      if (session.wsSession) {
        session.wsSession.sendStatus('CHARACTER_SELECT_OK');
      }
      return;
    }
  }

  /**
   * Procesa LOGIN_RESPONSE (0xa102)
   * 
   * Usa LoginHandler para parsear la respuesta y extraer:
   * - sessionId
   * - host del Agent Server
   * - puerto del Agent Server
   */
  handleLoginResponse(packetObj, session) {
    Logger.info(`[RX] LOGIN_RESPONSE session=${this.sessionId}`, 'TcpSession');

    const loginHandler = new LoginHandler();
    const result = loginHandler.processLoginResponse(packetObj);

    if (result.success) {
      Logger.success(
        `LOGIN SUCCESS! SessionId=${result.sessionId}, Agent: ${result.agentHost}:${result.agentPort}`,
        'TcpSession'
      );
      if (session.wsSession) {
        session.wsSession.sendStatus('LOGIN_OK', {
          sessionId: result.sessionId,
          host: result.agentHost,
          port: result.agentPort,
        });
      }
    } else {
      Logger.error(`LOGIN FAILED: ${result.error}`, null, 'TcpSession');
      if (session.wsSession) {
        session.wsSession.sendStatus('LOGIN_FAILED', {
          error: result.error,
          code: result.code,
          subcode: result.subcode,
        });
      }
    }
  }

  /**
   * Procesa CHARACTER_LIST (0xb007)
   * 
   * Extrae la lista de personajes con:
   * - Nombre
   * - Nivel
   * - Experiencia
   * - Stats (STR, INT)
   * - HP/MP
   */
  handleCharacterList(packetObj, session) {
    Logger.info(`[RX] CHARACTER_LIST session=${this.sessionId}`, 'TcpSession');

    const loginHandler = new LoginHandler();
    const result = loginHandler.processCharacterList(packetObj);

    if (result.success) {
      Logger.success(
        `Received ${result.charCount} character(s) for session ${this.sessionId}`,
        'TcpSession'
      );

      if (session.wsSession) {
        session.wsSession.sendStatus('CHARACTER_LIST_RECEIVED', {
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
      }
    } else {
      Logger.error(`CHARACTER_LIST parse failed: ${result.error}`, null, 'TcpSession');
      if (session.wsSession) {
        session.wsSession.sendStatus('CHARACTER_LIST_FAILED', {
          error: result.error,
        });
      }
    }
  }

  handleHandshake(rawPacket, session) {
    let flag = 0;
    if (rawPacket.length > 6) {
      flag = rawPacket.readUInt8(6);
    }

    if (flag === 0x0e || flag === 0x10 || !this.handshakeStarted) {
      Logger.info(`HANDSHAKE_START flag=0x${flag.toString(16).padStart(2, '0')} session=${this.sessionId}`, 'TcpSession');
      if (session.wsSession) {
        session.wsSession.sendStatus('HANDSHAKE');
      }
    }

    const reader = new PacketReader(rawPacket);
    const responsePackets = this.security.handshake(reader) || [];

    this.handshakeStarted = true;
    responsePackets.forEach((response) => {
      const payload = response.packet.getBytes();
      const outgoing = this.security.formatPacket(response.opcode, payload, response.encrypted);
      this.send(outgoing);
    });
  }

  /**
   * Dispatches data to Silkroad GameServer.
   * @param {Buffer} data Binary packet.
   */
  send(data) {
    if (this.isClosed) {
      Logger.warn(`TCP session already closed for ${this.sessionId}. Packet dropped.`, 'TcpSession');
      return;
    }

    // Translate outgoing buffer for UI monitoring (direction TX)
    const packetObj = PacketTranslator.translate(data, "TX");

    // Forward TX packet to WebSocket for real-time monitoring
    const session = sessionManager.getSession(this.sessionId);
    if (session && session.wsSession) {
      session.txPackets += 1;
      session.lastOpcode = packetObj.opcode;
      session.lastPacketAt = packetObj.timestamp;
      session.lastTxAt = packetObj.timestamp;
      Logger.info(`[TX] opcode=${packetObj.opcode} size=${packetObj.size} session=${this.sessionId}`, 'TcpSession');
      session.wsSession.sendPacket(packetObj);
    }

    let processedData = data;
    if (this.onPacketSendingHook) {
      try {
        processedData = this.onPacketSendingHook(data);
        if (!processedData) {
          Logger.debug(`Packet dropped by TCP outgoing hook for session ${this.sessionId}`, 'TcpSession');
          return; // Dropped by hook
        }
      } catch (err) {
        Logger.error(`Error in TCP onPacketSendingHook for session ${this.sessionId}`, err, 'TcpSession');
      }
    }

    Logger.debug(`Gateway -> TCP [${processedData.length} bytes] in session ${this.sessionId}`, 'TcpSession');
    this.connectionManager.send(processedData);
  }

  /**
   * Converts a structured PACKET object back to raw binary and sends to GameServer.
   * @param {Object} packetObj PACKET object with payload as ArrayBuffer, Buffer, or hex string.
   */
  sendPacket(packetObj) {
    let rawBuffer;
    if (packetObj.payload instanceof ArrayBuffer) {
      rawBuffer = Buffer.from(packetObj.payload);
    } else if (Buffer.isBuffer(packetObj.payload)) {
      rawBuffer = packetObj.payload;
    } else if (typeof packetObj.payload === 'string') {
      rawBuffer = Buffer.from(packetObj.payload, 'hex');
    } else {
      Logger.warn(`sendPacket: unrecognized payload format for session ${this.sessionId}`, 'TcpSession');
      return;
    }
    this.send(rawBuffer);
  }

  /**
   * Destroys raw TCP client socket.
   */
  close() {
    if (this.isClosed) {
      return;
    }

    this.isClosed = true;
    this.packetAssembler.reset();
    this.security = null;
    this.onPacketReceivedHook = null;
    this.onPacketSendingHook = null;
    if (this.connectionManager) {
      this.connectionManager.closeAll();
    }
    this.activeClient = null;
    this.connectionManager = null;
    this.packetAssembler = null;
  }

  destroy() {
    this.close();
  }
}

export default TcpSession;
