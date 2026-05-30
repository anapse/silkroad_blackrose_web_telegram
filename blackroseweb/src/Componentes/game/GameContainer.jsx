import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAuth }   from "../../context/AuthContext.jsx";
import { REGIONS }   from "./data/REGIONS.js";
import { MARKERS }   from "./data/MARKERS.js";
import { CITY_MAPS } from "./data/CITY_MAPS.js";
import { GAME_CONSTANTS } from "../../constants/gameConstants.js";
import { useMMOCamera } from "../../game/hooks/useMMOCamera.js";
import { useGameLoop } from "../../game/hooks/useGameLoop.js";
import { usePlayerInit } from "../../game/hooks/usePlayerInit.js";
import { useMapInteractions } from "../../game/hooks/useMapInteractions.js";
import { renderToWorld, worldToRender, worldRegionKey, cityPlayArea, cityViewFrame, normalizedWorldInCity } from "../../game/utils/geo.js";
import { pointInRect, getDistance } from "../../game/utils/math.js";
import { isWorldInsideCity, cityForPlayer, cityWorldToImage, cityImageToWorld, clampWorldToCity, nudgeWorldOutsideCity } from "../../game/utils/movement.js";
import { directionToAngle } from "../../game/utils/vectors.js";
import { calculateCameraOffset } from "../../game/utils/camera.js";

import "./GameContainer.css";
import UnderBar from "./UnderBar.jsx";
import UnifiedGameWindow from './Interfaces/UnifiedGameWindow.jsx';

const { MAP, MOVEMENT, ICONS, SPAWN } = GAME_CONSTANTS;
const {
  MIN_X: MAP_MIN_X,
  MAX_X: MAP_MAX_X,
  MIN_Z: MAP_MIN_Z,
  MAX_Z: MAP_MAX_Z,
  BASE_TILE_SZ,
  TILE_STEP,
  UNITS_PER_REGION,
  WORLD_SCALE,
  CANVAS_W: MAP_CANVAS_W,
  CANVAS_H: MAP_CANVAS_H
} = MAP;

const { WALK_SPEED_WU, MAX_CLICK_WU, CITY_EXIT_NUDGE_WU } = MOVEMENT;
const R = UNITS_PER_REGION;
const CAMERA_OFFSET_Y = 80;

// Differentiate Race from RefObjID
function getRaceFromID(id) {
  const rid = Number(id);
  if ((rid >= 14722 && rid <= 15000) || (rid >= 1907 && rid <= 1932)) return "euro";
  return "china";
}

/* ══════════════════════════════════════════════════════
   CITY REGION DETECTION — uses REGIONS.js town areas as truth.
══════════════════════════════════════════════════════ */
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
    mapId,
    townName,
    regions,
    regionSet: new Set(regions.map(r => `${r.x}_${r.z}`)),
    worldMinX: minX * R,
    worldMaxX: (maxX + 1) * R,
    worldMinZ: minZ * R,
    worldMaxZ: (maxZ + 1) * R,
    image: cityMap.image,
    imageWidth: cityMap.imageWidth ?? 900,
    imageHeight: cityMap.imageHeight ?? 600,
    playArea: cityMap.playArea,
    portals: cityMap.portals ?? [],
  };
}).filter(Boolean);

function cityPortalAtWorld(city, worldX, worldZ, side = "worldRect") {
  const point = normalizedWorldInCity(city, worldX, worldZ);
  return city.portals?.find(portal => portal[side] && pointInRect(point, portal[side])) ?? null;
}

function cityPortalAtImage(city, px, py, fitMode = "gridToImage") {
  const area = cityPlayArea(city);
  const areaX = fitMode === "imageToGrid" ? 0 : area.x;
  const areaY = fitMode === "imageToGrid" ? 0 : area.y;
  const point = {
    x: (px - areaX) / area.w,
    y: (py - areaY) / area.h,
  };
  return city.portals?.find(portal => portal.cityRect && pointInRect(point, portal.cityRect)) ?? null;
}

function cityFullImagePoint(city, xPercent, yPercent, fitMode = "gridToImage") {
  const area = cityPlayArea(city);
  const fullX = (xPercent / 100) * city.imageWidth;
  const fullY = (yPercent / 100) * city.imageHeight;

  return {
    x: fitMode === "imageToGrid" ? fullX - area.x : fullX,
    y: fitMode === "imageToGrid" ? fullY - area.y : fullY,
  };
}



const ICON_SIZE = {
  city: ICONS.CITY, fort: ICONS.FORT,
  dungeon: ICONS.DUNGEON, npc: ICONS.NPC, poi: ICONS.POI,
};

