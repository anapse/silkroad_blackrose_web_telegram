/**
 * LOGIN HANDLER
 * 
 * Procesa el flujo completo de login:
 * 1. Recibe LOGIN_RESPONSE (0xa102)
 * 2. Procesa CHARACTER_LIST (0xb007)
 * 3. Gestiona CHARACTER_SELECT (0xb001)
 * 
 * Basado en: https://github.com/svalencius/silkroad-bot
 */

import Logger from '../utils/Logger.js';
import { parseOpcode, OPCODES } from '../opcodes/OPCODE_DEFINITIONS.js';
import { LoginRequestBuilder } from '../builders/LoginRequestBuilder.js';

export class LoginHandler {
    constructor() {
        this.currentSessionId = null;
        this.agentHost = null;
        this.agentPort = null;
        this.characterList = [];
        this.selectedCharacter = null;
        this.loginAttempts = 0;
        this.maxLoginAttempts = 3;
    }

    /**
     * Procesa LOGIN_RESPONSE (0xa102)
     * 
     * Si es exitoso, contiene la información del Agent/Game Server
     * Si falla, contiene un código de error
     * 
     * @param {Object} packet - Paquete parseado
     * @returns {Object} Resultado del procesamiento
     */
    processLoginResponse(packet) {
        Logger.info(`[LOGIN] Processing LOGIN_RESPONSE`, 'LoginHandler');

        if (!packet.opcode || packet.opcode !== '0xa102') {
            Logger.error(`Invalid opcode for LOGIN_RESPONSE: ${packet.opcode}`, null, 'LoginHandler');
            return { success: false, error: 'Invalid opcode' };
        }

        const parsed = parseOpcode(packet.payload, packet.opcode);

        if (!parsed) {
            Logger.error(`Failed to parse LOGIN_RESPONSE`, null, 'LoginHandler');
            return { success: false, error: 'Parse failed' };
        }

        if (!parsed.success) {
            Logger.error(
                `LOGIN FAILED: ${parsed.errorMessage} (code: ${parsed.code}, subcode: ${parsed.subcode})`,
                null,
                'LoginHandler'
            );
            return {
                success: false,
                error: parsed.errorMessage,
                code: parsed.code,
                subcode: parsed.subcode,
            };
        }

        // Login exitoso (se recibe agentIP, agentPort y token)
        this.agentHost = parsed.agentIP;
        this.agentPort = parsed.agentPort;
        this.currentSessionId = parsed.token; // almacenar token como id interno

        Logger.success(
            `LOGIN SUCCESSFUL! Token=${parsed.token}, Redirecting to ${parsed.agentIP}:${parsed.agentPort}`,
            'LoginHandler'
        );

        return {
            success: true,
            agentHost: parsed.agentIP,
            agentPort: parsed.agentPort,
            token: parsed.token,
        };
    }

    /**
     * Procesa CHARACTER_LIST (0xb007)
     * 
     * Contiene la lista de personajes disponibles para la cuenta
     * 
     * @param {Object} packet - Paquete parseado
     * @returns {Object} Resultado del procesamiento
     */
    processCharacterList(packet) {
        Logger.info(`[LOGIN] Processing CHARACTER_LIST`, 'LoginHandler');

        if (!packet.opcode || packet.opcode !== '0xb007') {
            Logger.error(`Invalid opcode for CHARACTER_LIST: ${packet.opcode}`, null, 'LoginHandler');
            return { success: false, error: 'Invalid opcode' };
        }

        const parsed = parseOpcode(packet.payload, packet.opcode);

        if (!parsed || !parsed.success) {
            Logger.error(`Failed to parse CHARACTER_LIST`, null, 'LoginHandler');
            return { success: false, error: 'Parse failed' };
        }

        this.characterList = parsed.characters;

        Logger.info(
            `Received ${parsed.charCount} character(s):`,
            'LoginHandler'
        );

        parsed.characters.forEach((char, idx) => {
            const status = char.deleted ? '❌ DELETED' : `LV ${char.level}`;
            Logger.info(`  [${idx}] ${char.name} - ${status}`, 'LoginHandler');
        });

        return {
            success: true,
            charCount: parsed.charCount,
            characters: parsed.characters,
        };
    }

