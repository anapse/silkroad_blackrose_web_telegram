/**
 * WEBSOCKET LOGIN HANDLER
 * 
 * Procesa mensajes de LOGIN desde el cliente web y construye los paquetes
 * necesarios para enviar al servidor de juego.
 * 
 * Flow:
 * 1. Cliente envía: { type: "LOGIN", username, password, serverId, locale }
 * 2. Backend crea paquete y lo envía al Game Server
 * 3. Game Server responde con LOGIN_RESPONSE
 * 4. Backend procesa y envía al cliente
 */

import Logger from '../gamegateway/utils/Logger.js';
import sessionManager from '../gamegateway/sessions/SessionManager.js';
import { GAME_VERSION, LOCALE_VIETNAM, DEFAULT_SERVER_ID } from '../config/gameConstants.js';
import { LoginRequestBuilder } from './builders/LoginRequestBuilder.js';

export function handleLoginMessage(message, sessionId, tcpSession) {
    if (message.type !== 'LOGIN') {
        Logger.warn(
            `Received non-LOGIN message type: ${message.type}`,
            'WebSocketLoginHandler'
        );
        return;
    }

    const username = message.username || '';
    const password = message.password || '';
    const serverId = message.serverId || DEFAULT_SERVER_ID;
    const locale = typeof message.locale === 'number' ? message.locale : LOCALE_VIETNAM;
    const clientVersion = typeof message.clientVersion === 'number' ? message.clientVersion : GAME_VERSION;

    if (!username || !password) {
        Logger.warn(
            `Login attempt without credentials from ${sessionId}`,
            'WebSocketLoginHandler'
        );
        return;
    }

    Logger.info(
        `[LOGIN] Attempt: username=${username}, serverId=${serverId}`,
        'WebSocketLoginHandler'
    );

    const session = sessionManager.getSession(sessionId);
    if (!session) {
        Logger.error(
            `Cannot store login credentials: session ${sessionId} not found`,
            null,
            'WebSocketLoginHandler'
        );
        return;
    }

    session.loginCredentials = { username, password, serverId, locale, clientVersion };
    Logger.debug(`Stored login credentials for session ${sessionId}`, 'WebSocketLoginHandler');

    // Si el shard list ya se recibió, enviar login inmediatamente
    if (tcpSession && tcpSession.packetRouter) {
        if (tcpSession.packetRouter.shardListReceived) {
            Logger.info('WebSocketLoginHandler: shardListReceived=true, sending login immediately', 'WebSocketLoginHandler');
            tcpSession.packetRouter.sendAutoLogin();
            if (session.wsSession) {
                session.wsSession.sendStatus('LOGIN_SENT');
            }
        } else if (tcpSession.handshakeComplete) {
            Logger.info('WebSocketLoginHandler: handshake complete, login will be sent on shard list', 'WebSocketLoginHandler');
            if (session.wsSession) {
                session.wsSession.sendStatus('LOGIN_PENDING_SHARD_LIST');
            }
        } else {
            if (session.wsSession) {
                session.wsSession.sendStatus('LOGIN_PENDING_HANDSHAKE');
            }
        }
    }
}

/**
 * Maneja selección de personaje desde el cliente
 */
export function handleCharacterSelectMessage(message, sessionId, tcpSession) {
    if (message.type !== 'CHARACTER_SELECT') {
        return;
    }

    // Evitar envíos duplicados: si ya se seleccionó personaje, ignorar
    if (tcpSession && tcpSession._characterSelected) {
        Logger.warn(
            `[CHARACTER_SELECT] Ignored duplicate selection for ${sessionId}`,
            'WebSocketLoginHandler'
        );
        return;
    }

    const characterName = message.characterName || '';

    if (!characterName) {
        Logger.warn(
            `Character select without name from ${sessionId}`,
            'WebSocketLoginHandler'
        );
        return;
    }

    Logger.info(
        `[CHARACTER_SELECT] Selecting: ${characterName}`,
        'WebSocketLoginHandler'
    );

    try {
        // Marcar que ya se seleccionó personaje
        tcpSession._characterSelected = true;

        // Construir paquete de CHARACTER_SELECT usando formatPacket (mismo método que PacketRouter)
        const PacketWriter = require('../gamegateway/packet/PacketWriter');
        const p = new PacketWriter();
        p.writeString(characterName);
        const encPacket = tcpSession.security.formatPacket(0x7001, p.getBytes(), false);

        if (tcpSession && tcpSession.send) {
            tcpSession.send(encPacket);
            Logger.debug(
                `[CHARACTER_SELECT] Packet sent (${encPacket.length} bytes)`,
                'WebSocketLoginHandler'
            );
        } else {
            Logger.error(
                `Cannot send character select packet: TCP session not ready`,
                null,
                'WebSocketLoginHandler'
            );
        }
    } catch (err) {
        Logger.error(
            `Error building character select packet`,
            err,
            'WebSocketLoginHandler'
        );
    }
}

