---
Estado: ACTIVO
Última revisión: 2026-05-25
Reemplazado por: N/A (documento vigente)
---

# 🔌 SILKROAD DUAL TCP - STATUS REPORT

> ℹ️ **NOTA DE AUDITORÍA**: Este documento describe el estado del Dual TCP.  
> Se ha identificado una contradicción con `IMPLEMENTATION_SUMMARY.md` (archivado en `docs/archive/`),  
> que reporta el login flow al 100%. Se recomienda verificar qué pasos del plan  
> (PASO 2-5) están realmente implementados en el código actual.

## ❌ PROBLEMA IDENTIFICADO

**El código actual maneja una SOLA conexión TCP**:
```
Gateway Server (15880) ← ❌ No conecta aquí
    ↓
Agent Server (15882) ← ✅ Conecta aquí directamente (INCORRECTO)
```

Pero **Silkroad Online v130 requiere DOS conexiones separadas**:

```
✅ FLUJO CORRECTO:
┌─────────────────────────┐
│ Fase 1: Gateway Login   │
├─────────────────────────┤
│ Conectar a 26.74.212.246:15880
│ Handshake (0x5000/0x9000)
│ Enviar LOGIN (0x6102)
│ ← Recibir Agent info en LOGIN_RESPONSE (0xa102)
│ DESCONECTAR (crítico)
│
├─────────────────────────┤
│ Fase 2: Agent Login     │
├─────────────────────────┤
│ Conectar a 26.74.212.246:15882 (nueva conexión)
│ Handshake NUEVO (0x5000/0x9000)
│ Enviar GAME_LOGIN (0x6103) con sessionId
│ ← Recibir CHARACTER_LIST (0xb007)
│ Seleccionar CHARACTER (0x7001)
│
└─────────────────────────┘
```

---

## ✅ LO QUE YA ESTÁ HECHO

### 1. TcpConnectionManager.js (NUEVO)
- ✅ Gestiona 2 conexiones TCP separadas
- ✅ Transición automática: Gateway → Agent
- ✅ Desconecta Gateway después de login
- ✅ Conecta nuevo Agent con datos recibidos
- ✅ Tracking de fase (IDLE → GATEWAY → AGENT)

**Ubicación**: `blackrosebackend/src/gamegateway/tcp/TcpConnectionManager.js`

**Métodos principales**:
```javascript
await manager.connectToGateway()                    // Fase 1
await manager.reconnectToAgent(host, port, id)     // Fase 2
manager.getActiveClient()                           // Cliente activo
manager.getStatus()                                 // Estado actual
```

### 2. Documentación Completa (NUEVO)
- ✅ DUAL_TCP_ARCHITECTURE.md - Explicación de arquitectura
- ✅ IMPLEMENTATION_PLAN.md - Plan paso a paso
- ✅ Este documento - Status report

---

## ⏳ LO QUE FALTA IMPLEMENTAR

### Paso 2: Actualizar TcpSession.js
**Cambio**: Usar TcpConnectionManager en lugar de TcpClient directo

```javascript
// ANTES (incorrecto):
this.client = new TcpClient(sessionId, AGENT_IP, AGENT_PORT);

// DESPUÉS (correcto):
import TcpConnectionManager from './TcpConnectionManager.js';
this.connectionManager = new TcpConnectionManager(sessionId);
this.connectionManager.onGatewayConnected = (client) => { ... };
this.connectionManager.onAgentConnected = (client) => { ... };
await this.connectionManager.connectToGateway();
```

**Impacto**: 5 cambios pequeños en TcpSession constructor y métodos principales

---

### Paso 3: Actualizar LoginHandler.js
**Cambio**: Cuando recibe LOGIN_RESPONSE, reconectar a Agent

```javascript
processLoginResponse(packet) {
    if (!parsed.success) return { success: false };
    
    // ✅ NUEVO: Reconectar al Agent
    await this.tcpSession.connectionManager.reconnectToAgent(
        parsed.host,
        parsed.port,
        parsed.sessionId
    );
    
    return { success: true, sessionId, host, port };
}
```

**Impacto**: 1 sección nueva (~10 líneas) en método existente

---

### Paso 4: Actualizar OPCODE_DEFINITIONS.js
**Cambios**: Agregar 2 opcodes nuevos

```javascript
AGENT_IDENTIFY_REPLY: {
    opcode: 0x2001,
    parse: (reader) => ({
        serverType: reader.readString(true),  // "GatewayServer" o "AgentServer"
        flag: reader.readByte(),
    }),
},

GAME_LOGIN_REPLY: {
    opcode: 0xa103,
    parse: (reader) => ({
        code: reader.readByte(),
        // ... manejo de errores
    }),
},
```

**Impacto**: 2 opcodes nuevos (~15 líneas)

---

### Paso 5: Actualizar TcpSession.handleGatewayPacket()
**Cambios**: Manejar los 2 opcodes nuevos

```javascript
if (packetObj.opcode === '0x2001') {
    // Identificación del servidor (informativo)
    return;
}

if (packetObj.opcode === '0xa103') {
    // Game login response (informativo)
    return;
}
```

