import { useState, useEffect, useRef } from "react";

/**
 * Hook para gestionar la cámara estilo MMO (Zoom + Drag).
 * Sin valores hardcodeados de posición.
 * @param {number} initZoom - Zoom inicial.
 */
export function useMMOCamera(initZoom = 1) {
  const viewportRef = useRef(null);
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(initZoom);
  const dragRef = useRef({ dragging: false, moved: false, lastX: 0, lastY: 0 });
  const onDragRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current.dragging) return;
      if (e.cancelable) e.preventDefault();
      const cx = e.touches?.[0]?.clientX ?? e.clientX;
      const cy = e.touches?.[0]?.clientY ?? e.clientY;
      const dx = cx - dragRef.current.lastX;
      const dy = cy - dragRef.current.lastY;

      if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
        dragRef.current.moved = true;
        if (onDragRef.current) onDragRef.current(dx, dy);
        dragRef.current.lastX = cx;
        dragRef.current.lastY = cy;
      }
    };

    const stop = () => {
      dragRef.current.dragging = false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", stop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", stop);
    };
  }, []);

  const startDrag = (cx, cy) => {
    dragRef.current = { dragging: true, moved: false, lastX: cx, lastY: cy };
  };

  const zoomIn = () => setZoom((z) => Math.min(50.0, +(z * 1.3).toFixed(2)));
  const zoomOut = () => setZoom((z) => +(z / 1.3).toFixed(2));
  const reset = (z) => setZoom(z);

  return {
    viewportRef,
    canvasRef,
    zoom,
    zoomIn,
    zoomOut,
    reset,
    startDrag,
    dragRef,
    onDragRef,
  };
}
