import Logger from '../../../shared/utils/Logger.js';
import { GATEWAY_CONFIG } from '../../../shared/config/gateway.js';
import sessionManager from '../../sessions/SessionManager.js';
import {
  handleLoginMessage,
  handleCharacterSelectMessage,
  handleCharacterListRequestMessage,
  handleDisconnectCharacterMessage,
  handleChatSendMessage,
  handleStallAction,
  handleMovementAction,
} from '../../../shared/WebSocketLoginHandler.js';

class WebSocketSession {
  /**
   * Represents a client WebSocket session.
   * @param {string} sessionId The unique session ID.
   * @param {WebSocket} ws The raw ws socket connection.
   */
  constructor(sessionId, ws) {
    this.sessionId = sessionId;
    this.ws = ws;
    this.isAlive = true;
    this.isClosed = false;

    // Rate limit tracking
    this.packetCount = 0;
    this.rateLimitResetTimer = null;

    // Future-proof Hook Placeholders (for packet filters, parsers, telegram integration)
    this.onPacketReceivedHook = null; // Hook triggered when client sends data to gateway
    this.onPacketSendingHook = null;  // Hook triggered when gateway is sending data to client

    this.setupSocket();
  }

  /**
   * Initializes WebSocket event handlers.
   */
  setupSocket() {
    // Explicitly set binary type to Node Buffer
    this.ws.binaryType = 'nodebuffer';

    this.ws.on('message', (data, isBinary) => {
      this.handleMessage(data, isBinary);
    });

    this.ws.on('pong', () => {
      this.isAlive = true;
      // PONG silencioso — no loggear
    });

    this.ws.on('close', (code, reason) => {
      Logger.info(`WS closed for session ${this.sessionId}. Code: ${code}, Reason: ${reason || 'No description'}`, 'WebSocketSession');
      sessionManager.destroySession(this.sessionId);
    });

    this.ws.on('error', (err) => {
      Logger.error(`WS error in session ${this.sessionId}`, err, 'WebSocketSession');
      sessionManager.destroySession(this.sessionId);
    });

    // Start 1-second interval rate limiter reset
    if (GATEWAY_CONFIG.PACKET_LIMITS.RATE_LIMIT_ENABLED) {
      this.rateLimitResetTimer = setInterval(() => {
        this.packetCount = 0;
      }, 1000);
    }
  }

