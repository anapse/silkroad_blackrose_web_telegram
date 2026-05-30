/**
 * GATEWAY — Configuración de Red del Gateway
 * 
 * Configuración centralizada importada desde ENV.
 */

import { ENV } from './env.js';

export const NETWORK = {
    SERVER_HOST: ENV.SERVER_HOST,
    GATEWAY_PORT: ENV.GATEWAY_PORT,
    AGENT_PORT: ENV.AGENT_PORT,
    WS_PORT: ENV.WS_PORT,
};

export const GATEWAY_CONFIG = {
    WS_HOST: '0.0.0.0',
    WS_PORT: NETWORK.WS_PORT,

    GAME_IP: NETWORK.SERVER_HOST,
    GAME_PORT: NETWORK.GATEWAY_PORT,

    AGENT_IP: NETWORK.SERVER_HOST,
    AGENT_PORT: NETWORK.AGENT_PORT,

    ENABLE_SECURITY: false,
    DEBUG: ENV.DEBUG,

    SERVER_TIMEOUT: ENV.SERVER_TIMEOUT,
    MAX_CLIENTS: 500,
    CLOUDFLARE_MODE: false,

    RECONNECT_OPTIONS: {
        ENABLED: false,
        MAX_ATTEMPTS: 3,
        DELAY_MS: 2000,
    },

    TIMEOUTS: {
        TCP_CONNECT_TIMEOUT: ENV.TCP_CONNECT_TIMEOUT,
        IDLE_TIMEOUT: 120000,
        WS_PING_INTERVAL: 30000,
    },

    PACKET_LIMITS: {
        MAX_SIZE: 65535,
        RATE_LIMIT_ENABLED: true,
        MAX_PACKETS_PER_SEC: 150,
    },
};

export default GATEWAY_CONFIG;
