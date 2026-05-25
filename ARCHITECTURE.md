# 🏗️ Black Rose — Arquitectura del Sistema

> Este documento describe la arquitectura real del proyecto.
> Black Rose NO es una aplicación web tradicional con REST APIs.
> Es un **Gateway de protocolo** que traduce el flujo binario de Silkroad a experiencias 2D multiplataforma.

---

## ⚡ Principio fundamental

```
El GameServer (Silkroad) es la autoridad.
El backend no crea lógica de juego propia.
Traduce, relay y sincroniza.
```

No hay miles de endpoints REST. Hay **buffers, opcodes y sesiones**.

---

## 📐 Diagrama de alto nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                      GAME SERVER (Silkroad)                      │
│                  26.74.212.246:15880 / 15882                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ TCP / Buffers / Opcodes
                           │ Blowfish / Security Bytes / CRC
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BLACKROSE BACKEND (Gateway)                    │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │  TCP Client  │  │   Security   │  │   Packet / Opcode       │  │
│  │  (Gateway)   │──│   Blowfish   │──│   Translator            │  │
│  │  TCP Client  │  │   Handshake  │  │   LoginHandler          │  │
│  │  (Agent)     │  │   CRC/Count  │  │   RequestBuilder        │  │
│  └──────┬───────┘  └──────────────┘  └───────────┬─────────────┘  │
│         │                                        │                │
│         └──────────────┬─────────────────────────┘                │
│                        ▼                                          │
│              ┌──────────────────┐                                 │
│              │  WebSocket Server │  (ws://host:8081)              │
│              └────────┬─────────┘                                 │
└───────────────────────┼───────────────────────────────────────────┘
                        │ WebSocket / JSON / Estados
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENTES 2D                                │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │  Web (React)  │  │  Telegram    │  │  Mobile (MAUI)        │  │
│  │  blackroseweb │  │  Mini App    │  │  Android / iOS        │  │
│  └──────────────┘  └──────────────┘  └────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de conexión (Dual TCP)

Silkroad v130 requiere **dos conexiones TCP separadas**:

### Fase 1 — Gateway (puerto 15880)

```
Cliente WebSocket
  ↓ {type:"LOGIN", username, password}
Backend recibe JSON
  ↓ Construye paquete binario 0x6102
Conexión TCP al Gateway Server (15880)
  ↓ Handshake (0x5000/0x9000) + Blowfish
  ↓ Login Request (0x6102)
  ↓ LOGIN_RESPONSE (0xa102) → sessionId + host:port del Agent
  ↓ DESCONECTAR del Gateway
```

### Fase 2 — Agent (puerto 15882)

```
NUEVA conexión TCP al Agent Server (15882)
  ↓ NUEVO Handshake (0x5000/0x9000)
  ↓ GAME_LOGIN (0x6103) con sessionId
  ↓ CHARACTER_LIST (0xb007)
  ↓ CHARACTER_SELECT (0x7001)
  ↓ ¡En mundo!
```

> **Detalle crítico**: Cada fase tiene su propio handshake Blowfish.
> El sessionId obtenido del Gateway se usa para autenticar en el Agent.

---

## 🧩 Componentes del backend

### `blackrosebackend/src/gamegateway/tcp/`
| Archivo | Responsabilidad |
|---------|----------------|
| `TcpClient.js` | Cliente TCP raw con manejo de buffers |
| `TcpSession.js` | Sesión completa: handshake, login, character select |
| `TcpConnectionManager.js` | Gestión de 2 conexiones (Gateway → Agent) |

### `blackrosebackend/src/gamegateway/websocket/`
| Archivo | Responsabilidad |
|---------|----------------|
| `WebSocketServer.js` | Servidor WebSocket, acepta clientes |
| `WebSocketSession.js` | Sesión WebSocket, rutea mensajes JSON ↔ TCP |

### `blackrosebackend/src/gamegateway/security/`
| Archivo | Responsabilidad |
|---------|----------------|
| `Security.js` | Handshake Blowfish, generación de claves |
| `securitytable.js` | Tablas de seguridad del handshake |

### `blackrosebackend/src/gamegateway/packet/`
| Archivo | Responsabilidad |
|---------|----------------|
| `PacketAssembler.js` | Ensambla buffers TCP en paquetes completos |
| `PacketReader.js` | Lee campos de un paquete binario |
| `PacketWriter.js` | Escribe campos en un paquete binario |

### `blackrosebackend/src/shared/`
| Archivo | Responsabilidad |
|---------|----------------|
| `PacketTranslator.js` | Traduce buffer → opcode + datos parseados |
| `opcodes/OPCODE_DEFINITIONS.js` | Definiciones y parsers de opcodes |
| `builders/LoginRequestBuilder.js` | Construye paquetes de login/character |
| `handlers/LoginHandler.js` | Procesa respuestas del servidor |
| `WebSocketLoginHandler.js` | Puente JSON WebSocket → paquetes TCP |
| `InventoryParser.js` | Parsea datos de inventario |
| `ItemTypeDB.js` | Base de datos de tipos de ítems |

---

## 🎨 Componentes del frontend

### `blackroseweb/src/game/` — Motor de juego 2D
| Archivo | Responsabilidad |
|---------|----------------|
| `hooks/useGameLoop.js` | Bucle principal del juego (requestAnimationFrame) |
| `hooks/useMMOCamera.js` | Cámara con seguimiento y exploración manual |
| `hooks/useMapInteractions.js` | Interacciones con el mapa (clics, marcadores) |
| `utils/` | Conversión de coordenadas World Units → píxeles |
| `constants/` | Regiones, mapas, puntos de interés |

### `blackroseweb/src/Componentes/` — Interfaz de usuario
| Componente | Descripción |
|------------|-------------|
| `game/UnderBar.jsx` | Barra inferior del juego (HP, MP, EXP) |
| `game/Interfaces/` | Ventanas draggable: Character, Skills, Inventory |
| `Home.jsx` | Portal web principal |
| `Login.jsx` | Pantalla de login |

### `blackroseweb/src/context/` — Estado global
| Contexto | Descripción |
|----------|-------------|
| `AuthContext.jsx` | Autenticación y sesión de usuario |

---

## 🔐 Seguridad

El protocolo Silkroad usa múltiples capas de seguridad:

1. **Handshake Blowfish** — Intercambio de claves al iniciar conexión
2. **Security Bytes** — Count byte + CRC byte en cada paquete
3. **Cifrado masivo** — Blowfish en modo CBC para datos de juego
4. **Flags de seguridad** — Negociados durante el handshake

Ver [`docs/protocol/DUAL_TCP_ARCHITECTURE.md`](docs/protocol/DUAL_TCP_ARCHITECTURE.md) para detalles completos.

---

## 💾 Base de datos

La base de datos (MSSQL) es parte del ecosistema original de Silkroad.
El backend puede consultarla para operaciones específicas, pero **el estado de juego en tiempo real siempre viene del GameServer vía TCP**.

---

## 📚 Lecturas recomendadas

| Documento | Contenido |
|-----------|-----------|
| [`SYSTEM_FLOW.md`](SYSTEM_FLOW.md) | Flujo completo: usuario → cliente → backend → GameServer |
| [`PROJECT_VISION.md`](PROJECT_VISION.md) | Visión del producto y modelo económico |
| [`ROADMAP.md`](ROADMAP.md) | Plan de desarrollo por etapas |
| [`docs/protocol/DUAL_TCP_ARCHITECTURE.md`](docs/protocol/DUAL_TCP_ARCHITECTURE.md) | Arquitectura detallada del Dual TCP |
| [`docs/protocol/SILKROAD_PACKET_DECRYPT_ANALYSIS.md`](docs/protocol/SILKROAD_PACKET_DECRYPT_ANALYSIS.md) | Análisis de cifrado Silkroad |
| [`docs/decisions/CORRECTIONS_LOG.md`](docs/decisions/CORRECTIONS_LOG.md) | Historial de correcciones técnicas |
| [`docs/DOCUMENTATION_INDEX.md`](docs/DOCUMENTATION_INDEX.md) | Índice completo de documentación |
