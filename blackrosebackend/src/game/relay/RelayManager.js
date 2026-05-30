import Logger from '../../shared/utils/Logger.js';
import sessionManager from '../sessions/SessionManager.js';

class RelayManager {
  /**
   * Bridges WebSocket <-> TCP data routing for a specific player session.
   * @param {string} sessionId Unique session ID.
   */
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.isActive = true;
  }

  /**
   * Routes binary messages received from the browser/WebSocket to the Silkroad TCP GameServer.
   * @param {Buffer|Object} data Binary packet or packet object.
   */
  handleWsData(data) {
    if (!this.isActive) return;

    const session = sessionManager.getSession(this.sessionId);
    if (session && session.tcpSession) {
      if (data && data.type === 'PACKET') {
        session.tcpSession.sendPacket(data);
      } else {
        session.tcpSession.send(data);
      }
    } else {
      Logger.warn(`WebSocket packet received but TCP session is missing for ${this.sessionId}`, 'RelayManager');
    }
  }

  /**
   * Routes binary messages received from the Silkroad TCP GameServer to the browser/WebSocket.
   * @param {Buffer|Object} data Binary packet or packet object.
   */
  handleTcpData(data) {
    if (!this.isActive) return;

    const session = sessionManager.getSession(this.sessionId);
    if (session && session.wsSession) {
      if (data && data.type === 'PACKET') {
        session.wsSession.sendPacket(data);
      } else {
        session.wsSession.send(data);
      }
    } else {
      Logger.warn(`TCP packet received but WebSocket session is missing for ${this.sessionId}`, 'RelayManager');
    }
  }

  /**
   * Disables the relay, halting all message forwarding.
   */
  destroy() {
    this.isActive = false;
    Logger.debug(`RelayManager stopped for session ${this.sessionId}`, 'RelayManager');
  }
}

export default RelayManager;
