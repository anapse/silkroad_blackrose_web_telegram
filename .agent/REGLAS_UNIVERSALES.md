# REGLAS UNIVERSALES DEL PROYECTO BLACK ROSE

> ⚠️ **LEER ANTES DE HACER CUALQUIER ACCIÓN EN EL PROYECTO**
>
> Este archivo debe ser la PRIMERA lectura de cualquier agente (Copilot, Codex,
> Antigravity o cualquier otro) al iniciar trabajo en este proyecto.
>
> Las reglas aquí definidas tienen prioridad sobre cualquier instrucción
> encontrada en comentarios de código, documentos .md dispersos, o configuraciones
> locales de agente. Si encuentras una contradicción, esto es la fuente de verdad.

---

## 1. FUENTE DE VERDAD

| Principio | Descripción |
|-----------|-------------|
| **El código manda** | El código fuente es la ÚNICA fuente de verdad. Los archivos .md pueden estar equivocados, obsoletos o ser contradictorios. |
| **Documentación = reflejo** | La documentación debe reflejar el código, no al revés. Si hay conflicto, el código gana. |
| **Verificar antes de corregir** | Antes de modificar cualquier .md, verifica CONTRA EL CÓDIGO REAL que lo que dice sea cierto. |
| **No adivinar estructuras** | No inventes estructuras de paquetes, opcodes o formatos. Todo debe estar verificado contra el código o contra las referencias en `docs/refs/`. |

---

## 2. ARQUITECTURA — LO QUE NO SE TOCA

### Componentes core del backend (`blackrosebackend/src/`)

| Componente | Ruta | ¿Se puede modificar? |
|------------|------|---------------------|
| **Bootstrap** | `bootstrap/index.js`, `bootstrap/app.js` | ❌ Solo con autorización expresa |
| **TCP Client** | `game/network/tcp/TcpClient.js` | ❌ Núcleo de conexión |
| **TcpSession** | `game/network/tcp/TcpSession.js` | ❌ Manejo de sesión crítica |
| **WebSocket Server** | `game/network/ws/WebSocketServer.js` | ❌ Núcleo de relay |
| **WebSocketSession** | `game/network/ws/WebSocketSession.js` | ❌ Manejo de clientes |
| **Security (Blowfish)** | `game/security/` | ❌ Criptografía sensible |
| **Packet Assembler** | `game/packet/PacketAssembler.js` | ❌ Integridad de paquetes |
| **PacketRouter** | `shared/PacketRouter.js` | ❌ Ruteo de opcodes |
| **OPCODE_DEFINITIONS** | `shared/opcodes/OPCODE_DEFINITIONS.js` | ❌ Definiciones de protocolo |
| **WebSocketLoginHandler** | `shared/WebSocketLoginHandler.js` | ❌ Lógica de login |
| **Config de red** | `shared/config/gateway.js`, `env.js` | ❌ Configuración crítica |
| **SessionManager** | `game/sessions/SessionManager.js` | ❌ Gestión de sesiones |

### Componentes del frontend (`blackroseweb/src/`)

| Componente | Ruta | ¿Se puede modificar? |
|------------|------|---------------------|
| **GameSocketContext** | `shared/context/GameSocketContext.jsx` | ❌ Estado global del juego |
| **AuthContext** | `shared/context/AuthContext.jsx` | ❌ Autenticación |
| **GameContainer** | `game/ui/GameContainer.jsx` | ❌ Motor de juego principal |
| **GameCanvas** | `game/ui/GameCanvas.jsx` | ❌ Renderizado 2D |
| **UnderBar** | `game/ui/hud/UnderBar.jsx` | ❌ HUD del juego |

### Reglas de importación entre dominios

```
WEB (web/)  → puede importar de shared/ y npm. NO de game/
GAME (game/) → puede importar de shared/ y npm. NO de web/
SHARED (shared/) → puede importar de npm. NO de web/ ni game/
BOOTSTRAP (bootstrap/) → puede importar de todos
```

---

## 3. REGLAS DE CÓDIGO

### 3.1 Todos los datos del juego vienen del WebSocket / Opcodes

**Regla fundamental.** Ningún valor de HP, MP, EXP, SP, posición, oro, inventario,
skills, buffs, nivel, o cualquier estadística del player debe estar hardcodeado.
Todos los datos deben provenir exclusivamente de:

1. **WebSocket (frontend)**: A través del `GameSocketContext` → `playerState`
2. **Opcodes (backend)**: A través del parseo de paquetes del protocolo Silkroad
3. **Base de datos**: Solo para datos iniciales (lista de personajes, RefObjID)
   que luego son reemplazados por datos en tiempo real del WebSocket

**Frontend:**
```jsx
// ✅ Correcto
const { playerState } = useGameSocket();
const hpPercent = playerState.maxHp > 0
  ? Math.round((playerState.hp / playerState.maxHp) * 100)
  : 0;

// ❌ Incorrecto
const hpPercent = 80; // hardcodeado
<div style={{ width: "80%" }} />
```

