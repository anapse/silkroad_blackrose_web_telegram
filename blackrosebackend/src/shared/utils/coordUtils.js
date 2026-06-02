/**
 * 📐 CoordUtils - Conversión estandarizada de coordenadas Silkroad
 * 
 * Todos los cálculos de posición pasan por AQUÍ. Si hay que cambiar algo,
 * se cambia SOLO en esta función, no en los handlers.
 * 
 * Órdenes de ejes según cada opcode:
 * - spawn (0x3015/0x3019): X(1º), Y altitud(2º), Z norte-sur(3º) ← MerchBot
 * - chardata (0x3013):      X(1º), Y altitud(2º), Z norte-sur(3º) ← MerchBot
 * - movement (0xB021):      X(1º), Z norte-sur(2º), Y altitud(3º)
 */

const UNITS_PER_REGION = 192;
const CENTER_X = 135;
const CENTER_Z = 92;
const RATIO = 10;

/**
 * Calcula coordenadas mundial desde valores raw del paquete.
 * @param {number} sectorX - Sector X
 * @param {number} sectorZ - Sector Z (norte-sur)
 * @param {number} raw1 - 1er valor (float o short) Siempre X
 * @param {number} raw2 - 2do valor (float o short)
 * @param {number} raw3 - 3er valor (float o short)
 * @param {'spawn'|'chardata'|'movement'} type - Tipo de paquete
 * @returns {{ region, regionX, regionZ, posX, posZ, posY, worldX, worldZ }}
 */
export function calcWorldCoords(sectorX, sectorZ, raw1, raw2, raw3, type = 'spawn') {
    const region = sectorX | (sectorZ << 8);
    const regionX = sectorX;
    const regionZ = sectorZ;

    let offsetX, offsetZ, offsetY;

    if (type === 'movement') {
        // 0xB021: X(1º), Z norte-sur(2º), Y altitud(3º)
        offsetX = raw1;
        offsetZ = raw2;  // 2do = norte-sur
        offsetY = raw3;  // 3ro = altitud
    } else {
        // spawn y chardata: X(1º), Y altitud(2º), Z norte-sur(3º) ← MerchBot
        offsetX = raw1;  // 1ro = X
        offsetY = raw2;  // 2do = altitud
        offsetZ = raw3;  // 3ro = norte-sur
    }

    const posX = Math.round(offsetX / RATIO);
    const posZ = Math.round(offsetZ / RATIO);
    const posY = Math.round(offsetY / RATIO);
    const worldX = (sectorX - CENTER_X) * UNITS_PER_REGION + posX;
    const worldZ = (sectorZ - CENTER_Z) * UNITS_PER_REGION + posZ;

    return { region, regionX, regionZ, posX, posZ, posY, worldX, worldZ };
}

/**
 * Calcula worldX/worldZ desde regionId + offsets raw.
 */
export function regionToWorld(regionId, rawX, rawZ, rawY, type = 'spawn') {
    const sectorX = regionId & 0xFF;
    const sectorZ = (regionId >> 8) & 0xFF;
    return calcWorldCoords(sectorX, sectorZ, rawX, rawZ, rawY, type);
}
