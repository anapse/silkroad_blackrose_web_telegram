# 🗺️ Referencia Técnica del Mapa 2D — BlackRose Web

> Documento actualizado el 26/05/2026. Últimos cambios: corrección de spawn, zoom inicial, interpolación con delta time, orden de ejes en 0x7021.

---

## 1. ¿Cómo se renderizan los tiles del mapa?

**Tecnología: HTML/CSS plano con elementos `<img>` dentro de `<div>`.**

No se usa Canvas HTML5, Leaflet, Three.js ni ninguna librería de mapas. Es una cuadrícula de imágenes PNG estáticas organizadas con **flexbox** en filas (clase CSS `.gc-row`).

El contenedor principal (`.gc-map-canvas`) se mueve con **transformaciones CSS 3D**:

```css
transform: translate3d(offsetX, offsetY, 0) scale(zoom);
transition-property: transform;
transition-duration: 0.15s;
transition-timing-function: linear;
```

---

## 2. Valores exactos de todas las constantes

Definidas en `blackroseweb/src/constants/gameConstants.js`:

| Constante | Valor | Descripción |
|---|---|---|
| `MAP.MIN_X` | **46** | Región X mínima del mapa |
| `MAP.MAX_X` | **174** | Región X máxima del mapa |
| `MAP.MIN_Z` | **73** | Región Z mínima del mapa |
| `MAP.MAX_Z` | **113** | Región Z máxima del mapa |
| `MAP.BASE_TILE_SZ` | **256** px | Tamaño en píxeles de cada tile |
| `MAP.TILE_STEP` | **4** | Cada tile abarca 4×4 regiones del juego |
| `MAP.UNITS_PER_REGION` | **192** | Unidades Silkroad por región |
| `MAP.WORLD_SCALE` | **3.0** | `(TILE_STEP * UNITS_PER_REGION) / BASE_TILE_SZ = (4*192)/256` |
| `MAP.CANVAS_W` | **8448** px | `((174-46)/4 + 1) * 256` — ancho total del canvas |
| `MAP.CANVAS_H` | **2816** px | `((113-73)/4 + 1) * 256` — alto total del canvas |
| `MOVEMENT.WALK_SPEED_WU` | **80** | Velocidad de movimiento en WU/segundo (delta time) |
| `MOVEMENT.MAX_CLICK_WU` | **800** | Distancia máxima de movimiento por clic |
| `MOVEMENT.CITY_EXIT_NUDGE_WU` | **0.01** | Desplazamiento mínimo al salir de ciudad |
| `ICONS.CITY` | `{ w: 40, h: 40 }` | Tamaño icono de ciudad |
| `ICONS.FORT` | `{ w: 30, h: 30 }` | Tamaño icono de fuerte |
| `ICONS.DUNGEON` | `{ w: 48, h: 48 }` | Tamaño icono de mazmorra |
| `ICONS.NPC` | `{ w: 32, h: 32 }` | Tamaño icono de NPC |
| `ICONS.POI` | `{ w: 25, h: 25 }` | Tamaño icono de POI |
| `SPAWN.CHINA` | `{ REGION_X:168, REGION_Z:97, POS_X:98.2, POS_Z:14 }` | Spawn personaje chino |
| `SPAWN.EUROPE` | `{ REGION_X:68, REGION_Z:104, POS_X:50, POS_Z:50 }` | Spawn personaje europeo |

---

## 3. Clic en canvas (pixelX, pixelY) → Coordenadas del mundo (worldX, worldZ)

**Archivo:** `blackroseweb/src/game/utils/geo.js`

```js
export const renderToWorld = (rx, rz) => {
  return {
    worldX: MAP_MIN_X * UNITS_PER_REGION + rx * WORLD_SCALE,
    worldZ: (MAP_MAX_Z + 1) * UNITS_PER_REGION - rz * WORLD_SCALE,
  };
};
```

Con los valores numéricos concretos:

```
worldX = 46 * 192 + pixelX * 3.0  =  8832 + pixelX * 3.0
worldZ = (113 + 1) * 192 - pixelZ * 3.0  =  21888 - pixelZ * 3.0
```

**Ajuste por zoom** (en `blackroseweb/src/game/hooks/useMapInteractions.js`):

```js
const px = (e.clientX - rect.left) / zoomLevel;
const py = (e.clientY - rect.top) / zoomLevel;
const clPx = Math.max(0, Math.min(MAP_CANVAS_W, px));
const clPy = Math.max(0, Math.min(MAP_CANVAS_H, py));
const w = renderToWorld(clPx, clPy);
```

