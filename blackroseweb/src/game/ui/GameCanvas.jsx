import { useMemo, useRef, useState, useEffect, useLayoutEffect } from "react";
import { REGIONS } from "../data/regions/index.js";
import { MARKERS } from "../data/MARKERS.js";
import { CITY_MAPS } from "../data/CITY_MAPS.js";
import { GAME_CONSTANTS } from "../../shared/constants/gameConstants.js";
import { useMMOCamera } from "../hooks/useMMOCamera.js";
import { worldToRender, cityPlayArea, cityViewFrame, normalizedWorldInCity } from "../utils/geo.js";
import { pointInRect } from "../utils/math.js";
import { cityForPlayer, cityWorldToImage } from "../utils/movement.js";
import { calculateCameraOffset } from "../utils/camera.js";
import { getEntityName } from "../utils/entityNames.js";
import MapDot from "./map/MapDot.jsx";

const { MAP, MOVEMENT, ICONS } = GAME_CONSTANTS;
const {
  MIN_X: MAP_MIN_X, MAX_X: MAP_MAX_X,
  MIN_Z: MAP_MIN_Z, MAX_Z: MAP_MAX_Z,
  BASE_TILE_SZ, TILE_STEP, UNITS_PER_REGION,
  WORLD_SCALE, CANVAS_W: MAP_CANVAS_W, CANVAS_H: MAP_CANVAS_H
} = MAP;
const { MAX_CLICK_WU, CITY_EXIT_NUDGE_WU } = MOVEMENT;
const R = UNITS_PER_REGION;
const CAMERA_OFFSET_Y = 0;

const ICON_SIZE = {
  city: ICONS.CITY, fort: ICONS.FORT,
  dungeon: ICONS.DUNGEON, npc: ICONS.NPC, poi: ICONS.POI,
};

// ── City region detection ──
const CITY_REGIONS = Object.entries(CITY_MAPS).map(([mapId, cityMap]) => {
  const townName = cityMap.townName;
  if (!townName) return null;
  const regions = REGIONS.filter(r => String(r.name).toLowerCase() === townName.toLowerCase());
  if (regions.length === 0) return null;
  const minX = Math.min(...regions.map(r => r.x));
  const maxX = Math.max(...regions.map(r => r.x));
  const minZ = Math.min(...regions.map(r => r.z));
  const maxZ = Math.max(...regions.map(r => r.z));
  return {
    mapId, townName, regions,
    regionSet: new Set(regions.map(r => `${r.x}_${r.z}`)),
    worldMinX: minX * R, worldMaxX: (maxX + 1) * R,
    worldMinZ: minZ * R, worldMaxZ: (maxZ + 1) * R,
    image: cityMap.image, imageWidth: cityMap.imageWidth ?? 900,
    imageHeight: cityMap.imageHeight ?? 600,
    playArea: cityMap.playArea, portals: cityMap.portals ?? [],
  };
}).filter(Boolean);

// ── Tile lazy loading ──
let tileObserver = null;
function getTileObserver() {
  if (!tileObserver) {
    tileObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const placeholder = entry.target;
          const src = placeholder.dataset.src;
          if (src && !placeholder.querySelector('img')) {
            const img = document.createElement('img');
            img.src = src; img.alt = ''; img.draggable = false;
            img.className = 'gc-tile';
            img.onerror = () => { img.style.display = 'none'; };
            placeholder.appendChild(img);
          }
          tileObserver.unobserve(placeholder);
        }
      }
    }, { rootMargin: '500px' });
  }
  return tileObserver;
}

function buildMapGrid() {
  const rows = [];
  for (let z = MAP_MAX_Z; z >= MAP_MIN_Z; z -= TILE_STEP) {
    const row = [];
    for (let x = MAP_MIN_X; x <= MAP_MAX_X; x += TILE_STEP) {
      const screenX = ((x - MAP_MIN_X) / TILE_STEP) * BASE_TILE_SZ;
      const screenY = ((MAP_MAX_Z - z) / TILE_STEP) * BASE_TILE_SZ;
      row.push({ x, z, screenX, screenY, src: `/interface/minimap/${x}x${z}.webp` });
    }
    rows.push(row);
  }
  return rows;
}

const regionByXZ = {};
REGIONS.forEach(r => { regionByXZ[`${r.x}_${r.z}`] = r; });
const regionById = Object.fromEntries(REGIONS.map(r => [r.regionId, r]));

