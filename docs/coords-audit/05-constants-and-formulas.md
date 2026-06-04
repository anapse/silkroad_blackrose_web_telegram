# 5. Constantes, fórmulas y centros del sistema de coordenadas

---

## 5.1. Constantes

### Backend (`blackrosebackend/src/shared/utils/coordUtils.js`)

| Constante | Valor | Descripción |
|-----------|-------|-------------|
| `UNITS_PER_REGION` | `192` | Unidades Silkroad por región |
| `CENTER_X` | `135` | Centro del mapa en X (para convertir a world units) |
| `CENTER_Z` | `92` | Centro del mapa en Z (norte-sur) |
| `RATIO` | `10` | Factor de división de floats raw a unidades enteras |

### Frontend (`blackroseweb/src/shared/constants/gameConstants.js`)

| Constante | Valor | Descripción |
|-----------|-------|-------------|
| `MAP.MIN_X` | `26` | Región X mínima |
| `MAP.MAX_X` | `252` | Región X máxima |
| `MAP.MIN_Z` | `37` | Región Z mínima |
| `MAP.MAX_Z` | `126` | Región Z máxima |
| `MAP.BASE_TILE_SZ` | `192` | Tamaño de tile en píxeles |
| `MAP.TILE_STEP` | `1` | Paso de tile (1 = 1 región por tile) |
| `MAP.UNITS_PER_REGION` | `192` | Unidades por región |
| `MAP.WORLD_SCALE` | `1` | `192/192` |
| `MAP.TILE_RADIUS` | `5` | Radio de tiles alrededor del jugador |
| `MAP.CANVAS_W` | `2112` | `(2*5+1)*192` |
| `MAP.CANVAS_H` | `2112` | `(2*5+1)*192` |

### Frontend (`blackroseweb/src/game/utils/geo.js`)

| Constante | Valor | Descripción |
|-----------|-------|-------------|
| `CANVAS_CENTER` | `1056` | `TILE_RADIUS * BASE_TILE_SZ + BASE_TILE_SZ / 2 = 5*192+96` |

---

## 5.2. Fórmulas

### Region ID → sectorX / sectorZ

```
sectorX = regionId & 0xFF
sectorZ = (regionId >> 8) & 0xFF
regionId = sectorX | (sectorZ << 8)
```

### Floats raw → pos unidades enteras (backend)

```
posX = Math.round(xOffset / 10)
posZ = Math.round(zOffset / 10)   // norte-sur
posY = Math.round(yOffset / 10)   // altitud
```

### Región + offset → World Units (backend)

```
worldX = (sectorX - 135) * 192 + posX
worldZ = (sectorZ - 92) * 192 + posZ
```

### Región + offset → World Units (frontend, regionXYToWorld)

```
worldX = (regionX - 135) * 192 + Math.round(posX)
worldZ = (regionZ - 92) * 192 + Math.round(posZ)
```

### Región + offset → World Units (frontend, regionToWorld)

```
worldX = (sectorX - 135) * 192 + Math.round(rawX)
worldZ = (sectorZ - 92) * 192 + Math.round(rawZ)
```

### World Units centrados → Región absoluta

```
regionX = Math.floor(worldX / 192) + 135
regionZ = Math.floor(worldZ / 192) + 92
```

### World Units → píxeles de canvas (coordToCanvas)

```
canvasX = (5 + regionX - playerRegionX) * 192 + posX
canvasZ = (5 - (regionZ - playerRegionZ)) * 192 + (192 - posZ)
```

### World Units → píxeles de canvas (worldToRender)

```
renderX = (worldX - playerWX) + 960
renderZ = -(worldZ - playerWZ) + 960
```

### Píxeles de canvas → World Units (renderToWorld)

```
worldX = playerWX + (renderX - 1056)
worldZ = playerWZ - (renderZ - 1056)
```

### Click en canvas → World Units centradas

