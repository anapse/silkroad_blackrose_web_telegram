/**
 * Fundamentos matemáticos para el motor de juego.
 */

/**
 * Verifica si un punto está dentro de un rectángulo.
 * @param {Object} point {x, y}
 * @param {Object} rect {x1, y1, x2, y2}
 */
export const pointInRect = (point, rect) => {
  return (
    point.x >= rect.x1 &&
    point.x <= rect.x2 &&
    point.y >= rect.y1 &&
    point.y <= rect.y2
  );
};

/**
 * Limita un valor entre un mínimo y un máximo.
 */
export const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

/**
 * Interpolación lineal.
 */
export const lerp = (start, end, t) => start * (1 - t) + end * t;

/**
 * Calcula la distancia euclidiana entre dos puntos.
 */
export const getDistance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
