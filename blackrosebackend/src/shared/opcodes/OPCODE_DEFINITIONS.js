/**
 * SILKROAD ONLINE v130 - OPCODE PACKET DEFINITIONS
 * 
 * PROTOCOLO CORRECTO PARA SILKROAD v130 VIETNAM:
 * 
 * OPCODES DE LOGIN:
 * - 0x6102: LOGIN_REQUEST (cliente → gateway)
 * - 0xa102: LOGIN_RESPONSE (gateway → cliente)
 * 
 * OPCODES DE PERSONAJES:
 * - 0x7007: CHARACTER_LIST_REQUEST (cliente → agent)
 * - 0xb007: CHARACTER_LIST (agent → cliente)
 * - 0x7001: CHARACTER_SELECT (cliente → agent)
 * - 0xb001: CHARACTER_SELECT_CONFIRM (agent → cliente)
 * 
 * HANDSHAKE:
 * - 0x5000: HANDSHAKE_INIT (server → client)
 * - 0x9000: HANDSHAKE_RESPONSE (client → server)
 * - 0x2001: AGENT_IDENTIFY (agent → client)
 * 
 * Basado en:
 * - https://github.com/svalencius/silkroad-bot
 * - https://github.com/leolongvu/SilkroadLeoBot
 */

const PacketReader = require('../../gamegateway/packet/PacketReader');

