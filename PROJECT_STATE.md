# PROJECT_STATE.md — Estado del proyecto antes del checkpoint

> Fecha: 2026-05-25
> Propósito: Preservar el estado actual del proyecto como línea temporal antes de continuar con limpieza estructural.

---

## Estado general

| Atributo | Valor |
|----------|-------|
| Fecha | 2026-05-25 |
| Rama | `main` |
| Último commit | `7e6955f` — "Fix spawn (0x3012) + chat bidireccional + GAME_LOGIN writeByte + ChatBox + bot project" |
| Tags | Ninguno |
| Estado funcional | ✅ Funcional (backend inicia, web inicia, docs abren, scripts funcionan) |

---

## Componentes funcionando

| Componente | Estado | Descripción |
|-----------|--------|-------------|
| `blackrosebackend/` | ✅ Funcional | Gateway TCP/WebSocket, conexión Dual TCP, handshake Blowfish, login flow |
| `blackroseweb/` | ✅ Funcional | Frontend React + Vite, portal web, motor de juego 2D, Telegram guard |
| `docs/` | ✅ Funcional | Documentación reconstruida, organizada y congelada |
| `docs/refs/` | ✅ Migrado | Código de referencia C# clasificado en code/ y archive/ |
| `.agent/` | ✅ Intacto | Sistema de agentes AI (AG Kit) sin modificar |

---

## Limitaciones conocidas

| Limitación | Detalle |
|-----------|---------|
| Dual TCP incompleto | `TcpConnectionManager.js` existe pero la reconexión al Agent (pasos 2-5) puede no estar 100% implementada |
| 0x6103/0xa103 sin parser | GAME_LOGIN/GAME_LOGIN_REPLY no tienen parser en OPCODE_DEFINITIONS.js |
| REST contradictorio | README dice "no expone REST APIs" pero el portal web sí tiene rutas REST (controllers/routes) |
| game/constants/ no existe | Los constants están en `/constants/gameConstants.js`, no en `/game/constants/` |
| Credenciales MSSQL en código | `database/conection.js` expone usuario/contraseña de la BD |
| LOGIN_FRONTEND_EXAMPLE.jsx | No está presente en el disco (fue eliminado en sesiones anteriores) |

---

## Cambios sin commit respecto al último commit

### Archivos nuevos (untracked)
- `PROJECT_VISION.md`, `ROADMAP.md`, `SYSTEM_FLOW.md` — documentación reconstruida
- `blackrosebackend/src/shared/InventoryParser.js`, `ItemTypeDB.js` — nuevos archivos del backend
- `docs/` — toda la estructura documental reconstruida
- `package-lock.json` — lockfile de dependencias

### Archivos modificados (unstaged)
- `ARCHITECTURE.md`, `README.md` — reescritos durante reconstrucción documental
- `blackrosebackend/src/app.js` — cambios para servir frontend estático
- `blackrosebackend/src/gamegateway/tcp/TcpSession.js` — mejoras en sesión TCP
- `blackrosebackend/src/gamegateway/websocket/WebSocketSession.js` — mejoras en WebSocket
- `blackrosebackend/src/shared/PacketRouter.js`, `WebSocketLoginHandler.js` — mejoras en ruteo

### Archivos eliminados (deleted)
- `bot/obj/`, `bot/bin/`, `.vs/` — basura de compilación eliminada del disco
- Documentos movidos de raíz a `docs/` (ARCHIVED_*, etc.)

---

## Notas

Este checkpoint marca el fin de la fase de reconstrucción documental y migración del bot.
A partir de aquí comienza la limpieza estructural del repositorio.

Todo el conocimiento está preservado:
- Código activo → `blackrosebackend/`, `blackroseweb/`
- Referencias C# → `docs/refs/code/`
- Documentación → `docs/`
- Historial → `docs/archive/`
- Auditorías → `docs/audit/`
