# 🔄 SYSTEM FLOW — Black Rose

> Flujo completo: desde que un usuario abre el navegador hasta que su personaje
> está en el mundo del juego, renderizado en 2D.

---

## 1. FLUJO DE CONEXIÓN COMPLETO

```
USUARIO                    FRONTEND (React)              BACKEND (Gateway)              GAME SERVER (Silkroad)
   │                            │                              │                              │
   │   Abre navegador           │                              │                              │
   │───────────────────────────>│                              │                              │
   │                            │                              │                              │
   │   Carga React + Vite       │                              │                              │
   │   Index.html + main.jsx    │                              │                              │
   │<───────────────────────────│                              │                              │
   │                            │                              │                              │
   │   Ingresa credenciales     │                              │                              │
   │───────────────────────────>│                              │                              │
   │                            │                              │                              │
   │                            │  ws.connect(ws://host:8081)  │                              │
   │                            │─────────────────────────────>│                              │
   │                            │                              │                              │
   │                            │  {type:"LOGIN", username,    │                              │
   │                            │   password, serverId, locale}│                              │
   │                            │─────────────────────────────>│                              │
   │                            │                              │                              │
   │                            │                              │  TCP connect (15880)         │
   │                            │                              │─────────────────────────────>│
   │                            │                              │                              │
   │                            │                              │  [0x5000] HANDSHAKE          │
   │                            │                              │<─────────────────────────────│
   │                            │                              │                              │
   │                            │                              │  [0x9000] HANDSHAKE_OK       │
   │                            │                              │  + Blowfish key exchange     │
   │                            │                              │─────────────────────────────>│
   │                            │                              │                              │
   │                            │                              │  [0x2001] AGENT_IDENTIFY     │
   │                            │                              │─────────────────────────────>│
   │                            │                              │                              │
   │                            │                              │  [0x2001] AGENT_IDENTIFY_REPLY│
   │                            │                              │<─────────────────────────────│
   │                            │                              │                              │
   │                            │                              │  [0x6102] LOGIN_REQUEST      │
   │                            │                              │  (locale + user + MD5 pass   │
   │                            │                              │   + serverId + captcha)      │
   │                            │                              │─────────────────────────────>│
   │                            │                              │                              │
   │                            │                              │  [0xa102] LOGIN_RESPONSE     │
   │                            │                              │  (código + sessionId         │
   │                            │                              │   + host + port del Agent)   │
   │                            │                              │<─────────────────────────────│
   │                            │                              │                              │
   │                            │                              │  ── DESCONECTAR TCP ──       │
   │                            │                              │                              │
   │                            │                              │  TCP connect (15882)         │
   │                            │                              │  ── NUEVO HANDSHAKE ──       │
   │                            │                              │─────────────────────────────>│
   │                            │                              │                              │
   │                            │                              │  [0x6103] GAME_LOGIN         │
   │                            │                              │  (con sessionId)             │
   │                            │                              │─────────────────────────────>│
   │                            │                              │                              │
   │                            │                              │  [0xa103] GAME_LOGIN_REPLY   │
   │                            │                              │<─────────────────────────────│
   │                            │                              │                              │
   │                            │                              │  [0x7007] CHAR_LIST_REQUEST  │
   │                            │                              │─────────────────────────────>│
   │                            │                              │                              │
   │                            │                              │  [0xb007] CHARACTER_LIST     │
   │                            │                              │  (personajes del usuario)    │
   │                            │                              │<─────────────────────────────│
   │                            │                              │                              │
   │                            │  {type:"STATUS",             │                              │
   │                            │   status:"LOGIN_OK",         │                              │
   │                            │   characters:[...]}          │                              │
   │                            │<─────────────────────────────│                              │
   │                            │                              │                              │
   │   Ve lista de personajes   │                              │                              │
   │<───────────────────────────│                              │                              │
   │                            │                              │                              │
   │   Selecciona personaje     │                              │                              │
   │───────────────────────────>│                              │                              │
   │                            │                              │                              │
   │                            │  {type:"CHARACTER_SELECT",   │                              │
   │                            │   characterName:"MiPj"}      │                              │
   │                            │─────────────────────────────>│                              │
   │                            │                              │                              │
   │                            │                              │  [0x7001] CHARACTER_SELECT   │
   │                            │                              │─────────────────────────────>│
   │                            │                              │                              │
   │                            │                              │  [0xb001] SELECT_CONFIRM     │
   │                            │                              │<─────────────────────────────│
   │                            │                              │                              │
   │   ¡En mundo! 🎮            │                              │                              │
   │<───────────────────────────│                              │                              │
```

---

## 2. FLUJO DE DATOS EN EL BACKEND

### 2.1 Recepción de paquete del GameServer

```
TCP recibe buffer raw
  │
  ▼
PacketAssembler.assemble(buffer)
  │  Espera hasta tener el tamaño completo
  │  Maneja paquetes fragmentados
  ▼
PacketTranslator.translate(packet)
  │  Lee size (uint16 LE) + opcode (uint16 LE)
  │  Verifica flag de encriptado (bit 15 del size)
  │  Desencripta si es necesario (Blowfish)
  │  Valida security bytes (count + CRC)
  ▼
parseOpcode(opcode, payload)
  │  Busca el opcode en OPCODE_DEFINITIONS
  │  Si tiene parser, extrae campos estructurados
  ▼
LoginHandler.processXxx(packet)
  │  Actualiza estado de la sesión
  │  Prepara respuesta para el frontend
  ▼
WebSocketSession.sendToClient(JSON)
  │  Convierte a JSON
  │  Envía por WebSocket al frontend
```

