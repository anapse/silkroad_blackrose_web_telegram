# 4. Todos los campos leídos junto a las coordenadas

Este archivo documenta CADA CAMPO que se lee en los mismos bloques que las coordenadas, incluyendo el orden exacto de lectura y el tipo de dato, para cada opcode.

---

## 4.1. Opcode 0x3013 — CHAR_DATA (posición en ParseBionicDetails)

### Orden de lectura desde donde se encuentra la posición:

```
Offset  Tipo     Campo
──────────────────────────────
+0      uint32   uniqueId
+4      uint16   region (ushort)
  +0    uint8    sectorX (region & 0xFF)
  +1    uint8    sectorZ ((region >> 8) & 0xFF)
+6      float32  xOffset (X, este-oeste)
+10     float32  zOffset (norte-sur) ← ¡2do float!
+14     float32  yOffset (altitud)   ← ¡3er float!
+18     int16    angle
```

### Campos ANTES de la posición (en el mismo buffer):

```
Offset  Tipo     Campo
──────────────────────────────
+0      uint32   serverTimestamp
+4      uint32   modelId (refObjId)
+8      uint8    scale
+9      uint8    level
+10     uint8    levelMax
+11     uint64   currentExp (BigUInt64)
+19     uint32   skillExp (uint16+uint16, se salta)
+23     uint64   gold
+31     uint32   sp
+35     uint16   statPoints
+37     uint8    berserkPoints
+38     uint32   expChunk (se salta)
+42     uint32   hp
+46     uint32   mp
+50     uint8    (desconocido, se salta)
+51     uint8    (desconocido, se salta)
+52     uint16   (desconocido, se salta)
+54     uint32   (desconocido, se salta)
+58     uint8    (desconocido, se salta)
+59     uint8    (desconocido, se salta)
+60     uint8    maxSlots
+61     uint8    itemCount
```

### Campos DESPUÉS de la posición:

```
- AvatarInventory
  - uint8  avatarSize
  - uint8  avatarCount
  - Por cada avatar: uint8 slot, uint32 rentType, [rent info], uint32 itemId, uint8 optLevel, uint64 variance, uint32 durability, uint8 magCount, magCount×8 bytes, 8 bytes binding
- uint8 unkByte1
- Masteries (while next === 1): uint32 mId, uint8 mLv
- uint8 unkByte2
- Skills (while next === 1): uint32 sId, uint8 sEnabled
- Quests: uint16 completedCount, completedCount×uint32, uint8 activeCount, quest data...
- uint8 unkByte3
- CollectionBook: uint32 themeCount, themeCount×(uint32 index, uint32 startTime, uint32 pages)
- POSICIÓN (uniqueId + region + x + z + y + angle) ← 20 bytes
```

---

## 4.2. Opcode 0x3015 — SINGLE_SPAWN

### Para entidades CHAR:

