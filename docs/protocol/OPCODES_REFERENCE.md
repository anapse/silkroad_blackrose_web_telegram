# Referencia Completa de Opcodes - Silkroad Online (VSRO)

> Documentación basada en el análisis de los repositorios:
> - **RSBot** (myildirimofficial/RSBot)
> - **xBot-WinForms** (svalencius/xBot-WinForms)
> - **EasySSA** (Dentrax/EasySSA)
> - **SilkroadDoc** (DummkopfOfHachtenduden/SilkroadDoc)
> - **SilkroadProject** (tanisman/SilkroadProject)
>
> **Propósito**: Servir como fuente única de verdad para el desarrollo del backend PacketRouter.js.
> **NO adivinar estructuras** — todo debe estar verificado contra esta referencia.

---

## Convenciones de Tipos

| Tipo | Tamaño | Descripción |
|------|--------|-------------|
| `uint8` / `byte` | 1 byte | Entero sin signo de 8 bits |
| `uint16` / `ushort` | 2 bytes | Entero sin signo de 16 bits, little-endian |
| `uint32` / `uint` | 4 bytes | Entero sin signo de 32 bits, little-endian |
| `uint64` / `ulong` | 8 bytes | Entero sin signo de 64 bits, little-endian |
| `int8` / `sbyte` | 1 byte | Entero con signo de 8 bits |
| `int16` / `short` | 2 bytes | Entero con signo de 16 bits, little-endian |
| `int32` / `int` | 4 bytes | Entero con signo de 32 bits, little-endian |
| `float` | 4 bytes | IEEE 754 single-precision, little-endian |
| `bool` | 1 byte | 0 = false, 1 = true |
| `string` | variable | String con prefijo de longitud (uint16) + datos UTF-8 |
| `bytes[n]` | n bytes | Datos crudos |

---

## 1. Flujo de Conexión (Gateway → Agent)

```
Gateway (puerto 15779):
  0x6101 → ServerList
  0xA101 ← ServerList Response
  0x6102 → GatewayLogin
  0xA102 ← GatewayLogin Response (session key)
  0x6103 → AgentLogin (con session key + locale)
  0xA103 ← AgentLogin Response

Agent (puerto 15884):
  0x2001 → GlobalIdentification (envía locale)
  0x2002 ← Heartbeat (ping)
  0x2003 → Pong
  0x7001 → CharacterSelectionJoin
  ... listing ...
  0xB001 ← CharacterSelectionResponse ("Welcome")
  0x34A5 ← CharacterDataBegin
  0x3013 ← CharacterData (chunked, múltiples paquetes)
  0x34A6 ← CharacterDataEnd (procesa todo)
  0x3012 → ClientConfirmSpawn (se envía DESPUÉS de CharacterDataEnd)
  0x34B5 ← SpawnRequest
  0x34B6 → SpawnConfirm
  0x3017 ← EntityGroupSpawnBegin (spawnea NPCs/mobs cercanos)
  0x3019 ← EntityGroupSpawnData (datos de spawn)
  0x3018 ← EntityGroupSpawnEnd (procesa spawn grupal)
  0xB023 ← EntityUpdatePosition (actualiza posición de entidades)
  0xB021 ← EntityMoveResponse (confirmación de movimiento)
```

---

## 2. Opcodes del Servidor Agent (Server → Client)

### 2.1. Conexión y Heartbeat

#### `0x2001` — GlobalIdentification (Cliente → Servidor)
```
Estructura:
  [string] locale (ej: "US", "TR", "TH")
```

#### `0x2002` — Heartbeat / Ping (Servidor → Cliente)
```
Estructura:
  Sin payload (paquete vacío, solo opcode)
```
**Respuesta esperada**: `0x2003` (Pong, también vacío)

---

### 2.2. Carga del Personaje (CharacterData)

#### `0x34A5` — CharacterDataBegin
```
Estructura:
  Sin payload (solo opcode)
```
**Efecto**: Inicializa `Game.ChunkedPacket = new Packet(0)`, detiene movimiento.

#### `0x3013` — CharacterData (chunked)
```
Estructura:
  [bytes] Datos crudos del personaje (se acumulan en ChunkedPacket)
```
**Efecto**: Se reciben MÚLTIPLES paquetes 0x3013. Todos se concatenan en `ChunkedPacket`.

#### `0x34A6` — CharacterDataEnd
**ESTRUCTURA COMPLETA** (orden exacto de parseo):

