// ================================================================
// Archivo: 07-click-calculation.js
// Cálculo completo del click del mouse → coordenadas → envío MOVE
// ================================================================

// ----------------------------------------------------------------
// De: gameConstants.js — constantes usadas en el cálculo del click
// ----------------------------------------------------------------
export const GAME_CONSTANTS = {
  MAP: {
    MIN_X: 26,
    MAX_X: 252,
    MIN_Z: 35,
    MAX_Z: 126,
    BASE_TILE_SZ: 192,
    TILE_STEP: 1,
    UNITS_PER_REGION: 192,
    WORLD_SCALE: 192 / 192,  // = 1
    TILE_RADIUS: 5,
    CANVAS_W: (2 * 5 + 1) * 192,  // = 2112
    CANVAS_H: (2 * 5 + 1) * 192,  // = 2112
  },
  MOVEMENT: {
    WALK_SPEED_WU: 80,
    MAX_CLICK_WU: 800,
    CITY_EXIT_NUDGE_WU: 0.01,
  },
};

// ----------------------------------------------------------------
// De: GameContainer.jsx — cómo el canvas recibe el click
// ----------------------------------------------------------------
// Se declaran estas constantes al inicio del módulo:
const { MAP, MOVEMENT, ICONS, SPAWN } = GAME_CONSTANTS;
const {
  MIN_X: MAP_MIN_X,
  MAX_X: MAP_MAX_X,
  MIN_Z: MAP_MIN_Z,
  MAX_Z: MAP_MAX_Z,
  BASE_TILE_SZ,
  UNITS_PER_REGION,
  WORLD_SCALE,
  CANVAS_W: MAP_CANVAS_W,
  CANVAS_H: MAP_CANVAS_H,
} = MAP;

const { WALK_SPEED_WU, MAX_CLICK_WU, CITY_EXIT_NUDGE_WU } = MOVEMENT;
const R = UNITS_PER_REGION;  // R = 192

// El send viene de useGameSocket():
const { playerState, entities, setEntities, serverDisconnected, reconnect, send } = useGameSocket();

// El hook se llama así:
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
    constants: { MAP_CANVAS_W, MAP_CANVAS_H, R, MAX_CLICK_WU, CITY_EXIT_NUDGE_WU, TILE_RADIUS, UNITS_PER_REGION },
    wsSend: send
});

// El canvas renderiza y pasa el click con el zoom actual:
{/* ── MAP CANVAS ── */}
<div ref={world.canvasRef}
    className="gc-map-canvas"
    style={{
      transform: `translate3d(${worldOffsetX}px,${worldOffsetY}px,0) scale(${world.zoom})`,
      transition: 'transform 0.4s cubic-bezier(0.2, 0, 0.2, 1)',
      width: MAP_CANVAS_W,
      height: MAP_CANVAS_H,
      position: 'relative',
    }}
    onClick={e => handleMapClick(e, world.zoom)}
>

// ----------------------------------------------------------------
// De: useMapInteractions.js — handleMapClick COMPLETO
// (desde el evento del mouse hasta wsSend)
// ----------------------------------------------------------------
import { renderToWorld, cityPlayArea } from "../utils/geo.js";
import { getDistance, pointInRect } from "../utils/math.js";
import { isWorldInsideCity, clampWorldToCity, nudgeWorldOutsideCity, cityPortalAtImage, cityImageToWorld } from "../utils/movement.js";

