import { useState, useMemo, useEffect, useRef } from 'react';
import { GAME_CONSTANTS } from '../../shared/constants/gameConstants.js';
import { coordToCanvas } from '../utils/geo.js';
import { getEntityName, getRealEntityType } from '../utils/entityNames.js';

const { MAP } = GAME_CONSTANTS;
const UNITS_PER_REGION = MAP.UNITS_PER_REGION;

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

/**
 * EntityLayer - Renderiza NPCs, MOBs y otros players en el mapa
 * con hover tooltip, colores por tipo y actualización en tiempo real.
 */
export function EntityLayer({ 
  currentMap, 
  entities, 
  me, 
  world 
}) {
  const [entityHover, setEntityHover] = useState(null);
  const renderCountRef = useRef(0);

  // Memoizar entidades y resolver nombres
  // Depende de me.regionX/Z para recalcular cuando el player obtiene posición
  const entityList = useMemo(() => {
    const list = Object.values(entities || {}).map(e => {
      // Intentar nombre desde: 1) datos por refObjId, 2) nameCache por uniqueId, 3) fallback
      const resolvedName = getEntityName(e.refObjId, e.entityType);
      const displayName = resolvedName || e.name || `${e.entityType || '?'}#${e.refObjId || e.uniqueId}`;
      return { ...e, displayName };
    });
    return list;
  }, [entities, me?.regionX, me?.regionZ]);

  // ── Si no estamos en world map ──
  if (currentMap !== 'world') return null;

  // ── DEBUG log solo cuando cambia el número de entidades ──
  const prevCountRef = useRef(0);
  useEffect(() => {
    const count = entityList.length;
    if (count !== prevCountRef.current) {
      prevCountRef.current = count;
      console.log(`[EntityLayer] Entidades cambiaron: ahora ${count}`);
    }
  });

  // ── Si no hay entidades mostrar un punto de debug ──
  if (!entityList.length) {
    if (me?.regionX != null) {
      const { renderX, renderZ } = entityToCanvas({
        regionX: me.regionX, regionZ: me.regionZ,
        posX: me.posX || 0, posZ: me.posZ || 0
      }, me.regionX, me.regionZ);
      return (
        <div
          style={{
            position: 'absolute',
            left: renderX - 4,
            top: renderZ - 4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#ff0',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      );
    }
    return null;
  }

  return (
    <>
      {entityList.map(entity => {
        if (entity.regionX == null || entity.regionZ == null) {
          console.log(`[EntityLayer] ⚠️ SALTADO region null: ${entity.displayName} uid=${entity.uniqueId} regionX=${entity.regionX} regionZ=${entity.regionZ}`);
          return null;
        }

        // Usar posición ABSOLUTA en canvas (basada en región, NO en me.worldX)
        const { renderX, renderZ } = entityToCanvas(entity, me.regionX, me.regionZ);

        if (renderX == null || isNaN(renderX) || renderZ == null || isNaN(renderZ)) {
          console.log(`[EntityLayer] ⚠️ render INVALIDO: ${entity.displayName} uid=${entity.uniqueId} renderX=${renderX} renderZ=${renderZ} region=(${entity.regionX},${entity.regionZ}) pos=(${entity.posX},${entity.posZ})`);
          return null;
        }

        // Determinar tipo REAL (el servidor clasifica por rango, no por tipo real)
        const realType = getRealEntityType(entity.refObjId) || entity.entityType || '?';
        let color, size, borderColor;
        if (realType === 'MOB') { 
          color = '#ff4444'; size = 8; borderColor = '#cc2222';
        } else if (realType === 'NPC') { 
          color = '#00ff88'; size = 10; borderColor = '#00cc66';
        } else if (realType === 'PLAYER' || realType === 'CHAR') { 
          color = '#4488ff'; size = 6; borderColor = '#2266cc';
        } else {
          // Fallback por entityType del servidor
          const serverType = entity.entityType || '?';
          if (serverType === 'NPC') { color = '#00ff88'; size = 10; borderColor = '#00cc66'; }
          else if (serverType === 'MOB') { color = '#ff4444'; size = 8; borderColor = '#cc2222'; }
          else if (serverType === 'PLAYER' || serverType === 'CHAR') { color = '#4488ff'; size = 6; borderColor = '#2266cc'; }
          else { color = '#88aaff'; size = 8; borderColor = '#6688cc'; }
        }

        const isHovered = entityHover === entity.uniqueId;

        return (
          <div key={entity.uniqueId} style={{ position: 'relative' }}>
            {/* Punto de la entidad */}
            <div
              data-entity-id={entity.uniqueId}
              data-entity-type={realType}
              style={{
                position: 'absolute',
                left: renderX - size / 2,
                top: renderZ - size / 2,
                width: size,
                height: size,
                borderRadius: '50%',
                background: color,
                border: isHovered ? `2px solid #fff` : `1px solid ${borderColor}`,
                zIndex: isHovered ? 1000 : 900,
                pointerEvents: 'auto',
                cursor: 'pointer',
                boxShadow: isHovered 
                  ? `0 0 12px ${color}, inset 0 0 4px rgba(255,255,255,0.3)` 
                  : `0 0 4px ${borderColor}`,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={() => setEntityHover(entity.uniqueId)}
              onMouseLeave={() => setEntityHover(null)}
            />

            {/* Tooltip en hover */}
            {isHovered && (
              <div
                style={{
                  position: 'absolute',
                  left: renderX,
                  top: renderZ - size / 2 - 4,
                  transform: 'translate(-50%, -100%)',
                  background: 'rgba(0,0,0,0.85)',
                  color: color,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 9999,
                  border: `1px solid ${color}`,
                  boxShadow: `0 0 12px rgba(0,0,0,0.8), 0 0 6px ${color}`,
                }}
              >
                {entity.displayName}
                {entity.stallFlag === 4 && (
                  <span style={{ display: 'block', fontSize: '10px', color: '#ffcc00', fontWeight: 'normal', marginTop: 2 }}>
                    🛒 {entity.stallName || 'Stall'}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}