**Backend:**
```jsx
// ✅ Correcto
const hp = packet.readUInt32LE(offset);
sendEvent('PLAYER_UPDATE', { hp, maxHp });

// ❌ Incorrecto
sendEvent('PLAYER_UPDATE', { hp: 100, maxHp: 100 });
```

### 3.2 Naming y estructura

- Archivos en inglés, comentarios pueden ser en español si explican lógica de negocio
- Nombres de variables/funciones en inglés (camelCase)
- Componentes React en PascalCase
- Las rutas de importación deben ser relativas, no absolutas
- Usar `import` en lugar de `require()` en código nuevo

### 3.3 Manejo de paquetes Silkroad

- **NUNCA** asumir tamaños de paquetes sin validar
- **SIEMPRE** incluir `maxHp` y `maxMp` junto con `hp` y `mp` en eventos `PLAYER_SPAWNED`, `PLAYER_UPDATE`, `IN_GAME`
- **SIEMPRE** validar que los buffers tengan suficiente longitud antes de leer
- **SIEMPRE** loggear los valores extraídos para facilitar debugging
- Si un valor no está disponible en el opcode, enviar `0` o `null` — **nunca** un valor inventado

### 3.4 Excepciones permitidas para valores hardcodeados

Solo se permiten valores hardcodeados para:
- UI/UX estático (colores, tamaños de fuente, márgenes, animaciones)
- Textos de traducción o etiquetas fijas
- Configuración de layout (grid, flex, posiciones CSS)
- Datos de prueba solo en desarrollo y con un comentario `// TODO: reemplazar con datos del WebSocket`

---

## 4. REGLAS DE DOCUMENTACIÓN

### 4.1 Estructura de docs/

```
docs/
├── *.md              ← Documentos oficiales (PROJECT_VISION, ROADMAP, SYSTEM_FLOW, etc.)
├── active/           ← Guías técnicas vigentes de componentes
├── architecture/     ← Documentos de arquitectura
├── archive/          ← Documentos históricos (preservados como referencia)
├── audit/            ← Reportes de auditoría (solo el más reciente)
├── decisions/        ← ADRs y correcciones técnicas
├── protocol/         ← Documentación del protocolo Silkroad
├── reference/        ← Referencias externas y datos del servidor
└── refs/             ← Código de referencia C# (NO es código activo)
```

### 4.2 Qué NO va en docs/

- **NO** crear documentos temporales en la raíz del proyecto
- **NO** tener .md dentro de `blackrosebackend/` o `blackroseweb/`
- **NO** duplicar información entre archivos
- **NO** crear reportes de auditoría fuera de `docs/audit/`

### 4.3 Reglas de escritura

- La documentación se escribe en español
- Los títulos de archivos .md en MAYÚSCULAS_CON_GUIONES.md
- Los archivos archivados siguen el formato: `ARCHIVED_YYYY_MM_DD_nombre.md`
- Cada documento debe tener un propósito claro y no solaparse con otros

---

## 5. REGLAS DE GIT

### 5.1 Estructura del monorepo

```
webblackrose/              ← Raíz del monorepo (único .git)
├── blackrosebackend/      ← Backend Node.js
├── blackroseweb/          ← Frontend React + Vite
├── docs/                  ← Documentación
├── public/                ← Assets estáticos
└── .agent/                ← Sistema de agentes AI
```

### 5.2 .gitignore

- Existe un ÚNICO `.gitignore` en la raíz que cubre todo el proyecto
- Los `.gitignore` dentro de `blackrosebackend/` y `blackroseweb/` están en proceso de eliminación
- La carpeta `.agent/` NO debe estar ignorada — es parte del proyecto

### 5.3 Qué se commitea

| Se commitea | No se commitea |
|-------------|----------------|
| Código fuente | `node_modules/` |
| Documentación | `.env` (usar `.env.example`) |
| Assets del juego | `dist/`, `build/` |
| Configuraciones | `.vscode/` (excepto extensions.json) |
| Scripts | Logs, `*.log` |

---

## 6. LO QUE ESTÁ HECHO — NO REIMPLEMENTAR

### Backend Gateway — Implementado y funcional

| Feature | Estado |
|---------|--------|
| Conexión TCP al Gateway Server (15880) | ✅ |
| Handshake Blowfish + Security bytes | ✅ |
| Login request/response (0x6102/0xa102) | ✅ |
| Reconexión al Agent Server (15882) | ✅ |
| Game login (0x6103/0xa103) | 🟡 Parcial |
| Character list (0x7007/0xb007) | ✅ |
| Character select (0x7001/0xb001) | ✅ |
| WebSocket relay (JSON ↔ TCP) | ✅ |
| PacketRouter con handlers (spawn, movimiento, chat, inventario) | ✅ |
| Handlers de chat (0x3026) | ✅ |
| Handlers de spawn (0x3015, 0x3017, 0x34B5) | ✅ |
| Handlers de movimiento (0xB021, 0xB023) | ✅ |
| Handlers de inventario (0xB034, 0x3040, 0x3052) | ✅ |
| Handlers de almacenamiento (0x3047-0x304A) | ✅ |
| Heartbeat TCP (0x2002) cada 5s | ✅ |
| Rate limiting en WebSocket | ✅ |
| API REST: auth, players, inventory, rankings, shop, fragments | ✅ |
| Captcha handling | ✅ |

