// ================================================================
// Archivo: 01-spawn-player.js
// Bloques extraídos: cómo el frontend recibe el spawn del player
// ================================================================

// ----------------------------------------------------------------
// De: GameSocketContext.jsx — maneja PLAYER_SPAWNED / IN_GAME
// ----------------------------------------------------------------
          if (msg.detail?.type === "PLAYER_SPAWNED" || msg.status === "IN_GAME") {
            const d = msg.detail || {};
            setPlayerState((prev) => {
              // Nunca pisar posición válida con undefined
              const newRegion = (d.region != null && d.region > 0) ? d.region : prev.region;
              const newPosX = (d.posX != null) ? d.posX : prev.posX;
              const newPosY = (d.posY != null) ? d.posY : prev.posY;
              const newPosZ = (d.posZ != null) ? d.posZ : prev.posZ;

              return {
                ...prev,
                hp: d.hp ?? prev.hp,
                maxHp: d.maxHp ?? d.hp ?? prev.maxHp,
                mp: d.mp ?? prev.mp,
                maxMp: d.maxMp ?? d.mp ?? prev.maxMp,
                level: d.level ?? prev.level,
                sp: d.sp ?? prev.sp,
                exp: d.exp ?? prev.exp,
                region: newRegion,
                posX: newPosX,
                posY: newPosY,
                posZ: newPosZ,
              };
            });
          }

// ----------------------------------------------------------------
// De: GameSocketContext.jsx — maneja PLAYER_POSITION_INIT
// ----------------------------------------------------------------
          if (msg.detail?.type === "PLAYER_POSITION_INIT") {
            const d = msg.detail;
            // console.log('[PLAYER_POSITION_INIT]', JSON.stringify({ region: d.region, posX: d.posX, posY: d.posY, posZ: d.posZ }));
            // Solo actualizar si la región es válida (no 0)
            // Si region=0, el scanner no encontró posición y el frontend
            // debe mantener su fallback por raza (usePlayerInit.js)
            if (d.region && d.region > 0) {
              setPlayerState((prev) => {
                const next = { ...prev, hp: prev.hp || 0, region: d.region, posX: d.posX, posY: d.posY, posZ: d.posZ };
                return next;
              });
            }
          }

// ----------------------------------------------------------------
// De: GameSocketContext.jsx — maneja PLAYER_UPDATE
// ----------------------------------------------------------------
          if (msg.detail?.type === "PLAYER_UPDATE") {
            const d = msg.detail;
            setPlayerState((prev) => {
              // Nunca pisar posición válida con undefined
              const newRegion = (d.region != null && d.region > 0) ? d.region : prev.region;
              const newPosX = (d.posX != null) ? d.posX : prev.posX;
              const newPosY = (d.posY != null) ? d.posY : prev.posY;
              const newPosZ = (d.posZ != null) ? d.posZ : prev.posZ;

              return {
                ...prev,
                hp: d.hp ?? prev.hp,
                maxHp: d.maxHp ?? d.hp ?? prev.maxHp,
                mp: d.mp ?? prev.mp,
                maxMp: d.maxMp ?? d.mp ?? prev.maxMp,
                level: d.level ?? prev.level,
                sp: d.sp ?? prev.sp,
                exp: d.exp ?? prev.exp,
                region: newRegion,
                posX: newPosX,
                posY: newPosY,
                posZ: newPosZ,
              };
            });
          }

// ----------------------------------------------------------------
// De: usePlayerInit.js — bloque donde se calculan worldX, worldZ,
//     renderX, renderZ del player
// ----------------------------------------------------------------
    const regionId = Number(wsPlayer.region);
    const posX = Number(wsPlayer.posX);
    const posZ = Number(wsPlayer.posZ ?? 0);
    const { regionX, regionZ, worldX, worldZ } = regionXYToWorld(
      regionId & 0xFF, (regionId >> 8) & 0xFF, posX, posZ
    );
    const posY = wsPlayer?.posY ?? null;

    // Detectar si el servidor detuvo al jugador (PLAYER_STOPPED)
    const stopped = wsPlayer._stopped;

    // LOG reducido (solo en cambios de región)
    const isFromB021 = wsPlayer._fromB021;

    // Inicializar cámara solo la primera vez
    if (!hasPositionRef.current) {
      hasPositionRef.current = true;
      cameraRef.current = { wx: worldX, wz: worldZ };
    }

    setPlayers((prev) => {
      const prevMe = prev?.me;
      
      // Preservar cameraWX/cameraWZ y estado de movimiento
      const me = {
        id: "me",
        charName: character?.name || user?.username,
        worldX, worldZ,
        // NO actualizar cameraWX/WZ aquí — la cámara sigue suavemente en useGameLoop
        cameraWX: prevMe?.cameraWX ?? cameraRef.current.wx ?? worldX,
        cameraWZ: prevMe?.cameraWZ ?? cameraRef.current.wz ?? worldZ,
        isFollowingPlayer: true,
        // renderX/Z usando la función ESTÁNDAR centralizada en geo.js
        renderX: playerToCanvas(regionX, regionZ, posX, posZ).canvasX,
        renderZ: playerToCanvas(regionX, regionZ, posX, posZ).canvasZ,
        hp: wsPlayer?.hp ?? prevMe?.hp ?? 0,
        maxHp: wsPlayer?.maxHp ?? prevMe?.maxHp ?? 0,
        mp: wsPlayer?.mp ?? prevMe?.mp ?? 0,
        maxMp: wsPlayer?.maxMp ?? prevMe?.maxMp ?? 0,
        level: wsPlayer?.level ?? prevMe?.level ?? character?.level ?? 1,
        race,
        regionX, regionZ,
        posX, posZ, posY,
        angle: prevMe?.angle ?? 0,
        moving: prevMe?.moving ?? false,
        speed: WALK_SPEED_WU,
      };
      
      // Si el servidor detuvo al jugador, marcar _stopped para que useGameLoop cancele flags
      if (stopped) {
        me._stopped = stopped;
        me.moving = false;
        // NO actualizar cameraWX/WZ aquí — la cámara sigue suavemente
      }
      
      return { me };
    });
