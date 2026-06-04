# 2. Cómo el frontend recibe y grafica las coordenadas

## 2.1. Recepción en GameSocketContext

**Archivo**: `blackroseweb/src/shared/context/GameSocketContext.jsx`

El WebSocket recibe eventos JSON. Cada evento con datos de posición actualiza `playerState`:

### PLAYER_SPAWNED / IN_GAME
```js
if (msg.detail?.type === "PLAYER_SPAWNED" || msg.status === "IN_GAME") {
    const d = msg.detail || {};
    setPlayerState((prev) => {
        const newRegion = (d.region != null && d.region > 0) ? d.region : prev.region;
        const newPosX = (d.posX != null) ? d.posX : prev.posX;
        const newPosY = (d.posY != null) ? d.posY : prev.posY;
        const newPosZ = (d.posZ != null) ? d.posZ : prev.posZ;
        return { ...prev, region: newRegion, posX: newPosX, posY: newPosY, posZ: newPosZ, ... };
    });
}
```

### PLAYER_POSITION_INIT
```js
if (msg.detail?.type === "PLAYER_POSITION_INIT") {
    const d = msg.detail;
    if (d.region && d.region > 0) {
        setPlayerState((prev) => {
            const next = { ...prev, hp: prev.hp || 0, region: d.region, posX: d.posX, posY: d.posY, posZ: d.posZ };
            return next;
        });
    }
}
```

### PLAYER_MOVED (viejo, posiblemente no usado)
```js
if (msg.detail?.type === "PLAYER_MOVED") {
    const d = msg.detail;
    setPlayerState((prev) => ({ ...prev, region: d.region ?? prev.region, posX: d.posX ?? prev.posX, posZ: d.posZ ?? prev.posZ, posY: d.posY ?? prev.posY }));
}
```

### PLAYER_UPDATE
```js
if (msg.detail?.type === "PLAYER_UPDATE") {
    const d = msg.detail;
    setPlayerState((prev) => {
        const sameRegion = d.region == null || d.region === prev.region;
        return {
            ...prev, region: d.region ?? prev.region,
            posX: sameRegion ? (d.posX ?? prev.posX) : prev.posX,
            posY: sameRegion ? (d.posY ?? prev.posY) : prev.posY,
            posZ: sameRegion ? (d.posZ ?? prev.posZ) : prev.posZ,
            ...
        };
    });
}
```

### PLAYER_MOVE_CONFIRMED (movimiento propio)
```js
if (msg.detail?.type === "PLAYER_MOVE_CONFIRMED") {
    const d = msg.detail;
    if (d.dstRegion != null && d.dstRegion > 0 && d.dstX != null && d.dstZ != null) {
        setPlayerState((prev) => {
            const updates = { region: d.dstRegion, posX: d.dstX, posZ: d.dstZ };
            if (d.dstY != null && d.dstY > 0) updates.posY = d.dstY;
            return { ...prev, ...updates };
        });
    }
}
```

### ENTITY_SPAWN (entidades)
```js
if (msg.detail?.type === "ENTITY_SPAWN") {
    const d = msg.detail;
    const regionId = Number(d.region) || 0;
    // regionToWorld(regionId, posX, posZ) — ¡sin posY!
    const { regionX, regionZ, worldX, worldZ } = regionToWorld(regionId, d.posX, d.posZ);
    setEntities((prev) => ({
        ...prev,
        [d.uniqueId]: { ...d, regionX, regionZ, worldX, worldZ }
    }));
}
```

### ENTITY_MOVE (entidades moviéndose)
```js
if (msg.detail?.type === "ENTITY_MOVE") {
    const d = msg.detail;
    const regionId = Number(d.dstRegion) || 0;
    // movement: usar type='movement' porque el orden de ejes es X,Z,Y
    const { regionX: dstRegionX, regionZ: dstRegionZ, worldX: dstWorldX, worldZ: dstWorldZ } =
        regionToWorld(regionId, d.dstX, d.dstZ, d.dstY, 'movement');
    // Actualiza entidad con nueva posición...
}
```

---

## 2.2. Conversión a world units (geo.js)

**Archivo**: `blackroseweb/src/game/utils/geo.js`

### Constantes