```
tileOrigin = 5 * 192 = 960
localX = clickPx - 960
localZ = 960 - clickPy

playerRX = Math.floor(playerWorldX / 192)
playerRZ = Math.floor(playerWorldZ / 192)

clickWX = playerRX * 192 + localX
clickWZ = playerRZ * 192 + localZ
```

### Click → envío MOVE al backend

```
targetRX = Math.floor(tWX / 192) + 135     // región absoluta X
targetRZ = Math.floor(tWZ / 192) + 92      // región absoluta Z
targetRegion = targetRX | (targetRZ << 8)
targetLocalX = Math.round(tWX - (targetRX - 135) * 192)
targetLocalZ = Math.round(tWZ - (targetRZ - 92) * 192)
```

### Envío 0x7021 (backend → servidor Silkroad)

```
x10 = Math.round(posX * 10)
z10 = Math.round(posZ * 10)
y10 = Math.round(altY * 10)

// Normal world: writeShortLE(x10), writeShortLE(z10), writeShortLE(y10)
// Dungeon: writeDWord(x10), writeDWord(z10), writeDWord(y10)
```

---

## 5.3. Centros del sistema

El sistema de coordenadas usa DOS centros diferentes:

| Concepto | Valor | Dónde se usa |
|----------|-------|-------------|
| Centro del mapa (X) | `135` | Backend `CENTER_X`, frontend `regionToWorld`, `regionXYToWorld` |
| Centro del mapa (Z) | `92` | Backend `CENTER_Z`, frontend `regionToWorld`, `regionXYToWorld` |
| Centro del mapa (Z) | `91` | Frontend `worldToGame`, `gameToWorld` **⚠️ inconsistente** |
| Centro del canvas (X) | `960` | `TILE_RADIUS * BASE_TILE_SZ` |
| Centro del canvas (Z) | `960` | `TILE_RADIUS * BASE_TILE_SZ` |
| Centro del canvas exacto | `1056` | `CANVAS_CENTER` en `renderToWorld` |

**⚠️ INCONSISTENCIA DEL CENTRO Z**: 
- Backend usa `CENTER_Z = 92`
- Frontend `regionToWorld` y `regionXYToWorld` usan `92`
- Frontend `worldToGame` y `gameToWorld` usan `91`

---

## 5.4. Convención de ejes

| Eje | Dirección positiva | Notas |
|-----|-------------------|-------|
| X | Este | Misma convención en todo el sistema |
| Z (norte-sur) | Norte | Z++ = hacia el norte |
| Y (altitud) | Arriba | Y++ = más altura |
| Canvas X | Derecha | Misma dirección que X del juego |
| Canvas Y | Abajo | **Invertido** respecto a Z del juego (norte = arriba en canvas = menor Y) |

### Orden de ejes en paquetes

| Opcode | Orden | Documentación |
|--------|-------|--------------|
| 0x3013 (spawn) | X, Y(altitud), Z(norte-sur) | MerchBot |
| 0x3015 (spawn) | X, Y(altitud), Z(norte-sur) | MerchBot |
| 0x3019 (spawn) | X, Y(altitud), Z(norte-sur) | MerchBot |
| 0xB021 (movement) | X, Z(norte-sur), Y(altitud) | JellyBitz |
| 0x7021 (client move) | X, Z(norte-sur), Y(altitud) | RSBot |

**⚠️ INCONSISTENCIA CRÍTICA**: Los opcodes de spawn (0x3013, 0x3015, 0x3019) tienen el orden **X, Y(altitud), Z(norte-sur)** mientras que los de movimiento (0xB021, 0x7021) tienen el orden **X, Z(norte-sur), Y(altitud)**. La función `calcWorldCoords` maneja esta diferencia según el parámetro `type`, pero hay que verificar que cada llamada use el `type` correcto.

---

