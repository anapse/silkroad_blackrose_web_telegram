import { useEffect } from "react";
import { getDistance } from "../utils/math.js";
import { directionToAngle } from "../utils/vectors.js";
import { worldToRender } from "../utils/geo.js";
import { isWorldInsideCity, cityForPlayer, cityPortalAtWorld, nudgeWorldOutsideCity } from "../utils/movement.js";

/**
 * Hook que gestiona el ciclo de vida de la lógica del juego (Movimiento, Cámaras, Transiciones).
 * 
 * Movimiento con velocidad real en WU/segundo usando delta time.
 * WALK_SPEED = 80 WU/s es la velocidad base de caminata en Silkroad.
 * Con delta time, el marker se mueve a la misma velocidad independientemente de los FPS.
 */
export function useGameLoop({
  setPlayers,
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

          // ── MOVIMIENTO: velocidad real en WU/s con delta time ──
          if (p._targetWX !== undefined) {
            const dx = p._targetWX - p.worldX;
            const dz = p._targetWZ - p.worldZ;
            const dist = getDistance(p.worldX, p.worldZ, p._targetWX, p._targetWZ);

            const activeCity = insideCityRef.current ?? cityForPlayer(p.worldX, p.worldZ, cityRegions, R);
            const speed = activeCity ? WALK_SPEED * 0.5 : WALK_SPEED;
            const step = speed * dt;

            if (dist <= step) {
              p.worldX = p._targetWX;
              p.worldZ = p._targetWZ;
              p.moving = false;
              p._targetWX = undefined;
              p._targetWZ = undefined;
              if (id === "me") setTargetWorld(null);
              dirty = true;
            } else {
              const oldX = p.worldX;
              const oldZ = p.worldZ;
              p.worldX += (dx / dist) * step;
              p.worldZ += (dz / dist) * step;

              // Lógica de salida de ciudad
              if (id === "me" && activeCity && !isWorldInsideCity(activeCity, p.worldX, p.worldZ, R)) {
                if (cityPortalAtWorld(activeCity, oldX, oldZ, "cityRect")) {
                  p._targetWX = undefined;
                  p._targetWZ = undefined;
                  p.moving = false;
                  p.isFollowingPlayer = true;
                  setTargetWorld(null);
                  setInsideCity(null);
                  setCurrentMap("world");
                  dirty = true;
                  continue;
                }
                p.worldX = oldX;
                p.worldZ = oldZ;
                p._targetWX = undefined;
                p._targetWZ = undefined;
                p.moving = false;
                setTargetWorld(null);
                dirty = true;
                continue;
              }

              // Lógica de entrada a ciudad desde el mundo
              if (id === "me" && !activeCity) {
                const enteredCity = cityForPlayer(p.worldX, p.worldZ, cityRegions, R);
                if (enteredCity) {
                  enterCity(enteredCity);
                  dirty = true;
                  continue;
                }
              }

              p.angle = directionToAngle(dx, dz);
              p.moving = true;
            }
          }

          // ── SUAVIZADO DE CÁMARA (Follow) ──
          if (p.isFollowingPlayer) {
            const cdx = p.worldX - p.cameraWX;
            const cdz = p.worldZ - p.cameraWZ;
            if (Math.abs(cdx) > 0.1 || Math.abs(cdz) > 0.1) {
              p.cameraWX += cdx * 0.08;
              p.cameraWZ += cdz * 0.08;
              dirty = true;
            } else if (p.cameraWX !== p.worldX || p.cameraWZ !== p.worldZ) {
              p.cameraWX = p.worldX;
              p.cameraWZ = p.worldZ;
              dirty = true;
            }
          }

          // ── SINCRONIZACIÓN DE RENDER (siempre ejecutar, incluso sin _targetWX) ──
          const r = worldToRender(p.worldX, p.worldZ);
          const rX = Math.floor(p.worldX / R);
          const rZ = Math.floor(p.worldZ / R);

          if (p.renderX !== r.renderX || p.renderZ !== r.renderZ || p.regionX !== rX || p.regionZ !== rZ) {
            p.renderX = r.renderX;
            p.renderZ = r.renderZ;
            p.regionX = rX;
            p.regionZ = rZ;
            dirty = true;
          }
          if (p.moving) dirty = true;
        }
        return dirty ? { ...next } : prev;
      });
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [setPlayers, insideCityRef, cityRegions, R, enterCity, setCurrentMap, setInsideCity, setTargetWorld]);
}
