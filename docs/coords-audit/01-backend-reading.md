# 1. Cómo el backend lee las coordenadas

## 1.1. Origen de los datos

El backend (`blackrosebackend/`) recibe paquetes TCP del servidor Silkroad. El `PacketRouter` despacha cada paquete por su opcode a los handlers correspondientes.

**Archivo principal**: `blackrosebackend/src/shared/PacketRouter.js`

Las coordenadas se leen de los siguientes opcodes:

| Opcode | Handler | Propósito |
|--------|---------|-----------|
| `0x3013` (CHAR_DATA) | `CharDataHandlers.js` | Datos iniciales del personaje (incluye posición) |
| `0x3015` (SINGLE_SPAWN) | `SpawnHandlers.js` | Spawn de una entidad (player, mob, npc) |
| `0x3019` (GROUP_SPAWN_DATA) | `SpawnHandlers.js` | Spawn grupal de entidades |
| `0xB021` (SERVER_MOVE) | `MovementHandlers.js` | Movimiento del player y entidades |
| `0x3020` (CELESTIAL) | `MovementHandlers.js` | Posición celestial (para detectar uniqueId) |

---

## 1.2. Opcode 0x3013 — CHAR_DATA (posición inicial del player)

**Archivo**: `blackrosebackend/src/shared/handlers/packet/CharDataHandlers.js`

### Lectura secuencial (posición esperada)

```js
// En handleCharDataEnd(), después de parsear stats, inventario, skills, etc.:
// uniqueId + region + x + z + y + angle = 20 bytes
if (pos + 20 <= data.length) {
    const uid = data.readUInt32LE(pos); pos += 4;   // [4] uniqueId
    const region = data.readUInt16LE(pos); pos += 2; // [2] regionID (ushort)
    const xs = region & 0xFF;                         // sector X
    const ys = (region >> 8) & 0xFF;                  // sector Z (norte-sur)
    
    if (xs > 0 && ys > 0 && xs <= 252 && ys <= 126) {
        const xo = data.readFloatLE(pos); pos += 4;   // [4] X offset (float)
        const zo = data.readFloatLE(pos); pos += 4;   // [4] Z offset (float) — ¡2do float = norte-sur!
        const yo = data.readFloatLE(pos); pos += 4;   // [4] Y offset (float) — ¡3er float = altitud!
        angle = data.readInt16LE(pos); pos += 2;      // [2] angle (short)
        
        // Validación básica
        if (!isNaN(xo) && !isNaN(zo) && !isNaN(yo) &&
            Math.abs(xo) < 2000 && Math.abs(zo) < 2000 && Math.abs(yo) < 2000 &&
            !(Math.abs(xo) < 0.001 && Math.abs(zo) < 0.001 && Math.abs(yo) < 0.001)) {
            
            playerUniqueId = uid;
            const coords = calcWorldCoords(xs, ys, xo, yo, zo, 'spawn');
            //    calcWorldCoords recibe: sectorX, sectorZ, raw1, raw2, raw3, type='spawn'
            //    Con type='spawn': raw1=X, raw2=altitud(Y), raw3=norte-sur(Z)
            //    ¡OJO! calcWorldCoords recibe (xs, ys, xo, yo, zo)
            //    donde xo=X, yo=altitud(Y), zo=norte-sur(Z)
            
            initPos = {
                region: coords.region,
                posX: coords.posX,   // Math.round(xo / 10)
                posZ: coords.posZ,   // Math.round(zo / 10) ← zo es norte-sur
                posY: coords.posY,   // Math.round(yo / 10) ← yo es altitud
            };
        }
    }
}
```

### Fallback: búsqueda inversa (si la posición secuencial falla)

```js
// Si initPos.region === 0, busca hacia atrás desde el final del buffer
for (let i = data.length - 20; i >= SEARCH_START; i--) {
    const uid = data.readUInt32LE(i);           // [4] uniqueId
    const region = data.readUInt16LE(i + 4);    // [2] regionID
    const xs = region & 0xFF, ys = (region >> 8) & 0xFF;
    
    // Validar región y flotantes ...
    const xo = data.readFloatLE(i + 6);          // [4] X
    const zo = data.readFloatLE(i + 10);         // [4] Z (2do float = altitud/norte-sur)
    const yo = data.readFloatLE(i + 14);         // [4] Y (3er float = altitud/norte-sur)
    
    const coords = calcWorldCoords(xs, ys, xo, yo, zo, 'spawn');
    // Misma función, mismos parámetros
}
```