/* ══════════════════════════════════════════════════════
   WORLD GRID — built once, invisible logic layer
══════════════════════════════════════════════════════ */
let WORLD_GRID = [];

function buildMapGrid() {
  WORLD_GRID = [];
  const rows = [];
  for (let z = MAP_MAX_Z; z >= MAP_MIN_Z; z -= TILE_STEP) {
    const row = [];
    for (let x = MAP_MIN_X; x <= MAP_MAX_X; x += TILE_STEP) {
      // screenX/Y = canvas pixel position of this tile's top-left corner
      const screenX = ((x - MAP_MIN_X) / TILE_STEP) * BASE_TILE_SZ;
      const screenY = ((MAP_MAX_Z - z) / TILE_STEP) * BASE_TILE_SZ;
      WORLD_GRID.push({
        tileX: x, tileZ: z,
        screenX, screenY,
        // posX/posZ inside tile → Silkroad units (0‥768)
        unitsWide: TILE_STEP * UNITS_PER_REGION,
      });
      row.push({ x, z, src: `/interface/worldmap/map/map_world_${x}x${z}.png` });
    }
    rows.push(row);
  }
  return rows;
}

/* Canvas pixel → Silkroad region info */
function screenToSilkroad(px, py) {
  const tile = WORLD_GRID.find(t =>
    px >= t.screenX && px < t.screenX + BASE_TILE_SZ &&
    py >= t.screenY && py < t.screenY + BASE_TILE_SZ
  ) ?? null;
  if (!tile) return { regionX: 0, regionZ: 0, posX: 0, posZ: 0 };
  const localX = px - tile.screenX;
  const localZ = py - tile.screenY;
  const posX = Math.floor((localX / BASE_TILE_SZ) * tile.unitsWide);
  const posZ = Math.floor((localZ / BASE_TILE_SZ) * tile.unitsWide);
  return { tile, regionX: tile.tileX, regionZ: tile.tileZ, posX, posZ };
}

/* Canvas pixel → Silkroad from any world coord (for HUD) */
function coordsFromPixel(px, py) {
  return screenToSilkroad(px, py);
}

/* Resolve REGIONS.js lookup */
const regionByXZ = {};
REGIONS.forEach(r => { regionByXZ[`${r.x}_${r.z}`] = r; });

const regionById = Object.fromEntries(REGIONS.map(r => [r.regionId, r]));
function resolveMarkers() {
  return MARKERS.map(m => {
    const r = regionById[m.regionId];
    if (!r) return null;
    return { ...m,
      left: ((r.x - MAP_MIN_X) / 4) * BASE_TILE_SZ + (m.offset?.x ?? 0),
      top:  ((MAP_MAX_Z - r.z) / 4) * BASE_TILE_SZ + (m.offset?.y ?? 0),
    };
  }).filter(Boolean);
}