Además, se valida que la región clickeada exista en `REGIONS` y se limita la distancia máxima a `MAX_CLICK_WU = 800`.

---

## 4. Coordenadas del mundo (worldX, worldZ) → Píxeles del canvas

**Archivo:** `blackroseweb/src/game/utils/geo.js`

```js
export const worldToRender = (wx, wz) => {
  return {
    renderX: (wx - MAP_MIN_X * UNITS_PER_REGION) / WORLD_SCALE,
    renderZ: ((MAP_MAX_Z + 1) * UNITS_PER_REGION - wz) / WORLD_SCALE,
  };
};
```

Con valores numéricos concretos:

```
renderX = (worldX - 8832) / 3.0
renderZ = (21888 - worldZ) / 3.0
```

Esta función se llama **cada frame** en `useGameLoop.js` para sincronizar `p.renderX` y `p.renderZ` de cada jugador.

---

## 5. El zoom

**Sí, el mapa tiene zoom.** Implementado en `blackroseweb/src/game/hooks/useMMOCamera.js`.

| Propiedad | Valor |
|---|---|
| Zoom mínimo | **1.0** |
| Zoom máximo | **50.0** |
| Incremento | **0.25** |
| Zoom inicial (mundo) | **6.0** (antes 25, corregido para eliminar transición 25→6) |
| Zoom inicial (ciudad) | **12.0** |

**¿Cómo afecta al cálculo de coordenadas?**

1. **Clic:** Las coordenadas del clic se dividen por `zoomLevel` para obtener las coordenadas correctas en el espacio del canvas sin escalar:
   ```js
   const px = (e.clientX - rect.left) / zoomLevel;
   const py = (e.clientY - rect.top) / zoomLevel;
   ```

2. **Cámara:** El offset de cámara se multiplica por el zoom:
   ```js
   const rawX = vp.offsetWidth / 2 - cRX * world.zoom;
   const rawY = (vp.offsetHeight / 2 - CAMERA_OFFSET_Y) - cRZ * world.zoom;
   ```

3. **Renderizado:** El zoom se aplica mediante CSS `scale()`:
   ```jsx
   style={{ transform: `translate3d(${worldOffsetX}px,${worldOffsetY}px,0) scale(${world.zoom})` }}
   ```

---

## 6. Origen de las imágenes de los tiles

**Archivos PNG estáticos** servidos desde el directorio público con la ruta:

```
/interface/worldmap/map/map_world_{regionX}x{regionZ}.png
```

Ejemplo: `/interface/worldmap/map/map_world_46x113.png`

- **Cantidad total:** 632 tiles PNG
- **Ubicación real:** `blackroseweb/public/interface/worldmap/map/`
- **Tamaño de cada tile:** 256×256 px
- **Cada tile cubre:** 4×4 regiones = 768×768 unidades Silkroad (TILE_STEP × UNITS_PER_REGION = 4 × 192)
- **Cuadrícula total:** 13 columnas (X: 46→174 step 4) × 11 filas (Z: 113→73 step -4) = 143 tiles

---

## 7. Posición del jugador — Flujo de inicialización

**CORREGIDO: El spawn inicial ahora usa la posición por raza.**

Cuando el personaje se selecciona en `CharacterSelect`, el hook `usePlayerInit` determina la posición inicial:

1. **Si el personaje tiene `LatestRegion`** (enviado por el backend en CHARACTER_LIST): usa esa región más `PosX`/`PosZ` para calcular `worldX`/`worldZ`.

2. **Si no tiene posición del servidor** (caso más común): usa la posición de spawn según la raza:
   - **China:** región (168, 97), offset (98, 14) → world (32322, 18638) → Jangan
   - **Europa:** región (68, 104), offset (50, 50) → world (13106, 20018) → cerca de Rochefort

3. **Cuando llega `PLAYER_SPAWNED` por WebSocket:** el efecto `wsPlayer` en `GameContainer.jsx` sobreescribe la posición con los datos reales del servidor (CASO 1: `!_initialized`).

**Pipeline completo de coordenadas desde el servidor:**

