# 🔌 SILKROAD DUAL TCP CONNECTION ARCHITECTURE

## Problema Identificado

El código actual conecta una sola vez al Agent Server (15882), pero **Silkroad Online v130 tiene DOS servidores TCP separados**:

1. **Gateway Server (15880)**: Login + Character List
2. **Agent Server (15882)**: Character Select + Game World

---

## ❌ ARQUITECTURA ACTUAL (INCORRECTA)

```javascript
// TcpSession constructor
this.client = new TcpClient(
    sessionId,
    GATEWAY_CONFIG.AGENT_IP,      // ← Intenta conectar directo al Agent
    GATEWAY_CONFIG.AGENT_PORT      // ← Puerto del Agent
);

// Resultado:
// - No hace login en Gateway
// - No recibe lista de personajes
// - El servidor rechaza la conexión
```

---

## ✅ ARQUITECTURA CORRECTA (BASADA EN svalencius/silkroad-bot)

### FASE 1: Gateway Server (15880)
```
Client conecta a Gateway
  ↓
[Handshake 0x5000, 0x9000]
  ↓
[Envía 0x2001 AGENT_IDENTIFY]
  ↓
[Recibe 0x2001 AGENT_SERVER]  ← Servidor responde que es Gateway
  ↓
[Envía 0x6100 PATCH_REQUEST]
[Envía 0x6101 REQUEST_SERVER_LIST]  ← Pedir lista de servidores
  ↓
[Recibe 0xa101 SERVER_LIST]
  ↓
[Envía 0x6102 LOGIN_REQUEST]  ← Login con credentials
  ↓
[Recibe 0xa102 LOGIN_RESPONSE con host:puerto del Agent]
```

### FASE 2: Reconectar a Agent Server (15882)
```
[DESCONECTAR del Gateway] ← CRÍTICO: Cerrar conexión antigua
  ↓
[Esperar ~500ms]
  ↓
Client conecta NUEVA conexión a Agent
  ↓
[Handshake 0x5000, 0x9000 NUEVO]  ← Nuevo handshake
  ↓
[Envía 0x2001 AGENT_IDENTIFY con sessionId]
  ↓
[Recibe 0x2001 AGENT_SERVER]  ← Servidor responde que es Agent
  ↓
[Envía 0x6103 GAME_LOGIN]  ← Login en Agent con sessionId
  ↓
[Recibe 0xa103 GAME_LOGIN_REPLY]
  ↓
[Envía 0x7007 CHARACTER_LIST_REQUEST]
  ↓
[Recibe 0xb007 CHARACTER_LIST]
  ↓
[Envía 0x7001 CHARACTER_SELECT]
  ↓
[Recibe 0xb001 CHARACTER_SELECT_CONFIRM]
  ↓
[En mundo]
```

---

## 📊 OPCODES INVOLUCRADOS

### Gateway Server (0x6102 → 0xa102)

| Opcode | Nombre | Dirección | Propósito |
|--------|--------|-----------|----------|
| 0x5000 | HANDSHAKE | Server→Client | Iniciar handshake |
| 0x9000 | HANDSHAKE_OK | Client→Server | Aceptar handshake |
| 0x2001 | AGENT_IDENTIFY | Client→Server | Identificarse (enviar sessionId) |
| 0x2001 | AGENT_IDENTIFY_REPLY | Server→Client | Respuesta: "soy Gateway" |
| 0x6100 | PATCH_REQUEST | Client→Server | Solicitar patch info |
| 0x6101 | REQUEST_SERVER_LIST | Client→Server | Solicitar lista de servidores |
| 0xa101 | SERVER_LIST | Server→Client | Lista de servidores |
| 0x6102 | LOGIN_REQUEST | Client→Server | **Enviar user+pass** |
| 0xa102 | LOGIN_RESPONSE | Server→Client | **Recibir host:puerto del Agent + sessionId** |

### Agent Server (0x6103 → 0x7001)

| Opcode | Nombre | Dirección | Propósito |
|--------|--------|-----------|----------|
| 0x5000 | HANDSHAKE | Server→Client | Nuevo handshake |
| 0x9000 | HANDSHAKE_OK | Client→Server | Aceptar |
| 0x2001 | AGENT_IDENTIFY | Client→Server | Enviar sessionId + user + pass |
| 0x2001 | AGENT_IDENTIFY_REPLY | Server→Client | Respuesta: "soy Agent" |
| 0x6103 | GAME_LOGIN | Client→Server | **Login con sessionId** |
| 0xa103 | GAME_LOGIN_REPLY | Server→Client | Confirmación |
| 0x7007 | CHARACTER_LIST_REQUEST | Client→Server | Solicitar lista |
| 0xb007 | CHARACTER_LIST | Server→Client | Lista de personajes |
| 0x7001 | CHARACTER_SELECT | Client→Server | **Seleccionar personaje** |
| 0xb001 | CHARACTER_SELECT_CONFIRM | Server→Client | Confirmación |

