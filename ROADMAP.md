# 🗺️ ROADMAP — Black Rose

> Plan de desarrollo por etapas.
> Fecha: 2026-05-25

---

## 📊 Leyenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Completado |
| 🟡 | En desarrollo |
| 🔵 | Planeado |
| ⚪ | Idea / por explorar |

---

## 🥇 FASE 1 — MVP (Actual)

> Objetivo: Login funcional + visualización de personajes + mapa de ciudad

### Backend Gateway
| Feature | Estado |
|---------|--------|
| Conexión TCP al Gateway Server (15880) | 🟡 |
| Handshake Blowfish + Security bytes | ✅ |
| Login request/response (0x6102/0xa102) | ✅ |
| Caracterización de servidores (0x6101/0xa101) | 🔵 |
| Reconexión al Agent Server (15882) | 🟡 |
| Game login (0x6103/0xa103) | 🔵 |
| Character list (0x7007/0xb007) | ✅ |
| Character select (0x7001/0xb001) | ✅ |
| WebSocket relay (JSON ↔ TCP) | ✅ |
| Sesiones múltiples | 🔵 |

### Frontend Web
| Feature | Estado |
|---------|--------|
| Portal web (Home, Rankings, Descargas) | ✅ |
| Login con WebSocket | ✅ |
| Selector de personajes | ✅ |
| Motor de juego 2D (bucle, cámara, mapa) | ✅ |
| Ventanas draggable (Character, Skills, Inventory) | ✅ |
| UnderBar (HP, MP, EXP) | ✅ |
| Mapa de ciudad con marcadores | ✅ |
| Conversión de coordenadas World Units → píxeles | ✅ |
| Integración Telegram Web App | 🟡 |
| Detección de colisiones | 🟡 |

### Bot MAUI (.NET)
| Feature | Estado |
|---------|--------|
| Estructura base del proyecto | ✅ |
| Silkroad Security API (Blowfish, paquetes) | ✅ |
| Clases de agente, gateway, opcodes | 🟡 |
| Interfaz de usuario (Chat, BotConfig, Player) | 🟡 |

---

## 🥈 FASE 2 — Beta

> Objetivo: Juego 2D funcional + Telegram + economía básica

### Gameplay
| Feature | Prioridad |
|---------|-----------|
| Movimiento en mapa 2D (click to move) | 🔴 |
| Sincronización de posición con GameServer | 🔴 |
| Visualización de otros jugadores en mapa | 🔴 |
| Chat en tiempo real | 🔴 |
| Inventario completo (usar, equipar, soltar) | 🟡 |
| Visualización de NPCs y mobs | 🟡 |
| Sistema de habilidades básico | 🟡 |

### Telegram
| Feature | Prioridad |
|---------|-----------|
| Mini App funcional | 🔴 |
| Login vía Telegram | 🔴 |
| Notificaciones de eventos | 🟡 |

### Social
| Feature | Prioridad |
|---------|-----------|
| Lista de amigos | 🟡 |
| Gremios (visualización) | 🟡 |
| Sistema de mensajería | 🟡 |

---

## 🥉 FASE 3 — Lanzamiento

> Objetivo: Plataforma completa y estable

| Feature | Prioridad |
|---------|-----------|
| Marketplace entre jugadores | 🔴 |
| Sistema de trading básico | 🔴 |
| Eventos automáticos | 🟡 |
| Rankings en tiempo real | 🟡 |
| Panel de administración | 🟡 |
| App Android (MAUI) | 🟡 |
| App iOS (MAUI) | 🟡 |
| Documentación completa | 🔴 |
| Tests automatizados | 🔴 |
| CI/CD | 🟡 |

---

## 🔮 FASE 4 — Post-lanzamiento

> Objetivo: Expandir y optimizar

| Feature | Prioridad |
|---------|-----------|
| Mapa mundial completo | 🟡 |
| Sistema de misiones 2D | ⚪ |
| Eventos comunitarios | ⚪ |
| Soporte multilingüe | ⚪ |
| API pública para desarrolladores | ⚪ |
| Temas visuales personalizables | ⚪ |
| Integración con Discord | ⚪ |
| Logros y trofeos | ⚪ |

---

## 📐 Hitos clave

| Hito | Fecha estimada | Dependencias |
|------|---------------|--------------|
| Login + Character list funcional | 🟡 Cerca | Backend Gateway completo |
| Mapa 2D con movimiento | 🔵 Fase 2 | Sincronización TCP |
| Telegram Mini App | 🔵 Fase 2 | WebSocket relay estable |
| Beta cerrada | 🔵 Fase 2 | MVP completo + tests |
| Lanzamiento público | 🔵 Fase 3 | Beta validada |
| Apps móviles nativas | 🔵 Fase 3 | MAUI funcional |
