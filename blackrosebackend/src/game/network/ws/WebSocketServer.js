import { WebSocketServer as WS_Server } from 'ws';
import { GATEWAY_CONFIG } from '../../../shared/config/gateway.js';
import Logger from '../../../shared/utils/Logger.js';
import sessionManager from '../../sessions/SessionManager.js';
import WebSocketSession from './WebSocketSession.js';
import TcpSession from '../../network/tcp/TcpSession.js';
import RelayManager from '../../relay/RelayManager.js';

class WebSocketServer {
  constructor() {
    this.wss = null;
    this.heartbeatInterval = null;
  }

  /**
   * Boots the WebSocket Server.
   * Can run standalone on WS_PORT or share ports by attaching to an HTTP/HTTPS server instance.
   * @param {http.Server} [server] Optional Express http server instance.
   */
  start(server = null) {
    const options = {};

    if (server) {
      options.server = server;
      Logger.info(`Attaching WebSocket Server to existing Express HTTP Server.`, 'WebSocketServer');
    } else {
      options.host = GATEWAY_CONFIG.WS_HOST;
      options.port = GATEWAY_CONFIG.WS_PORT;
      Logger.info(`Initializing standalone WebSocket Server on ${GATEWAY_CONFIG.WS_HOST}:${GATEWAY_CONFIG.WS_PORT}...`, 'WebSocketServer');
    }

    // Spawn server instance
    this.wss = new WS_Server(options);

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (err) => {
      Logger.error(`WSS Server global error:`, err, 'WebSocketServer');
    });

    this.wss.on('listening', () => {
      const addr = this.wss.address();
      const port = addr && typeof addr === 'object' ? addr.port : GATEWAY_CONFIG.WS_PORT;
      Logger.success(`WebSocket Server listening on port ${port}`, 'WebSocketServer');
    });

    // Start WebSocket active client heartbeats
    this.startHeartbeat();
  }

  /**
   * Resolves the real client IP, respecting proxy forwarding and Cloudflare.
   * @param {http.IncomingMessage} req Client request object.
   * @returns {string} IP address.
   */
  getClientIp(req) {
    if (GATEWAY_CONFIG.CLOUDFLARE_MODE) {
      const cfIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'];
      if (cfIp) {
        return typeof cfIp === 'string' ? cfIp.split(',')[0].trim() : cfIp[0];
      }
    }

    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
    }

    return req.socket.remoteAddress || 'unknown';
  }

  /**
   * Processes new incoming connections, mapping the socket to the relay pipeline.
   * @param {WebSocket} ws Raw client ws socket.
   * @param {http.IncomingMessage} req Request metadata.
   */
  async handleConnection(ws, req) {
    const clientIp = this.getClientIp(req);
    Logger.info(`Incoming connection request from: ${clientIp}`, 'WebSocketServer');

    // 1. Limit Check
    if (!sessionManager.hasRoom()) {
      Logger.warn(`Connection from ${clientIp} rejected: Server is full!`, 'WebSocketServer');
      ws.close(1013, 'Server capacity reached');
      return;
    }

    // 2. Register new session
    const session = sessionManager.createSession(clientIp);
    if (!session) {
      ws.close(1011, 'Session registration failed');
      return;
    }

    const sessionId = session.id;

    try {
      // 3. Construct modular pipeline
      const wsSession = new WebSocketSession(sessionId, ws);
      const tcpSession = new TcpSession(sessionId);
      const relayManager = new RelayManager(sessionId);

      // Link components into the registry
      session.wsSession = wsSession;
      session.tcpSession = tcpSession;
      session.relayManager = relayManager;

      // 4. Asynchronously connect to Silkroad GameServer TCP port
      Logger.info(`Initializing GameServer TCP connection for session ${sessionId}...`, 'WebSocketServer');
      await tcpSession.connect();
      wsSession.sendStatus('TCP_OPEN', {
        host: GATEWAY_CONFIG.GAME_IP,
        port: GATEWAY_CONFIG.GAME_PORT,
      });

      Logger.success(`Relay pipeline successfully bridged for session ${sessionId}`, 'WebSocketServer');
    } catch (err) {
      Logger.error(`Failed to bridge relay pipeline for session ${sessionId}:`, err, 'WebSocketServer');

      // Clean up session and sockets
      sessionManager.destroySession(sessionId);
    }
  }

  /**
   * Periodic ping checks to active clients to avoid timeout and clean zombie connections.
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const activeSessions = sessionManager.getAllSessions();

      activeSessions.forEach((session) => {
        const wsSession = session.wsSession;
        if (!wsSession) return;

        // If client missed answering the previous heartbeat ping, prune the session
        if (!wsSession.isAlive) {
          Logger.warn(`Session ${session.id} missed heartbeat reply. Pruning.`, 'WebSocketServer');
          sessionManager.destroySession(session.id);
          return;
        }

        // Pulse next ping
        wsSession.ping();
      });
    }, GATEWAY_CONFIG.TIMEOUTS.WS_PING_INTERVAL);
  }

  /**
   * Shuts down the WS server and drops all client connections.
   */
  stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Prune all sessions
    sessionManager.destroyAll();

    if (this.wss) {
      this.wss.close(() => {
        Logger.info('WebSocket Server terminated.', 'WebSocketServer');
      });
      this.wss = null;
    }
  }
}

const webSocketServer = new WebSocketServer();
export default webSocketServer;