```js
const UNITS_PER_REGION = GAME_CONSTANTS.MAP.UNITS_PER_REGION;   // 192
const WORLD_SCALE = GAME_CONSTANTS.MAP.WORLD_SCALE;             // 1 (192/192)
const TILE_RADIUS = GAME_CONSTANTS.MAP.TILE_RADIUS;             // 5
const BASE_TILE_SZ = GAME_CONSTANTS.MAP.BASE_TILE_SZ;           // 192
const CANVAS_CENTER = TILE_RADIUS * BASE_TILE_SZ + BASE_TILE_SZ / 2; // 5*192+96 = 1056
```

### regionToWorld (usado en GameSocketContext para ENTITY_SPAWN y ENTITY_MOVE)

```js
export function regionToWorld(regionId, rawX, rawZ, rawY, type = 'spawn') {
    const sectorX = regionId & 0xFF;
    const sectorZ = (regionId >> 8) & 0xFF;
    let offsetX, offsetZ;
    if (type === 'movement') {
        offsetX = rawX;   // X directo
        offsetZ = rawZ;   // Z directo
    } else {
        // spawn: raw1=X, raw2=altitud, raw3=Z
        // pero acá llaman (rawX, rawZ, rawY)
        // rawX=posX, rawZ=posZ, rawY=altitud
        offsetX = rawX;
        offsetZ = rawZ;
    }
    const posX = Math.round(offsetX);
    const posZ = Math.round(offsetZ);
    const worldX = (sectorX - 135) * UNITS_PER_REGION + posX;
    const worldZ = (sectorZ - 92) * UNITS_PER_REGION + posZ;
    return { regionX: sectorX, regionZ: sectorZ, posX, posZ, worldX, worldZ };
}
```

**⚠️ NOTA**: En el backend `CENTER_Z = 92`, en el frontend `CENTER_Z = 92` también. Pero en `regionXYToWorld` y `regionToWorld`, el frontend usa `(regionZ - 92)` mientras que en algunos comentarios del código se menciona `91`. Hay una discrepancia: `CENTER_Z` = 92 en backend, pero en `regionXYToWorld` del frontend también se usa 92. Sin embargo, en `gameToWorld`/`worldToGame` se usa `91`:

```js
export const worldToGame = (wx, wz) => ({
    gameX: wx - 135 * UNITS_PER_REGION,
    gameY: wz - 91 * UNITS_PER_REGION,       // ← usa 91
});

export const gameToWorld = (gx, gy) => ({
    worldX: gx + 135 * UNITS_PER_REGION,
    worldZ: gy + 91 * UNITS_PER_REGION,       // ← usa 91
});
```

**⚠️ INCONSISTENCIA**: Backend usa `CENTER_Z = 92`, frontend `regionToWorld` usa `92`, pero `worldToGame`/`gameToWorld` usan `91`.

### regionXYToWorld (usado en usePlayerInit)

```js
export function regionXYToWorld(regionX, regionZ, posX, posZ) {
    const worldX = (regionX - 135) * UNITS_PER_REGION + Math.round(posX);
    const worldZ = (regionZ - 92) * UNITS_PER_REGION + Math.round(posZ);   // ← 92
    return { regionX, regionZ, posX: Math.round(posX), posZ: Math.round(posZ), worldX, worldZ };
}
```

### coordToCanvas (convierte región+offset a píxeles de canvas)

```js
export function coordToCanvas(regionX, regionZ, posX, posZ, playerRegionX, playerRegionZ) {
    const dx = regionX - playerRegionX;
    const dz = regionZ - playerRegionZ;
    return {
        canvasX: (TILE_RADIUS + dx) * BASE_TILE_SZ + posX,                 // (5 + dx) * 192 + posX
        canvasZ: (TILE_RADIUS - dz) * BASE_TILE_SZ + (BASE_TILE_SZ - posZ), // (5 - dz) * 192 + (192 - posZ)
    };
}
```

**⚠️ NOTA IMPORTANTE**: `canvasZ` invierte el eje Z: `(TILE_RADIUS - dz) * BASE_TILE_SZ + (BASE_TILE_SZ - posZ)`. Esto significa que Z positivo en el juego (norte) es ARRIBA en el canvas (menor Y). El backend entrega `posZ` como norte-sur donde Z++ = norte. En el canvas, Y++ = abajo, por eso se invierte.

### playerToCanvas (helper para el player)

