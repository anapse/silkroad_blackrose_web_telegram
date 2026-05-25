---
Estado: HISTORICO
Última revisión: 2026-05-25
Reemplazado por: DUAL_TCP_STATUS.md, DUAL_TCP_ARCHITECTURE.md
---

# 📋 PLAN DE IMPLEMENTACIÓN - DUAL TCP CONNECTIONS

> ⚠️ **DOCUMENTO HISTÓRICO**: Este plan fue ejecutado parcialmente.  
> El estado actual del proyecto se encuentra en:
> - `DUAL_TCP_ARCHITECTURE.md` — Arquitectura vigente
> - `DUAL_TCP_STATUS.md` — Estado actualizado
> - `LOGIN_IMPLEMENTATION_GUIDE.md` — Guía del login flow implementado
>
> Los pasos marcados como PENDIENTES pueden no reflejar el estado real del código.

## 🎯 OBJETIVO

Migrar de una **conexión única al Agent (incorrecto)** a un flujo de **dos conexiones separadas** (Gateway → Agent).

---

## ✅ PASO 1: TcpConnectionManager (COMPLETADO)

**Archivo**: `blackrosebackend/src/gamegateway/tcp/TcpConnectionManager.js`

**Lo que hace**:
- Maneja 2 conexiones TCP: Gateway y Agent
- Transición automática: Gateway → Agent
- Desconecta Gateway después de LOGIN_RESPONSE
- Conecta nuevo Agent con datos recibidos

**Uso**:
```javascript
const manager = new TcpConnectionManager(sessionId);
const gateway = await manager.connectToGateway();  // Fase 1
const agent = await manager.reconnectToAgent(host, port, sessionId);  // Fase 2
```

---

## ⏳ PASO 2: Actualizar TcpSession.js (PENDIENTE)

**Cambios necesarios**:

### 2.1 Importar TcpConnectionManager
```javascript
import TcpConnectionManager from './TcpConnectionManager.js';
```

### 2.2 En constructor, cambiar:
```javascript
// ANTES:
this.client = new TcpClient(sessionId, GATEWAY_CONFIG.AGENT_IP, GATEWAY_CONFIG.AGENT_PORT);

// DESPUÉS:
this.connectionManager = new TcpConnectionManager(sessionId);
this.currentClient = null;  // Se actualiza según fase
```

### 2.3 Agregar callbacks:
```javascript
this.connectionManager.onGatewayConnected = (client) => {
    this.currentClient = client;
    Logger.info(`[TcpSession] Gateway connected`, 'TcpSession');
    // El gateway está listo para handshake
};

this.connectionManager.onAgentConnected = (client) => {
    this.currentClient = client;
    Logger.info(`[TcpSession] Agent connected`, 'TcpSession');
    // El agent está listo para handshake
};
```

### 2.4 En método connect():
```javascript
async connect() {
    try {
        await this.connectionManager.connectToGateway();
        // No esperar a que esté listo en handshake, solo la conexión TCP
    } catch (err) {
        Logger.error(`Failed to connect to Gateway`, err, 'TcpSession');
        throw err;
    }
}
```

### 2.5 En método send():
```javascript
send(data) {
    const client = this.connectionManager.getActiveClient();
    if (client) {
        // ... enviar por el cliente activo
    }
}
```

---

## ⏳ PASO 3: Actualizar LoginHandler.js (PENDIENTE)

**Cambios en `processLoginResponse()`**:

```javascript
processLoginResponse(packet) {
    // ... código existente ...
    
    if (!parsed.success) {
        return { success: false, error: parsed.errorMessage };
    }

    // ✅ NUEVO: Guardar datos
    this.currentSessionId = parsed.sessionId;
    this.agentHost = parsed.host;
    this.agentPort = parsed.port;

    // ✅ NUEVO: Reconectar a Agent
    if (this.tcpSession && this.tcpSession.connectionManager) {
        try {
            Logger.info(
                `[LoginHandler] Reconnecting to Agent ${parsed.host}:${parsed.port}`,
                'LoginHandler'
            );
            
            await this.tcpSession.connectionManager.reconnectToAgent(
                parsed.host,
                parsed.port,
                parsed.sessionId
            );
            
            Logger.success(
                `[LoginHandler] Successfully reconnected to Agent`,
                'LoginHandler'
            );
            
        } catch (err) {
            Logger.error(
                `[LoginHandler] Failed to reconnect to Agent`,
                err,
                'LoginHandler'
            );
            return {
                success: false,
                error: 'Agent reconnection failed',
                originalSuccess: true,  // Login fue exitoso, pero no pudimos reconectar
            };
        }
    }

    return {
        success: true,
        sessionId: parsed.sessionId,
        agentHost: parsed.host,
        agentPort: parsed.port,
    };
}
```

---

## ⏳ PASO 4: Actualizar WebSocketLoginHandler.js (PENDIENTE)

**Agregar parámetro a métodos**:

```javascript
export function handleLoginMessage(message, sessionId, tcpSession, loginHandler) {
    // ... código existente ...
    
    // Pasar referencias completas:
    const loginPacket = LoginHandler.buildLoginRequest(username, password, serverId, locale);
    if (tcpSession && tcpSession.send) {
        tcpSession.send(loginPacket);
    }
}
```

---

## ⏳ PASO 5: Agregar Manejador para 0x2001 AGENT_IDENTIFY_REPLY (PENDIENTE)

En `OPCODE_DEFINITIONS.js`, agregar:

