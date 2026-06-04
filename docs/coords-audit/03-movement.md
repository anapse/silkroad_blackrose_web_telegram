# 3. Cómo se maneja el movimiento

## 3.1. Flujo completo del movimiento

```
1. Usuario hace click en el mapa
2. useMapInteractions.js calcula coordenadas de destino
3. Envía mensaje MOVE por WebSocket al backend
4. WebSocketSession.js construye paquete 0x7021 y lo envía al servidor
5. El servidor procesa el movimiento
6. El servidor envía 0xB021 (SERVER_MOVE) con la nueva posición
7. MovementHandlers.js parsea 0xB021
8. Envía PLAYER_MOVE_CONFIRMED al frontend
9. GameSocketContext.jsx actualiza playerState con la nueva posición
10. usePlayerInit.js + useGameLoop.js actualizan el render
```

---

## 3.2. Click del usuario → cálculo de destino

**Archivo**: `blackroseweb/src/game/hooks/useMapInteractions.js`

```js
const handleMapClick = (e, zoomLevel) => {
    if (camera.dragRef.current.moved) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / zoomLevel;
    const py = (e.clientY - rect.top) / zoomLevel;

    // Calcular worldX/worldZ del click...
    // (ver sección 2.5 para la fórmula completa)

    // Limitar distancia máxima
    const dist = getDistance(me.worldX, me.worldZ, clickWX, clickWZ);
    let tWX = clickWX, tWZ = clickWZ;
    if (dist > MAX_CLICK_WU) {   // MAX_CLICK_WU = 800
        const dx = clickWX - me.worldX;
        const dz = clickWZ - me.worldZ;
        tWX = me.worldX + (dx / dist) * MAX_CLICK_WU;
        tWZ = me.worldZ + (dz / dist) * MAX_CLICK_WU;
    }

    setTargetWorld({ wx: tWX, wz: tWZ, px: clPx, py: clPy });

    // Enviar MOVE al backend
    wsSend({
        type: 'MOVE',
        region: targetRegion,     // región absoluta
        posX: targetLocalX,       // offset local X (0-192)
        posZ: targetLocalZ,       // offset local Z (0-192)
    });
};
```

### LOG detallado del click (se imprime en consola)

```js
console.log('═══════════════════════════════════════════');
console.log('📍 [CLICK] Pixel en canvas:', { px: clPx, py: clPy });
console.log('📍 [CLICK] tileOrigin:', tileOrigin, 'localX:', localX, 'localZ:', localZ);
console.log('📍 [CLICK] player world (centrado):', { worldX: me.worldX, worldZ: me.worldZ });
console.log('📍 [CLICK] player region (absoluto):', { rX: Math.floor(me.worldX / R) + 135, rZ: Math.floor(me.worldZ / R) + 92 });
console.log('📍 [CLICK] clickWX/WZ (centrado):', { clickWX: Math.round(clickWX), clickWZ: Math.round(clickWZ) });
console.log('📍 [CLICK] targetWX/WZ (centrado, limitado):', { tWX: Math.round(tWX), tWZ: Math.round(tWZ) });
console.log('📍 [CLICK] target region (absoluto):', { targetRX, targetRZ });
console.log('📍 [CLICK] target local offset:', { targetLocalX, targetLocalZ });
console.log('📍 [CLICK] target region ID:', targetRegion);
console.log('📍 [CLICK] REGIONS existe:', REGIONS.some(reg => reg.x === targetRX && reg.z === targetRZ));
console.log('═══════════════════════════════════════════');
```

**⚠️ NOTA**: El sistema de coordenadas en el frontend usa **coordenadas centradas** (base 0, con el jugador en el centro del tile central) para los cálculos internos, pero convierte a **coordenadas absolutas** (135-252 para X, 92-126 para Z) para validar con REGIONS.js y enviar al backend.

---

## 3.3. Backend recibe MOVE y envía 0x7021

**Archivo**: `blackrosebackend/src/game/network/ws/WebSocketSession.js`

```js
if (parsed.type === 'MOVE') {
    const { region, posX, posZ, posY: frontendPosY } = parsed;
    
    // Detectar cambio de región
    const currentRegion = router._currentRegion;
    if (currentRegion !== undefined && currentRegion !== region) {
        // Enviar 0x34B6 para solicitar spawns de la nueva región
        const spawnReady = session.tcpSession.security.formatPacket(0x34B6, Buffer.alloc(0), true);
        session.tcpSession.send(spawnReady);
    }
    router._currentRegion = region;

    // Altitud
    let altY = 0;
    if (router && router._lastPlayerPosY > 0) {
        altY = router._lastPlayerPosY;       // ya está en unidades /10
    } else if (frontendPosY != null && frontendPosY > 0) {
        altY = frontendPosY;
    }
    if (altY <= 0) {
        altY = 182.0;   // altitud típica de Jangan (fallback)
    }

    // Construir paquete 0x7021
    const x10 = Math.round((posX || 0) * 10);   // ×10 para enviar como short
    const z10 = Math.round((posZ || 0) * 10);
    const y10 = Math.round(altY * 10);

    p.writeByte(0x01);                     // movement type
    p.writeWord(region & 0xFFFF);          // regionID
    
    if (region >= 32768) {                 // Dungeon
        p.writeDWord(x10);                 // int32
        p.writeDWord(z10);
        p.writeDWord(y10);
    } else {                               // Normal world
        writeShortLE(x10);                 // int16 X
        writeShortLE(z10);                 // int16 Z (norte-sur)
        writeShortLE(y10);                 // int16 Y (altitud)
    }

    const encPacket = session.tcpSession.security.formatPacket(0x7021, rawPayload, true);
    session.tcpSession.send(encPacket);
}
```

