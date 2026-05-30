// Este archivo re-exporta todas las regiones desde los archivos individuales
// Mantiene compatibilidad con los imports existentes que usaban REGIONS.js original

import { REGIONS_CHINA } from './china.js';
import { REGIONS_EUROPE } from './europe.js';
import { REGIONS_ARABIA } from './arabia.js';
import { REGIONS_DUNGEONS } from './dungeons.js';
import { REGIONS_ARENA } from './arena.js';
import { REGIONS_OTHER } from './other.js';

// Array combinado de todas las regiones (mismo nombre que el export original)
export const REGIONS = [
    ...REGIONS_CHINA,
    ...REGIONS_EUROPE,
    ...REGIONS_ARABIA,
    ...REGIONS_DUNGEONS,
    ...REGIONS_ARENA,
    ...REGIONS_OTHER,
];

// Función helper (mismo nombre que el export original)
// NOTA: En el original usaba r.area, pero los datos tienen propiedad "name"
export function getRegionByName(name) {
    return REGIONS.filter((r) => r.name === name);
}