```
  [uint32] serverTimestamp (solo Thailand+)
  [uint32] modelId (refObjId del personaje)
  [uint8]  scale
  [uint8]  level
  [uint8]  maxLevel
  [uint64] experience
  [uint32] skillExperience
  [uint64] gold
  [uint32] skillPoints
  [uint16] statPoints
  [uint8]  berserkPoints
  [uint32] experienceChunk
  [int32]  health (HP)
  [int32]  mana (MP)
  [uint8]  autoInvestExperience (AutoInverstType)

  // PK Stats
  [uint8]  dailyPK (o uint16 si Chinese_Old)
  [uint16] totalPK
  [uint32] pkPenaltyPoint
  [uint8]  berserkLevel (solo Thailand+)
  [uint8]  pvpFlag (solo >Thailand)

  // VIP / Client-specific (solo Chinese+)
  [uint8]  ? (si != Chinese)
  [uint32] vipServiceTime
  [uint8]  ?
  [uint32] ? (solo Turkey/VTC/RuSro/Taiwan)
  [bytes12] ? (solo Rigid)
  [uint8]  ? (solo VTC_Game)
  [bytes5] ? (solo Taiwan)
  [uint8]  serverCap
  [uint16] ? (solo !Korean/Chinese/Japanese)

  // INVENTORY (CharacterInventory)
  [*]      inventory (estructura compleja, ver sección 3)

  // AVATARS
  [*]      avatars (InventoryItemCollection, solo Thailand+)
           Si no Thailand: avatars = new InventoryItemCollection(5)

  // JOB2 (solo Vietnam+)
  [*]      job2SpecialtyBag (InventoryItemCollection)
  [*]      job2 (InventoryItemCollection)

  // SKILLS
  [*]      skills (Skills.FromPacket — estructura compleja)

  // QUESTS
  [*]      questLog (QuestLog.FromPacket — estructura compleja)
  [uint8]  unknown

  // COLLECTION BOOK (solo >Thailand)
  [uint32] collectionBookCount
  for each:
    [uint32] index
    [uint32] startTime
    [uint32] pages

  // ⭐ BIONIC DETAILS (ParseBionicDetails) — AQUÍ ESTÁ LA POSICIÓN
  [uint32] uniqueId
  [*]      movement (Position.FromPacket — ver sección 2.4)

  // STATE
  [*]      state (State.Deserialize)

  // NOMBRE Y JOB
  [string] name
  [*]      jobInformation (JobInfo.FromPacket)
  [uint8]  pvpState

  // COMBAT / TRANSPORTE
  [bool]   onTransport
  [bool]   inCombat
  [uint8]  ? (solo Chinese+)
  [uint32] transportUniqueId (si onTransport)
  [uint32] ? (solo Chinese+ — evento/balloon)
  [uint8]  ? (solo >Vietnam)
  [uint8]  pvpDress (0=Red, 1=Blue, 0xFF=None)

  // CLIENT-SPECIFIC (solo ciertos clientes)
  [uint8]  + [uint16] + [uint16] (0xFFs)

  // GUIDE FLAG
  [uint32] guideFlag (o uint64 si Thailand+)

  // FINAL
  [uint8]  ? (solo Chinese_Old/Chinese/Global/RuSro/Korean/VTC/Japanese)
  [uint8]  ? (solo Chinese)
  [uint32] jid
  [bool]   isGameMaster
```

---

### 2.3. Spawn de Entidades

#### `0x3015` — EntitySingleSpawn
```
Estructura:
  Llama a SpawnManager.Parse(packet)
  [uint32] refObjId
  [*]      datos según tipo (ver sección SpawnManager.Parse)
```

#### `0x3017` — EntityGroupSpawnBegin
```
Estructura:
  [uint8]  type (0x01 = Spawn, 0x02 = Despawn)
  [uint16] amount (cantidad de entidades)
```
**Efecto**: Inicializa `Game.SpawnInfo` con un nuevo Packet(0x3019).

#### `0x3019` — EntityGroupSpawnData
```
Estructura:
  [bytes]  datos de spawn (se acumulan en SpawnInfo.Packet)
```

#### `0x3018` — EntityGroupSpawnEnd
```
Estructura:
  Procesa SpawnInfo.Packet:
    for each entity (SpawnInfo.Amount):
      [uint32] refObjId (o uint.MaxValue para spell area)
      [*]      datos según tipo (ver SpawnManager.Parse)
```

#### `0x3016` — EntitySingleDespawn
```
Estructura:
  [uint32] uniqueId
```

---

### 2.4. Posición y Movimiento

#### `Position.FromPacket` (estructura genérica de posición)
```
Estructura:
  [uint16] region
  [float]  xOffset
  [float]  zOffset
  [float]  yOffset
  [int16]  angle
```

#### `Position.FromPacketConditional` (para mazmorras)
```
Estructura:
  [uint16] region
  if (region.IsDungeon):
    [int32]  xOffset
    [int32]  zOffset
    [int32]  yOffset
  else:
    [int16]  xOffset  (valor * 10)
    [int16]  zOffset  (valor * 10)
    [int16]  yOffset  (valor * 10)
  [int16]  worldId
  [int16]  layerId
```

#### `Movement.FromPacket` (estructura de movimiento)
```
Estructura:
  [bool]   hasDestination
  if (hasDestination):
    [uint16] region
    [int16]  xOffset (valor * 10)
    [float]  zOffset
    [int16]  yOffset (valor * 10)
  [float]  angle
  [float]  speed
```

#### `0xB023` — EntityUpdatePosition
```
Estructura:
  [uint32] uniqueId
  [*]      position (Position.FromPacket)
```
**Nota**: Si `uniqueId == Game.Player.UniqueId`, actualiza la posición del player.

