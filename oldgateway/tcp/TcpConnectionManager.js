/**
 * TCP CONNECTION MANAGER - SILKROAD DUAL SERVER ARCHITECTURE
 * 
 * Silkroad Online v130 tiene DOS servidores TCP separados:
 * 1. Gateway Server (15880): Login + Character List
 * 2. Agent Server (15882): Character Select + Game World
 * 
 * Flow:
 * 1. Conectar al Gateway
 * 2. Handshake con Gateway
 * 3. Enviar LOGIN_REQUEST (0x6102)
 * 4. Recibir LOGIN_RESPONSE (0xa102) con host:puerto del Agent
 * 5. DESCONECTAR del Gateway
 * 6. Conectar al Agent con credenciales recibidas
 * 7. Handshake con Agent
 * 8. Enviar GAME_LOGIN (0x6103)
 * 9. Recibir CHARACTER_LIST (0xb007)
 * 10. Enviar CHARACTER_SELECT (0x7001)
 * 
 * Basado en: https://github.com/svalencius/silkroad-bot/blob/master/connections/Client.js#L74-L91
 */

import TcpClient from './TcpClient.js';
import Logger from '../utils/Logger.js';
import { GATEWAY_CONFIG } from '../config/gateway.config.js';

export class TcpConnectionManager {
    constructor(sessionId) {
        this.sessionId = sessionId;

        // Estado de conexión
        this.connectionPhase = 'IDLE'; // IDLE -> GATEWAY -> AGENT -> IN_GAME
        this.isConnectedToGateway = false;
        this.isConnectedToAgent = false;

        // Conexiones TCP
        this.gatewayClient = null;
        this.agentClient = null;

        // Datos de sesión
        this.sessionData = {
            token: null,
            username: null,
            password: null,
            agentHost: null,
            agentPort: null,
        };

        // Callbacks para eventos de conexión
        this.onGatewayConnected = null;
        this.onAgentConnected = null;
        this.onConnectionError = null;
        this.onPhaseChange = null;
    }

    /**
     * FASE 1: Conectar al Gateway Server (15880)
     * Aquí se hace login y se obtiene la dirección del Agent Server
     */
    async connectToGateway() {
        try {
            Logger.info(
                `[TCP MANAGER] Phase 1: Connecting to Gateway ${GATEWAY_CONFIG.GAME_IP}:${GATEWAY_CONFIG.GAME_PORT}`,
                'TcpConnectionManager'
            );

            this._setPhase('GATEWAY_CONNECTING');

            // Crear cliente TCP al Gateway
            this.gatewayClient = new TcpClient(
                this.sessionId,
                GATEWAY_CONFIG.GAME_IP,
                GATEWAY_CONFIG.GAME_PORT
            );

            // Esperar conexión
            await this.gatewayClient.connect();

            this.isConnectedToGateway = true;
            this._setPhase('GATEWAY_CONNECTED');

            Logger.success(
                `[TCP MANAGER] Connected to Gateway ${GATEWAY_CONFIG.GAME_IP}:${GATEWAY_CONFIG.GAME_PORT}`,
                'TcpConnectionManager'
            );

            if (this.onGatewayConnected) {
                this.onGatewayConnected(this.gatewayClient);
            }

            return this.gatewayClient;

        } catch (err) {
            Logger.error(
                `[TCP MANAGER] Failed to connect to Gateway`,
                err,
                'TcpConnectionManager'
            );

            if (this.onConnectionError) {
                this.onConnectionError('gateway', err);
            }

            throw err;
        }
    }

