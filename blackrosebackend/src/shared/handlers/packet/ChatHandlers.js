// Handlers for Chat & Misc opcodes: 0x3026, 0x059c, 0xf54e
// Extracted from PacketRouter.js
import Logger from '../../utils/Logger.js';

export function createChatHandlers(router) {
    return {
        handleChat(rawPacket, packetObj) {
            const payload = rawPacket.slice(6);
            if (payload.length < 2) return;
            try {
                const chatType = payload.readUInt8(0);
                let charname = '???';
                let message = '';
                let uniqueID = 0;
                let pos = 1;

                switch (chatType) {
                    case 0: // All (general)
                    case 3: // All (general)
                        if (payload.length >= 5) { uniqueID = payload.readUInt32LE(pos); pos += 4; }
                        // Leer nombre (string con prefijo de longitud)
                        if (pos + 2 <= payload.length) {
                            const nameLen = payload.readUInt16LE(pos); pos += 2;
                            if (nameLen > 0 && pos + nameLen <= payload.length) {
                                charname = payload.toString('utf8', pos, pos + nameLen);
                                pos += nameLen;
                            }
                        }
                        message = payload.toString('utf8', pos);
                        break;
                    case 1: // private received
                        if (payload.length >= 5) { uniqueID = payload.readUInt32LE(pos); pos += 4; }
                        message = payload.toString('utf8', pos);
                        break;
                    case 2: // private sent
                        charname = payload.toString('utf8', pos, payload.indexOf(0, pos));
                        pos = payload.indexOf(0, pos) + 1;
                        message = payload.toString('utf8', pos);
                        break;
                    case 4: // party
                        charname = payload.toString('utf8', pos, payload.indexOf(0, pos));
                        pos = payload.indexOf(0, pos) + 1;
                        message = payload.toString('utf8', pos);
                        break;
                    case 5: // guild
                        charname = payload.toString('utf8', pos, payload.indexOf(0, pos));
                        pos = payload.indexOf(0, pos) + 1;
                        message = payload.toString('utf8', pos);
                        break;
                    case 6: // global
                        charname = payload.toString('utf8', pos, payload.indexOf(0, pos));
                        pos = payload.indexOf(0, pos) + 1;
                        message = payload.toString('utf8', pos);
                        break;
                    case 7: // notice
                        message = payload.toString('utf8', pos);
                        break;
                    default:
                        message = payload.toString('utf8', pos);
                }

                if (router.session && router.session.wsSession) {
                    router.session.wsSession.sendEvent('', {
                        type: 'CHAT_MESSAGE',
                        chatType, charname, message, uniqueID,
                    });
                }
            } catch (e) {
                Logger.warn('[CHAT] Parse error: ' + e.message, 'Chat');
            }
        },

        handleUnknown059c(rawPacket, packetObj) {
            Logger.debug('[059c] Unknown opcode received, size=' + rawPacket.length, 'Chat');
        },

        handleUnknownF54e(rawPacket, packetObj) {
            Logger.debug('[f54e] Unknown opcode received, size=' + rawPacket.length, 'Chat');
        }
    };
}
