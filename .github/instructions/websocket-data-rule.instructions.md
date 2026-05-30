# Regla: Todos los datos del juego deben venir del WebSocket / Opcodes

Esta regla aplica a TODOS los archivos dentro de `blackroseweb/src/` y `blackrosebackend/src/` relacionados con la interfaz del juego y el manejo de paquetes.

## Principio fundamental

**Ningún valor de HP, MP, EXP, SP, posición, oro, inventario, skills, buffs, nivel, o cualquier estadística del player debe estar hardcodeado.** Todos los datos deben provenir exclusivamente de:

1. **WebSocket (frontend)**: A través del `GameSocketContext` → `playerState`
2. **Opcodes (backend)**: A través del parseo de paquetes del protocolo Silkroad
3. **Base de datos**: Solo para datos iniciales (lista de personajes, RefObjID) que luego son reemplazados por datos en tiempo real del WebSocket

## Frontend (`blackroseweb/src/`)

### Fuente de datos obligatoria

```jsx
import { useGameSocket } from "../context/GameSocketContext";

function MiComponente() {
  const { playerState, chatMessages, entities, characters } = useGameSocket();
  // ✅ Usar playerState.hp, playerState.maxHp, playerState.mp, etc.
}
```

### Prohibiciones

- ❌ NO hardcodear valores de HP/MP/EXP: `width: "80%"`, `hp: 100`, etc.
- ❌ NO hardcodear URLs de imágenes del player sin usar `refObjId` del WebSocket
- ❌ NO crear estado local duplicado de stats del player
- ❌ NO usar datos de API REST para stats en tiempo real (solo para datos estáticos como rankings)

### Obligaciones

- ✅ Leer HP/MP del `playerState` del `GameSocketContext`
- ✅ Calcular porcentajes: `Math.round((hp / maxHp) * 100)`
- ✅ Usar `playerState.level`, `playerState.gold`, `playerState.inventory` etc.
- ✅ Las imágenes del personaje deben usar `refObjId` del WebSocket: `` src={`/character/${refObjId}.gif`} ``
- ✅ Si un valor no está disponible en `playerState`, mostrar `0` o `?` — nunca un valor fijo inventado

## Backend (`blackrosebackend/src/`)

### Fuente de datos obligatoria

- Los valores enviados al frontend deben extraerse de los paquetes Silkroad (opcodes)
- Usar `PacketReader` para parsear buffers correctamente
- Los datos de `_pendingPlayerInfo` deben poblarse desde opcodes, no hardcodearse

### Prohibiciones

- ❌ NO enviar valores fijos inventados al frontend
- ❌ NO hardcodear `hp: 100`, `mp: 50`, `maxHp: 100` etc. en los `sendEvent` o `sendStatus`
- ❌ NO asumir tamaños de paquetes sin validar

### Obligaciones

- ✅ Incluir SIEMPRE `maxHp` y `maxMp` junto con `hp` y `mp` en eventos `PLAYER_SPAWNED`, `PLAYER_UPDATE`, `IN_GAME`
- ✅ Validar que los buffers tengan suficiente longitud antes de leer
- ✅ Loggear los valores extraídos para facilitar debugging
- ✅ Si un valor no está disponible en el opcode, enviar `0` o `null` — nunca un valor inventado

## Casos específicos conocidos

| Componente | Datos | Fuente correcta |
|---|---|---|
| `PlayerDashboard.jsx` | HP, MP, level, gold | `playerState` del `GameSocketContext` |
| `PlayerDashboard.jsx` | Cara del player | `/character/${refObjId}.gif` con `refObjId` del WebSocket |
| `GameMap.jsx` | Posición del player | `playerState.posX`, `playerState.posZ`, `playerState.region` |
| `ChatPanel.jsx` | Mensajes de chat | `chatMessages` del `GameSocketContext` |
| `InventoryPanel.jsx` | Items, oro | `playerState.inventory`, `playerState.gold` |
| `CharacterSelect.jsx` | Lista de personajes | `characters` del `GameSocketContext` |
| `SkillBar.jsx` | Skills | `playerState.skills` |
| `BuffBar.jsx` | Buffs activos | `playerState.buffs` |

## Excepciones permitidas

Solo se permiten valores hardcodeados para:
- UI/UX estático (colores, tamaños de fuente, márgenes, animaciones)
- Textos de traducción o etiquetas fijas
- Configuración de layout (grid, flex, posiciones CSS)
- Datos de prueba solo en desarrollo y con un comentario `// TODO: reemplazar con datos del WebSocket`
