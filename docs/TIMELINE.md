# ⏳ TIMELINE — Línea de tiempo del proyecto Black Rose

> Registro de la evolución del proyecto desde su origen hasta el estado actual.
> Cada fase representa un hito importante en el desarrollo.

---

## Fase 0 — Origen del proyecto

| Atributo | Valor |
|----------|-------|
| Período | Anterior a mayo 2026 |
| Objetivo | Crear un bot MAUI para Silkroad Online |
| Resultado | Proyecto `bot/` funcional con conexión Gateway/Agent, Blowfish, UI en XAML |

**Logros:**
- Implementación completa de Silkroad Security API (Blowfish, handshake, paquetes)
- Conexión Dual TCP (Gateway → Agent)
- Interfaz de usuario MAUI multiplataforma (Android, iOS, Windows)
- Lógica de entrenamiento, auto-potion, movimiento

**Estado:** ✅ Completado (código preservado como referencia en `docs/refs/`)

---

## Fase 1 — Primer Gateway

| Atributo | Valor |
|----------|-------|
| Período | Anterior a mayo 2026 |
| Objetivo | Crear un Gateway Node.js que traduzca el protocolo Silkroad a WebSocket |
| Resultado | `blackrosebackend/` funcional con TCP relay, Blowfish, handshake |

**Logros:**
- Servidor WebSocket que acepta clientes del frontend
- Cliente TCP que se conecta al GameServer
- Handshake Blowfish completo (0x5000/0x9000)
- PacketAssembler, PacketReader, PacketWriter
- Primer login flow funcional

**Estado:** ✅ Completado (núcleo activo del backend)

---

## Fase 2 — Cliente Web

| Atributo | Valor |
|----------|-------|
| Período | Anterior a mayo 2026 |
| Objetivo | Crear un portal web con motor de juego 2D |
| Resultado | `blackroseweb/` funcional con React + Vite + game engine |

**Logros:**
- Portal web (Home, Rankings, Descargas)
- Login vía WebSocket
- Motor de juego 2D (game loop, cámara, mapa)
- Ventanas draggable (Character, Skills, Inventory)
- UnderBar (HP, MP, EXP)
- Integración con Telegram Web App
- Selector de personajes

**Estado:** ✅ Completado (frontend activo)

---

## Fase 3 — Login Flow + Dual TCP

| Atributo | Valor |
|----------|-------|
| Período | 20-24 mayo 2026 |
| Objetivo | Implementar login flow completo y arquitectura Dual TCP |
| Resultado | Login request/response, character list/select funcional |

**Logros:**
- `OPCODE_DEFINITIONS.js` con parsers para 0x6102, 0xa102, 0xb007, 0x7001, 0xb001
- `LoginRequestBuilder.js` para construir paquetes de login
- `LoginHandler.js` para procesar respuestas del servidor
- `WebSocketLoginHandler.js` como puente JSON ↔ TCP
- `TcpConnectionManager.js` para gestión de 2 conexiones (Gateway → Agent)
- Corrección de paquetes malformados (size+opcode faltantes)
- Documentación: `LOGIN_IMPLEMENTATION_GUIDE.md`, `TESTING_GUIDE.md`, `CORRECTIONS_LOG.md`

**Estado:** ✅ Completado (login flow funcional)

---

## Fase 4 — Sistema Documental

| Atributo | Valor |
|----------|-------|
| Período | 25 mayo 2026 (mañana) |
| Objetivo | Reconstruir toda la documentación del proyecto |
| Resultado | Sistema documental completo con políticas, índice y governance |

**Logros:**
- Reescritura completa de `README.md` y `ARCHITECTURE.md`
- Creación de `PROJECT_VISION.md`, `ROADMAP.md`, `SYSTEM_FLOW.md`
- Organización de `docs/` en subcarpetas temáticas
- `DOCUMENTATION_POLICY.md` con 10 reglas oficiales
- `DOCUMENTATION_INDEX.md` como índice central
- Auditorías: `DOC_STATUS.md`, `DOC_ALIGNMENT_REPORT.md`, `DOC_GOVERNANCE_REPORT.md`
- Migración de `bot/` → `docs/refs/` (440 MB → 5 MB)
- Sanitización de `README.md` (eliminación de datos sensibles)

**Estado:** ✅ Completado (documentación congelada)

---

## Fase 5 — Limpieza Estructural

| Atributo | Valor |
|----------|-------|
| Período | 25 mayo 2026 (tarde) — checkpoint completado |
| Objetivo | Limpiar el repositorio de basura versionada |
| Resultado | Checkpoint `v0-legacy-working` creado |

**Logros:**
- `.gitignore` actualizado con reglas para `bin/`, `obj/`, `.vs/`
- Commit checkpoint con todo el estado actual
- Tag `v0-legacy-working` creado
- `PROJECT_STATE.md` documentando el estado pre-limpieza

**Estado:** 🟡 En progreso (checkpoint creado, limpieza por continuar)

---

## Fase 6 — Estado Actual

| Atributo | Valor |
|----------|-------|
| Fecha | 2026-05-25 |
| Commit | `9d0c186` (tag: `v0-legacy-working`) |
| Rama | `main` |

### Componentes

| Componente | Estado | Ubicación |
|-----------|--------|-----------|
| Backend Gateway | ✅ Activo | `blackrosebackend/` |
| Frontend Web | ✅ Activo | `blackroseweb/` |
| Documentación | ✅ Congelada | `docs/` |
| Referencias C# | ✅ Preservadas | `docs/refs/code/` |
| Agentes AI | ✅ Intactos | `.agent/` |

### Pendiente

- Limpieza de archivos basura versionados (post-checkpoint)
- Push del commit y tag a origin
- Verificación de funcionalidad post-limpieza
