// ================================================================
// Archivo: 03-spawn-entities.js
// Bloques extraídos: cómo el frontend recibe y renderiza
// el spawn de entidades (mobs, NPCs, otros players)
// ================================================================

// ----------------------------------------------------------------
// De: GameSocketContext.jsx — maneja ENTITY_SPAWN
// ----------------------------------------------------------------
          if (msg.detail?.type === "ENTITY_SPAWN") {
            const d = msg.detail;
            // Usar ÚNICA función centralizada para convertir región+offset a world units
            const regionId = Number(d.region) || 0;
            const { regionX, regionZ, worldX, worldZ } = regionToWorld(regionId, d.posX, d.posZ);
            const entityType = d.entityType || '?';
            const entityName = d.name || `${entityType}#${d.uniqueId}`;
            // Log solo para CHARs (otros jugadores)
            if (entityType === 'CHAR') {
              console.log(`👤 [PLAYER] ${entityName} uid=${d.uniqueId} refObjId=${d.refObjId} world=(${worldX},${worldZ})`);
            }
            setEntities((prev) => {
              const updated = {
                ...prev,
                [d.uniqueId]: {
                  ...d,
                  regionX,
                  regionZ,
                  worldX,
                  worldZ,
                }
              };
              return updated;
            });
          }

// ----------------------------------------------------------------
// De: EntityLayer.jsx — bloque donde se calcula la posición
//     en canvas de cada entidad
// ----------------------------------------------------------------
/**
 * Calcula posición ABSOLUTA en el canvas basada en región+offset (como los tiles).
 * NO depende de me.worldX/worldZ — así evitamos el doble desplazamiento.
 * Usa la función ESTÁNDAR coordToCanvas centralizada en geo.js.
 */
function entityToCanvas(entity, playerRegionX, playerRegionZ) {
  const { canvasX, canvasZ } = coordToCanvas(
    entity.regionX, entity.regionZ,
    entity.posX ?? 0, entity.posZ ?? 0,
    playerRegionX, playerRegionZ
  );
  return { renderX: canvasX, renderZ: canvasZ };
}

// (El EntityLayer usa este cálculo dentro de un useMemo:)
  const entityList = useMemo(() => {
    const pRX = me?.regionX;
    const pRZ = me?.regionZ;
    const list = Object.values(entities || {}).map(e => {
      const resolvedName = getEntityName(e.refObjId, e.entityType);
      const displayName = resolvedName || e.name || `${e.entityType || '?'}#${e.refObjId || e.uniqueId}`;
      let renderX = undefined, renderZ = undefined;
      if (pRX != null && pRZ != null && e.regionX != null && e.regionZ != null) {
        const { canvasX, canvasZ } = coordToCanvas(
          e.regionX, e.regionZ,
          e.posX ?? 0, e.posZ ?? 0,
          pRX, pRZ
        );
        renderX = canvasX;
        renderZ = canvasZ;
      }
      return { ...e, displayName, renderX, renderZ };
    });
    return list;
  }, [entities, me?.regionX, me?.regionZ]);
