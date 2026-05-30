// Handlers for Handshake opcodes: 0x5000, 0x2001
// Extracted from PacketRouter.js
import Logger from '../../utils/Logger.js';
import PacketReader from '../../../game/packet/PacketReader.js';

export function createHandshakeHandlers(router) {
    return {
        handleHandshake(rawPacket, packetObj) {
            Logger.info('PacketRouter: HANDSHAKE received opcode=' + packetObj.opcode, 'Handshake');
            router.tcpSession.handleHandshake(rawPacket, router.session);
        },

        handleHandshakeComplete(rawPacket, packetObj) {
            if (router.tcpSession.handshakeStarted && !router.tcpSession.handshakeComplete) {
                router.tcpSession.handshakeComplete = true;
                Logger.info('PacketRouter: HANDSHAKE_COMPLETE opcode=' + packetObj.opcode + ' session=' + router.session.id, 'Handshake');

                try {
                    const reader = new PacketReader(rawPacket);
                    const serviceName = reader.readString(true);
                    Logger.info('[IDENTIFICATION] service=' + serviceName, 'Handshake');

                    if (router.session.wsSession) {
                        router.session.wsSession.sendStatus('HANDSHAKE_COMPLETE');
                        const displayName = serviceName === 'GlobalManager' ? 'GatewayServer' : serviceName;
                        router.session.wsSession.sendEvent('Handshake completado (' + displayName + ')');
                        router.session.wsSession.sendEvent('Servidor identificado: ' + displayName);
                    }

                    if (serviceName === 'GatewayServer' || serviceName === 'GlobalManager') {
                        Logger.info('PacketRouter: ' + serviceName + ' identified, sending 0x6100', 'Handshake');
                        router.sendPatchRequest();
                    } else if (serviceName === 'AgentServer') {
                        router.isAgent = true;
                        router.tcpSession.startHeartbeat();
                        Logger.info('PacketRouter: AgentServer identification received, sending GAME_LOGIN (0x6103)', 'Handshake');
                        router.sendGameLogin();
                    } else {
                        Logger.warn('PacketRouter: Unknown server identification: ' + serviceName, 'Handshake');
                    }
                } catch (err) {
                    Logger.error('PacketRouter: Failed to parse identification packet', err, 'Handshake');
                    if (router.session.wsSession) {
                        router.session.wsSession.sendStatus('HANDSHAKE_COMPLETE');
                        router.session.wsSession.sendEvent('Handshake completado');
                    }
                    router.sendPatchRequest();
                }
            }
        }
    };
}