export function useMapInteractions({
  isCity,
  camera,
  cityFitMode,
  setPlayers,
  setTargetWorld,
  setDialog,
  enterCity,
  insideCity,
  CITY_REGIONS,
  REGIONS,
  constants,
  wsSend  // ← función para enviar WebSocket al backend
}) {
  const { MAP_CANVAS_W, MAP_CANVAS_H, R, MAX_CLICK_WU, CITY_EXIT_NUDGE_WU, UNITS_PER_REGION, TILE_RADIUS } = constants;

  const handleMapClick = (e, zoomLevel) => {
    if (camera.dragRef.current.moved) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / zoomLevel;
    const py = (e.clientY - rect.top) / zoomLevel;

    setPlayers(prev => {
      const me = prev.me;
      // No hacer nada si el jugador no tiene posición todavía
      if (me.worldX == null || me.worldZ == null) return prev;

      let clickWX, clickWZ;
      let clPx, clPy, tileOrigin, localX, localZ;

      if (!isCity) {
        clPx = Math.max(0, Math.min(MAP_CANVAS_W, px));
        clPy = Math.max(0, Math.min(MAP_CANVAS_H, py));
        tileOrigin = TILE_RADIUS * R;  // 5 * 192 = 960
        localX = clPx - tileOrigin;
        localZ = tileOrigin - clPy;
        const playerRX = Math.floor(me.worldX / R);
        const playerRZ = Math.floor(me.worldZ / R);
        clickWX = (playerRX * R) + localX;
        clickWZ = (playerRZ * R) + localZ;

        // Validación de Región (sistema centrado → absoluto)
        const rX = Math.floor(clickWX / R) + 135;
        const rZ = Math.floor(clickWZ / R) + 92;
        if (!REGIONS.some(reg => reg.x === rX && reg.z === rZ)) return prev;

      } else if (insideCity) {
        const clickedWorld = cityImageToWorld(insideCity, px, py, cityFitMode);
        clickWX = clickedWorld.worldX;
        clickWZ = clickedWorld.worldZ;

        const area = cityPlayArea(insideCity);
        const areaX = cityFitMode === "imageToGrid" ? 0 : area.x;
        const areaY = cityFitMode === "imageToGrid" ? 0 : area.y;
        const exitPx = 24;

        const isNearEdge =
          px <= areaX + exitPx || px >= areaX + area.w - exitPx ||
          py <= areaY + exitPx || py >= areaY + area.h - exitPx;

        const exitPortal = isNearEdge ? cityPortalAtImage(insideCity, px, py, cityFitMode) : null;

        if (exitPortal) {
          const outside = nudgeWorldOutsideCity(insideCity, clickWX, clickWZ, R, CITY_EXIT_NUDGE_WU);
          clickWX = outside.worldX;
          clickWZ = outside.worldZ;
        } else if (isNearEdge || !isWorldInsideCity(insideCity, clickWX, clickWZ, R)) {
          const fixed = clampWorldToCity(insideCity, clickWX, clickWZ, R);
          clickWX = fixed.worldX;
          clickWZ = fixed.worldZ;
        }
      } else return prev;

      const dist = getDistance(me.worldX, me.worldZ, clickWX, clickWZ);
      let tWX = clickWX, tWZ = clickWZ;

      if (dist > MAX_CLICK_WU) {
        const dx = clickWX - me.worldX;
        const dz = clickWZ - me.worldZ;
        tWX = me.worldX + (dx / dist) * MAX_CLICK_WU;
        tWZ = me.worldZ + (dz / dist) * MAX_CLICK_WU;
      }

      setTargetWorld({ wx: tWX, wz: tWZ, px: clPx, py: clPy });

      // Enviar movimiento al backend
      if (wsSend && !isCity) {
        const targetRX = Math.floor(tWX / R) + 135;
        const targetRZ = Math.floor(tWZ / R) + 92;
        const targetRegion = targetRX | (targetRZ << 8);
        const targetLocalX = Math.round(tWX - (targetRX - 135) * R);
        const targetLocalZ = Math.round(tWZ - (targetRZ - 92) * R);
        
        const clampedLocalX = Math.min(191, Math.max(0, targetLocalX));
        const clampedLocalZ = Math.min(191, Math.max(0, targetLocalZ));
        
        // Validar que las coordenadas estén en rango antes de enviar
        if (targetRX >= 26 && targetRX <= 252 && targetRZ >= 37 && targetRZ <= 126) {
          wsSend({
            type: 'MOVE',
            region: targetRegion,
            posX: clampedLocalX,
            posZ: clampedLocalZ,
          });
        } else {
          console.warn('⚠️ [CLICK] Coordenadas fuera de rango — NO se envía MOVE');
        }
      }

      return {
        ...prev,
        me: { ...me, isFollowingPlayer: true }
      };
    });
  };
  // ...
  return { handleMapClick, handleMarkerClick, handleNpcClick };
}

// ----------------------------------------------------------------
// De dónde vienen me.worldX, me.worldZ, me.regionX, me.regionZ
// ----------------------------------------------------------------
// El objeto `me` se construye en usePlayerInit.js a partir de wsPlayer
// (que a su vez viene del playerState del GameSocketContext).
//
// wsPlayer.region, wsPlayer.posX, wsPlayer.posZ llegan desde el backend
// via WebSocket (PLAYER_SPAWNED, PLAYER_POSITION_INIT, PLAYER_UPDATE,
// PLAYER_MOVE_CONFIRMED).
//
// usePlayerInit.js hace:
    const regionId = Number(wsPlayer.region);
    const posX = Number(wsPlayer.posX);
    const posZ = Number(wsPlayer.posZ ?? 0);
    const { regionX, regionZ, worldX, worldZ } = regionXYToWorld(
      regionId & 0xFF, (regionId >> 8) & 0xFF, posX, posZ
    );
    // regionX = regionId & 0xFF
    // regionZ = (regionId >> 8) & 0xFF
    // worldX = (regionX - 135) * 192 + Math.round(posX)
    // worldZ = (regionZ - 92) * 192 + Math.round(posZ)

// Luego en el setPlayers:
      const me = {
        id: "me",
        worldX, worldZ,
        regionX, regionZ,
        posX, posZ, posY,
        // ...
      };

// En game/ui/GameContainer.jsx se usa así:
  const me = players.me;
  // me.worldX y me.worldZ son world units en sistema centrado (base 0)
  // me.regionX y me.regionZ son las coordenadas absolutas de región
  // me.posX y me.posZ son los offsets locales dentro de la región

// ----------------------------------------------------------------
// Constantes exactas usadas en el cálculo del click
// ----------------------------------------------------------------
// TILE_RADIUS  = 5
// BASE_TILE_SZ = 192
// R (UNITS_PER_REGION) = 192
// MAX_CLICK_WU = 800
// MAP_CANVAS_W = 2112  (= (2*5+1) * 192)
// MAP_CANVAS_H = 2112  (= (2*5+1) * 192)
//
// Fórmulas del click:
//   tileOrigin = TILE_RADIUS * R           = 5 * 192 = 960
//   localX     = clPx - tileOrigin          = pixel offset desde el centro (px)
//   localZ     = tileOrigin - clPy          = pixel offset invertido (py)
//   playerRX  = Math.floor(me.worldX / R)   = región centrada del player
//   playerRZ  = Math.floor(me.worldZ / R)
//   clickWX   = playerRX * R + localX       = worldX centrada del click
//   clickWZ   = playerRZ * R + localZ
//
// Conversión a absoluto para el envío:
//   targetRX  = Math.floor(tWX / R) + 135
//   targetRZ  = Math.floor(tWZ / R) + 92
//   targetRegion = targetRX | (targetRZ << 8)
//   targetLocalX = Math.round(tWX - (targetRX - 135) * R)   = offset 0-191
//   targetLocalZ = Math.round(tWZ - (targetRZ - 92) * R)    = offset 0-191
//
// Límite de distancia:
//   MAX_CLICK_WU = 800  (world units máximos que puede moverse en un click)
