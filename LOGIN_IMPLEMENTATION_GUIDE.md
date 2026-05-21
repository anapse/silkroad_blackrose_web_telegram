# LOGIN FLOW IMPLEMENTATION - GUÍA COMPLETA

## 📋 RESUMEN DE LO IMPLEMENTADO

He implementado el **flujo completo de login** para tu servidor Silkroad basándome en los repositorios de referencia. Aquí está todo lo que necesitas saber.

---

## 🏗️ ARCHIVOS CREADOS / MODIFICADOS

### ✅ ARCHIVOS NUEVOS CREADOS:

1. **`blackrosebackend/src/shared/opcodes/OPCODE_DEFINITIONS.js`**
   - Define la estructura de los paquetes de Silkroad
   - Contiene parsers para: LOGIN_RESPONSE, CHARACTER_LIST, CHARACTER_SELECT
   - Función `parseOpcode()` para extraer datos binarios

2. **`blackrosebackend/src/shared/builders/LoginRequestBuilder.js`**
   - Construye paquetes binarios listos para enviar
   - Métodos:
     - `buildLoginRequest(username, password, serverId, locale)` → 0x6102
     - `buildCharacterSelect(characterName)` → 0x7001
     - `buildCharacterListRequest()` → 0x7007
     - `buildCaptchaReply()` → 0x6323

3. **`blackrosebackend/src/shared/handlers/LoginHandler.js`**
   - Procesa respuestas del servidor
   - Métodos principales:
     - `processLoginResponse()` - Procesa 0xa102
     - `processCharacterList()` - Procesa 0xb007
     - `processCharacterSelect()` - Procesa 0xb001
     - `selectFirstAvailableCharacter()` - Selecciona automáticamente
     - `selectCharacterByName(name)` - Selecciona por nombre

4. **`blackrosebackend/src/shared/WebSocketLoginHandler.js`**
   - Puente entre WebSocket (frontend) y TCP (backend)
   - Maneja mensajes JSON desde el cliente
   - Transforma en paquetes binarios

### 🔄 ARCHIVOS MODIFICADOS:

1. **`PacketTranslator.js`**
   - ✅ Ahora llama a `parseOpcode()` automáticamente
   - ✅ Agrega campos `opcodeName` y `parsed` al resultado
   - ✅ Si un opcode tiene definición, extrae los datos

2. **`TcpSession.js`**
   - ✅ Importa `LoginHandler`
   - ✅ Agrega métodos `handleLoginResponse()` y `handleCharacterList()`
   - ✅ Procesa automáticamente 0xa102 y 0xb007

3. **`WebSocketSession.js`**
   - ✅ Importa handlers de login
   - ✅ `handleMessage()` ahora procesa JSON de LOGIN, CHARACTER_SELECT, REQUEST_CHARACTER_LIST
   - ✅ Ruteaautomáticamente a TCP

---

## 🚀 CÓMO USAR

### **PASO 1: ENVIAR LOGIN DESDE FRONTEND**

Cliente web envía JSON por WebSocket:

```javascript
// Desde ConnectionTester.jsx o cualquier cliente
ws.send(JSON.stringify({
  type: "LOGIN",
  username: "tu_usuario",
  password: "tu_contraseña",
  serverId: 64,           // ID del servidor
  locale: 130             // LOCALE_VIETNAM
}));
```

### **PASO 2: BACKEND PROCESA Y ENVÍA AL GAME SERVER**

El flujo automático:

```
WebSocket JSON (LOGIN)
    ↓
WebSocketSession.handleMessage()
    ↓
WebSocketLoginHandler.handleLoginMessage()
    ↓
LoginRequestBuilder.buildLoginRequest()
    ↓
TcpSession.send() → Game Server (0x6102)
```

### **PASO 3: RECIBIR LOGIN_RESPONSE (0xa102)**

El servidor responde con LOGIN_RESPONSE:

```
Game Server → 0xa102
    ↓
TcpSession.handleIncomingData()
    ↓
PacketTranslator.translate() → parseOpcode()
    ↓
TcpSession.handleLoginResponse()
    ↓
LoginHandler.processLoginResponse()
    ↓
WebSocket → STATUS: "LOGIN_OK" + sessionId, host, port
```

**Respuesta al cliente:**

```json
{
  "type": "STATUS",
  "status": "LOGIN_OK",
  "detail": {
    "sessionId": 12345,
    "host": "26.74.212.246",
    "port": 15882
  }
}
```