#### `0xB021` — EntityMoveResponse (confirmación de movimiento del servidor)
```
Estructura:
  [uint32] uniqueId
  [bool]   hasDestination
  if (hasDestination):
    [uint8]  regionX
    [uint8]  regionY
    [int16]  offsetX (valor * 10)
    [int16]  offsetZ (valor * 10)
    [int16]  offsetY (valor * 10)
  [uint16] angle
```
**Cálculo de coordenadas globales**:
```
posX = (regionX - 135) * 192 + (offsetX / 10)
posZ = (regionY - 92) * 192 + (offsetZ / 10)
```

---

### 2.5. SpawnManager.Parse — Estructura por Tipo de Entidad

El SpawnManager determina el tipo según `RefObjCommon.TypeID1` y subtipos:

```
[uint32] refObjId
if (refObjId == uint.MaxValue):
  // SpellArea
  [uint32/?] ? (uint si Chinese+, ushort si no)
  [uint32] skillId
  [uint32] uniqueId
  [*]      position (Position.FromPacket)
  return

if (refObjId == 0xFFFFFFFE):
  // Flower/decoration
  [uint32] ?
  [uint32] ?
  return

// Obtener RefObjCommon por refObjId
// Según TypeID1:

case 1: // Character / Player
  switch TypeID2:
    case 1: // Player
      [uint8]  scale
      [uint8]  hwanLevel (si >Japanese_Old)
      [uint8]  pvpCape (si >Thailand)
      [uint8]  autoInvestExp
      [uint8]  achievementTitle (si >Chinese)
      [uint32] ? (si Taiwan)
      [uint8]  inventorySize
      [uint8]  itemCount
      for each item:
        [uint32] itemId
        [uint8]  plus
      // Avatars (Thailand+)
      [uint8]  avatarInventorySize
      [uint8]  avatarCount
      for each avatar:
        [uint32] avatarId
        [uint8]  plus
      // Mask
      [bool]   hasMask
      if (hasMask):
        [uint32] maskId
        [uint8]  maskType
        if (maskType != 0):
          [uint8]  maskCount
          for each:
            [uint32] itemId
        if (maskType == 1 || maskType == 2):
          [uint8]  scale
          [uint8]  itemCount
          for each:
            [uint32] itemId
      // ⭐ ParseBionicDetails
      [uint32] uniqueId
      [*]      movement
      [*]      state
      [string] name
      [uint8]  jobType
      [uint8]  jobLevel (si <Chinese_Old)
      [uint8]  pvpState (si <Chinese_Old)
      [bool]   onTransport
      [bool]   inCombat
      [uint32] transportUniqueId (si onTransport)
      [uint8]  scrollMode
      [uint8]  interactMode
      [uint8]  ? (si <Chinese_Old)
      [string] guildName
      // Guild (si no job suit)
      [uint32] guildId
      [string] guildMemberName
      [uint32] guildLastCrestRev
      [uint32] unionId
      [uint32] unionLastCrestRev
      [bool]   isFriendly (Thailand+)
      [uint8]  fortSiegeAuthority (Thailand+)
      // Stall
      [*]      stall (según interactMode)
      // Final
      [bytes9] ? (Chinese+)
      [uint8]  equipmentCooldown
      [uint8]  pkFlag
      [uint8]  ? (Chinese+ && <Rigid)

    case 2: // Monster / NPC / Cos
      switch TypeID3:
        case 1: // Monster
          [uint32] uniqueId (ParseBionicDetails)
          [*]      movement
          [*]      state
          [uint8]  ? (1=Normal, 3=Spawning, 4=Running)

        case 3: // NPC
          [uint32] uniqueId (ParseBionicDetails)
          [*]      movement
          [*]      state
          [*]      talk (NpcTalk.Deserialize)

        case 2,4,5,6,7,8,9: // Cos (mascotas, monturas, etc)
          [uint32] uniqueId (ParseBionicDetails)
          [*]      movement
          [*]      state
          [*]      talk (NpcTalk.Deserialize)
          [string] name/guildName (según TypeID4)
          [*]      ownerName, ownerJobType, etc.
          [uint32] ownerUniqueId
          [uint8]  ? (si TypeID4==9)

        case 5: // Fortress Structure
          [uint32] hp
          [uint32] refEventStructId
          [uint16] currentState
          [*]      bionicDetails
          [*]      talk
          [uint32] guildId
          [string] guildName

case 3: // Item
  [uint8]  optLevel (si equipable)
  [uint32] amount (si es oro)
  [string] ownerName (si quest o trading)
  [uint32] uniqueId
  [*]      position (Position.FromPacket)
  [bool]   hasOwner
  [uint32] ownerJid (si hasOwner)
  [uint8]  rarity

case 4: // Portal
  [uint32] uniqueId
  [*]      position (Position.FromPacket)
  [uint8]  unkByte0 (Vietnam+)
  [uint8]  unkByte1
  [uint8]  unkByte2 (Vietnam+)
  if (unkByte1 == 1):
    [uint32] ?
    [uint8]  ?
  // Regulares vs Dimension Hole
  if (unkByte3 == 1): // Regular
    [uint32] ?
    [uint32] ?
  elif (unkByte3 == 6): // Dimension Hole
    [string] ownerName
    [uint32] ownerUniqueId
```

