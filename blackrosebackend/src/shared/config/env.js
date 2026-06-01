/**
 * ENV — Variables de Entorno Centralizadas
 * 
 * Único punto de acceso a process.env.
 * Ver .agent/REGLAS_UNIVERSALES.md sección 9.1.
 */

export const ENV = {
    // ===== SERVIDOR EXPRESS =====
    PORT: Number(process.env.PORT || 4000),

    // ===== RED SILKROAD =====
    SERVER_HOST: process.env.SERVER_HOST || 'GAME_HOST',
    GATEWAY_PORT: Number(process.env.GATEWAY_PORT || 15779),
    AGENT_PORT: Number(process.env.AGENT_PORT || 15882),
    WS_PORT: Number(process.env.WS_PORT || 100),

    // ===== TIMEOS =====
    SERVER_TIMEOUT: Number(process.env.SERVER_TIMEOUT || 30000),
    TCP_CONNECT_TIMEOUT: Number(process.env.TCP_CONNECT_TIMEOUT || 10000),

    // ===== BASE DE DATOS =====
    DB_USER: process.env.DB_USER || 'sa',
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_SERVER: process.env.DB_SERVER || 'localhost',
    DB_PORT: Number(process.env.DB_PORT || 51551),
    DB_NAME: process.env.DB_NAME || 'SRO_VT_SHARD',

    // ===== SEGURIDAD =====
    JWT_SECRET: process.env.JWT_SECRET || 'JWT_SECRET',

    // ===== ENTORNO =====
    NODE_ENV: process.env.NODE_ENV || 'development',
    DEBUG: process.env.DEBUG === 'true',
};

export default ENV;
