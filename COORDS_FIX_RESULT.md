# Resultado de la Corrección del Sistema de Coordenadas — BlackRose

**Fecha**: 2026-06-03

---

## Resumen de archivos modificados

| Archivo | Línea | Cambio |
|---------|-------|--------|
| `blackrosebackend/src/shared/handlers/packet/MovementHandlers.js` | 134 | `Math.round(srcZ)` → `Math.round(srcZ / 10)` |
| `blackroseweb/src/game/utils/geo.js` | 5 (comentario) | `regionZ - 91` → `regionZ - 92` |
| `blackroseweb/src/game/utils/geo.js` | 7 (comentario) | `worldZ/192 + 91` → `worldZ/192 + 92` |
| `blackroseweb/src/game/utils/geo.js` | 17 | `CANVAS_CENTER = 1056` → `CANVAS_CENTER = 960` |
| `blackroseweb/src/game/utils/geo.js` | 122 | `gameY: wz - 91 * UNITS_PER_REGION` → `gameY: wz - 92 * UNITS_PER_REGION` |
| `blackroseweb/src/game/utils/geo.js` | 127 | `worldZ: gy + 91 * UNITS_PER_REGION` → `worldZ: gy + 92 * UNITS_PER_REGION` |
| `blackroseweb/src/game/hooks/useMapInteractions.js` | 125-127 | Validación `targetLocalX <= 192` → clamp `Math.min(191, Math.max(0, ...))` |
| `blackrosebackend/src/game/network/ws/WebSocketSession.js` | 207-211 | Clamp de seguridad `posX/posZ` a [0, 191] antes de `×10` |

---

## Detalle de cada corrección

### Tarea 1 — srcZ en movimiento (0xB021)

**Problema**: `srcZ` se lee como `Float32` directo del servidor (no viene dividido), pero `srcX` y `srcY` ya se leen como `Int16/10`. Al enviar al frontend, `srcZ` se enviaba sin dividir, resultando en un valor ~10× mayor que los otros ejes.

**Archivo**: `blackrosebackend/src/shared/handlers/packet/MovementHandlers.js`

**Antes**:
```js
srcZ: hasSource ? Math.round(srcZ) : undefined,
```

**Después**:
```js
srcZ: hasSource ? Math.round(srcZ / 10) : undefined,
```

**Inversa verificada**: `srcZ` no se usa para reconstruir el paquete 0x7021 (el envío al servidor usa `posZ` del frontend, no `srcZ`). Pero su escala ahora coincide con `srcX`/`srcY`.

**Impacto**: Bajo — `srcZ` no es consumido por el frontend en ningún renderizado directo (solo `dstX`/`dstZ`/`dstY` se usan para posición). Pero la corrección elimina una inconsistencia en los datos de depuración.

---

### Tarea 2 — Unificar centro Z

**Problema**: El centro Z del mapa tenía dos valores: `92` en backend, `regionToWorld` y `regionXYToWorld`; `91` en `worldToGame`/`gameToWorld` de `geo.js`. Esto producía un desplazamiento fijo de 192 unidades (1 región entera) en el eje norte-sur para todo lo que pasara por esas funciones.

**Archivo**: `blackroseweb/src/game/utils/geo.js`

**Antes**:
```js
gameY: wz - 91 * UNITS_PER_REGION,
worldZ: gy + 91 * UNITS_PER_REGION,
```

**Después**:
```js
gameY: wz - 92 * UNITS_PER_REGION,
worldZ: gy + 92 * UNITS_PER_REGION,
```

**Inversa verificada**: `worldToGame` y `gameToWorld` ahora son inversas exactas entre sí y consistentes con el resto del sistema.

**Impacto**: Medio — afecta cualquier código que use `worldToGame`/`gameToWorld`. No se encontraron usos de estas funciones en el código actual, pero la corrección previene errores futuros si alguien las usa.

---

### Tarea 3 — Unificar origen del canvas en `renderToWorld`

**Problema**: `worldToRender` usaba `960` como origen del canvas (`TILE_RADIUS * BASE_TILE_SZ`), pero `renderToWorld` usaba `CANVAS_CENTER = 1056` (que incluía `+ BASE_TILE_SZ/2`). Esto hacía que ambas funciones NO fueran inversas entre sí, con un desfase de 96 píxeles.

**Archivo**: `blackroseweb/src/game/utils/geo.js`