---

### 2.6. Lista Completa de Opcodes del AgentServer

Basada en EasySSA (OPCode.cs), SilkroadDoc y RSBot.

#### 2.6.1. Entity (Entidades y Spawn)

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x3015` | `AGENT_ENTITY_SOLO_SPAWN` | S→C | Spawn individual de entidad |
| `0x3016` | `AGENT_ENTITY_SOLO_DESPAWN` | S→C | Despawn individual de entidad |
| `0x3017` | `AGENT_ENTITY_GROUPSPAWN_START` | S→C | Inicio de spawn grupal |
| `0x3019` | `AGENT_ENTITY_GROUPSPAWN_DATA` | S→C | Datos de spawn grupal |
| `0x3018` | `AGENT_ENTITY_GROUPSPAWN_END` | S→C | Fin de spawn grupal |
| `0xB021` | `AGENT_ENTITY_MOVEMENT` | S→C | Movimiento de entidad (CHAR_MOVEMENT) |
| `0xB023` | `AGENT_ENTITY_PICKUPITEM_MOVE` | S→C | Actualización de posición (ENTITY_PICKUPITEM_MOVE) |
| `0xB024` | `AGENT_ENTITY_MOVEMENT_ANGLE` | S→C | Cambio de ángulo (CHAR_MOVEMENT_ANGLE) |
| `0xB045` | `AGENT_ENTITY_SELECT_OBJECT` | S→C | Selección de objeto |
| `0xB046` | `AGENT_ENTITY_NPC_OPEN` | S→C | Apertura de diálogo NPC |
| `0xB04B` | `AGENT_ENTITY_NPC_CLOSE` | S→C | Cierre de diálogo NPC |
| `0x3036` | `AGENT_ENTITY_PICKUPITEM_ANIM` | S→C | Animación de recoger item |
| `0x30BF` | `AGENT_ENTITY_STATE_UPDATE` | S→C | Actualización de estado |
| `0x3057` | `AGENT_ENTITY_SKILL_EFFECTS` | S→C | Efectos de skill (CHAR_SKILL_EFFECTS) |
| `0xB070` | `AGENT_ENTITY_SKILL_CAST_BEGIN` | S→C | Inicio de casteo de skill |
| `0xB071` | `AGENT_ENTITY_SKILL_CAST_END` | S→C | Fin de casteo de skill |
| `0xB0BD` | `AGENT_ENTITY_SKILL_BUFF_ADD` | S→C | Añadir buff |
| `0xB072` | `AGENT_ENTITY_SKILL_BUFF_REMOVE` | S→C | Remover buff |
| `0x304E` | `AGENT_CHARACTER_INFO_UPDATE` | S→C | Actualización de info (HP/MP) |
| `0x3056` | `AGENT_CHARACTER_EXP_UPDATE` | S→C | Actualización de EXP |
| `0x30D0` | `AGENT_CHARACTER_SPEED` | S→C | Actualización de velocidad |
| `0x303D` | `AGENT_CHARACTER_STAT` | S→C | Actualización de stats |
| `0x3054` | `AGENT_CHARACTER_LEVELUP_EFFECT` | S→C | Efecto de level up |
| `0x3206` | `AGENT_ENTITY_TICKET` | S→C | Ticket de entidad |

#### 2.6.2. Environment (Entorno)

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x3020` | `AGENT_ENVIRONMENT_CELESTIAL_POSITION` | S→C | Posición del sol/luna (CHAR_CELESTIAL_POS) |
| `0x3027` | `AGENT_ENVIRONMENT_CELESTIAL_UPDATE` | S→C | Actualización celestial |
| `0x3809` | `AGENT_ENVIRONMENT_WEATHER_UPDATE` | S→C | Actualización del clima |

#### 2.6.3. Character (Personaje)

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x34A5` | `AGENT_CHARACTER_DATA_START` | S→C | Inicio de datos de personaje |
| `0x3013` | `AGENT_CHARACTER_DATA` | S→C | Datos de personaje (chunked) |
| `0x34A6` | `AGENT_CHARACTER_DATA_END` | S→C | Fin de datos de personaje |
| `0x7001` | `AGENT_CHARACTER_SELECTION_JOIN` | C→S | Join a personaje |
| `0xB001` | `AGENT_CHARACTER_SELECTION_JOIN` | S→C | Confirmación de join |
| `0x7007` | `AGENT_CHARACTER_SELECTION_ACTION` | C→S | Acción de selección |
| `0xB007` | `AGENT_CHARACTER_SELECTION_ACTION` | S→C | Lista de personajes |
| `0x7450` | `AGENT_CHARACTER_SELECTION_RENAME` | C→S | Renombrar personaje |
| `0xB450` | `AGENT_CHARACTER_SELECTION_RENAME` | S→C | Resultado de rename |
| `0xB050` | `AGENT_CHARACTER_STAT_UPDATE_STR` | S→C | Actualizar STR |
| `0xB051` | `AGENT_CHARACTER_STAT_UPDATE_INT` | S→C | Actualizar INT |

#### 2.6.4. Game (Juego)

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x300C` | `AGENT_GAME_NOTIFY` | S→C | Notificación del juego |
| `0x3012` | `AGENT_GAME_READY` | C→S | Confirmación de spawn listo |
| `0x3014` | `AGENT_GAME_READY` | C→S | Confirmación alternativa |
| `0x3080` | `AGENT_GAME_INVITE` | S→C | Invitación |
| `0x35B5` | `AGENT_GAME_RESET` | S→C | Reset del juego |
| `0x35B6` | `AGENT_GAME_RESET_COMPLETE` | C→S | Reset completado |
| `0x34BE` | `AGENT_GAME_SERVERTIME` | S→C | Tiempo del servidor |

