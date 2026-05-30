/**
 * Lógica matemática para cálculos de cámara (frustum, offsets, zoom).
 */

/**
 * Calcula el offset de la cámara basado en el movimiento del mouse/touch.
 */
export const calculateCameraOffset = (dx, dy, zoom) => {
  return {
    dxCanvas: -dx / zoom,
    dyCanvas: -dy / zoom
  };
};