/* ══════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════ */
export default function GameContainer({ user, character }) {
  const { logout } = useAuth();

  const [currentMap,     setCurrentMap]     = useState("world");
  const [activeWindow,   setActiveWindow]   = useState(null);
  const chinaMap        = useMemo(buildMapGrid,   []);
  const resolvedMarkers = useMemo(resolveMarkers, []);

  const [dialog,   setDialog]   = useState(null);
  const [hover,    setHover]    = useState(null);
  const [debug,    setDebug]    = useState(false);
  const [isMapActive, setIsMapActive] = useState(false);
  const [insideCity, setInsideCity] = useState(null);
  const [cityFitMode, setCityFitMode] = useState("gridToImage");
  const [isCombatMode, setIsCombatMode] = useState(false); // To control UnderBar expansion
  const insideCityRef = useRef(null);

  const debugRegions = useMemo(() => {
    if (!debug || currentMap !== "world") return [];
    const regionSize = BASE_TILE_SZ / TILE_STEP;
    return REGIONS.filter(r => 
      r.x >= MAP_MIN_X && r.x <= MAP_MAX_X && 
      r.z >= MAP_MIN_Z && r.z <= MAP_MAX_Z
    ).map(r => ({
      id: r.regionId,
      x: r.x, z: r.z,
      left: (r.x - MAP_MIN_X) * regionSize,
      top: (MAP_MAX_Z - r.z) * regionSize
    }));
  }, [debug, currentMap]);

  const cityOverlays = useMemo(() => {
    if (currentMap !== "world") return [];
    return CITY_REGIONS.map(city => {
      // Add a small bleed factor to expand the area slightly beyond the exact region bounds
      // to align with the visual walls on the world map texture.
      const bleedX = (city.worldMaxX - city.worldMinX) * 0.15; 
      const bleedZ = (city.worldMaxZ - city.worldMinZ) * 0.15; 

      const tl = worldToRender(city.worldMinX - bleedX, city.worldMaxZ + bleedZ);
      const br = worldToRender(city.worldMaxX + bleedX, city.worldMinZ - bleedZ);
      const area = cityPlayArea(city);
      
      const w = br.renderX - tl.renderX;
      const h = br.renderZ - tl.renderZ;
      const scaleX = w / area.w;
      const scaleY = h / area.h;

      return {
        id: city.mapId,
        image: city.image,
        left: tl.renderX,
        top: tl.renderZ,
        width: w,
        height: h,
        imgW: city.imageWidth * scaleX,
        imgH: city.imageHeight * scaleY,
        imgL: -area.x * scaleX,
        imgT: -area.y * scaleY,
      };
    });
  }, [currentMap]);

  // --- INITIALIZATION HOOK ---
  const { players, setPlayers, race } = usePlayerInit({
    user,
    character,
    constants: { SPAWN, UNITS_PER_REGION, WALK_SPEED_WU }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingImg, setLoadingImg] = useState(1);

  useEffect(() => {
    // Randomize loading image on start
    setLoadingImg(Math.floor(Math.random() * 7) + 1);
    
    let start = Date.now();
    const duration = 4000; // 4 seconds
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setLoadingProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => setIsLoading(false), 500); // Small buffer at 100%
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, []);

  const [targetWorld, setTargetWorld] = useState(null);

  const world = useMMOCamera(6);
  const city  = useMMOCamera(6);
  const isCity = currentMap !== "world";

  useEffect(() => {
    insideCityRef.current = insideCity;
  }, [insideCity]);

  // Init camera zoom
  useEffect(() => {
    world.reset(6);
  }, []);

  useLayoutEffect(() => {
    setPlayers(p => ({ ...p }));
  }, []);

  // Wire up drag logic
  useEffect(() => {
    world.onDragRef.current = (dx, dy) => {
      setPlayers(prev => {
        const me = { ...prev.me };
        me.isFollowingPlayer = false;
        const { dxCanvas, dyCanvas } = calculateCameraOffset(dx, dy, world.zoom);
        me.cameraWX += dxCanvas * WORLD_SCALE;
        me.cameraWZ += -dyCanvas * WORLD_SCALE;
        return { ...prev, me };
      });
    };
    city.onDragRef.current = (dx, dy) => {
      setPlayers(prev => {
        if (!insideCity) return prev;
        const me = { ...prev.me };
        me.isFollowingPlayer = false;
        const { dxCanvas, dyCanvas } = calculateCameraOffset(dx, dy, city.zoom);
        const cW = insideCity.worldMaxX - insideCity.worldMinX;
        const cH = insideCity.worldMaxZ - insideCity.worldMinZ;
        me.cameraWX += dxCanvas * (cW / insideCity.imageWidth);
        me.cameraWZ += -dyCanvas * (cH / insideCity.imageHeight);
        return { ...prev, me };
      });
    };
  }, [world.zoom, city.zoom, insideCity]);

  const enterCity = (detected) => {
    setInsideCity(detected);
    setPlayers(prev => ({
      ...prev,
      me: {
        ...prev.me,
        cameraWX: prev.me.worldX,
        cameraWZ: prev.me.worldZ,
        isFollowingPlayer: true,
        moving: false,
        _targetWX: undefined,
        _targetWZ: undefined,
      }
    }));
    setTargetWorld(null);
    
    // Smooth zoom transition (using the unified world camera)
    world.reset(12.0); 
  };

  /* ── MAP MODE SYNC — leaving a town region returns to world. Entering requires a portal. ── */
  useEffect(() => {
    const me = players.me;
    const detected = cityForPlayer(me.worldX, me.worldZ, CITY_REGIONS, R); // TRUE world units
    if (!detected && currentMap !== "world") {
      setInsideCity(null);
      setCurrentMap("world");
      world.reset(6.0);
    }
  }, [players.me.worldX, players.me.worldZ]);

  /* ── GAME LOOP — moves in World Units (SRU), derives render from world ── */
  useGameLoop({
    setPlayers,
    insideCityRef,
    setInsideCity,
    setCurrentMap,
    setTargetWorld,
    enterCity,
    constants: { WALK_SPEED_WU, R, WORLD_SCALE },
    cityRegions: CITY_REGIONS,
  });


  useEffect(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
  }, []);

  // backToWorld is only for emergency manual override
  const backToWorld = () => { setCurrentMap("world"); setInsideCity(null); setDialog(null); };

  // --- INTERACTION HOOK ---
  const { handleMapClick, handleMarkerClick, handleNpcClick } = useMapInteractions({
    isCity,
    camera: isCity ? city : world,
    cityFitMode,
    setPlayers,
    setTargetWorld,
    setDialog,
    enterCity,
    insideCity,
    CITY_REGIONS,
    REGIONS,
    constants: { MAP_CANVAS_W, MAP_CANVAS_H, R, MAX_CLICK_WU, CITY_EXIT_NUDGE_WU }
  });

  const tgUser   = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const cityData = isCity ? CITY_MAPS[currentMap] : null;

  // --- LOADING SCREEN ---
  if (isLoading) {
    return (
      <div className="gc-loading-screen">
        {/* Background Image */}
        <img 
          src={`/interface/loading/loading_china_${loadingImg}.png`} 
          className="gc-loading-img"
          alt="Loading..." 
        />
        
        {/* Progress Bar Container */}
        <div className="gc-progress-bar-container">
          {/* The actual loading image stretched */}
          <img 
            src="/interface/loading/gauge_loading.png" 
            className="gc-progress-bar-fill"
            style={{ width: `${loadingProgress}%` }}
            alt="progress" 
          />
          
          {/* Percentage text */}
          <div className="gc-progress-bar-text">
            {Math.floor(loadingProgress)}%
          </div>
        </div>
      </div>
    );
  }

  const me = players.me;
  const tgtScreen = targetWorld ? worldToRender(targetWorld.wx, targetWorld.wz) : null;
  const regionInfo = regionByXZ[`${me.regionX}_${me.regionZ}`];

  // City player position in city IMAGE pixels (derived from world units)
  const cityEntry = insideCity;
  const cityFrame = cityEntry ? cityViewFrame(cityEntry, cityFitMode) : null;
  let cityPlayerX = 0, cityPlayerY = 0; // city image pixels
  let cityTgtX = null, cityTgtY = null;
  if (cityEntry) {
    const playerImg = cityWorldToImage(cityEntry, me.worldX, me.worldZ, cityFitMode);
    cityPlayerX = playerImg.x;
    cityPlayerY = playerImg.y;
    if (targetWorld) {
      const targetImg = cityWorldToImage(cityEntry, targetWorld.wx, targetWorld.wz, cityFitMode);
      cityTgtX = targetImg.x;
      cityTgtY = targetImg.y;
    }
  }

  return (
    <div className="gc-wrapper">
      <header className="gc-header">
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {isCity && <button className="gc-back-btn" onClick={backToWorld}>← Mapa</button>}
          <div className="gc-brand">🌹 {isCity ? cityData?.name : "BlackRose"}</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {!isCity && (
            <button
              className={`gc-zoom-btn ${debug ? "debug-on" : ""}`}
              onClick={() => setDebug(d => !d)}
            >{debug ? "🐛 ON" : "🐛"}</button>
          )}
          {isCity && debug && (
            <button
              className="gc-zoom-btn debug-city"
              onClick={() => setCityFitMode(m => m === "gridToImage" ? "imageToGrid" : "gridToImage")}
            >
              {cityFitMode === "gridToImage" ? "Grid->Img" : "Img->Grid"}
            </button>
          )}
          <button className="gc-logout-btn" onClick={logout}>Salir</button>
        </div>
      </header>

      {/* ══ PLAYER HUD ══ */}
      <div className="gc-player-hud">
        <div className="gc-ph-portrait-frame">
          <img src={`/character/${character?.RefObjID}.gif`} className="gc-ph-portrait" alt="" onError={e => e.target.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='} />
          {/* Decorative circles */}
          <div className="gc-ph-deco" style={{top:4, left:-2}} />
          <div className="gc-ph-deco" style={{top:20, left:-5}} />
          <div className="gc-ph-deco" style={{top:36, left:-2}} />
          <img src={`/character/race_${me.race}.png`} style={{ position:"absolute", bottom:-5, right:-5, width:24, height:24, zIndex:10 }} alt={me.race} />
          {/* Dragon icon placeholder */}
          <div className="gc-ph-dragon-icon">
            <span style={{ fontSize:10 }}>🐉</span>
          </div>
        </div>
        <div className="gc-ph-info">
          <div className="gc-ph-top-line">
            <span className="gc-ph-name">{me.charName}</span>
            <span className="gc-ph-level">Lv {me.level}</span>
          </div>
          <div className="gc-ph-bar-wrap">
            <div className="gc-ph-bar" style={{background:"linear-gradient(to bottom, #d42222, #8b0000)", width:`${(me.hp/me.maxHp)*100}%`}} />
            <div className="gc-ph-bar-text">{me.hp} / {me.maxHp}</div>
          </div>
          <div className="gc-ph-bar-wrap">
            <div className="gc-ph-bar" style={{background:"linear-gradient(to bottom, #2255d4, #00008b)", width:`${(me.mp/me.maxMp)*100}%`}} />
            <div className="gc-ph-bar-text">{me.mp} / {me.maxMp}</div>
          </div>
        </div>
      </div>

      {/* ══ MMO MINIMAP HUD ══ */}
      <div className="gc-minimap-ui">
        <div className="gc-mm-header">
          <div className="gc-mm-title">{isCity ? cityData?.name : (regionInfo?.name || "Unknown Area")}</div>
        </div>
        <div className="gc-mm-coords">
          <div className="gc-mm-coord-item gc-mm-coord-item-left">X:{Math.round(me.worldX)}</div>
          <div className="gc-mm-coord-item gc-mm-coord-item-right">Y:{Math.round(me.worldZ)}</div>
        </div>
        <div className="gc-mm-circle-wrap">
          <div className="gc-mm-circle">
            {/* The compass inner map background (dark green grid feel) */}
            <div style={{ width:"100%", height:"100%", background:"repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(0,0,0,0.1) 19px, rgba(0,0,0,0.1) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(0,0,0,0.1) 19px, rgba(0,0,0,0.1) 20px)" }} />
          </div>

          {/* Focus Button (Globe) — Now toggles Map Interaction Mode */}
          <button
            className="gc-mm-globe-btn"
            onClick={() => {
              const nextActive = !isMapActive;
              setIsMapActive(nextActive);
              setPlayers(prev => ({
                ...prev,
                me: { ...prev.me, isFollowingPlayer: !nextActive }
              }));
            }}
          >
            <img 
              src={isMapActive ? "/interface/worldmap/wmap_small_button_world_press.png" : "/interface/worldmap/wmap_small_button_world_focus.png"} 
              style={{ width:"100%", height:"100%" }} 
              alt="Toggle Map Interaction" 
            />
          </button>

          <div className="gc-mm-compass gc-mm-compass-n">N</div>
          <div className="gc-mm-compass gc-mm-compass-s">S</div>
          <div className="gc-mm-compass gc-mm-compass-e">E</div>
          <div className="gc-mm-compass gc-mm-compass-w">W</div>
          <div style={{ position:"absolute", top:"50%", left:"50%", width:0, height:0, transformOrigin:'0 0', transform:`rotate(${me.angle}deg)`, zIndex:10, overflow:'visible' }}>
            <span style={{ position:'absolute', left:'-2px', top:'-2px', fontSize:'4px', lineHeight:1, color: me.race === 'euro' ? '#88aaff' : '#ff5555', textShadow:'0 0 3px #000', userSelect:'none' }}>▶</span>
          </div>
          {/* Integrated Zoom Controls */}
          <button className="gc-mm-zoom-btn gc-mm-zoom-btn-minus" onClick={() => isCity ? city.zoomOut() : world.zoomOut()}>−</button>
          <button className="gc-mm-zoom-btn gc-mm-zoom-btn-plus" onClick={() => isCity ? city.zoomIn() : world.zoomIn()}>+</button>
        </div>
      </div>

      {/* MMO CAMERA OFFSET COMPUTATION */}
      {(() => {
        const getClampedOffset = (rawX, rawY, currentZ, vp, cv) => {
          if (!vp || !cv) return { x: rawX, y: rawY };
          const vw = vp.offsetWidth;
          const vh = vp.offsetHeight;
          const cw = cv.offsetWidth * currentZ;
          const ch = cv.offsetHeight * currentZ;

          let x = rawX;
          let y = rawY;

          if (cw <= vw) {
            x = (vw - cw) / 2;
          } else {
            const minX = vw - cw;
            x = Math.max(minX, Math.min(0, rawX));
          }

          if (ch <= vh) {
            y = (vh - ch) / 2;
          } else {
            const minY = vh - ch;
            y = Math.max(minY, Math.min(0, rawY));
          }

          return { x, y };
        };

        // World Map Offset
        let worldOffsetX = 0, worldOffsetY = 0;
        if (!isCity && world.viewportRef.current && world.canvasRef.current) {
          const vp = world.viewportRef.current;
          const targetWX = me.isFollowingPlayer ? me.worldX : me.cameraWX;
          const targetWZ = me.isFollowingPlayer ? me.worldZ : me.cameraWZ;
          
          const { renderX: cRX, renderZ: cRZ } = worldToRender(targetWX, targetWZ);
          const rawX = vp.offsetWidth / 2 - cRX * world.zoom;
          const rawY = (vp.offsetHeight / 2 - CAMERA_OFFSET_Y) - cRZ * world.zoom;
          const clamped = getClampedOffset(rawX, rawY, world.zoom, vp, world.canvasRef.current);
          worldOffsetX = clamped.x; worldOffsetY = clamped.y;
        } else if (!isCity) {
          const targetWX = me.isFollowingPlayer ? me.worldX : me.cameraWX;
          const targetWZ = me.isFollowingPlayer ? me.worldZ : me.cameraWZ;
          const { renderX: cRX, renderZ: cRZ } = worldToRender(targetWX, targetWZ);
          worldOffsetX = (window.innerWidth  / 2) - cRX * world.zoom;
          worldOffsetY = (window.innerHeight / 2) - cRZ * world.zoom;
        }

        // City Map Offset
        let cityOffsetX = 0, cityOffsetY = 0;
        if (isCity && cityEntry && city.viewportRef.current && city.canvasRef.current) {
          const vp = city.viewportRef.current;
          const targetWX = me.isFollowingPlayer ? me.worldX : me.cameraWX;
          const targetWZ = me.isFollowingPlayer ? me.worldZ : me.cameraWZ;
          const { x: cRX, y: cRY } = cityWorldToImage(cityEntry, targetWX, targetWZ, cityFitMode);
          const rawX = vp.offsetWidth / 2 - cRX * city.zoom;
          const rawY = (vp.offsetHeight / 2 - CAMERA_OFFSET_Y) - cRY * city.zoom;
          const clamped = getClampedOffset(rawX, rawY, city.zoom, vp, city.canvasRef.current);
          cityOffsetX = clamped.x; cityOffsetY = clamped.y;
        } else if (isCity && cityEntry) {
          const { x: cRX, y: cRY } = cityWorldToImage(cityEntry, me.cameraWX, me.cameraWZ, cityFitMode);
          cityOffsetX = (window.innerWidth  / 2) - cRX * city.zoom;
          cityOffsetY = (window.innerHeight / 2) - cRY * city.zoom;
        }

        return (
          <>
            {/* ══ UNIFIED MAP VIEW ══ */}
              <div ref={world.viewportRef} className="gc-map-viewport"
                onMouseDown={e => world.startDrag(e.clientX, e.clientY)}
                onTouchStart={e => { const t=e.touches[0]; world.startDrag(t.clientX, t.clientY); }}
              >
          {/* ── DEBUG HUD ── */}
          {debug && (
            <div className="gc-hud">
              <div className="gc-hud-title">🗺 COORD DEBUG</div>
              <div className="gc-hud-row"><span className="gc-hud-key">Map</span>        <span style={{...{color: isCity?"#ff8800":"#4af"}, ...{color: isCity?"#ff8800":"#4af"}}} className="gc-hud-val">{currentMap}</span></div>
              <div className="gc-hud-row"><span className="gc-hud-key">InsideTown</span> <span style={{color: insideCity?"#4f4":"#f44"}} className="gc-hud-val">{insideCity ? insideCity.mapId : "NO"}</span></div>
              <div className="gc-hud-separator" />
              <div className="gc-hud-row"><span style={{color:"#4af"}} className="gc-hud-key">worldX (SRU)</span>  <span className="gc-hud-val">{Math.round(me.worldX)}</span></div>
              <div className="gc-hud-row"><span style={{color:"#4af"}} className="gc-hud-key">worldZ (SRU)</span>  <span className="gc-hud-val">{Math.round(me.worldZ)}</span></div>
              <div className="gc-hud-separator" />
              <div className="gc-hud-row"><span style={{color:"#fa4"}} className="gc-hud-key">renderX (px)</span>  <span className="gc-hud-val">{me.renderX.toFixed(1)}</span></div>
              <div className="gc-hud-row"><span style={{color:"#fa4"}} className="gc-hud-key">renderZ (px)</span>  <span className="gc-hud-val">{me.renderZ.toFixed(1)}</span></div>
              <div className="gc-hud-separator" />
              <div className="gc-hud-row"><span className="gc-hud-key">Region</span>  <span className="gc-hud-val">{me.regionZ << 8 | me.regionX} ({me.regionX}, {me.regionZ})</span></div>
              <div className="gc-hud-row"><span className="gc-hud-key">File</span>    <span style={{color:"#ff8800"}} className="gc-hud-val">{me.regionZ}_{me.regionX}.jpg</span></div>
              {insideCity && <>
                <div className="gc-hud-separator" />
                <div className="gc-hud-row"><span className="gc-hud-key">cityMapX</span>  <span className="gc-hud-val">{cityPlayerX.toFixed(1)}%</span></div>
                <div className="gc-hud-row"><span className="gc-hud-key">cityMapY</span>  <span className="gc-hud-val">{cityPlayerY.toFixed(1)}%</span></div>
              </>}
              <div className="gc-hud-separator" />
              <div className="gc-hud-row"><span className="gc-hud-key">Moving</span>     <span style={{color: me.moving?"#4f4":"#f44"}} className="gc-hud-val">{me.moving?"YES":"NO"}</span></div>
            </div>
          )}

          {/* ── MAP CANVAS ── */}
          <div ref={world.canvasRef}
            className="gc-map-canvas"
            style={{
              transform: `translate3d(${worldOffsetX}px,${worldOffsetY}px,0) scale(${world.zoom})`,
              transition: 'transform 0.4s cubic-bezier(0.2, 0, 0.2, 1)'
            }}
            onClick={e => handleMapClick(e, world.zoom)}
          >
            {/* LAYER 1: Tiles */}
            {chinaMap.map((row, ri) => (
              <div key={ri} className="gc-row">
                {row.map(tile => (
                  <div key={`${tile.x}_${tile.z}`} className="gc-tile-wrap" style={{width: BASE_TILE_SZ, height: BASE_TILE_SZ}}>
                    <img src={tile.src} alt="" draggable={false} className="gc-tile" />
                  </div>
                ))}
              </div>
            ))}

            {/* LAYER 1.5: City Overlays (Seamless Unified View) */}
            {cityOverlays.map(city => {
              const cityData = CITY_MAPS[city.id];
              const showDetails = world.zoom > 3; // Solo mostrar detalles si hay suficiente zoom
              
              return (
                <div key={city.id} 
                  style={{
                    position: "absolute",
                    left: city.left,
                    top: city.top,
                    width: city.width,
                    height: city.height,
                    zIndex: 80,
                    pointerEvents: "none",
                    overflow: "hidden",
                    boxShadow: world.zoom > 5 ? "0 0 40px rgba(0,0,0,0.7)" : "none",
                    borderRadius: "4px",
                    background: "rgba(0,0,0,0.1)"
                  }}
                >
                  {/* City Background Image */}
                  <img src={cityData?.image || city.image} alt={city.id}
                    style={{
                      position: "absolute",
                      left: city.imgL,
                      top: city.imgT,
                      width: city.imgW,
                      height: city.imgH,
                      opacity: showDetails ? 1 : 0.6,
                      transition: "opacity 0.5s",
                      display: "block"
                    }} 
                    onError={(e) => { e.target.style.display = 'none'; }} // Ocultar si la ruta es falsa
                  />

                  {/* Render City NPCs - Only when zoomed in */}
                  {showDetails && cityData && cityData.npcs.map(npc => {
                    const baseSz = ICONS.NPC || { w: 24, h: 24 };
                    // IMPORTANTE: Dividimos por el zoom para que el icono mantenga su tamaño visual en pantalla
                    const sz = { 
                      w: baseSz.w / world.zoom * 6, 
                      h: baseSz.h / world.zoom * 6 
                    };
                    const hov = hover === npc.id;
                    const active = isMapActive;

                    // Posición absoluta dentro del contenedor del pueblo
                    const npcX = (npc.x / 100) * city.imgW + city.imgL;
                    const npcY = (npc.y / 100) * city.imgH + city.imgT;

                    return (
                      <div key={npc.id}
                        style={{ position:"absolute", left:npcX, top:npcY,
                                 width: sz.w, height: sz.h,
                                 transform:`translate(-50%,-50%) scale(${(hov && active)?1.2:1})`,
                                 transition:"transform .15s", zIndex:100, 
                                 cursor: active ? "pointer" : "default",
                                 pointerEvents: active ? "auto" : "none" }}
                        onMouseEnter={() => active && setHover(npc.id)} onMouseLeave={() => setHover(null)}
                        onClick={e => active && handleNpcClick(npc, e)}
                      >
                        <img src={npc.icon} alt={npc.label}
                          style={{ width:"100%", height:"100%", objectFit:"contain", pointerEvents:"none" }} 
                          onError={(e) => { e.target.src = '/interface/worldmap/map/npc_default.png'; }}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* LAYER 2: Markers */}
            {resolvedMarkers.filter(m => m.type !== "city").map(m => {
              const sz = ICON_SIZE[m.type] ?? ICON_SIZE.poi;
              const hov = hover === m.id;
              const active = isMapActive;
              return (
                <div key={m.id}
                  style={{ 
                    position:"absolute", 
                    left:m.left-sz.w/2, 
                    top:m.top-sz.h/2, 
                    width:sz.w, 
                    height:sz.h, 
                    zIndex:100, 
                    cursor: active ? "pointer" : "default", 
                    transform: (hov && active) ? "scale(1.15)" : "scale(1)", 
                    transition: "transform .15s",
                    pointerEvents: active ? "auto" : "none"
                  }}
                  onMouseEnter={() => active && setHover(m.id)} 
                  onMouseLeave={() => setHover(null)}
                  onClick={e => active && handleMarkerClick(m, e)}
                >
                  <img src={(hov && active) && m.iconFocus ? m.iconFocus : m.icon} alt={m.label}
                    style={{ width:sz.w, height:sz.h, objectFit:"contain", pointerEvents:"none" }} />
                </div>
              );
            })}

            {/* LAYER 3: Player Overlay — renderX/Z are canvas pixels */}
            <div className="gc-overlay-layer" style={{ zIndex: 2000 }}>
              {tgtScreen && <div className="gc-dest-marker" style={{ left:tgtScreen.renderX, top:tgtScreen.renderZ }} />}
              {players && Object.values(players).map(p => (
                <div key={p.id} style={{
                  position: 'absolute',
                  left: p.renderX,
                  top: p.renderZ,
                  width: 0,
                  height: 0,
                  transformOrigin: '0 0',
                  transform: `rotate(${p.angle}deg)`,
                  zIndex: 1000,
                  pointerEvents: 'none',
                  overflow: 'visible',
                }}>
                  <span style={{
                    position: 'absolute',
                    left: '-2px',
                    top: '-2px',
                    fontSize: '4px',
                    lineHeight: 1,
                    color: p.race === 'euro' ? '#88aaff' : '#ff5555',
                    textShadow: '0 0 3px #000, 0 0 6px #000',
                    userSelect: 'none',
                  }}>▶</span>
                </div>
              ))}
            </div>

            {/* LAYER 4: Debug Grid */}
            {debug && debugRegions.map(r => (
                <div key={r.id} className="gc-region-box" style={{ left: r.left, top: r.top, width: BASE_TILE_SZ / TILE_STEP, height: BASE_TILE_SZ / TILE_STEP }}>
                  <div className="gc-region-id-text">{r.id}</div>
                </div>
              ))}
          </div>
        </div>




      {dialog && (
        <div className="gc-overlay" onClick={() => setDialog(null)}>
          <div className="gc-dialog-box" onClick={e => e.stopPropagation()}>
            <div className="gc-dialog-head">
              <span className="gc-dialog-title">{dialog.title}</span>
              <button className="gc-dialog-close" onClick={() => setDialog(null)}>✕</button>
            </div>
            <p className="gc-dialog-text">{dialog.text}</p>
            <button className="gc-dialog-btn" onClick={() => setDialog(null)}>Cerrar</button>
          </div>
        </div>
      )}
      {activeWindow && (
        <UnifiedGameWindow 
          activeType={activeWindow}
          onClose={() => setActiveWindow(null)}
          race={me.race}
          charData={{
            name: character?.CharName || 'rioplay',
            level: me.level,
            // refObjId: el mismo ID numérico que usa /character/{RefObjID}.gif en el HUD
            refObjId: character?.RefObjID ?? null,
            // inventorySize: capacidad total de slots de inventario (desde slot 13).
            // Si el servidor no lo provee, usamos 96 (3 páginas de 32) como default.
            inventorySize: character?.InventorySize ?? 96,
            currentExp: character?.ExpOffset || 0,
            nextExp: character?.Exp_C || 0,
            statPoint: character?.RemainStatPoint || 0,
            honorPoint: 'N/A',
            str: character?.Strength || 0,
            int: character?.Intellect || 0,
            hp: me.hp,
            maxHp: me.maxHp,
            mp: me.mp,
            maxMp: me.maxMp,
            phyAtk: '1792 ~ 2196',
            magAtk: '2707 ~ 3317',
            phyDef: 742,
            magDef: 1235,
            phyBalance: '71 %',
            magBalance: '46 %',
            hitRate: 136,
            parryRatio: 70,
            jobAlias: '<Nothing>',
            jobLevel: '<Nothing>',
            jobExp: 0,
            skillPoints: character?.RemainSkillPoint || 58
          }}
        />
      )}

      <UnderBar 
        hp={me.hp} 
        maxHp={me.maxHp} 
        mp={me.mp} 
        maxMp={me.maxMp} 
        exp={character?.Exp_C && character.Exp_C > 0 
          ? (character.ExpOffset / character.Exp_C) * 100 
          : 0} 
        level={me.level} 
        isCombat={isCombatMode} 
        activeWindow={activeWindow}
        setActiveWindow={setActiveWindow}
      />
      </>
      );
    })()}
    </div>
  );
}


