/**
 * GAME CONSTANTS
 * 
 * Constantes globales para Silkroad Online v130
 * Cambiar estos valores aquí se refleja en toda la aplicación
 */

module.exports = {
    // ===== VERSIÓN DEL JUEGO =====
    GAME_VERSION: 247,  // v130 Vietnam

    // ===== LOCALES =====
    LOCALE_VIETNAM: 22,  // 0x16
    DEFAULT_LOCALE: 22,

    // ===== OPCODES PRINCIPALES =====
    OPCODE_LOGIN_REQUEST: 0x6102,
    OPCODE_LOGIN_RESPONSE: 0xA102,
    OPCODE_CHARACTER_LIST_REQUEST: 0x7007,
    OPCODE_CHARACTER_LIST_RESPONSE: 0xB007,
    OPCODE_CHARACTER_SELECT: 0x7001,
    OPCODE_CHARACTER_SELECT_RESPONSE: 0xB001,

    // ===== TIEMPOS =====
    CONNECTION_TIMEOUT: 30000,  // 30 segundos
    HANDSHAKE_TIMEOUT: 10000,   // 10 segundos

    // ===== PUERTOS Y HOSTS =====
    GATEWAY_HOST: process.env.GATEWAY_HOST || '26.74.212.246',
    GATEWAY_PORT: parseInt(process.env.GATEWAY_PORT || '15880'),
    AGENT_HOST: process.env.AGENT_HOST || '26.74.212.246',
    AGENT_PORT: parseInt(process.env.AGENT_PORT || '15882'),

    // ===== IDS DE SERVIDOR =====
    DEFAULT_SERVER_ID: 0x40,  // 64 - Vietnam
};