### **PASO 4: SOLICITAR LISTA DE PERSONAJES**

Cliente envía:

```javascript
ws.send(JSON.stringify({
  type: "REQUEST_CHARACTER_LIST"
}));
```

Backend envía: `LoginRequestBuilder.buildCharacterListRequest()` → 0x7007

### **PASO 5: RECIBIR CHARACTER_LIST (0xb007)**

```json
{
  "type": "STATUS",
  "status": "CHARACTER_LIST_RECEIVED",
  "detail": {
    "charCount": 2,
    "characters": [
      {
        "index": 0,
        "name": "MyCharacter",
        "level": 50,
        "refObjId": 388564,
        "exp": "1000000000",
        "hp": 1000,
        "mp": 500,
        "deleted": false
      },
      {
        "index": 1,
        "name": "DeletedChar",
        "level": 30,
        "refObjId": 388564,
        "exp": "500000000",
        "hp": 800,
        "mp": 300,
        "deleted": true
      }
    ]
  }
}
```

### **PASO 6: SELECCIONAR PERSONAJE**

Cliente envía:

```javascript
ws.send(JSON.stringify({
  type: "CHARACTER_SELECT",
  characterName: "MyCharacter"
}));
```

Backend construye y envía: `LoginRequestBuilder.buildCharacterSelect()` → 0x7001

### **PASO 7: CONFIRMACIÓN (0xb001)**

Cuando el servidor confirma:

```json
{
  "type": "STATUS",
  "status": "CHARACTER_SELECT_OK"
}
```

---

## 📦 ESTRUCTURA DE PAQUETES

### **LOGIN REQUEST (0x6102) - Cliente → Servidor**

```
Byte:   locale (1 byte)
String: username
String: password
Word:   serverId (2 bytes)
String: captcha (vacío = "")
```

Ejemplo con tu configuración:
```javascript
const packet = LoginRequestBuilder.buildLoginRequest(
  "usuario",
  "contraseña",
  64,                // serverId
  130                // LOCALE_VIETNAM
);
```

### **LOGIN RESPONSE (0xa102) - Servidor → Cliente**

```
Byte: code (1 = éxito, 0 = error)

Si code == 1 (éxito):
  DWord: sessionId
  String: hostAgent
  Word: portAgent

Si code == 0 (error):
  Byte: subcode (1=contraseña, 2=baneado, 3=conectado, 5=lleno, etc.)
```

Parser automático en `OPCODE_DEFINITIONS.js`:
```javascript
{
  success: true,
  sessionId: 12345,
  host: "26.74.212.246",
  port: 15882
}
```

### **CHARACTER_LIST (0xb007) - Servidor → Cliente**

```
Byte: type (2 = lista)
Byte: success (1 = sí)
Byte: charCount

Para cada personaje:
  DWord: refObjId (modelo)
  String: name
  Byte: volume
  Byte: level
  QWord: exp
  Word: str
  Word: int
  Word: statPoints
  DWord: hp
  DWord: mp
  Byte: deleted (1 = sí)
  [si deleted] DWord: deletionTime
```

Parser en `OPCODE_DEFINITIONS.js`:
```javascript
{
  success: true,
  charCount: 2,
  characters: [
    {
      refObjId: 388564,
      name: "MyChar",
      level: 50,
      exp: 1000000000n,
      hp: 1000,
      mp: 500,
      deleted: false
    }
  ]
}
```

### **CHARACTER_SELECT (0x7001) - Cliente → Servidor**

```
String: characterName
```

Builder:
```javascript
const packet = LoginRequestBuilder.buildCharacterSelect("MyCharacter");
```

---

## 🔍 CÓMO VER LOS DATOS EN FRONTEND

En `ConnectionTester.jsx` ya tienes el monitor de paquetes. Ahora ves:

```javascript
// En el mensaje recibido:
{
  type: "STATUS",
  status: "LOGIN_OK",
  detail: { sessionId, host, port }
}

{
  type: "STATUS",
  status: "CHARACTER_LIST_RECEIVED",
  detail: { charCount, characters: [...] }
}

{
  type: "PACKET",
  direction: "RX",
  opcode: "0xa102",
  opcodeName: "LOGIN_RESPONSE",    // ✅ NUEVO
  parsed: {                          // ✅ NUEVO
    success: true,
    sessionId: 12345,
    host: "...",
    port: 15882
  },
  payload: "hex..." // bruto
}
```

---

## 🎯 CONFIGURACIÓN PARA TU SERVIDOR