### Lo que se envía al frontend desde 0x3013

```js
// PLAYER_POSITION_INIT
router.session.wsSession.sendEvent('PLAYER_POSITION_INIT', {
    type: 'PLAYER_POSITION_INIT',
    region: initPos.region,       // region ID (ushort)
    posX: initPos.posX,           // ya dividido /10
    posY: initPos.posY,           // ya dividido /10 (altitud)
    posZ: initPos.posZ,           // ya dividido /10 (norte-sur)
});

// También PLAYER_SPAWNED
router.session.wsSession.sendEvent('', {
    type: 'PLAYER_SPAWNED',
    region: initPos.region,
    posX: initPos.posX, posY: initPos.posY, posZ: initPos.posZ,
    level, hp, mp, maxHp, maxMp, sp, exp, refObjId, playerName,
});

// También PLAYER_UPDATE
router.session.wsSession.sendEvent('', {
    type: 'PLAYER_UPDATE',
    hp, maxHp, mp, maxMp, level, sp, exp: currentExp,
    region: initPos.region,
    posX: initPos.posX, posY: initPos.posY, posZ: initPos.posZ,
});
```

---

## 1.3. Opcode 0x3015 — SINGLE_SPAWN

**Archivo**: `blackrosebackend/src/shared/handlers/packet/SpawnHandlers.js`

### Para entidades CHAR

```js
// Después de parsear inventory/avatar/mask:
uniqueId = payload.readUInt32LE(pos); pos += 4;   // [4] uniqueId
xSector = payload.readUInt8(pos); pos += 1;       // [1] sector X
ySector = payload.readUInt8(pos); pos += 1;       // [1] sector Z (norte-sur)
xOffset = payload.readFloatLE(pos); pos += 4;     // [4] X offset (float)
yOffset = payload.readFloatLE(pos); pos += 4;     // [4] 2do = altitud (Y)
zOffset = payload.readFloatLE(pos); pos += 4;     // [4] 3ro = norte-sur (Z)
angle = payload.readUInt16LE(pos); pos += 2;      // [2] angle
moving = payload.readUInt8(pos); pos += 1;        // [1] moving flag
running = payload.readUInt8(pos); pos += 1;       // [1] running flag
```

### Para entidades NPC/MOB/COS

```js
// Misma estructura pero sin inventory/avatar/mask antes:
uniqueId = payload.readUInt32LE(pos); pos += 4;   // [4] uniqueId
xSector = payload.readUInt8(pos); pos += 1;       // [1] sector X
ySector = payload.readUInt8(pos); pos += 1;       // [1] sector Z
xOffset = payload.readFloatLE(pos); pos += 4;     // [4] X offset
yOffset = payload.readFloatLE(pos); pos += 4;     // [4] 2do = altitud
zOffset = payload.readFloatLE(pos); pos += 4;     // [4] 3ro = norte-sur
angle = payload.readUInt16LE(pos); pos += 2;
moving = payload.readUInt8(pos); pos += 1;
running = payload.readUInt8(pos); pos += 1;
```

### Transformación

```js
const coords = calcWorldCoords(xSector, ySector, xOffset, yOffset, zOffset, 'spawn');
//         calcWorldCoords(sectorX, sectorZ, raw1, raw2, raw3, 'spawn')
//         raw1=xOffset (X), raw2=yOffset (altitud), raw3=zOffset (norte-sur)

const region = coords.region;     // sectorX | (sectorZ << 8)
const posX_sql = coords.posX;     // Math.round(xOffset / 10)
const posZ_sql = coords.posZ;     // Math.round(zOffset / 10)  ← el que era 3er float
const posY_sql = coords.posY;     // Math.round(yOffset / 10)  ← el que era 2do float
```

### Lo que se envía al frontend

```js
// Para el propio player (PLAYER_SPAWNED):
{ type: 'PLAYER_SPAWNED', region, posX: posX_sql, posY: posY_sql, posZ: posZ_sql, ... }

// Para otras entidades (ENTITY_SPAWN):
{ type: 'ENTITY_SPAWN', uniqueId, refObjId, entityType, region,
  posX: posX_sql, posY: posY_sql, posZ: posZ_sql, angle, moving, running, name, ... }
```

---

## 1.4. Opcode 0x3019 — GROUP_SPAWN_DATA (spawn grupal)

