// ================================================================
// Archivo: 08-camera-offset.js
// Cálculo del offset de cámara (CSS translate3d) del canvas
// ================================================================

// ----------------------------------------------------------------
// De: GameContainer.jsx — cálculo completo de worldOffsetX/Y y cityOffsetX/Y
// (se ejecuta dentro de un IIFE en el render)
// ----------------------------------------------------------------

      {/* MMO CAMERA OFFSET COMPUTATION */}
      {(() => {
        // ── getClampedOffset: función auxiliar inline ──
        const getClampedOffset = (rawX, rawY, currentZ, vp, cv) => {
          if (!vp || !cv) return { x: rawX, y: rawY };
          const vw = vp.offsetWidth;
          const vh = vp.offsetHeight;
          const cw = cv.offsetWidth * currentZ;
          const ch = cv.offsetHeight * currentZ;

          let x = rawX;
          let y = rawY;

          if (cw <= vw) {
            // Canvas más pequeño que el viewport → centrarlo
            x = (vw - cw) / 2;
          } else {
            // Canvas más grande → evitar que se salga por los bordes
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

        // ── World Map Offset ──
        let worldOffsetX = 0, worldOffsetY = 0;
        if (!isCity && me.worldX != null && me.worldZ != null) {
          const vp = world.viewportRef.current;        // viewport contenedor
          const cv = world.canvasRef.current;           // canvas con los tiles

          // Calcular posición estable del player en el canvas
          const rX = Math.floor(me.worldX / R) + 135;   // región absoluta X
          const rZ = Math.floor(me.worldZ / R) + 92;    // región absoluta Z
          const localX = me.worldX - (rX - 135) * R;    // offset local X dentro de la región
          const localZ = me.worldZ - (rZ - 92) * R;     // offset local Z dentro de la región
          const { canvasX: stableRX, canvasZ: stableRZ } = coordToCanvas(rX, rZ, localX, localZ, rX, rZ);

          // cRX/cRZ: punto del canvas que debe quedar centrado en pantalla
          const cRX = me.isFollowingPlayer
            ? stableRX   // siguiendo al player → su posición en el canvas
            : (TILE_RADIUS * UNITS_PER_REGION) + (me.cameraWX - (Math.floor(me.cameraWX / UNITS_PER_REGION) * UNITS_PER_REGION));
          const cRZ = me.isFollowingPlayer
            ? stableRZ
            : (TILE_RADIUS * UNITS_PER_REGION) - (me.cameraWZ - (Math.floor(me.cameraWZ / UNITS_PER_REGION) * UNITS_PER_REGION));

          if (isNaN(cRX) || isNaN(cRZ)) { worldOffsetX = 0; worldOffsetY = 0; }
          else {
            const vpW = vp ? vp.offsetWidth : window.innerWidth;
            const vpH = vp ? vp.offsetHeight : window.innerHeight;
            // rawX/Y: posición del translate3d para que cRX/cRZ quede en el centro
            const rawX = vpW / 2 - cRX * world.zoom;
            const rawY = (vpH / 2 - CAMERA_OFFSET_Y) - cRZ * world.zoom;
            if (vp && cv) {
              const clamped = getClampedOffset(rawX, rawY, world.zoom, vp, cv);
              worldOffsetX = clamped.x;
              worldOffsetY = clamped.y;
            } else {
              worldOffsetX = rawX;
              worldOffsetY = rawY;
            }
          }
        }

        // ── City Map Offset ──
        let cityOffsetX = 0, cityOffsetY = 0;
        if (isCity && cityEntry && city.viewportRef.current && city.canvasRef.current) {
          const vp = city.viewportRef.current;
          const targetWX = me.isFollowingPlayer ? me.worldX : me.cameraWX;
          const targetWZ = me.isFollowingPlayer ? me.worldZ : me.cameraWZ;
          const { x: cRX, y: cRY } = cityWorldToImage(cityEntry, targetWX, targetWZ, cityFitMode);
          const rawX = vp.offsetWidth / 2 - cRX * city.zoom;
          const rawY = (vp.offsetHeight / 2 - CAMERA_OFFSET_Y) - cRY * city.zoom;
          const clamped = getClampedOffset(rawX, rawY, city.zoom, vp, city.canvasRef.current);
          cityOffsetX = clamped.x;
          cityOffsetY = clamped.y;
        } else if (isCity && cityEntry) {
          const { x: cRX, y: cRY } = cityWorldToImage(cityEntry, me.cameraWX, me.cameraWZ, cityFitMode);
          cityOffsetX = (window.innerWidth  / 2) - cRX * city.zoom;
          cityOffsetY = (window.innerHeight / 2) - cRY * city.zoom;
        }

        // ── Luego se usa en el translate3d del canvas ──
        // (ver bloque siguiente)

// ----------------------------------------------------------------
// De: GameContainer.jsx — el canvas renderizado con translate3d
// ----------------------------------------------------------------
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

// El viewport contenedor:
              <div ref={world.viewportRef} className="gc-map-viewport"
                onMouseDown={e => world.startDrag(e.clientX, e.clientY)}
                onTouchStart={e => { const t=e.touches[0]; world.startDrag(t.clientX, t.clientY); }}
              >

// ----------------------------------------------------------------
// De: useMMOCamera.js — creación de viewportRef y canvasRef
// ----------------------------------------------------------------
export function useMMOCamera(initZoom = 1) {
  const viewportRef = useRef(null);
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(initZoom);
  const dragRef = useRef({ dragging: false, moved: false, lastX: 0, lastY: 0 });
  const onDragRef = useRef(null);
  // ...
  return {
    viewportRef,   // → attach a <div className="gc-map-viewport">
    canvasRef,     // → attach a <div className="gc-map-canvas">
    zoom,
    // ...
  };
}

// ----------------------------------------------------------------
// De: GameContainer.css — estilos del viewport y canvas
// ----------------------------------------------------------------
.gc-map-viewport {
  flex: 1;
  position: relative;
  overflow: hidden;        // ← clips el canvas
  background: #0a0a0a;
  touch-action: none;
  padding-bottom: 115px;
  min-height: 300px;
}

.gc-map-canvas {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;   // ← la escala/rotación parte desde top-left
  width: max-content;
  will-change: transform;
}

// ----------------------------------------------------------------
// De: useMapInteractions.js — el rect del click
// ----------------------------------------------------------------
  const handleMapClick = (e, zoomLevel) => {
    if (camera.dragRef.current.moved) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / zoomLevel;
    const py = (e.clientY - rect.top) / zoomLevel;

// e.currentTarget es el canvas (world.canvasRef.current = div.gc-map-canvas).
// No hay comentarios en el código que expliquen por qué se eligió ese elemento.
// Sin embargo, al ser el canvas el elemento con transform:scale(),
// getBoundingClientRect() devuelve las coordenadas VISUALES afectadas por el scale.
// Pero el click handler divide por zoomLevel para compensar, asumiendo que
// el rect devuelve el tamaño visual escalado.
//
// ⚠️ NOTA IMPORTANTE:
// getBoundingClientRect() sobre un elemento con CSS transform:scale()
// devuelve el rectángulo VISUAL escalado, NO el lógico.
// Si el canvas tiene scale(0.5), su getBoundingClientRect devolverá
// la mitad del ancho real. Luego se divide px por zoomLevel, que
// también es 0.5. Esto podría estar compensando doble o mal.
//
// Además, e.clientX - rect.left da el offset DENTRO del canvas escalado,
// no dentro del sistema de coordenadas lógico del canvas.
// La división por zoomLevel intenta compensar, pero si el rect
// ya está escalado, la compensación puede ser incorrecta.