#### 2.6.5. COS (Call On Summons - Mascotas/Monturas)

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x30C8` | `AGENT_COS_INFO` | S→C | Información COS |
| `0x30C9` | `AGENT_COS_UPDATE` | S→C | Actualización COS |
| `0x30CA` | `AGENT_COS_UPDATE_STATE` | S→C | Actualización estado COS |
| `0xB0CB` | `AGENT_COS_UPDATE_RIDESTATE` | S→C | Estado de montura |
| `0x70C5` | `AGENT_COS_COMMAND` | C→S | Comando COS |
| `0xB0C5` | `AGENT_COS_COMMAND` | S→C | Respuesta comando COS |
| `0x70C6` | `AGENT_COS_TERMINATE` | C→S | Terminar COS |
| `0xB0C6` | `AGENT_COS_TERMINATE` | S→C | Confirmación terminar |
| `0x7116` | `AGENT_COS_UNSUMMON` | C→S | Dessummonear |
| `0xB116` | `AGENT_COS_UNSUMMON` | S→C | Confirmación dessummon |
| `0x7117` | `AGENT_COS_NAME` | C→S | Cambiar nombre |
| `0xB117` | `AGENT_COS_NAME` | S→C | Confirmación nombre |
| `0x7420` | `AGENT_COS_UPDATE_SETTINGS` | C→S | Actualizar config |
| `0xB420` | `AGENT_COS_UPDATE_SETTINGS` | S→C | Confirmación config |

#### 2.6.6. Inventory (Inventario)

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x3038` | `AGENT_INVENTORY_ENTITY_EQUIP` | S→C | Equipar item |
| `0x3039` | `AGENT_INVENTORY_ENTITY_UNEQUIP` | S→C | Desequipar item |
| `0x3040` | `AGENT_INVENTORY_UPDATE_ITEM_STATS` | S→C | Actualizar stats item |
| `0x3049` | `AGENT_INVENTORY_STORAGE_INFO_DATA` | S→C | Datos de almacén |
| `0x3201` | `AGENT_INVENTORY_UPDATE_AMMO` | S→C | Actualizar munición |
| `0x7034` | `AGENT_INVENTORY_OPERATION` | C→S | Operación de inventario |
| `0xB034` | `AGENT_INVENTORY_OPERATION` | S→C | Resultado operación |
| `0x703C` | `AGENT_INVENTORY_STORAGE_OPEN` | C→S | Abrir almacén |
| `0xB03C` | `AGENT_INVENTORY_STORAGE_OPEN` | S→C | Almacén abierto |
| `0x704C` | `AGENT_INVENTORY_ITEM_USE` | C→S | Usar item |
| `0xB04C` | `AGENT_INVENTORY_ITEM_USE` | S→C | Resultado usar item |

#### 2.6.7. Chat

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x7025` | `AGENT_CHAT` | C→S | Enviar mensaje |
| `0xB025` | `AGENT_CHAT` | S→C | Recibir mensaje |
| `0x3026` | `AGENT_CHAT_UPDATE` | S→C | Actualización chat |
| `0x302D` | `AGENT_CHAT_RESTRICT` | S→C | Restricción chat |

#### 2.6.8. Party (Grupo)

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x7060` | `AGENT_PARTY_CREATE` | C→S | Crear grupo |
| `0xB060` | `AGENT_PARTY_CREATE` | S→C | Grupo creado |
| `0x7061` | `AGENT_PARTY_LEAVE` | C→S | Salir grupo |
| `0xB061` | `AGENT_PARTY_LEAVE` | S→C | Confirmación salida |
| `0x7062` | `AGENT_PARTY_INVITE` | C→S | Invitar |
| `0xB062` | `AGENT_PARTY_INVITE` | S→C | Invitación |
| `0x3864` | `AGENT_PARTY_UPDATE` | S→C | Actualización grupo |
| `0x3865` | `AGENT_PARTY_CREATED` | S→C | Grupo creado |
| `0x3065` | `AGENT_PARTY_CREATED_FROM_MATCHING` | S→C | Grupo desde matching |
| `0x3068` | `AGENT_PARTY_DISTRIBUTION` | S→C | Distribución |
| `0xB067` | `sro_client.OnJoinPartyAck` | S→C | Join party ACK |
| `0x7069` | `AGENT_PARTY_MATCHING_FORM` | C→S | Formulario matching |
| `0xB069` | `AGENT_PARTY_MATCHING_FORM` | S→C | Matching form |
| `0x706D` | `AGENT_PARTY_MATCHING_JOIN` | C→S | Unirse a matching |
| `0xB06D` | `AGENT_PARTY_MATCHING_JOIN` | S→C | Resultado matching |

