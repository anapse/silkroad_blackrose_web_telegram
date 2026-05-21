import crypto from 'crypto';
import { GATEWAY_CONFIG } from '../config/gateway.config.js';
import Logger from '../utils/Logger.js';

class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Creates and registers a new session if space permits.
   * @param {string} clientIp Client IP address.
   * @returns {Object|null} The session object or null if rejected.
   */
  createSession(clientIp) {
    if (this.sessions.size >= GATEWAY_CONFIG.MAX_CLIENTS) {
      Logger.warn(`Connection rejected: Max client limit reached (${GATEWAY_CONFIG.MAX_CLIENTS})`, 'SessionManager');
      return null;
    }

    const sessionId = crypto.randomUUID();
    const session = {
      id: sessionId,
      clientIp,
      wsSession: null,
      tcpSession: null,
      relayManager: null,
      createdAt: new Date(),
      rxPackets: 0,
      txPackets: 0,
      lastOpcode: null,
      lastPacketAt: null,
      lastRxAt: null,
      lastTxAt: null,
      loginCredentials: null,
    };

    this.sessions.set(sessionId, session);
    Logger.info(`SESSION_CREATED ${sessionId} ip=${clientIp} active=${this.sessions.size}/${GATEWAY_CONFIG.MAX_CLIENTS}`, 'SessionManager');
    return session;
  }

  /**
   * Retrieves an active session by its ID.
   * @param {string} id Unique session ID.
   * @returns {Object|undefined} Session object or undefined if not found.
   */
  getSession(id) {
    return this.sessions.get(id);
  }

  /**
   * Performs absolute cleanup of a session, safely closing all associated WS/TCP sockets and destroying the relay.
   * Prevents connection/socket leaks in any edge cases.
   * @param {string} id Unique session ID.
   * @returns {boolean} True if successfully found and destroyed, false otherwise.
   */
  destroySession(id) {
    const session = this.sessions.get(id);
    if (!session) return false;

    Logger.info(`Initiating session destruction: ${id}`, 'SessionManager');
    this.sessions.delete(id);

    // 1. Destroy Relay first so no further message routing is attempted
    if (session.relayManager) {
      try {
        session.relayManager.destroy();
      } catch (err) {
        Logger.error(`Error destroying relay for session ${id}`, err, 'SessionManager');
      }
    }

    // 2. Safely close WebSocket
    if (session.wsSession) {
      try {
        session.wsSession.close();
      } catch (err) {
        Logger.error(`Error closing WS for session ${id}`, err, 'SessionManager');
      }
    }

    // 3. Safely destroy TCP socket
    if (session.tcpSession) {
      try {
        session.tcpSession.close();
      } catch (err) {
        Logger.error(`Error destroying TCP client for session ${id}`, err, 'SessionManager');
      }
    }

    session.wsSession = null;
    session.tcpSession = null;
    session.relayManager = null;
    session.clientIp = null;
    session.createdAt = null;

    Logger.success(`SESSION_DESTROYED ${id} remaining=${this.sessions.size}`, 'SessionManager');
    return true;
  }

  /**
   * Retrieves all active sessions.
   * @returns {Array} List of active session objects.
   */
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Retrieves the total count of active sessions.
   * @returns {number} Active sessions count.
   */
  getCount() {
    return this.sessions.size;
  }

  /**
   * Checks if a new connection can be accepted.
   * @returns {boolean} True if under max client capacity.
   */
  hasRoom() {
    return this.sessions.size < GATEWAY_CONFIG.MAX_CLIENTS;
  }

  /**
   * Destroys all active sessions (e.g. during server shutdown).
   */
  destroyAll() {
    Logger.warn(`Destroying all active sessions... Count: ${this.sessions.size}`, 'SessionManager');
    for (const id of this.sessions.keys()) {
      this.destroySession(id);
    }
  }
}

const sessionManager = new SessionManager();
export default sessionManager;