---

## 🛠️ IMPLEMENTACIÓN

### Paso 1: Crear TcpConnectionManager (✅ YA HECHO)

Archivo: `blackrosebackend/src/gamegateway/tcp/TcpConnectionManager.js`

```javascript
export class TcpConnectionManager {
    async connectToGateway() { }  // Fase 1
    async reconnectToAgent(host, port, sessionId) { }  // Fase 2
    getActiveClient() { }  // Retorna cliente activo
    send(data) { }  // Enviar por cliente activo
}
```

### Paso 2: Actualizar TcpSession (⏳ PENDIENTE)

Debe usar TcpConnectionManager en lugar de crear una sola conexión.

### Paso 3: Actualizar LoginHandler (⏳ PENDIENTE)

Cuando reciba LOGIN_RESPONSE (0xa102):
1. Extraer host y puerto del Agent
2. Llamar a `connectionManager.reconnectToAgent(host, port, sessionId)`

### Paso 4: Manejar nuevos opcodes (⏳ PENDIENTE)

- 0x2001 AGENT_IDENTIFY_REPLY: Determinar si es Gateway o Agent
- 0xa103 GAME_LOGIN_REPLY: Confirmación en Agent
- 0x6100, 0x6101, 0xa101: Opcodes de Gateway

---

## 💻 CÓDIGO EJEMPLO DE FLUJO

### En TcpSession constructor:

```javascript
// ANTES (mal):
this.client = new TcpClient(sessionId, AGENT_IP, AGENT_PORT);

// DESPUÉS (correcto):
import TcpConnectionManager from './TcpConnectionManager.js';

this.connectionManager = new TcpConnectionManager(sessionId);
this.connectionManager.onGatewayConnected = (gatewayClient) => {
    // Iniciar handshake con Gateway
    this._handleGatewayConnected(gatewayClient);
};
this.connectionManager.onAgentConnected = (agentClient) => {
    // Iniciar handshake con Agent
    this._handleAgentConnected(agentClient);
};

// Iniciar conexión al Gateway
await this.connectionManager.connectToGateway();
```

### En LoginHandler.processLoginResponse():

```javascript
// Cuando recibimos LOGIN_RESPONSE (0xa102) exitoso:
if (parsed.success) {
    const { sessionId, host, port } = parsed;
    
    // RECONECTAR al Agent
    await this.tcpSession.reconnectToAgent(host, port, sessionId);
    
    // En Agent, solicitar CHARACTER_LIST
    this.tcpSession.send(LoginRequestBuilder.buildCharacterListRequest());
}
```

---

## ⚠️ PUNTOS CRÍTICOS

1. **DESCONEXIÓN OBLIGATORIA**: Después de LOGIN_RESPONSE, **DEBE** cerrar la conexión al Gateway antes de conectar al Agent.

2. **NUEVO HANDSHAKE**: Cada conexión (Gateway y Agent) requiere su propio handshake (0x5000/0x9000).

3. **SESSION ID**: El LOGIN_RESPONSE del Gateway contiene el sessionId que se usa en el Agent.

4. **0x2001 AGENT_IDENTIFY**: Es diferente en Gateway vs Agent:
   - En Gateway: Envía solo nombre del cliente
   - En Agent: Envía sessionId + username + password

5. **CONFIGURACIÓN**: 
   - Gateway: `GATEWAY_CONFIG.GAME_IP:GAME_PORT` (15880)
   - Agent: `GATEWAY_CONFIG.AGENT_IP:AGENT_PORT` (15882)

---

## 🔍 VALIDACIÓN

Para verificar que funciona:

1. Monitorea logs con `[TCP MANAGER]`
2. Verifica transición: `IDLE → GATEWAY_CONNECTING → GATEWAY_CONNECTED → GATEWAY_DISCONNECTING → AGENT_CONNECTING → AGENT_CONNECTED`
3. Verifica opcodes:
   ```
   Gateway: 0x6102 (LOGIN) → 0xa102 (RESPONSE)
   Desconexión: ~500ms
   Agent: 0x5000 (HANDSHAKE) → 0x9000 → 0x2001 → ...
   ```

---

## 📚 REFERENCIAS

- **svalencius/silkroad-bot**:
  - `connections/Client.js`: Método `reconnect()` (línea 74-91)
  - `Bot.js`: Evento `onLoginResponse()` (línea 302-310)
  - `logic/client/login/Login.js`: `loginResponse()` (línea 156-189)

- **leolongvu/SilkroadLeoBot**: Estructura similar

---

## ✅ TODO

- [x] Crear TcpConnectionManager
- [ ] Actualizar TcpSession para usar TcpConnectionManager
- [ ] Actualizar LoginHandler para reconectar a Agent
- [ ] Agregar handler para 0x2001 AGENT_IDENTIFY_REPLY
- [ ] Agregar handler para 0xa103 GAME_LOGIN_REPLY
- [ ] Probar flujo completo
