/**
 * Operaciones vectoriales para el movimiento del juego.
 */

/**
 * Calcula el ángulo en grados basado en un vector de dirección (dx, dz).
 * Silkroad: 0° = Norte, 90° = Este, 180° = Sur, 270° = Oeste
 * El triángulo ▶ apunta a la derecha (Este = 90°) sin rotar.
 * atan2(dx, dz) da 0 cuando dz<0 (norte), 180 cuando dz>0 (sur)
 */
export const directionToAngle = (dx, dz) => {
  // Ángulo en grados: 0° = Norte (dz negativo), 90° = Este (dx positivo)
  let angle = Math.atan2(dx, -dz) * (180 / Math.PI);
  // Normalizar a 0-360
  if (angle < 0) angle += 360;
  return angle;
};

/**
 * Normaliza un vector para que su magnitud sea 1.
 */
export const normalizeVector = (dx, dz) => {
  const length = Math.hypot(dx, dz);
  if (length === 0) return { x: 0, z: 0 };
  return { x: dx / length, z: dz / length };
};