**Antes**:
```js
const CANVAS_CENTER = TILE_RADIUS * BASE_TILE_SZ + BASE_TILE_SZ / 2;  // = 1056
```

**Después**:
```js
const CANVAS_CENTER = TILE_RADIUS * BASE_TILE_SZ;                      // = 960
```

**Inversa verificada**: Ahora `worldToRender` y `renderToWorld` son inversas exactas:
- `worldToRender` → `renderX = (wx - pwX) + 960`, `renderZ = -(wz - pwZ) + 960`
- `renderToWorld` → `worldX = pwX + (rx - 960)`, `worldZ = pwZ - (rz - 960)`

**Impacto**: Bajo — `renderToWorld` no es llamado en ningún lugar del código (solo importado). Pero la corrección asegura que si alguien lo usa, dará resultados correctos.

---

### Tarea 4 — Verificación de cadena completa de ida y vuelta

Se verificó cada paso de transformación:

| Paso | Entrada | Transformación | Salida | Inversa correcta |
|------|---------|---------------|--------|-----------------|
| Servidor → Backend (spawn) | Float32 raw | `/10` | `posX` (int) | ×10 como Int16 ✓ |
| Backend → Frontend | `posX` (int) | ninguna | `posX` (int) | N/A |
| Frontend → Backend (MOVE) | `posX` (int) | ninguna | `posX` (int) | N/A |
| Backend → Servidor (0x7021) | `posX` (int) | `×10`, writeInt16 | Int16 raw | `/10` en recepción ✓ |
| Servidor → Backend (0xB021) | Int16 raw | `/10` | `dstX` (int) | ×10 en envío ✓ |
| Backend → Frontend (confirmación) | `dstX` (int) | ninguna | `posX` (int) | Consistente ✓ |

**Conclusión**: Todas las transformaciones tienen su inversa exacta. No se encontraron problemas en la cadena.

---

### Tarea 5 — Verificación entidades vs player misma base

**Resultado**: Ambas rutas son consistentes.

**Player**:
1. `regionXYToWorld(regionX, regionZ, posX, posZ)` → worldX/worldZ
2. `coordToCanvas(regionX, regionZ, posX, posZ, regionX, regionZ)` → renderX/renderZ

**Entidades**:
1. `regionToWorld(regionId, posX, posZ)` → worldX/worldZ (misma fórmula: `(sector-135)*192 + posX`)
2. `coordToCanvas(e.regionX, e.regionZ, posX, posZ, pRX, pRZ)` → renderX/renderZ (misma función)

**Nota**: `useGameLoop.js` tiene código para renderizar otros players (no-"me") usando `worldToRender` en lugar de `coordToCanvas`, pero este código es inalcanzable porque el estado `players` solo contiene `"me"`. Si en el futuro se añaden más players al estado, habrá que unificar el renderizado.

---

## Problemas adicionales encontrados

### 1. Validación lava en `useMapInteractions.js` (CORREGIDO)

**Antes**: `targetLocalX >= 0 && targetLocalX <= 192` — permitía 192, que excede el rango [0, 191].
**Después**: Se aplica clamp `Math.min(191, Math.max(0, targetLocalX))` antes de enviar al servidor.
**Además**: Se añadió clamp de seguridad en `WebSocketSession.js` antes de la conversión `×10`.

### 2. Código muerto en `useGameLoop.js`

El bloque de renderizado para `id !== "me"` usando `worldToRender` es código muerto. Debería eliminarse o reemplazarse con `coordToCanvas` para mantener la coherencia, si en el futuro se añaden más jugadores al estado `players`.

### 3. `regionToWorld` en frontend ignora el parámetro `type`

En `geo.js`, la función `regionToWorld` acepta un parámetro `type` pero su implementación es idéntica para `'spawn'` y `'movement'` (ambos hacen `offsetX = rawX; offsetZ = rawZ`). El parámetro `type` solo tiene sentido en el backend (`calcWorldCoords`). Esto es confuso pero no causa errores.

### 4. Duplicación de lógica de coordenadas

Backend tiene `calcWorldCoords` y `regionToWorld` en `coordUtils.js`. Frontend tiene `regionToWorld`, `regionXYToWorld`, `playerToCanvas`, `coordToCanvas`, `worldToRender`, `renderToWorld`, `worldToGame`, `gameToWorld` en `geo.js`. Hay lógica duplicada entre backend y frontend para la misma conversión (worldX = (sector-135)*192 + posX). Cualquier cambio futuro debe hacerse en ambos lados.