```js
// Backend (PacketRouter.js) - leer offsets según el paquete:
// 0x3015/0x3019 (SPAWN): readFloatLE → valor directo 0.0-192.0
// 0xB021 (SERVER_MOVE):   readInt16LE → valor *10, dividir entre 10
// Ambos envían: region, posX, posY(altitud), posZ al frontend

// Frontend (GameContainer.jsx, efecto wsPlayer):
const regionId = Number(wsPlayer.region);
const regionX = regionId & 0xFF;
const regionZ = regionId >> 8;
const localX = Math.max(0, Math.min(UNITS_PER_REGION, Number(wsPlayer.posX)));
const localZ = Math.max(0, Math.min(UNITS_PER_REGION, Number(wsPlayer.posZ || 0)));
const worldX = (regionX * UNITS_PER_REGION) + localX;
const worldZ = (regionZ * UNITS_PER_REGION) + localZ;
```

**Sincronización inteligente con el servidor 3D (4 casos):**
- CASO 1 - `!_initialized`: primera posición, salto directo.
- CASO 2 - `distToCurrentPos > 1500`: teletransporte real, salto directo.
- CASO 3 - `distToTarget > 300`: servidor corrigió trayectoria, actualizar destino.
- CASO 4 - `distToTarget <= 300`: no hacer nada, el loop ya interpola hacia allá.

**Interpolación suave** (useGameLoop.js):
- Velocidad real: `WALK_SPEED = 80 WU/s` (velocidad base Silkroad)
- Delta time: `dt = (timestamp - lastTime) / 1000`, máximo 50ms
- Step por frame: `step = speed * dt`
- Si `dist <= step`: snap directo al target
- Si no: avanzar `(dx/dist) * step` en cada eje

**El marker se renderiza** con CSS `position: absolute; left: p.renderX; top: p.renderZ;` dentro del canvas. El fontSize del marker se ajusta dinámicamente: `${2.4 / world.zoom * 6}px` para mantener tamaño visual constante independientemente del zoom.

---

## 8. Archivos donde está la lógica del mapa

| Archivo | Propósito |
|---|---|
| `blackroseweb/src/constants/gameConstants.js` | Constantes del mapa (MIN_X, MAX_Z, WORLD_SCALE, etc.) |
| `blackroseweb/src/game/utils/geo.js` | Funciones `renderToWorld()`, `worldToRender()`, `worldRegionKey()` |
| `blackroseweb/src/game/hooks/useMapInteractions.js` | Manejo de clics en el mapa → coordenadas del mundo |
| `blackroseweb/src/game/hooks/useMMOCamera.js` | Zoom y drag de la cámara |
| `blackroseweb/src/game/hooks/useGameLoop.js` | Game loop: movimiento, interpolación, sincronización render |
| `blackroseweb/src/game/hooks/usePlayerInit.js` | Inicialización del jugador (spawn) |
| `blackroseweb/src/game/utils/movement.js` | Lógica de movimiento, ciudades, portales |
| `blackroseweb/src/game/utils/math.js` | Funciones auxiliares (`getDistance`, `pointInRect`) |
| `blackroseweb/src/game/utils/vectors.js` | Normalización de vectores, ángulos |
| `blackroseweb/src/game/utils/camera.js` | Cálculo de offset de cámara |
| `blackroseweb/src/Componentes/game/GameContainer.jsx` | Componente principal: renderizado de tiles, overlays, jugador, ciudades |
| `blackroseweb/src/Componentes/game/MapDot.jsx` | Componente para puntos en el mapa (NPCs, mobs, etc.) |
| `blackroseweb/src/Componentes/game/data/REGIONS.js` | Datos de todas las regiones del mundo |
| `blackroseweb/src/Componentes/game/data/MARKERS.js` | Marcadores (ciudades, fuertes, mazmorras) |
| `blackroseweb/src/Componentes/game/data/CITY_MAPS.js` | Datos de mapas de ciudades |
| `blackroseweb/src/Componentes/game/GameContainer.css` | Estilos del mapa y HUD |

---

## Resumen visual del flujo de datos

```
Servidor (packet 0x7021)
    │ regionId, posX, posZ
    ▼
WebSocket → wsPlayer (GameSocketContext)
    │
    ▼
GameContainer.jsx (efecto wsPlayer)
    │ worldX = (regionX * 192) + localX
    │ worldZ = (regionZ * 192) + localZ
    ▼
useGameLoop.js (cada frame)
    │ worldToRender(worldX, worldZ) → { renderX, renderZ }
    ▼
GameContainer.jsx (render)
    │ <div style={{ left: p.renderX, top: p.renderZ }}>
    │     <span>▶</span>
    │ </div>
    ▼
CSS: translate3d(offsetX, offsetY, 0) scale(zoom)
```

---

*Documentación generada automáticamente a partir del código fuente del proyecto BlackRose Web.*