**Archivo**: `blackrosebackend/src/shared/handlers/packet/SpawnHandlers.js`

El grupo spawn acumula datos en `0x3017` (BEGIN) + `0x3019` (DATA) + `0x3018` (END). El parsing es IDÉNTICO al de 0x3015 para cada entidad dentro del grupo.

---

## 1.5. Opcode 0xB021 — SERVER_MOVE (movimiento)

**Archivo**: `blackrosebackend/src/shared/handlers/packet/MovementHandlers.js`

```js
const entityUniqueId = payload.readUInt32LE(pos); pos += 4;   // [4] uniqueId
const hasDestination = payload.readUInt8(pos); pos += 1;     // [1] hasDestination

if (hasDestination === 1) {
    dstRegion = payload.readUInt16LE(pos); pos += 2;         // [2] regionID
    // Orden en 0xB021 según JellyBitz: X, Z(norte-sur), Y(altitud)
    dstX = payload.readInt16LE(pos); pos += 2;               // [2] X offset (short)
    dstZ = payload.readInt16LE(pos); pos += 2;               // [2] Z offset = norte-sur (short)
    dstY = payload.readInt16LE(pos); pos += 2;               // [2] Y offset = altitud (short)
}

// Source (siempre presente según RSBot)
hasSource = payload.readUInt8(pos) === 1; pos += 1;
if (hasSource) {
    srcRegion = payload.readUInt16LE(pos); pos += 2;         // [2] regionID
    
    if (srcRegion >= 32768) { // Dungeon
        srcX = payload.readInt32LE(pos) / 10; pos += 4;      // [4] X (int /10)
        srcZ = payload.readFloatLE(pos); pos += 4;           // [4] Z (float) — ¡norte-sur!
        srcY = payload.readInt32LE(pos) / 10; pos += 4;      // [4] Y (int /10) — altitud
    } else { // Normal world
        srcX = payload.readInt16LE(pos) / 10; pos += 2;      // [2] X (short /10)
        srcZ = payload.readFloatLE(pos); pos += 4;           // [4] Z (float) — ¡norte-sur!
        srcY = payload.readInt16LE(pos) / 10; pos += 2;      // [2] Y (short /10) — altitud
    }
}

// Angle
angle = payload.readInt16LE(pos); pos += 2;                  // [2] angle
```

### Lo que se envía al frontend

```js
// Para el player (PLAYER_MOVE_CONFIRMED):
{ type: 'PLAYER_MOVE_CONFIRMED', uniqueId,
  dstRegion, dstX: Math.round(dstX / 10), dstZ: Math.round(dstZ / 10), dstY: Math.round(dstY / 10),
  hasSource, srcRegion, srcX: Math.round(srcX), srcZ: Math.round(srcZ), srcY: Math.round(srcY),
  angle }

// Para otras entidades (ENTITY_MOVE):
{ type: 'ENTITY_MOVE', uniqueId,
  dstRegion, dstX: Math.round(dstX / 10), dstZ: Math.round(dstZ / 10), dstY: Math.round(dstY / 10),
  hasSource, srcRegion, srcX: Math.round(srcX), srcZ: Math.round(srcZ), srcY: Math.round(srcY),
  angle }
```

**⚠️ NOTA**: En `dstX/dstZ/dstY` se aplica `Math.round(raw / 10)` porque los valores vienen como `Int16` raw del paquete, pero en `srcX/srcY` ya vienen como `Int16/10` (divididos), y `srcZ` ya viene como Float directo (no dividido). Luego en el frontend se aplica `Math.round(srcX)` que es redundante si ya vino dividido.

---

## 1.6. Opcode 0x3020 — CELESTIAL (solo para detectar uniqueId)

Este opcode NO contiene posición del jugador. Contiene:
```js
const uniqueId = payload.readUInt32LE(0);       // [4] uniqueId
const moonPosition = payload.readUInt16LE(4);  // [2] moon position
const hour = payload.readUInt8(6);              // [1] hour
const minute = payload.readUInt8(7);            // [1] minute
```

Se usa para actualizar `router._expectedUniqueId` y, si hay un buffer de `_charDataBuffer`, se re-explora para encontrar la posición.

---

## 1.7. La función central `calcWorldCoords`

**Archivo**: `blackrosebackend/src/shared/utils/coordUtils.js`