function resolveMarkers() {
  return MARKERS.map(m => {
    const r = regionById[m.regionId];
    if (!r) return null;
    return {
      ...m,
      left: ((r.x - MAP_MIN_X) / TILE_STEP) * BASE_TILE_SZ + (m.offset?.x ?? 0),
      top: ((MAP_MAX_Z - r.z) / TILE_STEP) * BASE_TILE_SZ + (m.offset?.y ?? 0),
    };
  }).filter(Boolean);
}

export default function GameCanvas({
  currentMap, isCity, players, entities, playerReady, world, city,
  worldOffsetX, worldOffsetY, cityOffsetX, cityOffsetY,
  debug, debugRegions, isMapActive, hover, setHover,
  hoveredEntity, setHoveredEntity, targetWorld,
  insideCity, cityFitMode, cityEntry, cityPlayerX, cityPlayerY,
  handleMarkerClick, wsPlayer, character,
}) {
  const chinaMap = useMemo(buildMapGrid, []);
  const resolvedMarkers = useMemo(resolveMarkers, []);
  const me = players?.me;

  // Sincronizar clase show-grid al body cuando debug está activo
  useEffect(() => {
    document.body.classList.toggle('show-grid', debug);
  }, [debug]);

  // Tiles visibles
  const visibleTiles = useMemo(() => {
    const wx = me?.worldX;
    const wz = me?.worldZ;
    if (!wx || !wz) return [];
    const radius = Math.max(8, 16 / (world?.zoom || 1));
    const radiusWU = radius * UNITS_PER_REGION;
    return chinaMap.flat().filter(tile => {
      const tileWX = tile.x * UNITS_PER_REGION;
      const tileWZ = tile.z * UNITS_PER_REGION;
      return Math.abs(tileWX - wx) < radiusWU && Math.abs(tileWZ - wz) < radiusWU;
    });
  }, [me?.worldX, me?.worldZ, world?.zoom, chinaMap]);

  return (
    <>
      {/* DEBUG HUD */}
      {debug && (
        <div className="gc-hud">
          <div className="gc-hud-title">🗺 COORD DEBUG</div>
          <div className="gc-hud-row"><span className="gc-hud-key">Map</span><span style={{color: isCity?"#ff8800":"#4af"}} className="gc-hud-val">{currentMap}</span></div>
          <div className="gc-hud-row"><span className="gc-hud-key">InsideTown</span><span style={{color: insideCity?"#4f4":"#f44"}} className="gc-hud-val">{insideCity ? insideCity.mapId : "NO"}</span></div>
          <div className="gc-hud-separator" />
          <div className="gc-hud-row"><span style={{color:"#4af"}} className="gc-hud-key">worldX (SRU)</span><span className="gc-hud-val">{Math.round(me?.worldX)}</span></div>
          <div className="gc-hud-row"><span style={{color:"#4af"}} className="gc-hud-key">worldZ (SRU)</span><span className="gc-hud-val">{Math.round(me?.worldZ)}</span></div>
          <div className="gc-hud-separator" />
          <div className="gc-hud-row"><span style={{color:"#fa4"}} className="gc-hud-key">renderX (px)</span><span className="gc-hud-val">{me?.renderX?.toFixed(1)}</span></div>
          <div className="gc-hud-row"><span style={{color:"#fa4"}} className="gc-hud-key">renderZ (px)</span><span className="gc-hud-val">{me?.renderZ?.toFixed(1)}</span></div>
          <div className="gc-hud-separator" />
          <div className="gc-hud-row"><span className="gc-hud-key">Region</span><span className="gc-hud-val">{me ? (me.regionZ << 8 | me.regionX) : '?'} ({me?.regionX}, {me?.regionZ})</span></div>
          <div className="gc-hud-row"><span className="gc-hud-key">File</span><span style={{color:"#ff8800"}} className="gc-hud-val">{me?.regionZ}_{me?.regionX}.jpg</span></div>
          {insideCity && <>
            <div className="gc-hud-separator" />
            <div className="gc-hud-row"><span className="gc-hud-key">cityMapX</span><span className="gc-hud-val">{cityPlayerX?.toFixed(1)}%</span></div>
            <div className="gc-hud-row"><span className="gc-hud-key">cityMapY</span><span className="gc-hud-val">{cityPlayerY?.toFixed(1)}%</span></div>
          </>}
          <div className="gc-hud-separator" />
          <div className="gc-hud-row"><span className="gc-hud-key">Moving</span><span style={{color: me?.moving?"#4f4":"#f44"}} className="gc-hud-val">{me?.moving?"YES":"NO"}</span></div>
        </div>
      )}

      {/* MAP CANVAS - World */}
      {!isCity && (
        <div ref={world.viewportRef} className="gc-map-viewport">
          <div ref={world.canvasRef} className="gc-map-canvas" style={{
            transform: `translate3d(${worldOffsetX}px,${worldOffsetY}px,0) scale(${world.zoom})`,
            background: '#0a0a0a', minWidth: MAP_CANVAS_W, minHeight: MAP_CANVAS_H,
          }}>
            {/* Tiles */}
            {visibleTiles.map(tile => (
              <div key={`${tile.x}_${tile.z}`} className="gc-tile-wrap" data-src={tile.src}
                data-grid-label={`${tile.z}_${tile.x}`}
                ref={el => { if (el && !el.dataset.observed) { el.dataset.observed = '1'; getTileObserver().observe(el); } }}
                style={{ position: 'absolute', left: tile.screenX, top: tile.screenY, width: BASE_TILE_SZ, height: BASE_TILE_SZ }}
              />
            ))}
            {/* Markers */}
            {resolvedMarkers.filter(m => m.type !== "city").map(m => {
              const sz = ICON_SIZE[m.type] ?? ICON_SIZE.poi;
              const hov = hover === m.id;
              const active = isMapActive;
              const isMapDot = ['mob', 'quest_npc', 'player', 'unique_mob'].includes(m.type);
              const dotScale = Math.max(4, Math.min(12, 12 / world.zoom));
              const displaySize = isMapDot ? dotScale : sz.w;
              const displayHeight = isMapDot ? dotScale : sz.h;
              return (
                <div key={m.id} style={{
                  position: "absolute", left: m.left - (isMapDot ? displaySize / 2 : sz.w / 2),
                  top: m.top - (isMapDot ? displayHeight / 2 : sz.h / 2),
                  width: displaySize, height: displayHeight, zIndex: 100,
                  cursor: active ? "pointer" : "default",
                  transform: (hov && active) ? "scale(1.15)" : "scale(1)",
                  transition: "transform .15s", pointerEvents: active ? "auto" : "none"
                }}
                  onMouseEnter={() => active && setHover(m.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={e => active && handleMarkerClick(m, e)}
                >
                  {isMapDot ? (
                    <MapDot type={m.type} label={m.label} size={displaySize}
                      x={displaySize / 2} y={displayHeight / 2} zIndex={100}
                      active={active} hov={hov} zoom={world.zoom}
                      onMouseEnter={() => active && setHover(m.id)}
                      onMouseLeave={() => setHover(null)}
                      onClick={e => active && handleMarkerClick(m, e)}
                    />
                  ) : (
                    <img src={(hov && active) && m.iconFocus ? m.iconFocus : m.icon} alt={m.label}
                      style={{ width: sz.w, height: sz.h, objectFit: "contain", pointerEvents: "none" }} />
                  )}
                </div>
              );
            })}

            {/* Player overlay */}
            <div className="gc-overlay-layer" style={{ zIndex: 2000 }}>
              {targetWorld && (() => {
                const ts = worldToRender(targetWorld.wx, targetWorld.wz);
                return <div className="gc-dest-marker" style={{ left: ts.renderX, top: ts.renderZ }} />;
              })()}
              {Number.isFinite(me?.worldX) && Number.isFinite(me?.worldZ) && Object.values(players).map(p => {
                const sz = Math.max(8, 16 / world.zoom);
                const isEuro = p.race === 'euro';
                const color = isEuro ? '#44aaff' : '#ff5555';
                return (
                  <div key={p.id} style={{ position: 'absolute', left: p.renderX, top: p.renderZ, width: 0, height: 0, zIndex: 1000, pointerEvents: 'none', overflow: 'visible' }}>
                    <div style={{ position: 'absolute', left: -sz / 2, top: -sz / 2, width: 0, height: 0,
                      borderLeft: `${sz * 0.35}px solid transparent`, borderRight: `${sz * 0.35}px solid transparent`,
                      borderBottom: `${sz}px solid ${color}`, transform: `rotate(${p.angle}deg)`,
                      transformOrigin: 'center center', filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))', pointerEvents: 'none',
                    }} />
                    <div style={{ position: 'absolute', left: -2, top: -2, width: 4, height: 4, borderRadius: '50%', backgroundColor: '#ffffff', opacity: 0.8, pointerEvents: 'none' }} />
                  </div>
                );
              })}
              {/* Entities */}
              {Number.isFinite(me?.worldX) && Number.isFinite(me?.worldZ) && Object.values(entities).filter(e => {
                const eRegionX = e.region & 0xFF;
                const eRegionZ = (e.region >> 8) & 0xFF;
                const eWorldX = ((eRegionX - 135) * UNITS_PER_REGION) + (e.posX || 0);
                const eWorldZ = ((eRegionZ - 92) * UNITS_PER_REGION) + (e.posZ || 0);
                const dx = Math.abs(eWorldX - me.worldX);
                const dz = Math.abs(eWorldZ - me.worldZ);
                const range = Math.max(3000, 8000 / world.zoom);
                return dx < range && dz < range;
              }).map(e => {
                const eRegionX = e.region & 0xFF;
                const eRegionZ = (e.region >> 8) & 0xFF;
                const eWorldX = ((eRegionX - 135) * UNITS_PER_REGION) + (e.posX || 0);
                const eWorldZ = ((eRegionZ - 92) * UNITS_PER_REGION) + (e.posZ || 0);
                const r = worldToRender(eWorldX, eWorldZ);
                const isChar = e.entityType === 'CHAR';
                const isMob = e.entityType === 'MOB';
                const isCos = e.entityType === 'COS';
                const isNpc = e.entityType === 'NPC';
                const dotSize = Math.max(5, Math.min(10, 12 / world.zoom));
                const half = dotSize / 2;
                const color = isMob ? '#ff2222' : isChar ? '#22aa44' : isCos ? '#4488ff' : isNpc ? '#ffdd44' : '#ffcc00';
                const borderColor = isMob ? '#ff6666' : isChar ? '#55dd77' : isCos ? '#66aaff' : isNpc ? '#ffee88' : '#ffdd44';
                const isHovered = hoveredEntity === e.uniqueId;
                let label = e.name;
                if (!label) {
                  const resolved = getEntityName(e.refObjId, e.entityType);
                  label = resolved || (isMob ? `Mob #${e.uniqueId}` : isCos ? `Pet #${e.uniqueId}` : `NPC #${e.uniqueId}`);
                }
                return (
                  <div key={e.uniqueId} style={{ position: 'absolute', left: r.renderX - half, top: r.renderZ - half, width: dotSize, height: dotSize, zIndex: isHovered ? 2000 : 90, pointerEvents: 'auto', cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredEntity(e.uniqueId)}
                    onMouseLeave={() => setHoveredEntity(null)}
                  >
                    <div style={{ width: dotSize, height: dotSize, borderRadius: isMob ? '50%' : '2px', backgroundColor: color, border: `2px solid ${borderColor}`, transform: isChar ? 'rotate(45deg)' : 'none', boxShadow: isHovered ? `0 0 12px ${color}, 0 0 24px ${color}` : `0 0 5px ${color}`, transition: 'box-shadow 0.15s' }} />
                    {isHovered && (
                      <div style={{ position: 'absolute', left: '50%', bottom: '100%', transform: 'translateX(-50%)', marginBottom: 4, padding: '2px 6px', background: 'rgba(0,0,0,0.85)', color: '#fff', fontSize: Math.max(9, Math.min(13, 13 / world.zoom)), borderRadius: 4, border: `1px solid ${color}`, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 3000, fontFamily: 'sans-serif', lineHeight: 1.2, boxShadow: '0 0 8px rgba(0,0,0,0.5)' }}>
                        {label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Debug Grid */}
            {debug && debugRegions.map(r => (
              <div key={r.id} className="gc-region-box" style={{ left: r.left, top: r.top, width: BASE_TILE_SZ / TILE_STEP, height: BASE_TILE_SZ / TILE_STEP }}>
                <div className="gc-region-id-text">{r.id}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAP CANVAS - City */}
      {isCity && cityEntry && (
        <div ref={city.viewportRef} className="gc-map-viewport">
          <div ref={city.canvasRef} className="gc-map-canvas" style={{
            transform: `translate3d(${cityOffsetX}px,${cityOffsetY}px,0) scale(${city.zoom})`,
            background: '#0a0a0a',
          }}>
            <img src={cityEntry.image} alt={cityEntry.townName} style={{ width: cityEntry.imageWidth, height: cityEntry.imageHeight, display: 'block' }} />
          </div>
        </div>
      )}
    </>
  );
}