    /**
     * FASE 2: Desconectar del Gateway y conectar al Agent
     * Se llama después de recibir LOGIN_RESPONSE exitoso (0xa102)
     * 
     * @param {string} agentHost - Host del Agent Server (ej: "26.74.212.246")
     * @param {number} agentPort - Puerto del Agent Server (ej: 15882)
     * @param {number} token - Token (dword) recibido del Gateway para autenticar en el Agent
     */
    async reconnectToAgent(agentHost, agentPort, token) {
        try {
            Logger.info(
                `[TCP MANAGER] Phase 2: Reconnecting to Agent ${agentHost}:${agentPort}`,
                'TcpConnectionManager'
            );

            this._setPhase('GATEWAY_DISCONNECTING');

            // Guardar datos de sesión
            this.sessionData.token = token;
            this.sessionData.agentHost = agentHost;
            this.sessionData.agentPort = agentPort;

            // Desconectar del Gateway
            if (this.gatewayClient) {
                await this._closeGatewayConnection();
                this.isConnectedToGateway = false;
                Logger.info(
                    `[TCP MANAGER] Disconnected from Gateway`,
                    'TcpConnectionManager'
                );
            }

            // Esperar un poco para asegurar desconexión limpia
            await new Promise(resolve => setTimeout(resolve, 500));

            this._setPhase('AGENT_CONNECTING');

            // Crear nueva conexión al Agent
            this.agentClient = new TcpClient(
                this.sessionId,
                agentHost,
                agentPort
            );

            // Esperar conexión
            await this.agentClient.connect();

            this.isConnectedToAgent = true;
            this._setPhase('AGENT_CONNECTED');

            Logger.success(
                `[TCP MANAGER] Connected to Agent ${agentHost}:${agentPort}`,
                'TcpConnectionManager'
            );

            if (this.onAgentConnected) {
                this.onAgentConnected(this.agentClient);
            }

            return this.agentClient;

        } catch (err) {
            Logger.error(
                `[TCP MANAGER] Failed to reconnect to Agent`,
                err,
                'TcpConnectionManager'
            );

            if (this.onConnectionError) {
                this.onConnectionError('agent', err);
            }

            throw err;
        }
    }

    /**
     * Obtener cliente activo (Gateway o Agent según fase)
     */
    getActiveClient() {
        if (this.isConnectedToAgent) {
            return this.agentClient;
        } else if (this.isConnectedToGateway) {
            return this.gatewayClient;
        }
        return null;
    }

    /**
     * Enviar datos por el cliente activo
     */
    send(data) {
        const client = this.getActiveClient();
        if (client) {
            client.send(data);
        } else {
            Logger.warn(
                `[TCP MANAGER] No active connection to send data`,
                'TcpConnectionManager'
            );
        }
    }

    /**
     * Cerrar todas las conexiones
     */
    async closeAll() {
        Logger.info(
            `[TCP MANAGER] Closing all connections`,
            'TcpConnectionManager'
        );

        try {
            if (this.isConnectedToGateway) {
                await this._closeGatewayConnection();
                this.isConnectedToGateway = false;
            }

            if (this.isConnectedToAgent) {
                await this._closeAgentConnection();
                this.isConnectedToAgent = false;
            }

            this._setPhase('CLOSED');
        } catch (err) {
            Logger.error(
                `[TCP MANAGER] Error closing connections`,
                err,
                'TcpConnectionManager'
            );
        }
    }

    /**
     * Privadas: Helpers
     */

    async _closeGatewayConnection() {
        if (this.gatewayClient) {
            if (typeof this.gatewayClient.destroy === 'function') {
                this.gatewayClient.destroy();
            } else if (typeof this.gatewayClient.disconnect === 'function') {
                this.gatewayClient.disconnect();
            }
            this.gatewayClient = null;
        }
    }

    async _closeAgentConnection() {
        if (this.agentClient) {
            if (typeof this.agentClient.destroy === 'function') {
                this.agentClient.destroy();
            } else if (typeof this.agentClient.disconnect === 'function') {
                this.agentClient.disconnect();
            }
            this.agentClient = null;
        }
    }

    _setPhase(phase) {
        const oldPhase = this.connectionPhase;
        this.connectionPhase = phase;

        Logger.debug(
            `[TCP MANAGER] Phase transition: ${oldPhase} → ${phase}`,
            'TcpConnectionManager'
        );

        if (this.onPhaseChange) {
            this.onPhaseChange(oldPhase, phase);
        }
    }

    /**
     * Obtener estado actual
     */
    getStatus() {
        return {
            phase: this.connectionPhase,
            isConnectedToGateway: this.isConnectedToGateway,
            isConnectedToAgent: this.isConnectedToAgent,
            sessionData: this.sessionData,
        };
    }
}

export default TcpConnectionManager;