```javascript
export const OPCODES = {
    // ... existentes ...
    
    AGENT_IDENTIFY_REPLY: {
        opcode: 0x2001,
        name: 'AGENT_IDENTIFY_REPLY',
        parse: (reader) => {
            const serverType = reader.readString(true);  // "GatewayServer" o "AgentServer"
            const flag = reader.readByte();
            
            return {
                success: true,
                serverType,  // CRITICAL: Indica si es Gateway o Agent
                flag,
            };
        },
    },
    
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
            } else {
                const subcode = reader.readByte();
                return {
                    success: false,
                    code: 0,
                    subcode,
                };
            }
        },
    },
};
```

---

## ⏳ PASO 6: Agregar Manejador en TcpSession.js (PENDIENTE)

En `handleGatewayPacket()`, agregar:

```javascript
handleGatewayPacket(rawPacket, packetObj, session) {
    // ... existentes ...
    
    // AGENT_IDENTIFY_REPLY (0x2001) - Respuesta de identificación
    if (packetObj.opcode === '0x2001') {
        const parsed = parseOpcode(rawPacket, packetObj.opcode);
        if (parsed) {
            Logger.info(
                `[TcpSession] Server type: ${parsed.serverType}`,
                'TcpSession'
            );
            // En Gateway: "GatewayServer", en Agent: "AgentServer"
            // No es crítico manejar, solo informativo
        }
        return;
    }
    
    // GAME_LOGIN_REPLY (0xa103) - Respuesta a login en Agent
    if (packetObj.opcode === '0xa103') {
        const parsed = parseOpcode(rawPacket, packetObj.opcode);
        if (parsed && parsed.success) {
            Logger.success(
                `[TcpSession] Game login successful on Agent`,
                'TcpSession'
            );
            if (session.wsSession) {
                session.wsSession.sendStatus('AGENT_LOGIN_OK');
            }
        } else {
            Logger.error(
                `[TcpSession] Game login failed on Agent`,
                null,
                'TcpSession'
            );
            if (session.wsSession) {
                session.wsSession.sendStatus('AGENT_LOGIN_FAILED');
            }
        }
        return;
    }
}
```

---

## 🧪 PASO 7: Testing

### 7.1 Verificar logs en secuencia:

```
✅ [TCP MANAGER] Phase 1: Connecting to Gateway 26.74.212.246:15880
✅ Connected to Gateway
✅ [RX] Opcode: 0x5000 (HANDSHAKE)
✅ [TX] Opcode: 0x9000 (HANDSHAKE_OK)
✅ [RX] Opcode: 0x2001 (AGENT_IDENTIFY_REPLY) - serverType: "GatewayServer"
✅ [TX] Opcode: 0x6102 (LOGIN_REQUEST)
✅ [RX] Opcode: 0xa102 (LOGIN_RESPONSE) - sessionId: XXXXX
✅ [TCP MANAGER] Disconnected from Gateway
✅ [TCP MANAGER] Phase 2: Reconnecting to Agent 26.74.212.246:15882
✅ Connected to Agent
✅ [RX] Opcode: 0x5000 (HANDSHAKE nuevo)
✅ [TX] Opcode: 0x9000 (HANDSHAKE_OK nuevo)
✅ [RX] Opcode: 0x2001 (AGENT_IDENTIFY_REPLY) - serverType: "AgentServer"
✅ [TX] Opcode: 0x6103 (GAME_LOGIN)
✅ [RX] Opcode: 0xa103 (GAME_LOGIN_REPLY)
✅ [TX] Opcode: 0x7007 (CHARACTER_LIST_REQUEST)
✅ [RX] Opcode: 0xb007 (CHARACTER_LIST)
```

### 7.2 Verificar en DevTools:

```json
{
  "type": "STATUS",
  "status": "LOGIN_OK",
  "detail": { "sessionId": 12345, "host": "26.74.212.246", "port": 15882 }
}

// ... Esperar reconexión al Agent ~1 segundo

{
  "type": "STATUS",
  "status": "AGENT_LOGIN_OK"
}

{
  "type": "STATUS",
  "status": "CHARACTER_LIST_RECEIVED",
  "detail": { "charCount": 2, "characters": [...] }
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] TcpConnectionManager creado y probado
- [ ] TcpSession actualizado para usar TcpConnectionManager
- [ ] LoginHandler.processLoginResponse() reconecta a Agent
- [ ] WebSocketLoginHandler pasa referencias correctas
- [ ] OPCODE_DEFINITIONS.js agregó 0x2001 AGENT_IDENTIFY_REPLY y 0xa103
- [ ] TcpSession.handleGatewayPacket() maneja los nuevos opcodes
- [ ] Logs muestran secuencia correcta
- [ ] Frontend recibe transición GATEWAY → AGENT
- [ ] Character list se recibe del Agent
- [ ] Character select funciona desde Agent

---

## 🎯 RESULTADO ESPERADO

Después de estas 7 pasos, el flujo será:

```
Cliente WebSocket
    ↓ LOGIN JSON
WebSocketLoginHandler
    ↓ Build paquete 0x6102
TcpSession + ConnectionManager
    ↓ Conectar a Gateway 15880
Game Server Gateway
    ↓ Handshake + Response 0xa102
ConnectionManager
    ↓ Desconectar Gateway, Conectar Agent 15882
Game Server Agent
    ↓ Handshake + Game Login
TcpSession
    ↓ Solicitar CHARACTER_LIST
Game Server Agent
    ↓ Enviar CHARACTER_LIST
WebSocketSession
    ↓ Enviar a Cliente
Cliente WebSocket
    ↓ Mostrar personajes
```

**✅ FLUJO CORRECTO IMPLEMENTADO**
