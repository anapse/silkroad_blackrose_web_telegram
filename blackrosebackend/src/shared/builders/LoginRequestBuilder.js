/**
 * LOGIN REQUEST PACKET BUILDER
 * 
 * OPCODES SILKROAD V130 (VIETNAM):
 * - 0x6102: LOGIN_REQUEST (cliente → gateway)
 * - 0x6323: CAPTCHA_REPLY (cliente → gateway)
 * - 0x7007: CHARACTER_LIST_REQUEST (cliente → agent)
 * - 0x7001: CHARACTER_SELECT (cliente → agent)
 * 
 * ESTRUCTURA DE PAQUETE SILKROAD:
 * [Size (word)] [Opcode (word)] [Payload]
 * 
 * Size = tamaño de (Opcode + Payload), en bytes
 * 
 * Basado en: https://github.com/svalencius/silkroad-bot
 */

const PacketWriter = require('../../gamegateway/packet/PacketWriter');
const { LOCALE_VIETNAM, DEFAULT_SERVER_ID } = require('../../config/gameConstants');

export class LoginRequestBuilder {

    /**
     * OPCODE DEFINITIONS (Silkroad v130)
     */
    static OPCODES = {
        LOGIN_REQUEST: 0x6102,              // Cliente → Gateway: Enviar credenciales
        CAPTCHA_REPLY: 0x6323,              // Cliente → Gateway: Respuesta a captcha
        CHARACTER_LIST_REQUEST: 0x7007,     // Cliente → Agent: Solicitar lista de personajes
        CHARACTER_SELECT: 0x7001,           // Cliente → Agent: Seleccionar personaje
    };

    /**
     * Construye un paquete de LOGIN_REQUEST (0x6102)
     * ESTRUCTURA VSRO v130 VIETNAM: [locale (byte)][username (string)][password (string - TEXTO PLANO)][serverId (word)]
     *
     * @param {string} username - Nombre de usuario
     * @param {string} password - Contraseña en TEXTO PLANO
     * @param {number} serverId - ID del servidor
     * @param {number} locale - Locale (ej: 22 para Vietnam)
     * @returns {Object} Objeto con payload (Buffer) y encrypted (boolean) - REQUIERE encriptación Blowfish
     */
    static buildLoginRequest(username, password, serverId = DEFAULT_SERVER_ID, locale = LOCALE_VIETNAM) {
        const packet = new PacketWriter();

        // PAYLOAD: locale, username, password (TEXTO PLANO), serverId
        packet.writeByte(locale);
        packet.writeString(username);
        packet.writeString(password);  // ← TEXTO PLANO
        packet.writeWord(serverId);

        return {
            payload: packet.getBytes(),
            encrypted: true  // 0x6102 REQUIERE encriptación Blowfish antes de enviar
        };
    }

    /**
     * Construye un paquete de CAPTCHA_REPLY (0x6323)
     * Se envía cuando el servidor pide un captcha (raramente usado en privados)
     * ESTRUCTURA: [respuesta (string)]
     * 
     * @returns {Buffer} Paquete COMPLETO con size, opcode, payload
     */
    static buildCaptchaReply() {
        const opcode = this.OPCODES.CAPTCHA_REPLY; // 0x6323
        const packet = new PacketWriter();
        packet.writeString("");  // Respuesta vacía
        return this._buildPacketWithOpcode(opcode, packet.getBytes());
    }

    /**
     * Construye un paquete de GAME_LOGIN (0x6103) para el Agent Server
     * Basado en xBot Agent.cs Remote_PacketHandler:
     *   protocol.WriteUInt(id);
     *   protocol.WriteAscii(username);
     *   protocol.WriteAscii(password);
     *   protocol.WriteUShort(locale);  // WORD, no byte
     *   protocol.WriteUInt(0u);        // MAC vacío
     *   protocol.WriteUShort(0);       // padding
     *
     * @param {number} token - Session ID recibido en LOGIN_RESPONSE (0xA102)
     * @param {string} username - Nombre de usuario (texto plano)
     * @param {string} password - Contraseña (texto plano, NO MD5)
     * @param {number} locale - Locale (22 para Vietnam)
     * @returns {Object} { payload, encrypted }
     */
    static buildGameLogin(token, username, password, locale = LOCALE_VIETNAM) {
        const packet = new PacketWriter();

        packet.writeDWord(Number(token || 0));
        packet.writeString(username || '');
        packet.writeString(password || '');
        packet.writeWord(locale);
        packet.writeDWord(0);   // MAC vacío
        packet.writeWord(0);    // padding

        return {
            payload: packet.getBytes(),
            encrypted: true,
        };
    }

    /**
     * Construye un paquete de CHARACTER_LIST_REQUEST (0x7007)
     * Se envía después de llegar al Agent Server para solicitar la lista de personajes
     * ESTRUCTURA: [tipo (byte)] = 2
     * 
     * @returns {Buffer} Paquete COMPLETO con size, opcode, payload
     */
    static buildCharacterListRequest() {
        const opcode = this.OPCODES.CHARACTER_LIST_REQUEST; // 0x7007
        const packet = new PacketWriter();
        packet.writeByte(2);  // Tipo: 2 = solicitar lista
        return this._buildPacketWithOpcode(opcode, packet.getBytes());
    }

    /**
     * Construye un paquete de CHARACTER_SELECT (0x7001)
     * Se envía para seleccionar un personaje específico
     * ESTRUCTURA: [nombrePersonaje (string)]
     * 
     * @param {string} characterName - Nombre del personaje a seleccionar
     * @returns {Buffer} Paquete COMPLETO con size, opcode, payload
     */
    static buildCharacterSelect(characterName) {
        const opcode = this.OPCODES.CHARACTER_SELECT; // 0x7001
        const packet = new PacketWriter();
        packet.writeString(characterName);
        return this._buildPacketWithOpcode(opcode, packet.getBytes());
    }

    /**
     * Función auxiliar: Agrega Size y Opcode a un payload
     * 
     * ESTRUCTURA SILKROAD:
     * [Size (word, LE)] [Opcode (word, LE)] [Payload]
     * 
     * Size = longitud de (Opcode + Payload) en bytes
     * 
     * @param {number} opcode - Opcode (ej: 0x6102)
     * @param {Buffer} payload - Payload sin size ni opcode
     * @returns {Buffer} Paquete COMPLETO
     */
    static _buildPacketWithOpcode(opcode, payload) {
        // Tamaño total de opcode + payload
        const size = 2 + payload.length;

        // Crear buffer final: size (2) + opcode (2) + payload
        const completo = Buffer.alloc(4 + payload.length);

        // Escribir size (word, LE)
        completo.writeUInt16LE(size, 0);

        // Escribir opcode (word, LE)
        completo.writeUInt16LE(opcode, 2);

        // Copiar payload
        payload.copy(completo, 4);

        return completo;
    }
}

export default LoginRequestBuilder;
