/**
 * CONSTANTS — Constantes del Juego
 * 
 * Solo constantes del juego, sin configuración de red.
 */

// ===== VERSIÓN DEL JUEGO =====
export const GAME_VERSION = 247; // v130 Vietnam

// ===== LOCALES =====
export const LOCALE_VIETNAM = 22; // 0x16
export const DEFAULT_LOCALE = 22;

// ===== IDS DE SERVIDOR =====
export const DEFAULT_SERVER_ID = 0x03; // 3 - Vietnam

// ===== OPCODES PRINCIPALES =====
export const OPCODE_LOGIN_REQUEST = 0x6102;
export const OPCODE_LOGIN_RESPONSE = 0xA102;
export const OPCODE_CHARACTER_LIST_REQUEST = 0x7007;
export const OPCODE_CHARACTER_LIST_RESPONSE = 0xB007;
export const OPCODE_CHARACTER_SELECT = 0x7001;
export const OPCODE_CHARACTER_SELECT_RESPONSE = 0xB001;

// ===== SPAWN =====
export const OPCODE_SPAWN_REQUEST = 0x34B5;
export const OPCODE_SPAWN_RESPONSE = 0x34B6;
export const OPCODE_CONFIRM_SPAWN = 0x3020;
export const OPCODE_CLIENT_CONFIRM_SPAWN = 0x34C5;
export const OPCODE_SINGLE_SPAWN = 0x3015;
export const OPCODE_GROUP_SPAWN = 0x3017;
export const OPCODE_GROUP_SPAWN_END = 0x3018;
export const OPCODE_CHAR_DATA = 0x3013;
export const OPCODE_CHAR_DATA_BEGIN = 0x34A5;
export const OPCODE_CHAR_DATA_END = 0x34A6;
