import TcpConnectionManager from './TcpConnectionManager.js';
import PacketAssembler from '../../packet/PacketAssembler.js';
import Logger from '../../../shared/utils/Logger.js';
import { GATEWAY_CONFIG } from '../../../shared/config/gateway.js';
import sessionManager from '../../sessions/SessionManager.js';
import { LoginHandler } from '../../../shared/handlers/LoginHandler.js';
import PacketRouter from '../../../shared/PacketRouter.js';
import PacketTranslator from '../../../shared/PacketTranslator.js';

const Security = require('../../security/Security.js');
const PacketReader = require('../../packet/PacketReader.js');
const PacketWriter = require('../../packet/PacketWriter.js');

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
    this.startHeartbeat();
  }

  /**
   * Inicia heartbeat TCP (0x2002) cada 5 segundos.
   * Usa security.formatPacket() para generar count/check bytes válidos.
   */
  startHeartbeat() {
    this.stopHeartbeat();
    // Heartbeat solo visible en DEBUG
    if (Logger.isDebugEnabled?.()) {
      Logger.debug(`[TcpSession] Starting heartbeat (0x2002 every 5s) for ${this.sessionId}`, 'TcpSession');
    }
    this._heartbeatTimer = setInterval(() => {
      if (this.isClosed || !this.security) return;
      try {
        const payload = Buffer.alloc(0);
        const pingPacket = this.security.formatPacket(0x2002, payload, false);
        this.send(pingPacket);
      } catch (err) {
        Logger.warn(`[TcpSession] Heartbeat send failed for ${this.sessionId}`, err, 'TcpSession');
      }
    }, 5000);
  }

  /**
   * Detiene el heartbeat
   */
  stopHeartbeat() {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
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
        session.wsSession.sendEvent(`Desconectado: ${hadError ? 'error de socket' : 'cierre de conexion'}`);
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
      // Detectar si el paquete está encriptado (bit 0x8000 en size)
      const rawSize = packet.payload.readUInt16LE(0);
      const isEncrypted = (rawSize & 0x8000) !== 0;
      const payloadSize = rawSize & 0x7FFF;

      let processedPayload = packet.payload;

      if (isEncrypted && this.security) {
        try {
          // ═══════════════════════════════════════════════════════════
          // BLOWFISH DECRYPT — OFFSET CORRECTO
          // ═══════════════════════════════════════════════════════════
          //
          // Estructura del paquete encriptado:
          //   [0-1] size field (NO cifrado)
          //   [2-N] opcode(2) + count(1) + check(1) + payload + padding
          //
          // El campo rawSize (size & 0x7FFF) = opcode(2) + count(1) + check(1) + payload
          // Los datos cifrados empiezan en byte 2.
          // Longitud cifrada = align8(rawSize)  (mismo cálculo que PacketAssembler.getAlignedSize)
          //   donde align8(n) = (n + 7) & ~7
          // ═══════════════════════════════════════════════════════════

          const encDataLen = payloadSize + 4; // rawSize + 4? No: rawSize YA es opcode+count+check+payload
          // rawSize = payloadSize = opcode(2) + count(1) + check(1) + payload(N)
          // PacketAssembler.getAlignedSize hace: encDataLen = payloadSize + 4 (pero payloadSize YA incluye esos 4)
          // Esto es un bug del PacketAssembler original, pero debemos coincidir con él.
          const alignedLen = (encDataLen % 8 === 0) ? encDataLen : encDataLen + (8 - (encDataLen % 8));
          const availableLen = packet.payload.length - 2;

          if (availableLen < alignedLen) {
            Logger.warn(`[DECRYPT] Insufficient data: need=${alignedLen} have=${availableLen} pktLen=${packet.payload.length}`, 'TcpSession');
            continue;
          }

          // 🔍 DEBUG HEX ANTES del decrypt
          const hexBefore = packet.payload.subarray(0, Math.min(packet.payload.length, 64)).toString('hex').toUpperCase();
          Logger.info(`[DECRYPT] BEFORE size=0x${rawSize.toString(16)} alignedLen=${alignedLen} hex=${hexBefore}`, 'TcpSession');

          // Decrypt desde byte 2, longitud = alignedLen
          const decrypted = this.security.decode(packet.payload, 2, alignedLen);

          if (decrypted.length < 4) {
            Logger.warn(`[DECRYPT] Decrypt returned only ${decrypted.length} bytes — skipping`, 'TcpSession');
            continue;
          }

          // 🔍 DEBUG HEX DESPUÉS del decrypt
          const hexAfter = decrypted.subarray(0, Math.min(decrypted.length, 64)).toString('hex').toUpperCase();
          const realOpcode = decrypted.readUInt16LE(0);
          Logger.info(`[DECRYPT] AFTER opcode=0x${realOpcode.toString(16).padStart(4, '0')} decryptedLen=${decrypted.length} hex=${hexAfter}`, 'TcpSession');

          // Validar opcode: debe ser un opcode válido de Silkroad
          if (realOpcode === 0 || realOpcode === 0xFFFF) {
            Logger.warn(`[DECRYPT] Invalid opcode 0x${realOpcode.toString(16).padStart(4, '0')} after decrypt — corrupt packet?`, 'TcpSession');
            continue;
          }

          const realCountByte = decrypted.readUInt8(2);
          const realCheckByte = decrypted.readUInt8(3);

          // Reconstruir paquete sin encriptación
          // Layout: [payloadSize:2][opcode:2][count:1][check:1][payload:N]
          //
          // El rawSize del paquete encriptado (payloadSize) NO incluye los 4 bytes
          // de opcode+count+check que están dentro de la parte cifrada.
          // El tamaño real del contenido descifrado es payloadSize + 4.
          // Ese es el valor correcto para el campo size del paquete reconstruido.
          const realPayloadSize = payloadSize + 4;
          processedPayload = Buffer.alloc(realPayloadSize + 2);
          processedPayload.writeUInt16LE(realPayloadSize, 0);
          processedPayload.writeUInt16LE(realOpcode, 2);
          processedPayload.writeUInt8(realCountByte, 4);
          processedPayload.writeUInt8(realCheckByte, 5);

          // Copiar payload desde offset 4 del decrypted (después de opcode+count+check)
          const copyLen = Math.min(realPayloadSize - 4, decrypted.length - 4);
          if (copyLen > 0) decrypted.copy(processedPayload, 6, 4, 4 + copyLen);

          Logger.info(`[DECRYPT] SUCCESS opcode=0x${realOpcode.toString(16).padStart(4, '0')} payloadSize=${payloadSize}`, 'TcpSession');
        } catch (err) {
          Logger.warn(`[DECRYPT] Failed: ${err.message}`, 'TcpSession');
        }
      }

      const packetObj = PacketTranslator.translate(
        { payload: processedPayload, size: processedPayload.length, opcode: `0x${processedPayload.readUInt16LE(2).toString(16).padStart(4, '0')}` },
        "RX"
      );
      session.rxPackets += 1;
      session.lastOpcode = packetObj.opcode;
      session.lastPacketAt = packetObj.timestamp;
      session.lastRxAt = packetObj.timestamp;
      Logger.info(`[RX] opcode=${packetObj.opcode} size=${packetObj.size} session=${this.sessionId}`, 'TcpSession');
      session.relayManager.handleTcpData(packetObj);
      const handled = this.packetRouter.route(processedPayload, packetObj);
      if (!handled) {
        this.handleGatewayPacket(processedPayload, packetObj, session);
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

    // CHARACTER_SELECT (0xb001) — solo log, el envío lo hace PacketRouter
    if (packetObj.opcode === '0xb001') {
      Logger.info(`CHARACTER_SELECT confirmed session=${this.sessionId}`, 'TcpSession');
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
    this.stopHeartbeat();
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
