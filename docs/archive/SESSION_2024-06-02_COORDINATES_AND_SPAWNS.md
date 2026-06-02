# Sesión 2024-06-02: Coordenadas, Spawns y Estandarización

## Resumen
Sesión enfocada en corregir el sistema de coordenadas del canvas 2D, estandarizar fórmulas, y diagnosticar por qué las entidades no aparecen hasta que el jugador se mueve.

---

## 1. Sistema de Coordenadas de Canvas

### Fórmula centralizada (archivo: `geo.js`)
Se creó `coordToCanvas()` como función ÚNICA para calcular posiciones en píxeles del canvas:

```javascript
coordToCanvas(regionX, regionZ, posX, posZ, playerRegionX, playerRegionZ)
  dx = regionX - playerRegionX
  dz = regionZ - playerRegionZ
  canvasX = (TILE_RADIUS + dx) * BASE_TILE_SZ + posX
  canvasZ = (TILE_RADIUS - dz) * BASE_TILE_SZ + (BASE_TILE_SZ - posZ)
```

**Fórmula final:** `canvasZ = (5 - dz) * 192 + (192 - posZ)`

### Archivos actualizados
- `geo.js`: exporta `coordToCanvas()`, `playerToCanvas()`, `worldToRender()`, `renderToWorld()`
- `usePlayerInit.js`: usa `playerToCanvas()` para renderX/renderZ
- `useGameLoop.js`: usa `coordToCanvas()` para sincronizar render del player
- `GameContainer.jsx`: usa `coordToCanvas()` para stableRX/stableRZ y offset del canvas
- `EntityLayer.jsx`: usa `coordToCanvas()` (importado de geo.js)

### Fix: CAMERA_OFFSET_Y
Se cambió `CAMERA_OFFSET_Y` de 80 a 0 tanto en `GameContainer.jsx` como `GameCanvas.jsx`. Esto eliminó un desplazamiento de 80px al sur que causaba que el player apareciera más abajo de lo debido comparado con el 3D.

### Orden de ejes (verificado con MerchBot C#)
| Paquete | 1er valor | 2do valor | 3er valor |
|---------|-----------|-----------|-----------|
| Spawn (0x3015/0x3019) | **X** (este-oeste) | **Y** (altitud) | **Z** (norte-sur) |
| Movimiento (0xB021) | **X** (este-oeste) | **Z** (norte-sur) | **Y** (altitud) |

El backend (`coordUtils.js`) maneja correctamente ambos órdenes según el parámetro `type`.

---

## 2. Diagnóstico: Entidades no aparecen hasta moverse

### Síntoma
"Es como si estuviera ciego hasta que algo se mueva" — las entidades no se ven en el canvas 2D hasta que el jugador o una entidad se mueve.

### Causa raíz
El `PLAYER_POSITION_INIT` se envía desde `CharDataHandlers.js` al procesar 0x3013 (CHAR_DATA). Sin embargo, las entidades del grupo spawn (0x3017-0x3019) llegan ANTES de que el frontend procese la posición del jugador. Cuando `me.regionX` es `null`, `entityToCanvas()` calcula `NaN` y las entidades se descartan. Al moverse, llega 0xB023 que dispara `PLAYER_POSITION_INIT` (por el fallback en `handleMoveBegin`), y entonces las entidades aparecen.

### Flujo actual (con problema)
1. 0x3013 (CHAR_DATA) → PLAYER_POSITION_INIT + PLAYER_SPAWNED → frontend
2. 0x3017-0x3019 (group spawn) → ENTITY_SPAWN → frontend (me.regionX aún null)
3. Entidades se guardan en estado pero no se renderizan (NaN)
4. Jugador se mueve → 0xB023 → PLAYER_POSITION_INIT (fallback) → me.regionX se setea
5. Entidades aparecen al re-renderizar

### Solución propuesta
**Pendiente**: Asegurar que `PLAYER_POSITION_INIT` llegue y sea procesado por el frontend ANTES de que las entidades sean evaluadas. Posibles enfoques:
- Bufferizar ENTITY_SPAWN hasta que el player tenga posición
- Agregar `me?.regionX` y `me?.regionZ` como dependencia en el `useMemo` de EntityLayer (YA IMPLEMENTADO)
- Verificar que el frontend procese `PLAYER_SPAWNED` correctamente

---

## 3. Cambios en EntityLayer

### Fix: Dependencia de me.regionX/Z
Se agregó `me?.regionX` y `me?.regionZ` como dependencias del `useMemo` de `entityList` en `EntityLayer.jsx` para asegurar que se recalcule cuando el jugador obtenga posición.

