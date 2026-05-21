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

    if (tcpSession && tcpSession.packetRouter && tcpSession.handshakeComplete) {
        tcpSession.packetRouter.sendLoginAfterHandshake();
        if (session.wsSession) {
            session.wsSession.sendStatus('LOGIN_SENT');
        }
    } else if (session.wsSession) {
        session.wsSession.sendStatus('LOGIN_PENDING_HANDSHAKE');
    }
}

/**
 * Maneja selección de personaje desde el cliente
 */
export function handleCharacterSelectMessage(message, sessionId, tcpSession) {
    if (message.type !== 'CHARACTER_SELECT') {
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
        // Construir paquete de CHARACTER_SELECT
        const selectPacket = LoginHandler.buildCharacterSelect(characterName);

        if (tcpSession && tcpSession.send) {
            tcpSession.send(selectPacket);
            Logger.debug(
                `[CHARACTER_SELECT] Packet sent (${selectPacket.length} bytes)`,
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

export default {
    handleLoginMessage,
    handleCharacterSelectMessage,
    handleCharacterListRequestMessage,
};