```js
const UNITS_PER_REGION = 192;
const CENTER_X = 135;
const CENTER_Z = 92;
const RATIO = 10;

export function calcWorldCoords(sectorX, sectorZ, raw1, raw2, raw3, type = 'spawn') {
    const region = sectorX | (sectorZ << 8);    // region ID = sectorX | (sectorZ << 8)
    const regionX = sectorX;
    const regionZ = sectorZ;

    let offsetX, offsetZ, offsetY;

    if (type === 'movement') {
        // 0xB021: X(1º), Z norte-sur(2º), Y altitud(3º)
        offsetX = raw1;      // X
        offsetZ = raw2;      // 2do = norte-sur
        offsetY = raw3;      // 3ro = altitud
    } else {
        // spawn y chardata: X(1º), Y altitud(2º), Z norte-sur(3º) ← MerchBot
        offsetX = raw1;      // X
        offsetY = raw2;      // 2do = altitud
        offsetZ = raw3;      // 3ro = norte-sur
    }

    const posX = Math.round(offsetX / RATIO);    // /10
    const posZ = Math.round(offsetZ / RATIO);    // /10
    const posY = Math.round(offsetY / RATIO);    // /10
    
    const worldX = (sectorX - CENTER_X) * UNITS_PER_REGION + posX;   // (sectorX - 135) * 192 + posX
    const worldZ = (sectorZ - CENTER_Z) * UNITS_PER_REGION + posZ;   // (sectorZ - 92) * 192 + posZ

    return { region, regionX, regionZ, posX, posZ, posY, worldX, worldZ };
}
```

**⚠️ INCONSISTENCIA EN EL ORDEN DE EJES**:

| Tipo | Parámetros que recibe | Orden interpretado |
|------|----------------------|-------------------|
| `spawn` | `(sectorX, sectorZ, raw1, raw2, raw3)` | raw1=X, raw2=altitud(Y), raw3=norte-sur(Z) |
| `chardata` | `(sectorX, sectorZ, raw1, raw2, raw3)` | raw1=X, raw2=altitud(Y), raw3=norte-sur(Z) |
| `movement` | `(sectorX, sectorZ, raw1, raw2, raw3)` | raw1=X, raw2=norte-sur(Z), raw3=altitud(Y) |

Pero en `CharDataHandlers.js` se llama así:
```js
const coords = calcWorldCoords(xs, ys, xo, yo, zo, 'spawn');
//                sectorX = xs, sectorZ = ys
//                raw1 = xo, raw2 = yo, raw3 = zo
// Con type='spawn': raw1=xo → X, raw2=yo → altitud, raw3=zo → norte-sur
```

**⚠️ ¡ATENCIÓN!** En `MovementHandlers.js`, cuando se parsea `srcX/srcZ/srcY` para movimiento, las variables locales ya están pre-divididas (/10) ANTES de llamar a `calcWorldCoords`, mientras que `dstX/dstZ/dstY` se envían RAW y el frontend recibe `Math.round(raw / 10)`. Pero `calcWorldCoords` NO se llama para movimiento — los valores se envían directamente al frontend sin pasar por `coordUtils`.

---

## 1.8. Cómo el backend envía movimiento al servidor (0x7021)

**Archivo**: `blackrosebackend/src/game/network/ws/WebSocketSession.js`

Cuando el frontend envía un `MOVE`, el backend construye el paquete 0x7021:

```js
const regionX = region & 0xFF;
const regionZ = (region >> 8) & 0xFF;

const x10 = Math.round((posX || 0) * 10);   // multiplica ×10 (inverso de /10)
const z10 = Math.round((posZ || 0) * 10);
const y10 = Math.round(altY * 10);

p.writeByte(0x01);           // movement type (1 = normal click)
p.writeWord(region & 0xFFFF); // regionID como ushort

if (region >= 32768) {       // Dungeon format
    p.writeDWord(x10);       // int32 X
    p.writeDWord(z10);       // int32 Z
    p.writeDWord(y10);       // int32 Y
} else {                     // Normal world - int16
    // Orden según RSBot (0x7021): X, Z(norte-sur), Y(altitud)
    const writeShortLE = (val) => {
        const b = Buffer.alloc(2);
        b.writeInt16LE(Math.round(val), 0);
        p.writeWord(b.readUInt16LE(0));
    };
    writeShortLE(x10);       // X offset * 10 (este-oeste)
    writeShortLE(z10);       // Z offset * 10 (norte-sur)
    writeShortLE(y10);       // Y offset * 10 (altitud)
}
```