    /**
     * Selecciona automáticamente el primer personaje disponible (no eliminado)
     * 
     * @returns {Object} Personaje seleccionado o error
     */
    selectFirstAvailableCharacter() {
        const available = this.characterList.filter((char) => !char.deleted);

        if (available.length === 0) {
            Logger.error(`No available characters to select`, null, 'LoginHandler');
            return { success: false, error: 'No available characters' };
        }

        const selectedChar = available[0];
        this.selectedCharacter = selectedChar;

        Logger.info(
            `Auto-selected character: ${selectedChar.name} (Level ${selectedChar.level})`,
            'LoginHandler'
        );

        return {
            success: true,
            character: selectedChar,
            packet: LoginRequestBuilder.buildCharacterSelect(selectedChar.name),
        };
    }

    /**
     * Selecciona un personaje específico por nombre
     * 
     * @param {string} characterName - Nombre del personaje a seleccionar
     * @returns {Object} Resultado de la selección
     */
    selectCharacterByName(characterName) {
        const character = this.characterList.find((char) =>
            char.name.toLowerCase() === characterName.toLowerCase() && !char.deleted
        );

        if (!character) {
            Logger.error(
                `Character "${characterName}" not found or is deleted`,
                null,
                'LoginHandler'
            );
            return { success: false, error: 'Character not found' };
        }

        this.selectedCharacter = character;

        Logger.info(
            `Selected character: ${character.name} (Level ${character.level})`,
            'LoginHandler'
        );

        return {
            success: true,
            character,
            packet: LoginRequestBuilder.buildCharacterSelect(character.name),
        };
    }

    /**
     * Procesa CHARACTER_SELECT (0xb001)
     * Confirmación de que el personaje fue seleccionado correctamente
     * 
     * @param {Object} packet - Paquete parseado
     * @returns {Object} Resultado del procesamiento
     */
    processCharacterSelect(packet) {
        Logger.info(`[LOGIN] Processing CHARACTER_SELECT confirmation`, 'LoginHandler');

        if (!packet.opcode || packet.opcode !== '0xb001') {
            Logger.error(`Invalid opcode for CHARACTER_SELECT: ${packet.opcode}`, null, 'LoginHandler');
            return { success: false, error: 'Invalid opcode' };
        }

        const parsed = parseOpcode(packet.payload, packet.opcode);

        if (!parsed || !parsed.success) {
            Logger.error(`Character selection failed`, null, 'LoginHandler');
            return { success: false, error: 'Selection failed' };
        }

        Logger.success(
            `Character "${this.selectedCharacter.name}" selected successfully!`,
            'LoginHandler'
        );

        return {
            success: true,
            selectedCharacter: this.selectedCharacter,
        };
    }

    /**
     * Construye el paquete de LOGIN_REQUEST (0x6102)
     * 
     * @param {string} username - Usuario
     * @param {string} password - Contraseña
     * @param {number} serverId - ID del servidor
     * @param {number} locale - Locale (por defecto 130 para Vietnam)
     * @returns {Buffer} Paquete listo para enviar
     */
    static buildLoginRequest(username, password, serverId, locale = 130) {
        return LoginRequestBuilder.buildLoginRequest(username, password, serverId, locale);
    }

    /**
     * Construye el paquete de CAPTCHA_REPLY (0x6323) vacío
     * 
     * @returns {Buffer} Paquete listo para enviar
     */
    static buildCaptchaReply() {
        return LoginRequestBuilder.buildCaptchaReply();
    }

    /**
     * Construye el paquete de GAME_LOGIN (0x6103)
     * 
     * @param {number} sessionId - Session ID recibido en LOGIN_RESPONSE
     * @returns {Buffer} Paquete listo para enviar
     */
    static buildGameLogin(sessionId) {
        return LoginRequestBuilder.buildGameLogin(sessionId);
    }

    /**
     * Construye el paquete de CHARACTER_LIST_REQUEST (0x7007)
     * 
     * @returns {Buffer} Paquete listo para enviar
     */
    static buildCharacterListRequest() {
        return LoginRequestBuilder.buildCharacterListRequest();
    }

    /**
     * Estado actual del login
     */
    getStatus() {
        return {
            sessionId: this.currentSessionId,
            agentHost: this.agentHost,
            agentPort: this.agentPort,
            characterCount: this.characterList.length,
            characters: this.characterList,
            selectedCharacter: this.selectedCharacter,
        };
    }
}

export default LoginHandler;