### 2.2 Envío de paquete al GameServer

```
WebSocket recibe JSON del frontend
  │
  ▼
WebSocketSession.handleMessage(message)
  │  Identifica tipo: LOGIN, CHARACTER_SELECT, etc.
  ▼
WebSocketLoginHandler.handleXxxMessage(data)
  │  Valida datos del JSON
  │  Prepara parámetros
  ▼
LoginRequestBuilder.buildXxx(...)
  │  Construye payload binario
  │  Agrega size + opcode
  ▼
TcpSession.send(buffer)
  │  Aplica Blowfish si es necesario
  │  Calcula security bytes (count + CRC)
  │  Envía por TCP al GameServer
```

---

## 3. FLUJO DE DATOS EN EL FRONTEND

### 3.1 Conexión WebSocket

```
Componente Login
  │
  ▼
AuthContext.login(username, password)
  │  Abre WebSocket a ws://host:8081
  │  Envía {type:"LOGIN", ...}
  ▼
(onmessage) → {type:"STATUS", status:"LOGIN_OK", characters}
  │
  ▼
CharacterSelect recibe lista
  │  Renderiza personajes del usuario
  │  Usuario hace clic en uno
  ▼
Envía {type:"CHARACTER_SELECT", characterName:"..."}
  │
  ▼
(onmessage) → {type:"STATUS", status:"PLAYING"}
  │
  ▼
Router → /game (ruta protegida)
  │
  ▼
GameEngine.init()
  │  Inicia useGameLoop (requestAnimationFrame)
  │  Carga mapa de ciudad
  │  Coloca personaje en el mundo
```

### 3.2 Renderizado del juego 2D

```
Game Loop (cada frame)
  │
  ├── useGameLoop → requestAnimationFrame
  │     │
  │     ├── Actualiza estado del juego
  │     ├── Procesa inputs del usuario
  │     └── Renderiza en canvas 2D
  │
  ├── useMMOCamera
  │     │
  │     ├── Sigue al jugador (modo automático)
  │     └── Permite exploración manual (arrastrar)
  │
  ├── useMapInteractions
  │     │
  │     ├── Detecta clics en el mapa
  │     ├── Calcula destino (World Units → píxeles)
  │     └── Envía comando de movimiento al backend
  │
  └── Componentes UI
        │
        ├── UnderBar (HP, MP, EXP, nivel)
        ├── Ventana Character (stats, equipo)
        ├── Ventana Inventory (items, equipar)
        └── Ventana Skills (habilidades)
```

---

## 4. FORMATO DEL PAQUETE SILKROAD

```
Byte 0-1:   Size (uint16 LE)
            Bits 0-14: Tamaño del payload
            Bit 15:    1 = Encriptado, 0 = Plano

Byte 2-3:   Opcode (uint16 LE)
            Código de operación (0x6102, 0xa102, etc.)

Byte 4:     Count Byte (security)
            Generado con semillas de handshake

Byte 5:     CRC Byte (security)
            Checksum de validación

Byte 6+:    Payload
            Datos del paquete (cifrados o planos según flag)
```

---

## 5. OPCODES PRINCIPALES

### Gateway Server (15880)

| Opcode | Nombre | Dirección | Propósito |
|--------|--------|-----------|-----------|
| 0x5000 | HANDSHAKE | S→C | Inicia handshake Blowfish |
| 0x9000 | HANDSHAKE_OK | C→S | Acepta handshake |
| 0x2001 | AGENT_IDENTIFY | C→S | Identifica cliente |
| 0x2001 | AGENT_IDENTIFY_REPLY | S→C | Responde tipo de servidor |
| 0x6100 | PATCH_REQUEST | C→S | Solicita información de parche |
| 0x6101 | REQUEST_SERVER_LIST | C→S | Solicita servidores disponibles |
| 0xa101 | SERVER_LIST | S→C | Lista de servidores |
| 0x6102 | LOGIN_REQUEST | C→S | Envía credenciales |
| 0xa102 | LOGIN_RESPONSE | S→C | Respuesta + datos del Agent |

### Agent Server (15882)

| Opcode | Nombre | Dirección | Propósito |
|--------|--------|-----------|-----------|
| 0x5000 | HANDSHAKE | S→C | Nuevo handshake |
| 0x9000 | HANDSHAKE_OK | C→S | Acepta handshake |
| 0x2001 | AGENT_IDENTIFY | C→S | Envía sessionId |
| 0x2001 | AGENT_IDENTIFY_REPLY | S→C | Confirma tipo Agent |
| 0x6103 | GAME_LOGIN | C→S | Login con sessionId |
| 0xa103 | GAME_LOGIN_REPLY | S→C | Confirmación de login |
| 0x7007 | CHAR_LIST_REQUEST | C→S | Solicita personajes |
| 0xb007 | CHARACTER_LIST | S→C | Lista de personajes |
| 0x7001 | CHARACTER_SELECT | C→S | Selecciona personaje |
| 0xb001 | CHARACTER_SELECT_CONFIRM | S→C | Confirmación + entrada al mundo |

---

## 6. ESTADOS DE SESIÓN

```
IDLE → GATEWAY_CONNECTING → GATEWAY_HANDSHAKE → GATEWAY_LOGIN → 
GATEWAY_RESPONSE → DISCONNECTING → AGENT_CONNECTING → AGENT_HANDSHAKE → 
AGENT_LOGIN → CHARACTER_LIST → CHARACTER_SELECT → PLAYING
```

Cada transición es manejada por `TcpConnectionManager` y `LoginHandler`,
que actúan como máquina de estados.
