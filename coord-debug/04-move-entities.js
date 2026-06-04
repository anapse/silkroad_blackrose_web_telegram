// ================================================================
// Archivo: 04-move-entities.js
// Bloques extraídos: cómo el frontend recibe e interpola
// el movimiento de entidades
// ================================================================

// ----------------------------------------------------------------
// De: GameSocketContext.jsx — maneja ENTITY_MOVE
// ----------------------------------------------------------------
          if (msg.detail?.type === "ENTITY_MOVE") {
            const d = msg.detail;
            // Ignorar si no hay destino válido (evita NaN)
            if (!d.dstRegion || d.dstRegion <= 0 || d.dstX == null || d.dstZ == null) {
              console.warn(`[ENTITY_MOVE] ⚠️ uid=${d.uniqueId} destino inválido, ignorando`, d);
              return;
            }
            console.log(`[ENTITY_MOVE] 🚶 uid=${d.uniqueId} dstRegion=${d.dstRegion} dstX=${d.dstX} dstZ=${d.dstZ}`);
            // Usar ÚNICA función centralizada
            const regionId = Number(d.dstRegion) || 0;
            // movement: usar type='movement' porque el orden de ejes es X,Z,Y
            const { regionX: dstRegionX, regionZ: dstRegionZ, worldX: dstWorldX, worldZ: dstWorldZ } = regionToWorld(regionId, d.dstX, d.dstZ, d.dstY, 'movement');
            setEntities((prev) => {
              if (!prev[d.uniqueId]) {
                console.log(`[ENTITY_MOVE] ⚠️ uid=${d.uniqueId} NO ENCONTRADO - CREANDO como CHAR`);
                const cachedName = nameCacheRef.current[d.uniqueId];
                const newName = cachedName ? cachedName : `Player#${d.uniqueId}`;
                return {
                  ...prev,
                  [d.uniqueId]: {
                    uniqueId: d.uniqueId,
                    entityType: 'CHAR',
                    region: d.dstRegion,
                    regionX: dstRegionX,
                    regionZ: dstRegionZ,
                    posX: d.dstX,
                    posZ: d.dstZ,
                    posY: d.dstY || 0,
                    worldX: dstWorldX,
                    worldZ: dstWorldZ,
                    name: newName,
                    _targetWX: dstWorldX,
                    _targetWZ: dstWorldZ,
                  }
                };
              }
              return {
                ...prev,
                [d.uniqueId]: {
                  ...prev[d.uniqueId],
                  region: d.dstRegion,
                  regionX: dstRegionX,
                  regionZ: dstRegionZ,
                  posX: d.dstX,
                  posZ: d.dstZ,
                  worldX: dstWorldX,
                  worldZ: dstWorldZ,
                  _targetWX: dstWorldX,
                  _targetWZ: dstWorldZ,
                }
              };
            });
          }

// ----------------------------------------------------------------
// De: useGameLoop.js — interpolación de entidades con _targetWX/WZ
// ----------------------------------------------------------------
      // ── INTERPOLACIÓN DE ENTIDADES (mobs, NPCs, otros players) ──
      if (entities && setEntities) {
        setEntities((prevEntities) => {
          const nextEntities = { ...prevEntities };
          let entitiesDirty = false;
          let movingCount = 0;

          for (const uid in nextEntities) {
            const e = nextEntities[uid];
            // Solo interpolar si tiene destino
            if (e._targetWX === undefined || e._targetWZ === undefined) continue;
            movingCount++;

            const dx = e._targetWX - (e.worldX ?? e.posX ?? 0);
            const dz = e._targetWZ - (e.worldZ ?? e.posZ ?? 0);
            const dist = getDistance(e._targetWX, e._targetWZ, e.worldX ?? e.posX ?? 0, e.worldZ ?? e.posZ ?? 0);
            const speed = 80 * 0.5; // misma velocidad base que otros players
            const step = speed * dt;

            if (dist <= step) {
              // Llegó al destino
              nextEntities[uid] = {
                ...e,
                worldX: e._targetWX,
                worldZ: e._targetWZ,
                _targetWX: undefined,
                _targetWZ: undefined,
              };
              entitiesDirty = true;
            } else {
              // Interpolar
              const ratio = step / dist;
              const newPosX = (e.worldX ?? e.posX ?? 0) + dx * ratio;
              const newPosZ = (e.worldZ ?? e.posZ ?? 0) + dz * ratio;
              nextEntities[uid] = {
                ...e,
                worldX: newPosX,
                worldZ: newPosZ,
              };
              entitiesDirty = true;
            }
          }
          // ...
        });
      }
