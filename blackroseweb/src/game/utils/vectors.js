/**
 * Operaciones vectoriales para el movimiento del juego.
 */

/**
 * Calcula el ángulo en grados basado en un vector de dirección (dx, dz).
 * Silkroad usa un sistema donde el ángulo se mide desde el eje X.
 */
export const directionToAngle = (dx, dz) => {
  return Math.atan2(-dz, dx) * (180 / Math.PI);
};

/**
 * Normaliza un vector para que su magnitud sea 1.
 */
export const normalizeVector = (dx, dz) => {
  const length = Math.hypot(dx, dz);
  if (length === 0) return { x: 0, z: 0 };
  return { x: dx / length, z: dz / length };
};
