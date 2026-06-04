// ================================================================
// Archivo: 02-move-player.js
// Bloques extraídos: cómo el frontend recibe y procesa
// el movimiento del player
// ================================================================

// ----------------------------------------------------------------
// De: GameSocketContext.jsx — maneja PLAYER_MOVE_CONFIRMED
// ----------------------------------------------------------------
          if (msg.detail?.type === "PLAYER_MOVE_CONFIRMED") {
            // El servidor confirmó el movimiento (0xB021).
            // Actualizar posición directamente — la suavidad visual la dan
            // las transiciones CSS del canvas offset y el dot del player.
            const d = msg.detail;
            if (d.dstRegion != null && d.dstRegion > 0 && d.dstX != null && d.dstZ != null) {
              setPlayerState((prev) => {
                const updates = { region: d.dstRegion, posX: d.dstX, posZ: d.dstZ };
                if (d.dstY != null && d.dstY > 0) updates.posY = d.dstY;
                return { ...prev, ...updates };
              });
            }
          }

// ----------------------------------------------------------------
// De: useGameLoop.js — bloque que procesa al player (id === "me").
//     Render, recálculo de regionX/regionZ/worldX/worldZ.
// ----------------------------------------------------------------
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