  /**
   * Processes an incoming message from the WebSocket client.
   * @param {Buffer} data Binary packet payload.
   * @param {boolean} isBinary Flag indicating if the message is binary.
   */
  handleMessage(data, isBinary) {
    if (!isBinary) {
      try {
        const textStr = data.toString('utf8');
        const parsed = JSON.parse(textStr);

        // Manejar comandos de LOGIN
        if (parsed.type === 'LOGIN') {
          const session = sessionManager.getSession(this.sessionId);
          if (session && session.tcpSession) {
            handleLoginMessage(parsed, this.sessionId, session.tcpSession);
          }
          return;
        }

        // Manejar solicitud de lista de personajes
        if (parsed.type === 'REQUEST_CHARACTER_LIST') {
          const session = sessionManager.getSession(this.sessionId);
          if (session && session.tcpSession) {
            handleCharacterListRequestMessage(parsed, this.sessionId, session.tcpSession);
          }
          return;
        }

        // Manejar selección de personaje
        if (parsed.type === 'CHARACTER_SELECT') {
          const session = sessionManager.getSession(this.sessionId);
          if (session && session.tcpSession) {
            handleCharacterSelectMessage(parsed, this.sessionId, session.tcpSession);
          }
          return;
        }

        // Manejar desconexión de personaje (volver a selección)
        if (parsed.type === 'DISCONNECT_CHARACTER') {
          const session = sessionManager.getSession(this.sessionId);
          if (session && session.tcpSession) {
            handleDisconnectCharacterMessage(parsed, this.sessionId, session.tcpSession);
          }
          return;
        }

        // Manejar envío de mensajes de chat
        if (parsed.type === 'CHAT_SEND') {
          const session = sessionManager.getSession(this.sessionId);
          if (session && session.tcpSession) {
            handleChatSendMessage(parsed, this.sessionId, session.tcpSession);
          }
          return;
        }

        // Manejar acciones de Stall (STALL_CREATE, STALL_OPEN, STALL_MODIFY, STALL_CLOSE)
        if (parsed.type && parsed.type.startsWith('STALL_')) {
          const session = sessionManager.getSession(this.sessionId);
          if (session && session.tcpSession) {
            handleStallAction(parsed, this.sessionId, session.tcpSession);
          }
          return;
        }

        // Manejar acciones de movimiento (SIT_DOWN, GET_UP)
        if (parsed.type === 'SIT_DOWN' || parsed.type === 'GET_UP') {
          const session = sessionManager.getSession(this.sessionId);
          if (session && session.tcpSession) {
            handleMovementAction(parsed, this.sessionId, session.tcpSession);
          }
          return;
        }

        // Manejar respuesta de captcha desde el frontend
        if (parsed.type === 'CAPTCHA_REPLY') {
          const session = sessionManager.getSession(this.sessionId);
          if (session && session.tcpSession && session.tcpSession.packetRouter) {
            const code = parsed.code || '';
            Logger.info(`[CAPTCHA_REPLY] Frontend sent code: "${code}"`, 'WebSocketSession');
            const PacketWriter = require('../../packet/PacketWriter');
            const captchaPacket = new PacketWriter();
            captchaPacket.writeString(code);
            const encPacket = session.tcpSession.security.formatPacket(0x6323, captchaPacket.getBytes(), true);
            session.tcpSession.send(encPacket);
            Logger.info('[CAPTCHA_REPLY] Sent 0x6323 with user code', 'WebSocketSession');
          }
          return;
        }

        // Manejar movimiento del jugador (MOVE)
        if (parsed.type === 'MOVE') {
          const session = sessionManager.getSession(this.sessionId);
          if (session && session.tcpSession && session.tcpSession.packetRouter) {
            const { region, posX, posZ, posY: frontendPosY } = parsed;
            Logger.info(`[MOVE] Frontend move request: region=${region} posX=${posX} posZ=${posZ} posY=${frontendPosY}`, 'WebSocketSession');

            try {
              const router = session.tcpSession.packetRouter;
              
              // Detectar cambio de región
              const currentRegion = router._currentRegion;
              if (currentRegion !== undefined && currentRegion !== region) {
                Logger.info(`[MOVE] Region changed: ${currentRegion} -> ${region}. Sending 0x34B6 for new spawns...`, 'WebSocketSession');
                // Enviar 0x34B6 para solicitar spawns de la nueva región
                try {
                  const PacketWriter = require('../../packet/PacketWriter');
                  const spawnReady = session.tcpSession.security.formatPacket(0x34B6, Buffer.alloc(0), true);
                  session.tcpSession.send(spawnReady);
                  Logger.info(`[MOVE] 0x34B6 sent for region ${region}`, 'WebSocketSession');
                } catch (e) {
                  Logger.warn(`[MOVE] Failed to send 0x34B6: ${e.message}`, 'WebSocketSession');
                }
              }
              router._currentRegion = region;

              // Usar la altitud del servidor (última conocida) o la del frontend
              let altY = 0;
              if (router && router._lastPlayerPosY > 0) {
                altY = router._lastPlayerPosY; // ya está en unidades /10
              } else if (frontendPosY != null && frontendPosY > 0) {
                altY = frontendPosY;
              }
              // Si no hay altitud conocida, usar 182 (altitud típica de Jangan)
              if (altY <= 0) {
                altY = 182.0;
              }

              // Construir paquete 0x7021 (CLIENT_MOVEMENT)
              const PacketWriter = require('../../packet/PacketWriter');
              const p = new PacketWriter();

              // Extraer sectores del region ID
              const regionX = region & 0xFF;
              const regionZ = (region >> 8) & 0xFF;

              const x10 = Math.round((posX || 0) * 10);
              const z10 = Math.round((posZ || 0) * 10);
              const y10 = Math.round(altY * 10);

              Logger.info(`[MOVE] Sending 0x7021 region=${region} (${regionX},${regionZ}) xOffset=${x10} zOffset(NS)=${z10} yOffset(H)=${y10}`, 'WebSocketSession');

              p.writeByte(0x01); // movement type (1 = normal click)
              // Escribir RegionID como ushort (2 bytes) igual que RSBot
              p.writeWord(region & 0xFFFF); // regionID como ushort

              if (region >= 32768) {
                // Dungeon - int32
                p.writeDWord(x10);
                p.writeDWord(z10);
                p.writeDWord(y10);
              } else {
                // Normal world - int16 (short)
                // Orden según RSBot (0x7021): X, Z(norte-sur), Y(altitud)
                // RSBot Player.MoveTo: WriteShort(XOffset), WriteShort(ZOffset), WriteShort(YOffset)
                const writeShortLE = (val) => {
                    const b = Buffer.alloc(2);
                    b.writeInt16LE(Math.round(val), 0);
                    p.writeWord(b.readUInt16LE(0));
                };
                writeShortLE(x10);   // xOffset * 10 (este-oeste = posX)
                writeShortLE(z10);   // zOffset * 10 (norte-sur = posZ)
                writeShortLE(y10);   // yOffset * 10 (altitud = altY)
              }

              const rawPayload = p.getBytes();
              Logger.info('[MOVE] 0x7021 HEX=' + Buffer.from(rawPayload).toString('hex').toUpperCase() + ' size=' + rawPayload.length, 'WebSocketSession');
              const encPacket = session.tcpSession.security.formatPacket(0x7021, rawPayload, true);
              session.tcpSession.send(encPacket);
              Logger.info('[MOVE] 0x7021 sent to game server', 'WebSocketSession');
            } catch (err) {
              Logger.error(`[MOVE] Error sending movement: ${err.message}`, 'WebSocketSession');
            }
          }
          return;
        }

        Logger.info(
          `[Agent Routing] Session ${this.sessionId} - Message: ${parsed.type || 'JSON'}`,
          'WebSocketSession'
        );
        return;
      } catch (err) {
        Logger.warn(`Session ${this.sessionId} sent non-binary data. Packet ignored.`, 'WebSocketSession');
        return;
      }
    }

    // Guard 1: Enforce packet size limit
    if (data.length > GATEWAY_CONFIG.PACKET_LIMITS.MAX_SIZE) {
      Logger.warn(`Session ${this.sessionId} packet exceeded size limit (${data.length} > ${GATEWAY_CONFIG.PACKET_LIMITS.MAX_SIZE}). Disconnecting...`, 'WebSocketSession');
      sessionManager.destroySession(this.sessionId);
      return;
    }

    // Guard 2: Enforce rate limiting
    if (GATEWAY_CONFIG.PACKET_LIMITS.RATE_LIMIT_ENABLED) {
      this.packetCount++;
      if (this.packetCount > GATEWAY_CONFIG.PACKET_LIMITS.MAX_PACKETS_PER_SEC) {
        Logger.warn(`Session ${this.sessionId} exceeded packet rate limit (${this.packetCount} packets/sec). Disconnecting...`, 'WebSocketSession');
        sessionManager.destroySession(this.sessionId);
        return;
      }
    }

    Logger.debug(`WS -> Gateway [${data.length} bytes] in session ${this.sessionId}`, 'WebSocketSession');

    // Future placeholder hook: packet filtering, parsing, or Telegram logging
    let processedData = data;
    if (this.onPacketReceivedHook) {
      try {
        processedData = this.onPacketReceivedHook(data);
        if (!processedData) {
          Logger.debug(`Packet dropped by WebSocket incoming hook for session ${this.sessionId}`, 'WebSocketSession');
          return; // Dropped
        }
      } catch (err) {
        Logger.error(`Error in onPacketReceivedHook for session ${this.sessionId}`, err, 'WebSocketSession');
      }
    }

    // Relay the binary payload to the Silkroad GameServer
    const session = sessionManager.getSession(this.sessionId);
    if (session && session.relayManager) {
      session.relayManager.handleWsData(processedData);
    }
  }