#### 2.6.9. Guild (Clan)

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0xB0F0` | `AGENT_GUILD_CREATE` | S→C | Clan creado |
| `0xB0F1` | `AGENT_GUILD_DISBAND` | S→C | Clan disuelto |
| `0xB0F2` | `AGENT_GUILD_LEAVE` | S→C | Salir clan |
| `0xB0F3` | `AGENT_GUILD_INVITE` | S→C | Invitación clan |
| `0x38F5` | `AGENT_GUILD_UPDATE` | S→C | Actualización clan |
| `0x34B3` | `AGENT_GUILD_INFO_BEGIN` | S→C | Inicio info clan |
| `0x3101` | `AGENT_GUILD_INFO_DATA` | S→C | Datos info clan |
| `0x34B4` | `AGENT_GUILD_INFO_END` | S→C | Fin info clan |
| `0x3253` | `AGENT_GUILD_STORAGE_BEGIN` | S→C | Inicio storage guild |
| `0x3254` | `AGENT_GUILD_STORAGE_END` | S→C | Fin storage guild |
| `0x3255` | `AGENT_GUILD_STORAGE_DATA` | S→C | Datos storage guild |
| `0x385F` | `AGENT_SIEGE_UPDATE` | S→C | Actualización siege |

#### 2.6.10. Quest

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x30D4` | `AGENT_QUEST_TALK` | S→C | Diálogo quest |
| `0x30D5` | `AGENT_QUEST_UPDATE` | S→C | Actualización quest |
| `0x30D6` | `AGENT_QUEST_MARK_ADD` | S→C | Añadir marca quest |
| `0x30D7` | `AGENT_QUEST_MARK_REMOVE` | S→C | Remover marca quest |
| `0x30DA` | `AGENT_QUEST_GATHER` | S→C | Recolectar quest |
| `0x30DC` | `AGENT_QUEST_CAPTURE_RESULT` | S→C | Resultado captura |
| `0x30EC` | `AGENT_QUEST_NOTIFY` | S→C | Notificación quest |

#### 2.6.11. Exchange (Intercambio)

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0xB081` | `AGENT_EXCHANGE_START` | S→C | Inicio intercambio |
| `0x3085` | `AGENT_EXCHANGE_STARTED` | S→C | Intercambio iniciado |
| `0x3086` | `AGENT_EXCHANGE_CONFIRMED` | S→C | Intercambio confirmado |
| `0x3087` | `AGENT_EXCHANGE_APPROVED` | S→C | Intercambio aprobado |
| `0x3088` | `AGENT_EXCHANGE_CANCELED` | S→C | Intercambio cancelado |
| `0x308C` | `AGENT_EXCHANGE_UPDATE_ITEMS` | S→C | Actualizar items |

#### 2.6.12. Job

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x30E0` | `AGENT_JOB_UPDATE_PRICE` | S→C | Actualizar precio job |
| `0xB0E1` | `AGENT_JOB_JOIN` | S→C | Unirse a job |
| `0xB0E2` | `AGENT_JOB_LEAVE` | S→C | Salir de job |
| `0xB0E3` | `AGENT_JOB_ALIAS` | S→C | Alias job |
| `0x30E6` | `AGENT_JOB_UPDATE_EXP` | S→C | Actualizar EXP job |

#### 2.6.13. Skill

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x70A1` | `AGENT_SKILL_LEARN` | C→S | Aprender skill |
| `0xB0A1` | `AGENT_SKILL_LEARN` | S→C | Skill aprendida |
| `0x70A2` | `AGENT_SKILL_MASTERY_LEARN` | C→S | Aprender maestría |
| `0xB0A2` | `AGENT_SKILL_MASTERY_LEARN` | S→C | Maestría aprendida |
| `0x7202` | `AGENT_SKILL_WITHDRAW` | C→S | Retirar skill |
| `0xB202` | `AGENT_SKILL_WITHDRAW` | S→C | Skill retirada |
| `0x3204` | `AGENT_SKILL_WITHDRAW_INFO_WND` | S→C | Ventana info withdraw |
| `0x3077` | `AGENT_BUFF_TOKEN_UPDATE` | S→C | Actualizar token buff |

#### 2.6.14. Alchemy

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x7150` | `AGENT_ALCHEMY_REINFORCE` | C→S | Reforzar |
| `0xB150` | `AGENT_ALCHEMY_REINFORCE` | S→C | Resultado reforzar |
| `0x7151` | `AGENT_ALCHEMY_ENCHANT` | C→S | Encantar |
| `0xB151` | `AGENT_ALCHEMY_ENCHANT` | S→C | Resultado encantar |
| `0x34A9` | `AGENT_MAGICOPTION_GRANT` | C→S | Solicitar magic option |
| `0x34AA` | `AGENT_MAGICOPTION_GRANT` | S→C | Magic option asignada |