```
Offset  Tipo     Campo
───────────────────────────────
+0      uint32   refObjId
+4      uint8    scale
+5      uint8    rank (desconocido)
+6      uint8    icons (desconocido)
+7      uint8    unknown
+8      uint8    maxSlots
+9      uint8    itemCount
        ── items ──
        uint32   itemId (por cada item)
        (si es equip: +1 byte plus)
+?      uint8    maxAvatarSlots
+?      uint8    avatarCount
        ── avatars ──
        (por cada avatar: uint32 refItemId + uint8 plus)
+?      uint8    hasMask
        ── mask (si hasMask=1) ──
        uint32   maskId
        uint8    unkByte (si maskEntityType === 'CHAR')
        uint8    maskCount
        maskCount×uint32
        ── POSICIÓN ──
+?      uint32   uniqueId
+?      uint8    sectorX (xSector)
+?      uint8    sectorZ (ySector)
+?      float32  xOffset
+?      float32  yOffset (2do float = altitud)
+?      float32  zOffset (3er float = norte-sur)
+?      uint16   angle
+?      uint8    moving
+?      uint8    running
        ── Movement data (si moving=1) ──
        uint8    destXsec
        uint8    destYsec
        (si destYsec=0x80: dungeon 12 bytes; si no: 6 bytes)
        ── O si no moving ──
        uint8    noDestination
        uint16   angle (move angle)
        ── State ──
+?      uint8    alive (lifeState)
+?      uint8    unknown
+?      uint8    unknown
+?      uint8    unknown
+?      float32  walkSpeed
+?      float32  runSpeed
+?      float32  zerkSpeed
+?      uint8    skillCount
        ── Skills ──
        (por cada skill: uint32 skillId + uint32 tempId)
        ── NAME ──
+?      uint16   nameLen
+?      ASCII    charName (nameLen bytes)
        ── Post-name ──
+?      uint8    unknown
+?      uint8    jobType
+?      uint8    jobLevel
+?      uint8    cnt (unknown counter)
+?      uint8    unknown (o uint32 si cnt=1)
+?      uint8    unknown
+?      uint8    stallFlag
+?      uint8    unknown
+?      uint16   guildNameLen
+?      ASCII    guildName
+?      uint32   guildId
+?      uint16   grantNameLen
+?      ASCII    grantName
+?      12 bytes (unknown)
+?      uint16   (unknown)
+?      (si stallFlag=4): uint16 stallNameLen + ASCII stallName + 6 bytes
        (si no): uint16 unknown
```

### Para entidades NPC/MOB/COS:

```
Offset  Tipo     Campo
───────────────────────────────
+0      uint32   refObjId
+4      uint32   uniqueId
+8      uint8    sectorX
+9      uint8    sectorZ
+10     float32  xOffset
+14     float32  yOffset (2do = altitud)
+18     float32  zOffset (3ro = norte-sur)
+22     uint16   angle
+24     uint8    moving
+25     uint8    running
```

**⚠️ NOTA**: En CHAR, el orden es `yOffset` (altitud) como 2do float y `zOffset` (norte-sur) como 3er float. En NPC/MOB es exactamente el mismo orden. Pero en `calcWorldCoords` con type='spawn' se interpreta raw2=altitud, raw3=norte-sur.

---

## 4.3. Opcode 0xB021 — SERVER_MOVE

```
Offset  Tipo     Campo
───────────────────────────────
+0      uint32   entityUniqueId
+4      uint8    hasDestination
        ── Si hasDestination=1 ──
+5      uint16   dstRegion
+7      int16    dstX (offset X, short) — raw ×10
+9      int16    dstZ (offset Z norte-sur, short) — raw ×10
+11     int16    dstY (offset Y altitud, short) — raw ×10
        ── Si hasDestination=0 ──
+5      uint8    moveType (0=spinning, 1=sky/key-walking)
        ── Source (siempre presente) ──
+?      uint8    hasSource
        ── Si hasSource=1 ──
+?      uint16   srcRegion
        ── Si srcRegion>=32768 (Dungeon) ──
+?      int32    srcX (X offset /10)
+?      float32  srcZ (norte-sur, float directo)
+?      int32    srcY (altitud /10)
        ── Si no (Normal) ──
+?      int16    srcX (X offset /10)
+?      float32  srcZ (norte-sur, float directo)
+?      int16    srcY (altitud /10)
        ── Angle ──
+?      int16    angle
```

**⚠️ NOTA**: `srcX` y `srcY` ya vienen divididos entre 10 (en normal world son `Int16/10`, en dungeon `Int32/10`). `srcZ` viene como float directo, NO dividido. En el envío al frontend se hace `Math.round(srcX)` que es redundante si ya vino dividido.

---

## 4.4. Opcode 0x3019 — GROUP_SPAWN (por cada entidad)

La estructura es IDÉNTICA a 0x3015 para cada entidad dentro del grupo. El orden de campos es el mismo.

---

## 4.5. Opcode 0x3017 — GROUP_SPAWN_BEGIN

```
Offset  Tipo     Campo
───────────────────────────────
+0      uint8    action (0=despawn, 1=spawn)
+1      uint16   count (número de entidades)
```

---