### Código actual
```javascript
const entityList = useMemo(() => {
    const list = Object.values(entities || {}).map(e => {
      const resolvedName = getEntityName(e.refObjId, e.entityType);
      const displayName = resolvedName || e.name || `${e.entityType || '?'}#${e.refObjId || e.uniqueId}`;
      return { ...e, displayName };
    });
    return list;
  }, [entities, me?.regionX, me?.regionZ]);
```

---

## 4. Archivos de Referencia Verificados

Los siguientes archivos C# en la raíz del proyecto se usaron como referencia para verificar estructuras de paquetes:

- `0x3015.cs` — SingleSpawn, GroupeSpawn, SingleDeSpawn
- `6- Parse-NPC.PETS.PORTAL.ITEMS.MOB.CHAR.cs` — ParseNPC, ParseMob, ParseChar, ParsePets
- `PacketDoc vSRO 1.88/AGENT/OBJECT/OBJECT_SPAWN.cs` — Documentación oficial de estructura de spawn
- `PacketDoc vSRO 1.88/AGENT/OBJECT/0x3015 - SERVER_AGENT_OBJECT_SPAWN.cs`
- `docs/protocol/OPCODES_REFERENCE.md` — Documentación de opcodes

### Confirmación de orden de ejes en spawn (MerchBot)
```
byte xsec = packet.ReadByte();     // X sector
byte ysec = packet.ReadByte();     // Z sector (norte-sur)
float xcoord = packet.ReadFloat(); // X offset
packet.ReadFloat();                 // Y altitud (skipped)
float ycoord = packet.ReadFloat(); // Z offset (norte-sur)
```

Cálculo de mundo:
```
x = (xsec - 135) * 192 + xcoord/10
y = (ysec - 92) * 192 + ycoord/10   // "y" = Z (norte-sur)
```

### Confirmación de orden 0xB021 (OPCODES_REFERENCE.md)
```
[uint16] region
[int16]  offsetX (valor * 10)  → X
[int16]  offsetZ (valor * 10)  → Z (norte-sur)
[int16]  offsetY (valor * 10)  → Y (altitud)
```

---

## 5. Estado de Archivos Modificados

### Frontend (`blackroseweb/src/game/`)
| Archivo | Cambios |
|---------|---------|
| `utils/geo.js` | `coordToCanvas()`, `playerToCanvas()`, fix `worldToRender()` y `renderToWorld()` |
| `utils/entityNames.js` | Sin cambios recientes |
| `hooks/usePlayerInit.js` | Importa `playerToCanvas()` de geo.js |
| `hooks/useGameLoop.js` | Importa `coordToCanvas()` de geo.js, player renderZ usa fórmula estándar |
| `ui/EntityLayer.jsx` | Importa `coordToCanvas()`, agrega `me?.regionX/Z` a deps del memo |
| `ui/GameContainer.jsx` | Importa `coordToCanvas()`, `CAMERA_OFFSET_Y = 0` |
| `ui/GameCanvas.jsx` | `CAMERA_OFFSET_Y = 0` |

### Backend (`blackrosebackend/src/`)
| Archivo | Cambios |
|---------|---------|
| `shared/utils/coordUtils.js` | `calcWorldCoords()` con type='spawn'/'chardata'/'movement' |
| `shared/handlers/packet/SpawnHandlers.js` | Handlers para 0x3015-0x3019, 0x34B5, 0xB023 |
| `shared/handlers/packet/MovementHandlers.js` | Handlers para 0xB021, 0x3020 |
| `shared/handlers/packet/CharDataHandlers.js` | PLAYER_POSITION_INIT, PLAYER_SPAWNED |

---

## 6. Problemas Conocidos (Pendientes)

1. **Entidades no visibles hasta moverse** (ALTA PRIORIDAD) — Ver diagnóstico sección 2
2. **Group spawn solo envía 1 entidad (CHAR)** — En los logs solo se ve `count=1` para el group spawn. El servidor VSROMAX V4.4 posiblemente no envía mobs/NPCs en el grupo inicial, o llegan por separado vía 0x3015
3. **CAMERA_OFFSET_Y = 0** — Puede afectar la posición de la UI/HUD. Verificar si es necesario reintroducir un offset menor

---

## 7. Comandos Útiles

- Backend: `cd blackrosebackend && npm run dev`
- Frontend: `cd blackroseweb && npx vite --host 0.0.0.0 --port 5173`
- Puerto backend: 100
- Puerto frontend: 5173