/**
 * Maneja solicitud de lista de personajes
 */
export function handleCharacterListRequestMessage(message, sessionId, tcpSession) {
    if (message.type !== 'REQUEST_CHARACTER_LIST') {
        return;
    }

    Logger.info(
        `[REQUEST_CHARACTER_LIST] From ${sessionId}`,
        'WebSocketLoginHandler'
    );

    try {
        // Construir paquete de solicitud (0x7007)
        const requestPacket = LoginHandler.buildCharacterListRequest();

        if (tcpSession && tcpSession.send) {
            tcpSession.send(requestPacket);
            Logger.debug(
                `[REQUEST_CHARACTER_LIST] Packet sent (${requestPacket.length} bytes)`,
                'WebSocketLoginHandler'
            );
        } else {
            Logger.error(
                `Cannot send character list request: TCP session not ready`,
                null,
                'WebSocketLoginHandler'
            );
        }
    } catch (err) {
        Logger.error(
            `Error building character list request packet`,
            err,
            'WebSocketLoginHandler'
        );
    }
}

/**
 * Maneja desconexión de personaje (0x7005) — vuelve a la pantalla de selección
 */
export function handleDisconnectCharacterMessage(message, sessionId, tcpSession) {
    if (message.type !== 'DISCONNECT_CHARACTER') {
        return;
    }

    Logger.info(
        `[DISCONNECT_CHARACTER] Disconnecting from game world for ${sessionId}`,
        'WebSocketLoginHandler'
    );

    try {
        // 0x7005 con byte 0x01 = volver a selección de personaje
        const PacketWriter = require('../gamegateway/packet/PacketWriter');
        const p = new PacketWriter();
        p.writeByte(0x01);
        const encPacket = tcpSession.security.formatPacket(0x7005, p.getBytes(), false);

        if (tcpSession && tcpSession.send) {
            tcpSession.send(encPacket);
            // Resetear estado para permitir nueva selección
            tcpSession._characterSelected = false;
            if (tcpSession.packetRouter) {
                tcpSession.packetRouter._characterSelected = false;
                tcpSession.packetRouter._pendingPlayerInfo = null;
            }
            const session = sessionManager.getSession(sessionId);
            if (session && session.wsSession) {
                session.wsSession.sendEvent('↩ Personaje desconectado — selecciona otro');
                session.wsSession.sendStatus('CHARACTER_DISCONNECTED');
            }
            Logger.info(
                `[DISCONNECT_CHARACTER] Packet sent, character selection reset`,
                'WebSocketLoginHandler'
            );
        }
    } catch (err) {
        Logger.error(
            `Error building disconnect character packet`,
            err,
            'WebSocketLoginHandler'
        );
    }
}

/**
 * Maneja envío de mensajes de chat (0x7025) desde el frontend
 * Estructura 0x7025 (según bot/Clases/Agent.cs Mensajes):
 *   [1] chatType (2=PM, 3=All)
 *   [1] unknown (0x00)
 *   Si PM: [2] targetLen [N] targetName
 *   [2] messageLen [N] message
 */
export function handleChatSendMessage(message, sessionId, tcpSession) {
    if (message.type !== 'CHAT_SEND') {
        return;
    }

    const chatType = message.chatType || 3;
    const text = message.message || '';
    const target = message.target || '';

    if (!text) return;

    Logger.info(
        `[CHAT_SEND] type=${chatType} target=${target} msg=${text.slice(0, 30)}`,
        'WebSocketLoginHandler'
    );

    try {
        const PacketWriter = require('../gamegateway/packet/PacketWriter');
        const p = new PacketWriter();
        p.writeByte(chatType);
        p.writeByte(0x00); // unknown/padding

        if (chatType === 2 && target) {
            // Private message: incluir nombre del destinatario
            p.writeString(target);
        }

        p.writeString(text);

        const encPacket = tcpSession.security.formatPacket(0x7025, p.getBytes(), true);

        if (tcpSession && tcpSession.send) {
            tcpSession.send(encPacket);
            Logger.debug(`[CHAT_SEND] Packet sent (${encPacket.length} bytes)`, 'WebSocketLoginHandler');
        }
    } catch (err) {
        Logger.error(`Error building chat packet`, err, 'WebSocketLoginHandler');
    }
}

export default {
    handleLoginMessage,
    handleCharacterSelectMessage,
    handleCharacterListRequestMessage,
    handleDisconnectCharacterMessage,
    handleChatSendMessage,
};