**Impacto**: 2 handlers simples (~10 líneas)

---

## 📊 RESUMEN DE CAMBIOS

| Archivo | Cambios | Líneas | Prioridad |
|---------|---------|--------|-----------|
| TcpConnectionManager.js | ✅ CREADO | 250+ | 1️⃣ CRÍTICO |
| TcpSession.js | ⏳ Actualizar | ~20 | 1️⃣ CRÍTICO |
| LoginHandler.js | ⏳ Actualizar | ~15 | 1️⃣ CRÍTICO |
| OPCODE_DEFINITIONS.js | ⏳ Agregar | ~15 | 2️⃣ IMPORTANTE |
| TcpSession.js (handlers) | ⏳ Agregar | ~10 | 2️⃣ IMPORTANTE |

**Total**: ~70 líneas de código nuevo + cambios existentes

---

## 🎯 VALIDACIÓN DE ÉXITO

### ✅ Después de implementación, esperarás ver:

**En logs del backend**:
```
✅ [TCP MANAGER] Phase 1: Connecting to Gateway 26.74.212.246:15880
✅ Connected to Gateway
✅ [RX] Opcode: 0x5000 HANDSHAKE
✅ [TX] Opcode: 0x9000 HANDSHAKE_OK
✅ [TX] Opcode: 0x6102 LOGIN_REQUEST
✅ [RX] Opcode: 0xa102 LOGIN_RESPONSE with sessionId=12345, host=26.74.212.246, port=15882
✅ [TCP MANAGER] Disconnected from Gateway
✅ [TCP MANAGER] Phase 2: Reconnecting to Agent 26.74.212.246:15882
✅ Connected to Agent
✅ [RX] Opcode: 0x5000 HANDSHAKE (nuevo)
✅ [TX] Opcode: 0x9000 HANDSHAKE_OK (nuevo)
✅ [TX] Opcode: 0x6103 GAME_LOGIN
✅ [RX] Opcode: 0xa103 GAME_LOGIN_REPLY
✅ [TX] Opcode: 0x7007 CHARACTER_LIST_REQUEST
✅ [RX] Opcode: 0xb007 CHARACTER_LIST
```

**En DevTools (Frontend)**:
```json
// Fase 1 completada
{
  "type": "STATUS",
  "status": "LOGIN_OK",
  "detail": { "sessionId": 12345, "host": "26.74.212.246", "port": 15882 }
}

// ~1 segundo después, Fase 2 completada
{
  "type": "STATUS",
  "status": "AGENT_LOGIN_OK"
}

// Personajes recibidos
{
  "type": "STATUS",
  "status": "CHARACTER_LIST_RECEIVED",
  "detail": {
    "charCount": 2,
    "characters": [
      { "name": "MyChar", "level": 50, "hp": 1000, ... }
    ]
  }
}
```

---

## 🚀 PRÓXIMOS PASOS

### Orden de implementación:

1. **Actualizar TcpSession.js** (CRÍTICO - 20 líneas)
   - Reemplazar `new TcpClient()` con `new TcpConnectionManager()`
   - Agregar callbacks onGatewayConnected/onAgentConnected
   - Actualizar método send()

2. **Actualizar LoginHandler.js** (CRÍTICO - 15 líneas)
   - En processLoginResponse(), reconectar a Agent
   - Esperar a que se complete la reconexión

3. **Agregar opcodes en OPCODE_DEFINITIONS.js** (IMPORTANTE - 15 líneas)
   - 0x2001 AGENT_IDENTIFY_REPLY
   - 0xa103 GAME_LOGIN_REPLY

4. **Agregar handlers en TcpSession.js** (IMPORTANTE - 10 líneas)
   - Manejar 0x2001 y 0xa103 (aunque sea solo logging)

5. **Probar y validar** (CRÍTICO)
   - Ejecutar secuencia completa
   - Verificar logs
   - Confirmar que llega a CHARACTER_LIST

---

## 📚 REFERENCIAS UTILIZADAS

✓ https://github.com/svalencius/silkroad-bot/blob/master/connections/Client.js#L74-L91 (reconnect method)
✓ https://github.com/svalencius/silkroad-bot/blob/master/Bot.js#L302-L310 (onLoginResponse)
✓ https://github.com/svalencius/silkroad-bot/blob/master/README.md#gateway-and-agent-servers

---

## 📞 RESUMEN EJECUTIVO

**Problema**: El código conecta solo a Agent, no a Gateway. Silkroad requiere 2 conexiones.

**Solución**: TcpConnectionManager maneja el flujo correcto (Gateway → desconectar → Agent)

**Implementación**: ~70 líneas nuevas + cambios menores en 2 archivos existentes

**Tiempo estimado**: 30-45 minutos

**Complejidad**: ⭐⭐ (Media) - El TcpConnectionManager ya está hecho, solo falta integrarlo

**Riesgo**: Bajo - Los cambios son aislados y bien documentados

**Beneficio**: ✅ Login correcto, ✅ Character list, ✅ Character select funciona
