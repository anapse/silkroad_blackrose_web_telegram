import webSocketServer from './network/ws/WebSocketServer.js';
import Logger from '../shared/utils/Logger.js';

/**
 * Starts the Silkroad WebSocket <-> TCP Relay Gateway.
 * Can be called with or without an existing HTTP server instance.
 * @param {http.Server} [server] Optional existing Express HTTP server instance.
 */
export function startGateway(server = null) {
  Logger.info('Bootstrapping Silkroad WebSocket-TCP Relay Gateway...', 'GatewayIndex');

  try {
    webSocketServer.start(server);
    Logger.success('Silkroad WebSocket-TCP Relay Gateway boot sequence finished!', 'GatewayIndex');
  } catch (err) {
    Logger.error('Critical failure during Gateway startup sequence:', err, 'GatewayIndex');
  }
}