#### 2.6.15. Stall (Tienda)

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x70B1` | `AGENT_STALL_CREATE` | C→S | Crear tienda |
| `0xB0B1` | `AGENT_STALL_CREATE` | S→C | Tienda creada |
| `0x70B4` | `AGENT_STALL_BUY` | C→S | Comprar de tienda |
| `0xB0B4` | `AGENT_STALL_BUY` | S→C | Compra realizada |
| `0x30B7` | `AGENT_STALL_ENTITY_ACTION` | S→C | Acción entidad tienda |

#### 2.6.16. Teleport

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x7059` | `AGENT_TELEPORT_DESIGNATE` | C→S | Designar teletransporte |
| `0xB059` | `AGENT_TELEPORT_DESIGNATE` | S→C | Designado |
| `0x705A` | `AGENT_TELEPORT_USE` | C→S | Usar teletransporte |
| `0xB05A` | `AGENT_TELEPORT_USE` | S→C | Teletransporte realizado |

#### 2.6.17. Silk

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x3153` | `AGENT_SILK_UPDATE` | S→C | Actualizar silk |
| `0x3154` | `AGENT_SILK_NOTIFY` | S→C | Notificación silk |

#### 2.6.18. PK

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x30CD` | `AGENT_PK_UPDATE_PENALTY` | S→C | Actualizar penalización PK |
| `0x30CE` | `AGENT_PK_UPDATE_DAILY` | S→C | Actualizar PK diario |
| `0x30D3` | `AGENT_PK_UPDATE_LEVEL` | S→C | Actualizar nivel PK |

#### 2.6.19. Logout

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x7005` | `AGENT_LOGOUT` | C→S | Solicitar logout |
| `0xB005` | `AGENT_LOGOUT` | S→C | Confirmación logout |
| `0x7006` | `AGENT_LOGOUT_CANCEL` | C→S | Cancelar logout |
| `0x300A` | `AGENT_LOGUT_SUCCESS` | S→C | Logout exitoso |

#### 2.6.20. Global (Comunes a todos los servidores)

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x5000` | `SERVER_GLOBAL_HANDSHAKE_SETUP_CHALLENGE` | S→C | Handshake challenge |
| `0x5000` | `CLIENT_GLOBAL_HANDSHAKE_RESPONSE` | C→S | Handshake response |
| `0x9000` | `CLIENT_GLOBAL_HANDSHAKE_ACCEPT` | C→S | Handshake accept |
| `0x2001` | `SERVER_GLOBAL_MODULE_IDENTIFICATION` | S→C | Identificación del servidor |
| `0x2001` | `CLIENT_GLOBAL_MODULE_IDENTIFICATION` | C→S | Identificación del cliente |
| `0x2002` | `CLIENT_GLOBAL_MODULE_KEEP_ALIVE` | C→S | Heartbeat/Ping |
| `0x2005` | `SERVER_GLOBAL_NODE_STATUS1` | S→C | Estado nodo 1 (Massive) |
| `0x6005` | `SERVER_GLOBAL_NODE_STATUS2` | S→C | Estado nodo 2 (Massive) |
| `0x600D` | `SERVER_GLOBAL_MASSIVE_MESSAGE` | S→C | Mensaje massive |

#### 2.6.21. Gateway

| Opcode | Nombre | Dirección | Descripción |
|--------|--------|-----------|-------------|
| `0x6000` | `CLIENT_GATEWAY_CHECKVERSION` | C→S | Check versión |
| `0x6100` | `CLIENT_GATEWAY_PATCH_REQUEST` | C→S | Solicitar patch |
| `0xA100` | `SERVER_GATEWAY_PATCH_RESPONSE` | S→C | Respuesta patch |
| `0x6101` | `CLIENT_GATEWAY_SHARD_LIST_REQUEST` | C→S | Solicitar shard list |
| `0xA101` | `SERVER_GATEWAY_SHARD_LIST_RESPONSE` | S→C | Shard list response |
| `0x6102` | `CLIENT_GATEWAY_LOGIN_REQUEST` | C→S | Login request |
| `0x2322` | `SERVER_GATEWAY_LOGIN_IBUV_CHALLENGE` | S→C | Captcha challenge |
| `0x6323` | `CLIENT_GATEWAY_LOGIN_IBUV_CONFIRM` | C→S | Captcha response |
| `0xA323` | `SERVER_GATEWAY_LOGIN_IBUV_CONFIRM_RESPONSE` | S→C | Captcha result |
| `0xA102` | `SERVER_GATEWAY_LOGIN_RESPONSE` | S→C | Login response (token) |
| `0x6103` | `CLIENT_AGENT_AUTH` | C→S | Auth request (Agent) |
| `0xA103` | `SERVER_AGENT_AUTH` | S→C | Auth response (Agent) |