  /**
   * Transmits binary data to the WebSocket client.
   * @param {Buffer} data Binary payload.
   */
  send(data) {
    if (this.ws.readyState !== 1) { // 1 = WebSocket.OPEN
      Logger.warn(`WS connection not open for session ${this.sessionId}. Packet dropped.`, 'WebSocketSession');
      return;
    }

    // Future placeholder hook: edit packet or inject content before reaching the web client
    let processedData = data;
    if (this.onPacketSendingHook) {
      try {
        processedData = this.onPacketSendingHook(data);
        if (!processedData) {
          Logger.debug(`Packet dropped by WebSocket outgoing hook for session ${this.sessionId}`, 'WebSocketSession');
          return; // Dropped
        }
      } catch (err) {
        Logger.error(`Error in onPacketSendingHook for session ${this.sessionId}`, err, 'WebSocketSession');
      }
    }

    Logger.debug(`Gateway -> WS [${processedData.length} bytes] in session ${this.sessionId}`, 'WebSocketSession');

    this.ws.send(processedData, { binary: true }, (err) => {
      if (err) {
        Logger.error(`Error transmitting WS packet in session ${this.sessionId}`, err, 'WebSocketSession');
      }
    });
  }

  /**
   * Sends a structured PACKET object as JSON text to the WebSocket client.
   * Used for the real-time packet monitor in the frontend.
   * Payload is converted to hex string for JSON serialization.
   * @param {Object} packet PACKET object from PacketTranslator.
   */
  sendPacket(packet) {
    if (this.ws.readyState !== 1) {
      Logger.warn(`WS not open for session ${this.sessionId}. Packet JSON dropped.`, 'WebSocketSession');
      return;
    }

    let payloadHex;
    if (packet.payload instanceof ArrayBuffer) {
      payloadHex = Buffer.from(packet.payload).toString('hex');
    } else if (Buffer.isBuffer(packet.payload)) {
      payloadHex = packet.payload.toString('hex');
    } else {
      payloadHex = String(packet.payload);
    }

    const jsonPacket = {
      type: packet.type,
      direction: packet.direction,
      opcode: packet.opcode,
      size: packet.size,
      payload: payloadHex,
      timestamp: packet.timestamp,
    };

    const session = sessionManager.getSession(this.sessionId);
    if (session) {
      jsonPacket.stats = {
        rxPackets: session.rxPackets,
        txPackets: session.txPackets,
        lastOpcode: session.lastOpcode,
        lastPacketAt: session.lastPacketAt,
        lastRxAt: session.lastRxAt,
        lastTxAt: session.lastTxAt,
      };
    }

    const json = JSON.stringify(jsonPacket);
    Logger.debug(`Gateway -> WS [PACKET JSON ${json.length} chars] session ${this.sessionId}`, 'WebSocketSession');

    this.ws.send(json, { binary: false }, (err) => {
      if (err) {
        Logger.error(`Error sending packet JSON for session ${this.sessionId}`, err, 'WebSocketSession');
      }
    });
  }