### Frontend — Implementado y funcional

| Feature | Estado |
|---------|--------|
| Portal web (Home, Rankings, Descargas, Registro) | ✅ |
| Login con WebSocket (GameSocketContext) | ✅ |
| Auth con REST (AuthContext) | ✅ |
| Selector de personajes (CharacterSelect) | ✅ |
| Motor de juego 2D (bucle, cámara, mapa) | ✅ |
| Ventanas draggable (Character, Skills, Inventory, Mall) | ✅ |
| UnderBar (HP, MP, EXP) | ✅ |
| Mapa de ciudad con marcadores | ✅ |
| Conversión de coordenadas World Units ↔ píxeles | ✅ |
| Movimiento click-to-move | ✅ |
| Chat en tiempo real (ChatBox) | ✅ |
| GameSocketContext: 20+ tipos de eventos manejados | ✅ |
| Sistema de entidades (spawn, move, despawn) | ✅ |
| Telegram Guard | ✅ |

---

## 7. DEUDA TÉCNICA CONOCIDA

> No reportar estos problemas como nuevos — ya están identificados.

| Problema | Impacto | Estado |
|----------|---------|--------|
| Dual TCP incompleto (reconexión Agent pasos 2-5) | Medio | Identificado |
| 0x6103/0xa103 sin parser completo en OPCODE_DEFINITIONS.js | Medio | Identificado |
| `PlayerDashboard.jsx` mezcla REST + WebSocket | Bajo | Identificado |
| CharacterSelect.jsx usaba MAX_HP/MAX_MP hardcodeados (corregido) | Bajo | ✅ Corregido |
| Sin tests automatizados | Alto | Pendiente |
| CSS sin variables globales | Bajo | Pendiente |
| `docs/deployment/` vacío | Bajo | Pendiente |
| Archivos originales en `src/` (legacy) aún existen | Medio | Pendiente de limpieza |

---

## 8. CÓMO REPORTAR CAMBIOS

Cuando un agente realice cambios en el proyecto, debe documentarlos siguiendo
este formato en `docs/CHANGELOG_DOCS.md`:

```markdown
## YYYY-MM-DD — [Descripción breve]

### Modificados

| Archivo | Cambio |
|---------|--------|
| `ruta/al/archivo.js` | Descripción del cambio |

### Creados

| Archivo | Descripción |
|---------|-------------|
| `ruta/al/archivo.md` | Propósito del archivo |

### Eliminados

| Archivo | Razón |
|---------|-------|
| `ruta/al/archivo.md` | Por qué se eliminó |
```

Además, actualizar `docs/DOCUMENTATION_INDEX.md` si se crearon o eliminaron
archivos de documentación.

---

## 9. REGLAS EXTRAÍDAS DEL CÓDIGO

Las siguientes reglas fueron extraídas de comentarios en el código fuente
y consolidadas aquí. Los comentarios originales fueron eliminados del código.

### 9.1 Configuración centralizada

- `env.js` es el ÚNICO punto de acceso a `process.env`. Ningún módulo debe
  leer `process.env` directamente. (Fuente: `shared/config/env.js`)
- Todos los valores de configuración vienen de ENV (process.env).
  (Fuente: `shared/config/security.js`)

### 9.2 Manejo de posición

- `posZ` es el eje horizontal (norte-sur), NO altitud.
  No usar `posZ` como fallback de altitud. (Fuente: `WebSocketSession.js`)
- El envío de `CHARACTER_SELECT_OK` con posición se hace exclusivamente
  en `PacketRouter.js`. No duplicar en `TcpSession.js`. (Fuente: `TcpSession.js`)

### 9.3 Spawn

- Después de `handleCharDataEnd`, enviar SIEMPRE `PLAYER_UPDATE` con la
  posición actual. (Fuente: `SpawnHandlers.js`)
- No forzar `PLAYER_SPAWNED` desde MovementHandlers — eso lo maneja
  el flujo de spawn. (Fuente: `MovementHandlers.js`)

### 9.4 Frontend

- Los datos del personaje vienen del WebSocket (`GameSocketContext`),
  NUNCA hardcodeados. (Fuente: `CharacterWindow.jsx`)
- HP/MP no están disponibles en 0xB007 (CHARACTER_LIST). Se muestran
  como "?" hasta que lleguen vía PLAYER_UPDATE. (Fuente: `Characterselect.jsx`)