## 4.6. Opcode 0x3018 — GROUP_SPAWN_END

No tiene payload adicional. Solo marca el fin de los datos acumulados en 0x3019.

---

## 4.7. Opcode 0x3020 — CELESTIAL

```
Offset  Tipo     Campo
───────────────────────────────
+0      uint32   uniqueId
+4      uint16   moonPosition
+6      uint8    hour
+7      uint8    minute
```

---

## 4.8. Opcode 0x7021 — CLIENT_MOVEMENT (lo que se ENVÍA al servidor)

```
Offset  Tipo     Campo
───────────────────────────────
+0      uint8    movementType (1=normal click)
+1      uint16   regionID
        ── Si region>=32768 (Dungeon) ──
+3      int32    xOffset ×10
+7      int32    zOffset ×10 (norte-sur)
+11     int32    yOffset ×10 (altitud)
        ── Si no (Normal) ──
+3      int16    xOffset ×10
+5      int16    zOffset ×10 (norte-sur)
+7      int16    yOffset ×10 (altitud)
```

---

## 4.9. REGIONS.js y CITY_MAPS.js (frontend)

### REGIONS.js

```js
// Estructura de cada región:
{
    regionId: number,    // ID único de región
    x: number,           // sector X (absoluto, 26-252)
    z: number,           // sector Z (absoluto, 37-126)
    name: string,        // nombre del área
    // ... otros campos si existen
}
```

### CITY_MAPS.js

```js
// Estructura de cada mapa de ciudad:
{
    townName: string,           // nombre del pueblo
    image: string,               // ruta de la imagen
    imageWidth: number,          // ancho en píxeles
    imageHeight: number,         // alto en píxeles
    playArea: { x, y, w, h },   // área jugable dentro de la imagen
    portals: [{                  // portales de entrada/salida
        worldRect: { x, y, w, h },  // rectángulo en mundo
        cityRect: { x, y, w, h },   // rectángulo en imagen de ciudad
    }],
    npcs: [{                     // NPCs en el mapa de ciudad
        id: string,
        x: number,               // porcentaje X (0-100)
        y: number,               // porcentaje Y (0-100)
        label: string,
        icon: string,
        action: { type, ... },
    }],
}
```

### MARKERS.js

```js
// Estructura de cada marcador:
{
    regionId: number,    // ID de región
    type: string,        // 'city' | 'fort' | 'dungeon' | 'npc' | 'poi'
    label: string,
    icon: string,
    iconFocus?: string,
    offset?: { x, y },   // offset en píxeles desde la región
    action: { type: 'citymap'|'dialog'|'url', ... },
}
```

### GAME_CONSTANTS.js

```js
MAP: {
    MIN_X: 26,           // región X mínima del mapa
    MAX_X: 252,          // región X máxima
    MIN_Z: 37,           // región Z mínima
    MAX_Z: 126,          // región Z máxima
    BASE_TILE_SZ: 192,   // tamaño de cada tile en píxeles
    TILE_STEP: 1,        // cada tile = 1 región
    UNITS_PER_REGION: 192, // unidades Silkroad por región
    WORLD_SCALE: 1,      // 192/192 = 1
    TILE_RADIUS: 5,      // radio de tiles alrededor del jugador
    CANVAS_W: 2112,      // (2*5+1)*192 = 2112
    CANVAS_H: 2112,      // (2*5+1)*192 = 2112
},
MOVEMENT: {
    WALK_SPEED_WU: 80,   // velocidad de caminata en WU/s
    MAX_CLICK_WU: 800,   // distancia máxima de click
    CITY_EXIT_NUDGE_WU: 0.01, // desplazamiento al salir de ciudad
},
SPAWN: {
    CHINA: {
        REGION_X: 168,   // región inicial china
        REGION_Z: 97,
        POS_X: 98.2,     // posición inicial dentro de la región
        POS_Z: 14,
    },
    EUROPE: {
        REGION_X: 68,
        REGION_Z: 104,
        POS_X: 50,
        POS_Z: 50,
    },
}
```