---

## 3.4. Backend recibe 0xB021 y envía PLAYER_MOVE_CONFIRMED

**Archivo**: `blackrosebackend/src/shared/handlers/packet/MovementHandlers.js`

```js
handleServerMove(rawPacket, packetObj) {
    const payload = rawPacket.slice(6);
    let pos = 0;
    const entityUniqueId = payload.readUInt32LE(pos); pos += 4;
    const hasDestination = payload.readUInt8(pos); pos += 1;
    const isMyMove = (entityUniqueId === router._playerUniqueId) || (entityUniqueId === router._expectedUniqueId);

    if (hasDestination === 1) {
        dstRegion = payload.readUInt16LE(pos); pos += 2;
        dstX = payload.readInt16LE(pos); pos += 2;    // X
        dstZ = payload.readInt16LE(pos); pos += 2;    // Z = norte-sur
        dstY = payload.readInt16LE(pos); pos += 2;    // Y = altitud
    }

    // Source parsing...
    
    // Envío al frontend
    const eventName = isMyMove ? 'PLAYER_MOVE_CONFIRMED' : 'ENTITY_MOVE';
    router.session.wsSession.sendEvent('', {
        type: eventName, uniqueId: entityUniqueId,
        dstRegion: hasDestination ? dstRegion : undefined,
        dstX: hasDestination ? Math.round(dstX / 10) : undefined,
        dstZ: hasDestination ? Math.round(dstZ / 10) : undefined,
        dstY: hasDestination ? Math.round(dstY / 10) : undefined,
        hasSource, srcRegion, srcX, srcZ, srcY, angle,
    });
}
```

---

## 3.5. Frontend recibe PLAYER_MOVE_CONFIRMED

**Archivo**: `blackroseweb/src/shared/context/GameSocketContext.jsx`

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

---

## 3.6. Game Loop — Interpolación de movimiento

**Archivo**: `blackroseweb/src/game/hooks/useGameLoop.js`

### Player (id="me") — NO se interpola

```js
// El jugador (id="me") NO interpola — su posición la actualiza PLAYER_MOVE_CONFIRMED
// y la suavidad visual la dan las transiciones CSS.
if (id !== "me" && p._targetWX !== undefined) {
    // Interpolación para otros players/entidades...
}
```

### Otras entidades — interpolación lineal

```js
if (id !== "me" && p._targetWX !== undefined) {
    const dx = p._targetWX - p.worldX;
    const dz = p._targetWZ - p.worldZ;
    const dist = getDistance(p.worldX, p.worldZ, p._targetWX, p._targetWZ);
    const speed = WALK_SPEED * 0.5;   // 40 WU/s
    const step = speed * dt;

    if (dist <= step) {
        p.worldX = p._targetWX;
        p.worldZ = p._targetWZ;
        p.moving = false;
        p._targetWX = undefined;
        p._targetWZ = undefined;
    } else {
        p.worldX += (dx / dist) * step;
        p.angle = directionToAngle(dx, dz);
        p.moving = true;
    }
}
```

### Suavizado de cámara (Follow)

```js
if (p.isFollowingPlayer) {
    const cdx = p.worldX - p.cameraWX;
    const cdz = p.worldZ - p.cameraWZ;
    if (Math.abs(cdx) > 0.1 || Math.abs(cdz) > 0.1) {
        p.cameraWX += cdx * 0.15;
        p.cameraWZ += cdz * 0.15;
    } else if (p.cameraWX !== p.worldX || p.cameraWZ !== p.worldZ) {
        p.cameraWX = p.worldX;
        p.cameraWZ = p.worldZ;
    }
}
```

---

## 3.7. EntityLayer — Renderizado de entidades durante movimiento

**Archivo**: `blackroseweb/src/game/ui/EntityLayer.jsx`

Las entidades recalculan su posición en cada render usando `coordToCanvas`:

```js
const { canvasX, canvasZ } = coordToCanvas(
    e.regionX, e.regionZ,
    e.posX ?? 0, e.posZ ?? 0,
    pRX, pRZ
);
renderX = canvasX;
renderZ = canvasZ;
```

Cuando una entidad recibe ENTITY_MOVE, se actualiza su `worldX/worldZ` y `_targetWX/_targetWZ`, y el game loop interpola hasta que llega al destino.

---

## 3.8. Resumen: coordenadas absolutas vs relativas

| Concepto | Tipo | Descripción |
|----------|------|-------------|
| `region` | Absoluto | ID de región (ushort): `sectorX \| (sectorZ << 8)` |
| `posX` | Relativo | Offset X dentro de la región (0-191), en unidades Silkroad (/10) |
| `posZ` | Relativo | Offset Z dentro de la región (0-191), norte-sur positivo |
| `posY` | Relativo | Altitud dentro de la región |
| `worldX` | Absoluto | Coordenada mundial X: `(sectorX - 135) * 192 + posX` |
| `worldZ` | Absoluto | Coordenada mundial Z: `(sectorZ - 92) * 192 + posZ` |
| `renderX` | Canvas | Píxel X en el canvas: calculado por `coordToCanvas` o `worldToRender` |
| `renderZ` | Canvas | Píxel Z en el canvas: invertido (norte = arriba) |
