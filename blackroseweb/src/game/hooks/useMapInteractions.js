import { renderToWorld, cityPlayArea } from "../utils/geo.js";
import { getDistance, pointInRect } from "../utils/math.js";
import { isWorldInsideCity, clampWorldToCity, nudgeWorldOutsideCity, cityPortalAtImage, cityImageToWorld } from "../utils/movement.js";

/**
 * Hook para gestionar las interacciones del usuario con el mapa y entidades.
 */
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
      let clPx, clPy, tileOrigin, localX, localZ; // declaradas fuera para el log

      if (!isCity) {
        clPx = Math.max(0, Math.min(MAP_CANVAS_W, px));
        clPy = Math.max(0, Math.min(MAP_CANVAS_H, py));
        // Convertir píxel del canvas a coordenadas del mundo
        // El tile central (TILE_RADIUS, TILE_RADIUS) empieza en (TILE_RADIUS*R, TILE_RADIUS*R)
        // y corresponde a la región donde está el jugador
        tileOrigin = TILE_RADIUS * R;
        // Offset en píxeles desde el tile central (puede ser negativo si se clica a la izquierda)
        localX = clPx - tileOrigin;
        localZ = tileOrigin - clPy;
        // La región del jugador (en coordenadas centradas, base 0)
        const playerRX = Math.floor(me.worldX / R);
        const playerRZ = Math.floor(me.worldZ / R);
        // clickWX/Z en world units (sistema centrado, base 0)
        clickWX = (playerRX * R) + localX;
        clickWZ = (playerRZ * R) + localZ;
        // Permitir clic en el mismo tile: no hay restricción de distancia mínima
        // (el guard de MAX_CLICK_WU más abajo ya limita la distancia máxima)

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
        // Convertir de centrado a absoluto para el envío
        const targetRX = Math.floor(tWX / R) + 135;
        const targetRZ = Math.floor(tWZ / R) + 92;
        const targetRegion = targetRX | (targetRZ << 8);
        const targetLocalX = Math.round(tWX - (targetRX - 135) * R);
        const targetLocalZ = Math.round(tWZ - (targetRZ - 92) * R);
        
        // LOG DETALLADO: coordenadas del click
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
        
        // Validar que las coordenadas estén en rango antes de enviar
        if (targetRX >= 26 && targetRX <= 252 && targetRZ >= 37 && targetRZ <= 126 &&
          targetLocalX >= 0 && targetLocalX <= 192 && targetLocalZ >= 0 && targetLocalZ <= 192) {
          wsSend({
            type: 'MOVE',
            region: targetRegion,
            posX: targetLocalX,
            posZ: targetLocalZ,
          });
        } else {
          console.warn('⚠️ [CLICK] Coordenadas fuera de rango — NO se envía MOVE');
        }
      }

      return {
        ...prev,
        // Ya no guardamos _targetWX/WZ — el player se mueve solo con PLAYER_STOPPED
        me: { ...me, isFollowingPlayer: true }
      };
    });
  };

  const handleMarkerClick = (m, e) => {
    e.stopPropagation();
    if (m.action.type === "citymap") {
      const detected = CITY_REGIONS.find(c => c.mapId === m.action.map);
      if (detected) enterCity(detected);
    } else if (m.action.type === "dialog") {
      setDialog({ title: m.label, text: m.action.text });
    } else if (m.action.type === "url") {
      window.open(m.action.href, "_blank");
    }
  };

  const handleNpcClick = (npc, e) => {
    e.stopPropagation();
    if (npc.action.type === "dialog") {
      setDialog({ title: npc.label, text: npc.action.text });
    }
  };

  return { handleMapClick, handleMarkerClick, handleNpcClick };
}