## 5.5. Mapa de conversiones (resumen visual)

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA DE COORDENADAS                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Paquete TCP (raw)                                          │
│  ┌─────────────────┐                                       │
│  │ sectorX (uint8) │──┐                                    │
│  │ sectorZ (uint8) │──┤                                    │
│  │ xOffset (float) │──┤  ┌──────────────────┐              │
│  │ yOffset (float) │──┤  │  calcWorldCoords │              │
│  │ zOffset (float) │──┘  │  (backend)       │              │
│  └─────────────────┘      │  ┌────────────┐  │              │
│                           │  │ posX = x/10│  │              │
│                           │  │ posZ = z/10│  │              │
│                           │  │ posY = y/10│  │              │
│                           │  │ worldX=     │  │              │
│                           │  │  (sec-135)  │  │              │
│                           │  │  *192+posX  │  │              │
│                           │  │ worldZ=     │  │              │
│                           │  │  (sec-92)   │  │              │
│                           │  │  *192+posZ  │  │              │
│                           │  └────────────┘  │              │
│                           └──────────────────┘              │
│                                     │                       │
│                                     ▼                       │
│                           ┌──────────────────┐              │
│                           │  WebSocket JSON  │              │
│                           │  { region,       │              │
│                           │    posX, posZ,   │              │
│                           │    posY }        │              │
│                           └──────────────────┘              │
│                                     │                       │
│                                     ▼                       │
│                           ┌──────────────────┐              │
│                           │  regionToWorld   │              │
│                           │  (frontend)      │              │
│                           │  worldX =        │              │
│                           │   (sec-135)*192  │              │
│                           │   + Math.round() │              │
│                           │  worldZ =        │              │
│                           │   (sec-92)*192   │              │
│                           │   + Math.round() │              │
│                           └──────────────────┘              │
│                                     │                       │
│                                     ▼                       │
│  ┌─────────────────┐    ┌──────────────────┐               │
│  │  coordToCanvas  │    │  worldToRender   │               │
│  │  (player/local) │    │  (entities)      │               │
│  │  canvasX =      │    │  renderX =       │               │
│  │   (5+dx)*192+X  │    │   dwx + 960      │               │
│  │  canvasZ =      │    │  renderZ =       │               │
│  │   (5-dz)*192    │    │   -dwz + 960     │               │
│  │   +(192-posZ)   │    │                  │               │
│  └─────────────────┘    └──────────────────┘               │
│           │                        │                        │
│           └──────────┬─────────────┘                        │
│                      ▼                                      │
│           ┌──────────────────────┐                          │
│           │  p.renderX, p.renderZ │                          │
│           │  (píxeles absolutos   │                          │
│           │   del canvas)         │                          │
│           └──────────────────────┘                          │
│                      │                                       │
│                      ▼                                       │
│           ┌──────────────────────┐                          │
│           │  CSS translate3d    │                          │
│           │  offset + zoom      │                          │
│           │  → posición en       │                          │
│           │    pantalla          │                          │
│           └──────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 5.6. Origen del sistema "centrado" vs "absoluto"

El sistema de coordenadas Silkroad original usa **coordenadas absolutas** donde:
- `regionX` va de 0 a 255 (el mapa jugable es ~26-252)
- `regionZ` va de 0 a 255 (el mapa jugable es ~37-126)
- `posX/posZ` van de 0 a 191 dentro de cada región

El frontend de BlackRose usa un sistema **centrado** donde:
- El jugador está en el centro del canvas (tile central en TILE_RADIUS, TILE_RADIUS)
- Las coordenadas se calculan relativas al jugador
- `coordToCanvas` usa la diferencia de regiones (dx, dz) para posicionar
- El offset de cámara (`worldToRender`) desplaza el canvas completo con CSS

La conversión entre ambos sistemas:
- **Absoluto → Centrado**: `worldW = (regionX - 135) * 192 + posX`
- **Centrado → Absoluto**: `regionX = Math.floor(worldW / 192) + 135`