```js
export function playerToCanvas(playerRegionX, playerRegionZ, playerPosX, playerPosZ) {
    return coordToCanvas(playerRegionX, playerRegionZ, playerPosX, playerPosZ, playerRegionX, playerRegionZ);
    // Como playerRegionX/Z son los mismos, dx=0, dz=0
    // canvasX = TILE_RADIUS * BASE_TILE_SZ + posX = 5*192 + posX = 960 + posX
    // canvasZ = TILE_RADIUS * BASE_TILE_SZ + (BASE_TILE_SZ - posZ) = 960 + (192 - posZ)
}
```

### worldToRender (convierte world units a píxeles de canvas)

```js
export const worldToRender = (wx, wz, playerWX = 0, playerWZ = 0) => {
    const dwx = wx - playerWX;
    const dwz = wz - playerWZ;
    return {
        renderX: (dwx / WORLD_SCALE) + (TILE_RADIUS * BASE_TILE_SZ),       // dwx + 960
        renderZ: -(dwz / WORLD_SCALE) + (TILE_RADIUS * BASE_TILE_SZ),      // -dwz + 960
    };
};
```

### renderToWorld (inverso: píxeles de canvas → world units)

```js
export const renderToWorld = (rx, rz, playerWX = 0, playerWZ = 0) => ({
    worldX: playerWX + (rx - CANVAS_CENTER) * WORLD_SCALE,    // playerWX + (rx - 1056)
    worldZ: playerWZ - (rz - CANVAS_CENTER) * WORLD_SCALE,    // playerWZ - (rz - 1056)
});
```

---

## 2.3. Cómo se renderiza el player en el canvas

### En usePlayerInit.js

Cuando `wsPlayer` cambia (llega PLAYER_POSITION_INIT, PLAYER_SPAWNED, etc.):

```js
const regionId = Number(wsPlayer.region);
const posX = Number(wsPlayer.posX);
const posZ = Number(wsPlayer.posZ ?? 0);
const { regionX, regionZ, worldX, worldZ } = regionXYToWorld(
    regionId & 0xFF, (regionId >> 8) & 0xFF, posX, posZ
);

// render usando playerToCanvas (fórmula ESTÁNDAR)
renderX: playerToCanvas(regionX, regionZ, posX, posZ).canvasX,
renderZ: playerToCanvas(regionX, regionZ, posX, posZ).canvasZ,
```

### En useGameLoop.js (cada frame)

```js
// Para el player (id="me"):
const rX = Math.floor(p.worldX / R) + 135;
const rZ = Math.floor(p.worldZ / R) + 92;

const { canvasX, canvasZ } = coordToCanvas(
    p.regionX ?? rX, p.regionZ ?? rZ,
    p.posX ?? 0, p.posZ ?? 0,
    rX, rZ
);
p.renderX = canvasX;
p.renderZ = canvasZ;
p.regionX = rX;
p.regionZ = rZ;

// Para otros players:
const r = worldToRender(p.worldX, p.worldZ, p.cameraWX, p.cameraWZ);
p.renderX = r.renderX;
p.renderZ = r.renderZ;
```

### En GameContainer.jsx (renderizado DOM)

El canvas completo se desplaza con CSS `translate3d`:

```jsx
<div ref={world.canvasRef} className="gc-map-canvas"
    style={{
        transform: `translate3d(${worldOffsetX}px,${worldOffsetY}px,0) scale(${world.zoom})`,
        transition: 'transform 0.4s cubic-bezier(0.2, 0, 0.2, 1)'
    }}
>
```

El offset de cámara se calcula así:

```js
// World Map Offset
const targetWX = me.isFollowingPlayer ? me.worldX : me.cameraWX;
const targetWZ = me.isFollowingPlayer ? me.worldZ : me.cameraWZ;
const { renderX: cRX, renderZ: cRZ } = worldToRender(targetWX, targetWZ);
const rawX = vp.offsetWidth / 2 - cRX * world.zoom;
const rawY = (vp.offsetHeight / 2 - CAMERA_OFFSET_Y) - cRZ * world.zoom;
const clamped = getClampedOffset(rawX, rawY, world.zoom, vp, world.canvasRef.current);
worldOffsetX = clamped.x;
worldOffsetY = clamped.y;
```

El punto del player se posiciona en `p.renderX`, `p.renderZ` (coordenadas absolutas del canvas).

---

## 2.4. Cómo se renderizan las entidades (EntityLayer.jsx)

**Archivo**: `blackroseweb/src/game/ui/EntityLayer.jsx`