**Tu servidor:**
- GatewayServer: `26.74.212.246:15880`
- AgentServer/GameServer: `26.74.212.246:15882`
- Versión cliente: `130`
- Locale: `LOCALE_VIETNAM` (130)
- Captcha: vacío (IBUVStringSize = 0)

**Tu `gateway.config.js` ya debería tener:**

```javascript
export const GATEWAY_CONFIG = {
  WS_HOST: '0.0.0.0',
  WS_PORT: 8081,
  
  // Apuntar al Game Server (Agent)
  AGENT_IP: '26.74.212.246',
  AGENT_PORT: 15882,
  
  // ... resto de config
};
```

Para conectarte al **Gateway** (15880) en lugar del Agent (15882), cambiaría solo si necesitas:

```javascript
// Opción 1: Conectar a Gateway primero
AGENT_IP: '26.74.212.246',
AGENT_PORT: 15880,  // Gateway

// Luego el servidor te redirige al Agent
// LOGIN_RESPONSE contendrá: host=26.74.212.246, port=15882
```

---

## ✅ FLUJO COMPLETO VISUAL

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser/React)                      │
│                    ConnectionTester.jsx                         │
│                                                                 │
│  1. ws.send({type:"LOGIN", username, password, serverId})      │
│  2. ws.send({type:"REQUEST_CHARACTER_LIST"})                   │
│  3. ws.send({type:"CHARACTER_SELECT", characterName})          │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑
                         WebSocket (JSON)
                              ↓↑
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND (Node.js Gateway)                          │
│            WebSocketSession.handleMessage()                     │
│                                                                 │
│  → WebSocketLoginHandler.handleLoginMessage()                  │
│  → LoginRequestBuilder.buildLoginRequest()                     │
│  → TcpSession.send() [Binary 0x6102]                           │
│                                                                 │
│  ← [RX 0xa102 LOGIN_RESPONSE]                                  │
│  ← TcpSession.handleLoginResponse()                            │
│  ← LoginHandler.processLoginResponse()                         │
│  ← PacketTranslator.parseOpcode() ✅ [Extrae datos]           │
│  ← WebSocket STATUS: "LOGIN_OK"                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑
                       TCP/IP (Binary)
                              ↓↑
┌─────────────────────────────────────────────────────────────────┐
│         GAME SERVER (Silkroad Gateway/Agent)                    │
│              26.74.212.246:15880 (Gateway)                      │
│              26.74.212.246:15882 (Agent)                        │
│                                                                 │
│  [Handshake 0x5000, 0x9000, 0x2001]                           │
│  [0x6102 Login Request]                                        │
│  → 0xa102 Login Response                                       │
│  [0x7007 Character List Request]                              │
│  → 0xb007 Character List                                       │
│  [0x7001 Character Select]                                    │
│  → 0xb001 Character Select Confirm                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🐛 DEBUGGING

### Activar logs detallados:

En `gateway.config.js`:
```javascript
DEBUG_MODE: true,  // Si existe
LOG_LEVEL: 'debug'
```

### Ver qué sucede en cada paso:

1. **Frontend → Backend (WebSocket)**
   - Abre DevTools → Network → WS
   - Verifica los JSON enviados

2. **Backend → Game Server (TCP)**
   - Busca logs con `[LOGIN]` y `[RX]` en la consola
   - Verifica `TcpSession.send()` logs

3. **Parsing de paquetes**
   - Logs en `LoginHandler` y `PacketTranslator`
   - Verifica que `parsed` no sea null

---

## 🔧 SIGUIENTES PASOS

Una vez el login funcione, implementa:

1. **Movement (0xb100)** - Movimiento del personaje
2. **Inventory (0xb080)** - Items del inventario
3. **NPC Dialog (0xb0d0)** - Interacción con NPCs
4. **Skills (0xb0d8)** - Ejecución de habilidades
5. **Combat (0xb108)** - Combate

Cada uno seguirá el mismo patrón:
- Define estructura en `OPCODE_DEFINITIONS.js`
- Crea builder en `LoginRequestBuilder.js` (o similar)
- Agrega handler en `TcpSession.js`

---

## 📚 REFERENCIAS

- **Repositorio 1**: https://github.com/svalencius/silkroad-bot
- **Repositorio 2**: https://github.com/leolongvu/SilkroadLeoBot
- **Protocolo**: Silkroad Online v130 (Vietnam)

---

**¡Tu gateway ya está listo para login completo!** 🎉