  sendStatus(status, detail = {}) {
    if (this.ws.readyState !== 1) {
      return;
    }

    const message = JSON.stringify({
      type: 'STATUS',
      status,
      detail,
      timestamp: Date.now(),
    });

    this.ws.send(message, { binary: false }, (err) => {
      if (err) {
        Logger.error(`Error sending status JSON for session ${this.sessionId}`, err, 'WebSocketSession');
      }
    });
  }

  sendEvent(text, detail = {}) {
    if (this.ws.readyState !== 1) {
      return;
    }

    const message = JSON.stringify({
      type: 'EVENT',
      message: text,
      detail,
      timestamp: Date.now(),
    });

    this.ws.send(message, { binary: false }, (err) => {
      if (err) {
        Logger.error(`Error sending event JSON for session ${this.sessionId}`, err, 'WebSocketSession');
      }
    });
  }

  login(username, password, serverId) {
    const session = sessionManager.getSession(this.sessionId);
    if (!session || !session.tcpSession) {
      Logger.warn(`LOGIN ignored because TCP session is missing for ${this.sessionId}`, 'WebSocketSession');
      this.sendStatus('LOGIN_FAILED');
      return;
    }

    session.loginCredentials = { username, password, serverId };
    if (session.tcpSession.packetRouter && session.tcpSession.handshakeComplete) {
      session.tcpSession.packetRouter.sendLoginAfterHandshake();
      this.sendStatus('LOGIN_SENT');
    } else {
      this.sendStatus('LOGIN_PENDING_HANDSHAKE');
    }
  }

  /**
   * Sends a ping to check the socket's health status.
   */
  ping() {
    if (this.ws.readyState === 1) {
      this.isAlive = false;
      this.ws.ping();
    }
  }

  /**
   * Gracefully and decisively terminates the socket connection.
   */
  close() {
    if (this.isClosed) {
      return;
    }

    this.isClosed = true;
    this.sendStatus('SESSION_CLOSED');
    this.cleanup();
    this.ws.removeAllListeners('message');
    this.ws.removeAllListeners('pong');
    this.ws.removeAllListeners('close');
    this.ws.removeAllListeners('error');

    if (this.ws.readyState === 1 || this.ws.readyState === 0) {
      try {
        this.ws.terminate();
      } catch (e) {
        // Suppress already closed socket errors
      }
    }
  }

  /**
   * Internal cleaner for intervals.
   */
  cleanup() {
    if (this.rateLimitResetTimer) {
      clearInterval(this.rateLimitResetTimer);
      this.rateLimitResetTimer = null;
    }
    this.packetCount = 0;
    this.onPacketReceivedHook = null;
    this.onPacketSendingHook = null;
  }
}

export default WebSocketSession;
