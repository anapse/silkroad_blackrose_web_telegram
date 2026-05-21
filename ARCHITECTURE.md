# BLACK ROSE WEB ENGINE

## ARCHITECTURE OVERVIEW

The **Black Rose Web Engine** is a unified monorepo that combines the backend transport layer, shared Silkroad protocol utilities, and the frontend client viewer. All components interact through a single runtime, treating the GameServer as the authority.

```
GameServer
   ⇅
Backend (Gateway / Transport)
   ⇅
Shared (Protocol / Opcode Translator)
   ⇅
Frontend (Client / Monitor)
```

### SYSTEM SETTINGS
```
SYSTEM_MODE=MONOREPO
PROJECT_MODE=UNIFIED
NETWORK_MODE=GAME_PROTOCOL
FRONTEND_ROLE=CLIENT
BACKEND_ROLE=TRANSPORT
```

---

## Directory Structure (Conceptual)
```
BlackRose/
│
├── blackrosebackend/   # Transport, security, relay logic
│   └── src/...
│
├── blackroseweb/       # React client, UI, packet monitor
│   └── src/...
│
└── shared/              # Protocol definitions, opcode handling, serializer
    └── src/...
```

### Component Roles
| Component | Location | Responsibility | Consumer |
|-----------|----------|----------------|----------|
| **Gateway** | `blackrosebackend` | Handles TCP transport, security handshake, raw packet relay | `blackroseweb` (via Shared) |
| **Shared Protocol** | `shared` | Defines Silkroad packet format, opcode constants, serialization/deserialization, `PacketTranslator` | Backend & Frontend |
| **Client Monitor** | `blackroseweb` | Renders packet stream, hexadecimal view, JSON export, UI interaction | End‑user |

---

## Design Principles
1. **Single Runtime** – Backend and frontend share the same protocol implementation; no duplicated packet logic.
2. **Cross‑Component Impact Awareness** – Any change to `PacketTranslator` must be reflected in `TcpSession`, `RelayManager`, `WebSocketSession`, and `ConnectionTester`.
3. **No Direct DB ↔ Frontend Coupling** – Frontend never talks directly to databases; all data flows through the shared protocol.
4. **Extensibility** – Future opcode handlers, game entity decoding, and map synchronization will be added in the `shared` layer under `OPCODE_HANDLERS`.

---

## Future Roadmap (Phase 2)
- Implement specific opcode handlers in `shared/OPCODE_HANDLERS`.
- Add movement, entity, inventory, HP/MP handling.
- Integrate map synchronization.
- Expand UI to render gameplay elements.

---

*This document reflects the current unified architecture. All future modifications must respect the monorepo logical structure described above.*
