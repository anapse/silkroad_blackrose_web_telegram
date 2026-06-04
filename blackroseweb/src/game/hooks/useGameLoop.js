import { useEffect } from "react";
import { GAME_CONSTANTS } from "../../shared/constants/gameConstants.js";
import { getDistance } from "../utils/math.js";
import { directionToAngle } from "../utils/vectors.js";
import { worldToRender, coordToCanvas } from "../utils/geo.js";
import { isWorldInsideCity, cityForPlayer, cityPortalAtWorld, nudgeWorldOutsideCity } from "../utils/movement.js";

// Acceso directo para evitar problemas con desestructuración asíncrona
const MAP_CANVAS_W = GAME_CONSTANTS.MAP.CANVAS_W;
const TILE_RADIUS = GAME_CONSTANTS.MAP.TILE_RADIUS;
const UNITS_PER_REGION = GAME_CONSTANTS.MAP.UNITS_PER_REGION;

/**
 * Hook que gestiona el ciclo de vida de la lógica del juego (Movimiento, Cámaras, Transiciones).
 * 
 * Movimiento con velocidad real en WU/segundo usando delta time.
 * WALK_SPEED = 80 WU/s es la velocidad base de caminata en Silkroad.
 * Con delta time, el marker se mueve a la misma velocidad independientemente de los FPS.
 */
export function useGameLoop({
  setPlayers,
  entities,
  setEntities,
  insideCityRef,
  setInsideCity,
  setCurrentMap,
  setTargetWorld,
  enterCity,
  constants,
  cityRegions,
}) {
  const { R } = constants;

  useEffect(() => {
    let raf;
    let lastTime = performance.now();
    const WALK_SPEED = 80; // WU por segundo, velocidad base Silkroad

    const loop = (timestamp) => {
      const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // segundos, máximo 50ms
      lastTime = timestamp;

      setPlayers((prev) => {
        const next = { ...prev };
        let dirty = false;

        for (const id in next) {
          const p = next[id];

          // Saltar si no hay posición
          if (p.worldX == null || p.worldZ == null) continue;

          // ── MOVIMIENTO: para entidades que no son el jugador ──
          if (id !== "me" && p._targetWX !== undefined) {
            const dx = p._targetWX - p.worldX;
            const dz = p._targetWZ - p.worldZ;
            const dist = getDistance(p.worldX, p.worldZ, p._targetWX, p._targetWZ);
            const speed = WALK_SPEED * 0.5;
            const step = speed * dt;

            if (dist <= step) {
              p.worldX = p._targetWX;
              p.worldZ = p._targetWZ;
              p.moving = false;
              p._targetWX = undefined;
              p._targetWZ = undefined;
              dirty = true;
            } else {
              p.worldX += (dx / dist) * step;
              p.angle = directionToAngle(dx, dz);
              p.moving = true;
              dirty = true;
            }
          }

          // ── MOVIMIENTO: solo para entidades que no son el jugador ──
          // El jugador (id="me") NO interpola — su posición la actualiza PLAYER_MOVE_CONFIRMED
          // y la suavidad visual la dan las transiciones CSS.
          if (id !== "me" && p._targetWX !== undefined) {
            const dx = p._targetWX - p.worldX;
            const dz = p._targetWZ - p.worldZ;
            const dist = getDistance(p.worldX, p.worldZ, p._targetWX, p._targetWZ);
            const speed = WALK_SPEED * 0.5;
            const step = speed * dt;

            if (dist <= step) {
              p.worldX = p._targetWX;
              p.worldZ = p._targetWZ;
              p.moving = false;
              p._targetWX = undefined;
              p._targetWZ = undefined;
              dirty = true;
            } else {
              p.worldX += (dx / dist) * step;
              p.angle = directionToAngle(dx, dz);
              p.moving = true;
              dirty = true;
            }
          }

          // ── DETENER POR COLISIÓN ──
          // Cuando PLAYER_STOPPED llega, usePlayerInit ya actualizó worldX/worldZ
          // Solo limpiamos flags (NO borrar targetWorld — el marker se queda hasta próximo click)
          if (p._stopped) {
            p._targetWX = undefined;
            p._targetWZ = undefined;
            p.moving = false;
            delete p._stopped;
            dirty = true;
          }

          // ── SUAVIZADO DE CÁMARA (Follow) ──
          if (p.isFollowingPlayer) {
            const cdx = p.worldX - p.cameraWX;
            const cdz = p.worldZ - p.cameraWZ;
            if (Math.abs(cdx) > 0.1 || Math.abs(cdz) > 0.1) {
              p.cameraWX += cdx * 0.15;
              p.cameraWZ += cdz * 0.15;
              dirty = true;
            } else if (p.cameraWX !== p.worldX || p.cameraWZ !== p.worldZ) {
              p.cameraWX = p.worldX;
              p.cameraWZ = p.worldZ;
              dirty = true;
            }
          }

          // ── SINCRONIZACIÓN DE RENDER ──
          // Sistema centrado: recuperar regionX/Z desde worldX/Z
          const rX = Math.floor(p.worldX / R) + 135;
          const rZ = Math.floor(p.worldZ / R) + 92;

          if (p.id === 'me') {
            // Renderizar con la fórmula ESTÁNDAR centralizada
            const { canvasX, canvasZ } = coordToCanvas(
              p.regionX ?? rX, p.regionZ ?? rZ,
              p.posX ?? 0, p.posZ ?? 0,
              rX, rZ
            );
            const newRX = canvasX;
            const newRZ = canvasZ;
            if (p.renderX !== newRX || p.renderZ !== newRZ || p.regionX !== rX || p.regionZ !== rZ) {
              p.renderX = newRX;
              p.renderZ = newRZ;
              p.regionX = rX;
              p.regionZ = rZ;
              dirty = true;
            }
          } else {
            // Otros players se renderizan relativos al jugador
            const r = worldToRender(p.worldX, p.worldZ, p.cameraWX, p.cameraWZ);
            const newRX = isNaN(r.renderX) ? p.renderX : r.renderX;
            const newRZ = isNaN(r.renderZ) ? p.renderZ : r.renderZ;
            if (p.renderX !== newRX || p.renderZ !== newRZ || p.regionX !== rX || p.regionZ !== rZ) {
              p.renderX = newRX;
              p.renderZ = newRZ;
              p.regionX = rX;
              p.regionZ = rZ;
              dirty = true;
            }
          }
          if (p.moving) dirty = true;
        }
        return dirty ? { ...next } : prev;
      });

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
            // Solo interpolar si tiene worldX válido — nunca mezclar con posX
            if (e.worldX === undefined || e.worldZ === undefined) continue;
            movingCount++;

            const dx = e._targetWX - e.worldX;
            const dz = e._targetWZ - e.worldZ;
            const dist = getDistance(e._targetWX, e._targetWZ, e.worldX, e.worldZ);
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
                // NO sobrescribir posX/posZ (son offsets locales, no world coords)
              };
              entitiesDirty = true;
            }
          }
          // Log cada 5 segundos si hay entidades moviéndose
          if (movingCount > 0 && Math.floor(performance.now() / 5000) !== Math.floor((performance.now() - dt * 1000) / 5000)) {
            console.log(`[ENTIDADES] 🏃 ${movingCount} entidades moviéndose | ${Object.keys(nextEntities).length} totales en memoria`);
          }
          return entitiesDirty ? nextEntities : prevEntities;
        });
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [setPlayers, insideCityRef, cityRegions, R, enterCity, setCurrentMap, setInsideCity, setTargetWorld]);
}