```js
// entityToCanvas usa coordToCanvas (misma fórmula que el player)
function entityToCanvas(entity, playerRegionX, playerRegionZ) {
    const { canvasX, canvasZ } = coordToCanvas(
        entity.regionX, entity.regionZ,
        entity.posX ?? 0, entity.posZ ?? 0,
        playerRegionX, playerRegionZ
    );
    return { renderX: canvasX, renderZ: canvasZ };
}
```

Cada entidad se renderiza como un `<div>` absoluto dentro del canvas:

```jsx
<div style={{
    position: 'absolute',
    left: renderX - size / 2,
    top: renderZ - size / 2,
    width: size,
    height: size,
    borderRadius: '50%',
    background: color,
    ...
}} />
```

---

## 2.5. Conversión click del mouse → coordenadas de mapa

**Archivo**: `blackroseweb/src/game/hooks/useMapInteractions.js`

### Para el mapa mundial (world map):

```js
const clPx = Math.max(0, Math.min(MAP_CANVAS_W, px));
const clPy = Math.max(0, Math.min(MAP_CANVAS_H, py));

const tileOrigin = TILE_RADIUS * R;  // 5 * 192 = 960
const localX = clPx - tileOrigin;    // offset desde el centro del tile central
const localZ = tileOrigin - clPy;    // invertido (Z positivo = norte = arriba)

const playerRX = Math.floor(me.worldX / R);   // región centrada del player
const playerRZ = Math.floor(me.worldZ / R);

clickWX = (playerRX * R) + localX;            // worldX centrado
clickWZ = (playerRZ * R) + localZ;            // worldZ centrado

// Convertir a absoluto para validar con REGIONS.js
const rX = Math.floor(clickWX / R) + 135;     // región absoluta X
const rZ = Math.floor(clickWZ / R) + 92;      // región absoluta Z

// Validar que la región existe en REGIONS.js
if (!REGIONS.some(reg => reg.x === rX && reg.z === rZ)) return prev;
```

### Para el mapa de ciudad (city map):

```js
const clickedWorld = cityImageToWorld(insideCity, px, py, cityFitMode);
clickWX = clickedWorld.worldX;
clickWZ = clickedWorld.worldZ;
```

### Envío del MOVE al backend:

```js
const targetRX = Math.floor(tWX / R) + 135;
const targetRZ = Math.floor(tWZ / R) + 92;
const targetRegion = targetRX | (targetRZ << 8);
const targetLocalX = Math.round(tWX - (targetRX - 135) * R);
const targetLocalZ = Math.round(tWZ - (targetRZ - 92) * R);

wsSend({
    type: 'MOVE',
    region: targetRegion,
    posX: targetLocalX,
    posZ: targetLocalZ,
});
```

---

## 2.6. Conversión screenToSilkroad (píxel del canvas → región+offset)

**Archivo**: `blackroseweb/src/Componentes/game/GameContainer.jsx`

```js
function screenToSilkroad(px, py) {
    const tile = WORLD_GRID.find(t =>
        px >= t.screenX && px < t.screenX + BASE_TILE_SZ &&
        py >= t.screenY && py < t.screenY + BASE_TILE_SZ
    ) ?? null;
    if (!tile) return { regionX: 0, regionZ: 0, posX: 0, posZ: 0 };
    const localX = px - tile.screenX;
    const localZ = py - tile.screenY;
    const posX = Math.floor((localX / BASE_TILE_SZ) * tile.unitsWide);
    const posZ = Math.floor((localZ / BASE_TILE_SZ) * tile.unitsWide);
    return { tile, regionX: tile.tileX, regionZ: tile.tileZ, posX, posZ };
}
```

Donde WORLD_GRID se construye así:

```js
function buildMapGrid() {
    WORLD_GRID = [];
    for (let z = MAP_MAX_Z; z >= MAP_MIN_Z; z -= TILE_STEP) {
        for (let x = MAP_MIN_X; x <= MAP_MAX_X; x += TILE_STEP) {
            const screenX = ((x - MAP_MIN_X) / TILE_STEP) * BASE_TILE_SZ;
            const screenY = ((MAP_MAX_Z - z) / TILE_STEP) * BASE_TILE_SZ;
            WORLD_GRID.push({
                tileX: x, tileZ: z,
                screenX, screenY,
                unitsWide: TILE_STEP * UNITS_PER_REGION,
            });
        }
    }
}
```