export const OPCODES = {
    // ============================================================================
    // LOGIN FLOW OPCODES
    // ============================================================================

    /**
     * 0xA100 - PATCH_RESPONSE
     * Respuesta del servidor al PATCH_REQUEST (0x6100)
     * Basado en xBot Gateway.cs Remote_PacketHandler:
     *   case Opcode.SERVER_PATCH_RESPONSE:
     *       switch (packet.ReadByte()) {
     *           case 1: → version ok
     *           case 2: → version error
     */
    PATCH_RESPONSE: {
        opcode: 0xa100,
        name: 'PATCH_RESPONSE',
        parse: (reader) => {
            const result = reader.readByte();
            return {
                result,
                success: result === 1,
            };
        },
    },

    /**
     * 0xA102 - LOGIN_RESPONSE
     * Respuesta del servidor a un intento de login
     * 
     * Estructura (formato xBot confirmado):
     * - result (byte): 1 = éxito, 0 = error
     * 
     * Si result == 1:
     * - token (dword): Token/ID de sesión
     * - host (string): IP del Agent/Game Server
     * - port (word): Puerto del Agent/Game Server
     * 
     * Si result == 0 (error):
     * - subcode (byte): Código de error específico
     */
    LOGIN_RESPONSE: {
        opcode: 0xa102,
        name: 'LOGIN_RESPONSE',
        parse: (reader) => {
            const result = reader.readByte();

            if (result === 1) {
                // Login exitoso (formato xBot): result(1) + token(4) + agentIP(string) + agentPort(word)
                const token = reader.readDWord();
                const agentIP = reader.readString(true);
                const agentPort = reader.readWord();

                return {
                    success: true,
                    result: 1,
                    agentIP,
                    agentPort,
                    token,
                };
            }

            // Login fallido — códigos basados en RSBot GatewayLoginResponse.cs
            const subcode = reader.readByte();
            let errorMessage = '';

            switch (subcode) {
                case 1:
                    errorMessage = 'Wrong username/password';
                    break;
                case 2:
                    errorMessage = 'Account banned';
                    break;
                case 3:
                    errorMessage = 'User already connected';
                    break;
                case 4:
                    errorMessage = 'Server check (maintenance?)';
                    break;
                case 5:
                    errorMessage = 'Server full';
                    break;
                case 6:
                    errorMessage = 'Server blocked';
                    break;
                case 7:
                    errorMessage = 'Connection refused';
                    break;
                case 8:
                    errorMessage = 'Server overloaded';
                    break;
                case 9:
                    errorMessage = 'Connection failed';
                    break;
                case 10:
                    errorMessage = 'Not accessible';
                    break;
                case 11:
                    errorMessage = 'Server under maintenance';
                    break;
                case 12:
                    errorMessage = 'Server closed';
                    break;
                case 13:
                    errorMessage = 'Server delayed';
                    break;
                case 14:
                    errorMessage = 'Server busy';
                    break;
                case 15:
                    errorMessage = 'API server error';
                    break;
                case 16:
                    errorMessage = 'Server address error';
                    break;
                case 17:
                    errorMessage = 'Server not available';
                    break;
                case 18:
                    errorMessage = 'Server not accessible';
                    break;
                case 19:
                    errorMessage = 'Server connection failed';
                    break;
                case 20:
                    errorMessage = 'Server connection closed';
                    break;
                case 21:
                    errorMessage = 'Login attempt limit exceeded';
                    break;
                case 22:
                    errorMessage = 'Payment required';
                    break;
                case 23:
                    errorMessage = 'Server error';
                    break;
                case 24:
                    errorMessage = 'Country not allowed';
                    break;
                case 25:
                    errorMessage = 'Age limit';
                    break;
                case 26:
                    errorMessage = 'Queue (waiting list)';
                    break;
                case 27:
                    errorMessage = 'Server full (2)';
                    break;
                case 28:
                    errorMessage = 'ISRO block';
                    break;
                case 29:
                    errorMessage = 'KSRO block';
                    break;
                case 30:
                    errorMessage = 'Server connection lost';
                    break;
                case 31:
                    errorMessage = 'Unknown block';
                    break;
                case 32:
                    errorMessage = 'Invalid connection';
                    break;
                case 33:
                    errorMessage = 'Too many connections';
                    break;
                case 34:
                    errorMessage = 'Already connected';
                    break;
                case 35:
                    errorMessage = 'Payment expired';
                    break;
                case 36:
                    errorMessage = 'Underage';
                    break;
                case 37:
                    errorMessage = 'Reserved';
                    break;
                case 38:
                    errorMessage = 'Server full (3)';
                    break;
                case 39:
                    errorMessage = 'Wrong ID or password';
                    break;
                case 40:
                    errorMessage = 'Name change required';
                    break;
                case 41:
                    errorMessage = 'Login cancelled';
                    break;
                case 42:
                    errorMessage = 'No servers available';
                    break;
                case 43:
                    errorMessage = 'Too many attempts';
                    break;
                case 44:
                    errorMessage = 'Blocked account';
                    break;
                case 45:
                    errorMessage = 'Blocked reason';
                    break;
                case 46:
                    errorMessage = 'Temporarily blocked';
                    break;
                default:
                    errorMessage = `Unknown error (code: ${subcode})`;
            }

            return {
                success: false,
                result: 0,
                subcode,
                errorMessage,
            };
        },
    },

    /**
     * 0xB007 - CHARACTER_LIST
     * Lista de personajes disponibles para la cuenta
     * 
     * Estructura:
     * - type (byte): 2 para lista de personajes
     * - success (byte): 1 si hay personajes
     * - charCount (byte): Número de personajes
     * 
     * Para cada personaje:
     * - model (dword): RefObjID del personaje (determina clase/género)
     * - name (string): Nombre del personaje
     * - volume (byte): Altura visual
     * - level (byte): Nivel actual
     * - exp (qword): Experiencia actual
     * - str (word): Fuerza
     * - int (word): Inteligencia
     * - statPoints (word): Puntos de stats disponibles
     * - hp (dword): HP máximo
     * - mp (dword): MP máximo
     * - deleted (byte): 1 si está marcado para eliminar
     * - items (byte[]): Items equipados (variable)
     * - avatars (byte[]): Avatares equipados (variable)
     */
    CHARACTER_LIST: {
        opcode: 0xb007,
        name: 'CHARACTER_LIST',
        parse: (reader) => {
            const type = reader.readByte();

            if (type !== 2) {
                // Algunos servidores usan type=0 o type=1
                if (type === 0 || type === 1) {
                    // Posiblemente sin type byte, reintentar
                    // reader.pointer -= 1; // No se puede retroceder fácilmente
                }
                return {
                    success: false,
                    error: 'Invalid character list type: ' + type,
                };
            }

            const success = reader.readByte();
            if (success !== 1) {
                return {
                    success: false,
                    charCount: 0,
                    characters: [],
                };
            }

            const charCount = reader.readByte();
            const characters = [];

            for (let i = 0; i < charCount; i++) {
                try {
                    const character = {
                        index: i,
                        refObjId: reader.readDWord(),
                        name: reader.readString(true),
                        volume: reader.readByte(),
                        level: reader.readByte(),
                        exp: reader.readQWord(),
                        str: reader.readWord(),
                        int: reader.readWord(),
                        statPoints: reader.readWord(),
                        hp: reader.readDWord(),
                        mp: reader.readDWord(),
                        deleted: reader.readByte() === 1,
                        deletionTime: null,
                    };

                    // Si está marcado para eliminar, leer fecha de eliminación
                    if (character.deleted) {
                        character.deletionTime = reader.readDWord();
                    }

                    characters.push(character);
                } catch (err) {
                    // Silencioso — PacketRouter maneja el parseo con scanner
                }
            }

            return {
                success: true,
                charCount,
                characters,
            };
        },
    },

    /**
     * 0xB001 - CHARACTER_SELECT
     * Confirmación de selección de personaje
     * 
     * Estructura:
     * - code (byte): 1 = éxito
     */
    CHARACTER_SELECT: {
        opcode: 0xb001,
        name: 'CHARACTER_SELECT',
        parse: (reader) => {
            const code = reader.readByte();

            return {
                success: code === 1,
                code,
            };
        },
    },

    /**
     * 0xA103 - GAME_LOGIN_REPLY
     * Respuesta a GAME_LOGIN enviado al Agent Server
     * Basado en RSBot AgentLoginResponse.cs:
     *   flag=1 → éxito
     *   flag=0 → error con subcode:
     *     1=C9, 2=C10, 3=C10, 4=ServerFull, 5=IpLimit
     */
    GAME_LOGIN_REPLY: {
        opcode: 0xa103,
        name: 'GAME_LOGIN_REPLY',
        parse: (reader) => {
            const code = reader.readByte();
            if (code === 1) {
                return {
                    success: true,
                    code: 1,
                };
            }

            const subcode = reader.readByte();
            let errorMessage = '';
            switch (subcode) {
                case 1:
                    errorMessage = 'C9 - Connection error';
                    break;
                case 2:
                    errorMessage = 'C10 - Connection error';
                    break;
                case 3:
                    errorMessage = 'C10 - Connection error';
                    break;
                case 4:
                    errorMessage = 'Server full';
                    break;
                case 5:
                    errorMessage = 'IP limit reached';
                    break;
                default:
                    errorMessage = `Unknown agent error (code: ${subcode})`;
            }
            return {
                success: false,
                code: 0,
                subcode,
                errorMessage,
            };
        },
    },

    /**
     * 0x2001 - AGENT_IDENTIFY
     * Identidad del cliente hacia el servidor (parte del handshake)
     * Se envía: "SR_Client" como string
     */
    AGENT_IDENTIFY: {
        opcode: 0x2001,
        name: 'AGENT_IDENTIFY',
        parse: (reader) => {
            return {
                clientIdentity: reader.readString(true),
                flag: reader.readByte(),
            };
        },
    },

    /**
     * 0x5000 - HANDSHAKE
     * Inicia el handshake de seguridad (Diffie-Hellman)
     */
    HANDSHAKE: {
        opcode: 0x5000,
        name: 'HANDSHAKE',
        parse: (reader) => {
            return {
                flag: reader.readByte(),
                data: reader.rawBuffer().slice(reader.pointer),
            };
        },
    },

    /**
     * 0x9000 - HANDSHAKE_ACK
     * Acknowledge del handshake
     */
    HANDSHAKE_ACK: {
        opcode: 0x9000,
        name: 'HANDSHAKE_ACK',
        parse: (reader) => {
            return {
                acknowledged: true,
            };
        },
    },
};

/**
 * Encuentra la definición de un opcode por su valor hexadecimal
 * 
 * @param {string} opcodeHex - Opcode en formato hex (ej: "0xa102")
 * @returns {Object|null} Definición del opcode o null si no existe
 */
export function getOpcodeDefinition(opcodeHex) {
    return Object.values(OPCODES).find(
        (op) => `0x${op.opcode.toString(16).padStart(4, '0')}` === opcodeHex.toLowerCase()
    );
}

/**
 * Parsea un opcode si existe una definición para él
 * 
 * @param {Buffer} buffer - Buffer del paquete completo
 * @param {string} opcodeHex - Opcode en formato hex
 * @returns {Object|null} Datos parseados o null
 */
export function parseOpcode(buffer, opcodeHex) {
    const definition = getOpcodeDefinition(opcodeHex);
    if (!definition || !definition.parse) {
        return null;
    }

    try {
        const reader = new PacketReader(buffer);
        return definition.parse(reader);
    } catch (err) {
        console.error(`Error parsing opcode ${opcodeHex}:`, err);
        return null;
    }
}

export default { OPCODES, getOpcodeDefinition, parseOpcode };
