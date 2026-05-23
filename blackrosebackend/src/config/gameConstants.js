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

    // ===== SPAWN =====
    OPCODE_SPAWN_REQUEST: 0x34B5,        // Servidor pregunta si listo para spawn
    OPCODE_SPAWN_RESPONSE: 0x34B6,       // Cliente responde que sí
    OPCODE_CONFIRM_SPAWN: 0x3020,        // Servidor confirma spawn (posición)
    OPCODE_CLIENT_CONFIRM_SPAWN: 0x34C5, // Cliente confirma spawn (¡necesario!)
    OPCODE_SINGLE_SPAWN: 0x3015,         // Spawn de entidad individual
    OPCODE_GROUP_SPAWN: 0x3017,          // Group spawn begin
    OPCODE_GROUP_SPAWN_END: 0x3018,      // Group spawn end
    OPCODE_CHAR_DATA: 0x3013,            // Character data
    OPCODE_CHAR_DATA_BEGIN: 0x34A5,      // Character data begin
    OPCODE_CHAR_DATA_END: 0x34A6,        // Character data end

    // ===== TIEMPOS =====
    CONNECTION_TIMEOUT: 30000,  // 30 segundos
    HANDSHAKE_TIMEOUT: 10000,   // 10 segundos

    // ===== PUERTOS Y HOSTS =====
    GATEWAY_HOST: process.env.GATEWAY_HOST || '26.74.212.246',
    GATEWAY_PORT: parseInt(process.env.GATEWAY_PORT || '15779'),
    AGENT_HOST: process.env.AGENT_HOST || '26.74.212.246',
    AGENT_PORT: parseInt(process.env.AGENT_PORT || '15882'),

    // ===== IDS DE SERVIDOR =====
    DEFAULT_SERVER_ID: 0x03,  // 3 - Vietnam
};