---

## 3. Estructura del Inventario (CharacterInventory)

```
[uint8]  maxSlots
[uint8]  itemCount
for each item:
  [uint8]  slot
  [uint32] itemId
  [uint8]  plus
  [int16]  variance
  [uint16] durability
  [uint8]  quantity (si stackeable)

// Avatars (solo Thailand+ en CharacterDataEnd)
[uint8]  maxAvatarSlots
[uint8]  avatarCount
for each avatar:
  [uint32] avatarId
  [uint8]  plus
```

---

## 4. Mapeo de Opcodes a Handlers en PacketRouter.js

| Opcode | Handler | Estado |
|--------|---------|--------|
| `0x34A5` | `handleCharDataBegin` | ✅ |
| `0x3013` | `handleCharData` | ✅ |
| `0x34A6` | `handleCharDataEnd` | ✅ (incompleto — falta parseo completo) |
| `0x34B5` | `handleSpawnRequest` | ✅ |
| `0x3015` | `handleEntitySpawn` | ✅ |
| `0x3016` | `handleEntityDespawn` | ❌ No implementado |
| `0x3017` | `handleGroupSpawnBegin` | ❌ No implementado |
| `0x3019` | `handleGroupSpawnData` | ❌ No implementado |
| `0x3018` | `handleGroupSpawnEnd` | ❌ No implementado |
| `0xB023` | `handleEntityPositionUpdate` | ❌ No implementado |
| `0xB021` | `handleMoveResponse` | ✅ (parcial) |
| `0x3020` | `handlePositionUpdate` | ⚠️ Es CELESTIAL, no posición de player |
| `0xB045` | `handleActionSelect` | ❌ No implementado |
| `0x2002` | (heartbeat) | ⚠️ Logs innecesarios |
| `0x3026` | (chat) | ❌ No implementado |
| `0x3057` | (status update) | ❌ No implementado |

---

## 5. Notas Importantes

### 5.1. Posición Inicial del Player
La posición del player **SOLO** está disponible en:
1. **`0x34A6` (CharacterDataEnd)** → dentro de `ParseBionicDetails` → `Movement.FromPacket`
2. **`0xB023` (EntityUpdatePosition)** → cuando el servidor actualiza posición
3. **`0xB021` (EntityMoveResponse)** → cuando el servidor confirma movimiento

**`0x3020` NO contiene la posición del player**. Es `SERVER_ENVIROMENT_CELESTIAL_POSITION` (posición del sol/luna).

### 5.2. ParseBionicDetails
```cs
ParseBionicDetails(Packet packet):
  [uint32] uniqueId
  [bool]   hasDestination
  if (hasDestination):
    [uint16] region
    [int16]  xOffset (valor * 10)
    [float]  zOffset
    [int16]  yOffset (valor * 10)
  [float]  angle
  [float]  speed
```

### 5.3. Cálculo de Coordenadas Globales
```
// Para mundo normal (no mazmorra):
worldX = (regionX - 135) * 192 + (xOffset / 10)
worldZ = (regionY - 92) * 192 + (zOffset / 10)

// Para mazmorras (region.Y == 0x80):
worldX = xOffset / 10
worldZ = zOffset / 10
```

Donde `regionX = region & 0xFF`, `regionY = (region >> 8) & 0xFF`.

### 5.4. Tipos de Entidad (TypeID)
```
TypeID1:
  1 = Character (Player, Monster, NPC, Cos)
  3 = Item
  4 = Portal

TypeID2 (si TypeID1 == 1):
  1 = Player
  2 = Monster/NPC/Cos

TypeID3 (si TypeID1 == 1, TypeID2 == 2):
  1 = Monster
  2 = Cos (pet)
  3 = NPC
  4 = Cos (transport)
  5 = Cos (guild)
  6 = Cos (captured)
  7 = Cos (quest)
  8 = Cos (quest)
  9 = Cos (pet2)
```

---

## 6. Referencias

- RSBot: `Library/RSBot.Core/Network/Handler/Agent/Character/CharacterDataEndResponse.cs`
- RSBot: `Library/RSBot.Core/Objects/Spawn/SpawnedBionic.cs` (ParseBionicDetails)
- RSBot: `Library/RSBot.Core/Objects/Position.cs` (FromPacket, FromPacketConditional)
- RSBot: `Library/RSBot.Core/Objects/Spawn/SpawnManager.cs` (Parse)
- RSBot: `Library/RSBot.Core/Objects/Spawn/SpawnedPlayer.cs` (Deserialize)
- RSBot: `Library/RSBot.Core/Objects/Spawn/SpawnedNpc.cs`
- RSBot: `Library/RSBot.Core/Objects/Spawn/SpawnedMonster.cs`
- RSBot: `Library/RSBot.Core/Network/Handler/Agent/Entity/EntityUpdatePositionResponse.cs`
- RSBot: `Library/RSBot.Core/Network/Handler/Agent/Entity/EntitySingleSpawnResponse.cs`
- xBot-WinForms: `xBot.Core/Network/PacketHandler/`
