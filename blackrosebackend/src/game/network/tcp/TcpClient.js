import net from 'net';
import Logger from '../../../shared/utils/Logger.js';
import { GATEWAY_CONFIG } from '../../../shared/config/gateway.js';

class TcpClient {
  /**
   * Direct wrapper for Net.Socket to talk with Silkroad GameServer.
   * @param {string} sessionId Unique ID for session tracking.
   * @param {string} host GameServer IP address.
   * @param {number} port GameServer Port.
   */
  constructor(sessionId, host, port) {
    this.sessionId = sessionId;
    this.host = host;
    this.port = port;
    this.socket = null;
    this.isConnected = false;

    // Callbacks to communicate with the TcpSession/RelayManager layers
    this.onDataCallback = null;
    this.onCloseCallback = null;
    this.onErrorCallback = null;
    this.connectionTimeout = null;
    this.pendingConnectReject = null;
    this.isDestroyed = false;
  }

  /**
   * Establishes a TCP connection to the Silkroad GameServer.
   * @returns {Promise<void>} Resolves when connected, rejects on timeout or failure.
   */
  connect() {
    return new Promise((resolve, reject) => {
      Logger.info(`TCP attempting connection to Silkroad GameServer at ${this.host}:${this.port}...`, 'TcpClient');

      this.isDestroyed = false;
      this.pendingConnectReject = reject;
      this.socket = new net.Socket();
      let isSettled = false;

      // Timeout safety mechanism
      this.connectionTimeout = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          Logger.error(`TCP connection attempt timed out after ${GATEWAY_CONFIG.TIMEOUTS.TCP_CONNECT_TIMEOUT}ms`, null, 'TcpClient');
          this.pendingConnectReject = null;
          this.destroy();
          reject(new Error(`Timeout connecting to Silkroad GameServer at ${this.host}:${this.port}`));
        }
      }, GATEWAY_CONFIG.TIMEOUTS.TCP_CONNECT_TIMEOUT);

      this.socket.connect(this.port, this.host, () => {
        if (isSettled || this.isDestroyed) return;
        isSettled = true;
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
        this.pendingConnectReject = null;

        this.isConnected = true;
        Logger.success(`TCP connection established with Silkroad GameServer (${this.host}:${this.port})`, 'TcpClient');
        resolve();
      });

      this.socket.on('data', (data) => {
        if (this.onDataCallback) {
          this.onDataCallback(data);
        }
      });

      this.socket.on('close', (hadError) => {
        this.isConnected = false;
        Logger.info(`TCP socket closed for session ${this.sessionId}. Had error: ${hadError}`, 'TcpClient');
        if (this.onCloseCallback) {
          this.onCloseCallback(hadError);
        }
      });

      this.socket.on('error', (err) => {
        Logger.error(`TCP socket error for session ${this.sessionId}`, err, 'TcpClient');
        if (this.onErrorCallback) {
          this.onErrorCallback(err);
        }

        if (!isSettled) {
          isSettled = true;
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
          this.pendingConnectReject = null;
          reject(err);
        }
      });
    });
  }

  /**
   * Transmits raw binary buffer directly down the TCP socket.
   * @param {Buffer} data Binary packet payload.
   */
  send(data) {
    if (!this.isConnected || !this.socket) {
      Logger.warn(`TCP not connected in session ${this.sessionId}. Packet dropped.`, 'TcpClient');
      return;
    }

    this.socket.write(data, (err) => {
      if (err) {
        Logger.error(`TCP transmission error in session ${this.sessionId}`, err, 'TcpClient');
      }
    });
  }

  /**
   * Cleanly destroys the socket.
   */
  destroy() {
    this.isDestroyed = true;
    this.isConnected = false;
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.pendingConnectReject) {
      const reject = this.pendingConnectReject;
      this.pendingConnectReject = null;
      reject(new Error(`TCP connection cancelled for session ${this.sessionId}`));
    }

    if (this.socket) {
      try {
        // Eliminar callbacks ANTES de destruir para evitar que onCloseCallback
        // dispare sessionManager.destroySession() en un cierre intencional
        const closeCb = this.onCloseCallback;
        this.onDataCallback = null;
        this.onCloseCallback = null;
        this.onErrorCallback = null;
        this.socket.removeAllListeners('data');
        this.socket.removeAllListeners('close');
        this.socket.removeAllListeners('error');
        this.socket.destroy();
      } catch (err) {
        // Suppress double destroy errors
      }
      this.socket = null;
    }

    this.onDataCallback = null;
    this.onCloseCallback = null;
    this.onErrorCallback = null;
  }
}

export default TcpClient;
