/**
 * INVENTORY PARSER
 * 
 * Parsea paquetes de inventario siguiendo el patrón de xBot (JellyBitz/xBot-WinForms).
 * 
 * Opcodes manejados:
 * - 0x34A6: CharacterDataEnd — inventario completo + avatar
 * - 0xB034: SERVER_INVENTORY_ITEM_MOVEMENT — movimiento de items
 * - 0x3040: SERVER_INVENTORY_ITEM_UPDATE — actualización de items
 * - 0x3052: SERVER_INVENTORY_ITEM_DURABILITY_UPDATE
 * - 0x3092: SERVER_INVENTORY_CAPACITY_UPDATE
 * - 0x3047: SERVER_STORAGE_DATA_BEGIN — bodega begin
 * - 0x3049: SERVER_STORAGE_DATA — bodega data
 * - 0x304A: SERVER_STORAGE_DATA_END — bodega end
 */

import Logger from '../gamegateway/utils/Logger.js';
import { getTypeID2, getTypeID4, loadItemTypeDB } from './ItemTypeDB.js';

// Cargar la DB de tipos al importar el módulo (una sola vez)
loadItemTypeDB();

/**
 * Tipos de movimiento de inventario (SRTypes.InventoryItemMovement)
 */
export const InventoryMovementType = {
    InventoryToInventory: 0,
    StorageToStorage: 1,
    InventoryToStorage: 2,
    StorageToInventory: 3,
    InventoryToExchange: 4,
    ExchangeToInventory: 5,
    GroundToInventory: 6,
    InventoryToGround: 7,
    ShopToInventory: 8,
    InventoryToShop: 9,
    InventoryGoldToGround: 10,
    StorageGoldToInventory: 11,
    InventoryGoldToStorage: 12,
    InventoryGoldToExchange: 13,
    QuestToInventory: 14,
    InventoryToQuest: 15,
    TransportToTransport: 16,
    GroundToPet: 17,
    ShopToTransport: 19,
    TransportToShop: 20,
    PetToPet: 25,
    PetToInventory: 26,
    InventoryToPet: 27,
    GroundToPetToInventory: 28,
    GuildToGuild: 29,
    InventoryToGuild: 30,
    GuildToInventory: 31,
    InventoryGoldToGuild: 32,
    GuildGoldToInventory: 33,
    ShopBuyBack: 34,
    AvatarToInventory: 35,
    InventoryToAvatar: 36,
};

/**
 * Tipos de rentable (SRRentable.Type)
 */
const RentableType = {
    None: 0,
    LimitedTime: 1,
    LimitedDistance: 2,
    Package: 3,
};

/**
 * Parsea la información de rentable de un item.
 * @param {Buffer} data - Buffer de datos
 * @param {number} offset - Posición actual
 * @returns {{ rentable: object, offset: number }}
 */
function parseRentable(data, offset) {
    const rentableId = data.readUInt32LE(offset); offset += 4;
    const rentable = { id: rentableId, type: rentableId };

    if (rentableId === RentableType.None) {
        return { rentable, offset };
    }

    if (rentableId === RentableType.LimitedTime) {
        rentable.canDelete = data.readUInt16LE(offset); offset += 2;
        rentable.periodBeginTime = data.readUInt32LE(offset); offset += 4;
        rentable.periodEndTime = data.readUInt32LE(offset); offset += 4;
    } else if (rentableId === RentableType.LimitedDistance) {
        rentable.canDelete = data.readUInt16LE(offset); offset += 2;
        rentable.canRecharge = data.readUInt16LE(offset); offset += 2;
        rentable.meterRateTime = data.readUInt32LE(offset); offset += 4;
    } else if (rentableId === RentableType.Package) {
        rentable.canDelete = data.readUInt16LE(offset); offset += 2;
        rentable.canRecharge = data.readUInt16LE(offset); offset += 2;
        rentable.periodBeginTime = data.readUInt32LE(offset); offset += 4;
        rentable.periodEndTime = data.readUInt32LE(offset); offset += 4;
        rentable.packingTime = data.readUInt32LE(offset); offset += 4;
    }

    return { rentable, offset };
}

/**
 * Lee un string ASCII del buffer: [len:2][chars:N]
 */
function readAscii(data, offset) {
    if (offset + 2 > data.length) return { str: '', offset };
    const len = data.readUInt16LE(offset); offset += 2;
    if (offset + len > data.length) return { str: '', offset };
    const str = data.toString('ascii', offset, offset + len); offset += len;
    return { str, offset };
}

/**
 * Parsea un item completo siguiendo la estructura de xBot (ItemParsing).
 * 
 * Estructura:
 *   1. Rentable info (uint32 + campos condicionales)
 *   2. Item ID (uint32 — RefObjID)
 *   3. Si es equipable: plus, variance, durability, magicOptions, sockets, advancedElixirs
 *   4. Si es CoS: state, modelID, modelName, etc
 *   5. Si es Etc: quantity, alchemy params, etc
 * 
 * @param {Buffer} data - Buffer con datos del item
 * @param {number} offset - Posición inicial
 * @returns {{ item: object|null, offset: number }}
 */
export function parseItem(data, offset) {
    try {
        if (offset >= data.length) return { item: null, offset };

        // ═══════════════════════════════════════════════════════════════
        // ESTRUCTURA REAL del item en CharacterData (0x3013/0x34A6) — VSRO
        // Confirmado por vsro.org, xBot, RSBot:
        //
        //   [4] rentType (uint32 LE) — SIEMPRE presente (0 = no rentable)
        //   [4] refObjID (uint32 LE) — ID en _RefObjCommon
        //
        // Luego depende de TypeID3 del item:
        //
        //   EQUIPABLE (TypeID3 = 1 o 6):
        //     [1] optLevel / plus (uint8)
        //     [8] variance (uint64 LE)
        //     [4] durability (uint32 LE)
        //     [1] magicOptionCount → for each: [4]id + [4]val
        //     [1] socketCount → for each: [1]slot + [4]id + [4]val
        //     [1] hasElixirFlag → if 1: [1]count → for each: [4]id + [4]val
        //     [1] unk
        //
        //   ETC (TypeID3 = 3):
        //     [2] quantity (uint16 LE)
        //
        //   CoS/Pet (TypeID3 = 2 o 4):
        //     [1] state (uint8)
        //     [4] refObjIdExtra (uint32 LE)
        //     [2] nameLen (uint16 LE)
        //     [N] name (UTF16LE, nameLen*2 bytes)
        //     [1] unk
        // ═══════════════════════════════════════════════════════════════

        if (offset + 8 > data.length) return { item: null, offset };

        // 1. rentType — SIEMPRE 4 bytes
        const rentType = data.readUInt32LE(offset); offset += 4;

        // 2. refObjID — 4 bytes
        const itemId = data.readUInt32LE(offset); offset += 4;

        const item = {
            id: itemId,
            rentType,
            slot: 0,
            plus: 0,
            variance: 0,
            durability: 0,
            magicOptions: [],
            sockets: [],
            advancedElixirs: [],
            quantity: 1,
            modelID: 0,
            modelName: '',
            stateType: 0,
            isEquipable: false,
            isCos: false,
            isEtc: false,
        };

        // 3. Clasificar por TypeID3 (NO TypeID2)
        const typeInfo = getTypeID2(itemId); // usa el Map de ItemTypeDB
        // getTypeID2 retorna el TypeID2, pero necesitamos TypeID3
        // Buscar en itemTypeMap directamente
        const typeId3 = getTypeId3(itemId);

        if (typeId3 === 1 || typeId3 === 6) {
            // ⚔️ EQUIPABLE
            item.isEquipable = true;
            if (offset + 1 > data.length) return { item, offset };
            item.plus = data.readUInt8(offset); offset += 1;
            if (offset + 8 > data.length) return { item, offset };
            item.variance = Number(data.readBigUInt64LE(offset)); offset += 8;
            if (offset + 4 > data.length) return { item, offset };
            item.durability = data.readUInt32LE(offset); offset += 4;
            // Magic options
            if (offset + 1 > data.length) return { item, offset };
            const magCount = data.readUInt8(offset); offset += 1;
            for (let m = 0; m < magCount && offset + 8 <= data.length; m++) {
                const magId = data.readUInt32LE(offset); offset += 4;
                const magValue = data.readUInt32LE(offset); offset += 4;
                item.magicOptions.push({ id: magId, value: magValue });
            }
            // Sockets — xBot: p.ReadByte() (type=1), then count
            if (offset + 1 > data.length) return { item, offset };
            const sockType = data.readUInt8(offset); offset += 1; // 0x01 = socket section
            if (offset + 1 > data.length) return { item, offset };
            const sockCount = data.readUInt8(offset); offset += 1;
            for (let s = 0; s < sockCount && offset + 9 <= data.length; s++) {
                const sockSlot = data.readUInt8(offset); offset += 1;
                const sockId = data.readUInt32LE(offset); offset += 4;
                const sockValue = data.readUInt32LE(offset); offset += 4;
                item.sockets.push({ slot: sockSlot, id: sockId, value: sockValue });
            }
            // Advanced Elixirs — xBot: p.ReadByte() (type=2), then count
            if (offset + 1 > data.length) return { item, offset };
            const elixType = data.readUInt8(offset); offset += 1; // 0x02 = elixir section
            if (offset + 1 > data.length) return { item, offset };
            const elixCount = data.readUInt8(offset); offset += 1;
            for (let e = 0; e < elixCount && offset + 8 <= data.length; e++) {
                const elixId = data.readUInt32LE(offset); offset += 4;
                const elixValue = data.readUInt32LE(offset); offset += 4;
                item.advancedElixirs.push({ id: elixId, value: elixValue });
            }

        } else if (typeId3 === 3) {
            // 📦 ETC / consumible / stackable
            item.isEtc = true;
            if (offset + 2 > data.length) return { item, offset };
            item.quantity = data.readUInt16LE(offset); offset += 2;

        } else if (typeId3 === 2 || typeId3 === 4) {
            // 🐾 CoS / Pet — estructura VSRO: stateType(1) + modelID(4) + nameLen(2)
            //   + [PeriodEndTime(4) si TypeID4==2] + unkByte(1) + extra(14)
            //   = 22 bytes post-header (TypeID4≠2) o 26 bytes (TypeID4==2)
            item.isCos = true;
            if (offset + 1 > data.length) return { item, offset };
            item.stateType = data.readUInt8(offset); offset += 1;
            // Leer modelID para diagnóstico
            if (offset + 4 <= data.length) {
                item.modelID = data.readUInt32LE(offset);
            }
            // Determinar skip: TypeID4==2 tiene 4 bytes extra (PeriodEndTime)
            const id4 = getTypeID4(itemId);
            const cosBase = 4 + 2; // modelID + nameLen
            const cosPeriodEnd = (id4 === 2) ? 4 : 0;
            const cosUnk = 1;
            const cosExtra = 14; // datos aún no mapeados
            const cosSkip = cosBase + cosPeriodEnd + cosUnk + cosExtra;
            offset += Math.min(cosSkip, data.length - offset);

        } else {
            // Tipo desconocido — asumir ETC (2 bytes de quantity, lo más seguro)
            Logger.info(`[InventoryParser] Unknown typeId3=${typeId3} for item 0x${itemId.toString(16)}, assuming ETC`, 'InventoryParser');
            item.isEtc = true;
            if (offset + 2 <= data.length) {
                item.quantity = data.readUInt16LE(offset); offset += 2;
            }
        }

        return { item, offset };
    } catch (e) {
        Logger.error(`[InventoryParser] parseItem error at offset ${offset}: ${e.message}`, 'InventoryParser');
        return { item: null, offset };
    }
}

/**
 * Devuelve TypeID3 para un item dado su ID.
 * @param {number} id - ItemRefID
 * @returns {number} TypeID3 o 0 si no encontrado
 */
export function getTypeId3(id) {
    // Usar getTypeID2 importado (ya disponible en el scope del módulo)
    // getTypeID2: 1=equip, 2=cos, 3=etc
    if (typeof getTypeID2 !== 'function') {
        // Fallback si getTypeID2 no está en scope
        try {
            const { getTypeID2: gti2 } = require('./ItemTypeDB.js');
            if (typeof gti2 === 'function') {
                const typeId2 = gti2(id);
                if (typeId2 === 1) return 1;
                if (typeId2 === 2) return 2;
                if (typeId2 === 3) return 3;
            }
        } catch (e) {
            return 0;
        }
    }
    const typeId2 = getTypeID2(id);
    if (typeId2 === 1) return 1;
    if (typeId2 === 2) return 2;
    if (typeId2 === 3) return 3;
    return 0;
}

/**
 * Parsea el inventario completo desde CharacterDataEnd (0x34A6).
 * 
 * Estructura (xBot):
 *   ...stats del personaje...
 *   [2 bytes] PKTotal
 *   [4 bytes] PKPenalty
 *   [1 byte]  BerserkLevel
 *   [1 byte]  PVPCapeType
 *   --- Inventory ---
 *   [1 byte]  maxSlots
 *   [1 byte]  itemCount
 *   for each item:
 *     [1 byte] slot
 *     → parseItem(data, offset)
 *   --- InventoryAvatar ---
 *   [1 byte]  maxSlots
 *   [1 byte]  itemCount
 *   for each item:
 *     [1 byte] slot
 *     → parseItem(data, offset)
 * 
 * @param {Buffer} data - Buffer completo de CharacterDataEnd
 * @param {number} startOffset - Offset donde comienza el inventario
 * @returns {{ inventory: Array, inventoryAvatar: Array, maxSlots: number, offset: number }}
 */
export function parseInventory(data, startOffset) {
    let offset = startOffset;
    const inventory = [];

    if (offset + 2 > data.length) return { inventory, inventoryAvatar: [], maxSlots: 0, offset };

    const maxSlots = data.readUInt8(offset); offset += 1;
    const itemCount = data.readUInt8(offset); offset += 1;

    Logger.info(`[InventoryParser] Inventory: maxSlots=${maxSlots} items=${itemCount}`, 'InventoryParser');

    for (let i = 0; i < itemCount && offset < data.length; i++) {
        const slot = data.readUInt8(offset); offset += 1;
        const { item, offset: newOffset } = parseItem(data, offset);
        if (item) {
            item.slot = slot;
            inventory.push(item);
        }
        offset = newOffset;
    }

    // Avatar inventory
    const inventoryAvatar = [];
    if (offset + 2 <= data.length) {
        const avatarMaxSlots = data.readUInt8(offset); offset += 1;
        const avatarItemCount = data.readUInt8(offset); offset += 1;

        Logger.info(`[InventoryParser] AvatarInventory: maxSlots=${avatarMaxSlots} items=${avatarItemCount}`, 'InventoryParser');

        for (let i = 0; i < avatarItemCount && offset < data.length; i++) {
            const slot = data.readUInt8(offset); offset += 1;
            const { item, offset: newOffset } = parseItem(data, offset);
            if (item) {
                item.slot = slot;
                inventoryAvatar.push(item);
            }
            offset = newOffset;
        }
    }

    return { inventory, inventoryAvatar, maxSlots, offset };
}

/**
 * Parsea un movimiento de item (0xB034).
 * 
 * Estructura (xBot):
 *   [1 byte] result (1 = éxito)
 *   [1 byte] movementType
 *   ...datos según tipo...
 * 
 * @param {Buffer} payload - Payload del paquete (sin header)
 * @returns {{ result: number, type: number, data: object }|null}
 */
export function parseInventoryMovement(payload) {
    try {
        if (payload.length < 2) return null;

        const result = payload.readUInt8(0);
        if (result !== 1) {
            return { result, type: -1, data: {} };
        }

        const type = payload.readUInt8(1);
        const data = {};

        switch (type) {
            case InventoryMovementType.InventoryToInventory: {
                // [1]slotSrc [1]slotDst [2]quantity
                data.slotSrc = payload.readUInt8(2);
                data.slotDst = payload.readUInt8(3);
                data.quantity = payload.readUInt16LE(4);
                break;
            }
            case InventoryMovementType.GroundToInventory: {
                // [1]slotInventory → si es 0xFE es oro
                data.slotInventory = payload.readUInt8(2);
                if (data.slotInventory === 0xFE) {
                    data.gold = payload.readUInt32LE(3);
                } else {
                    const { item } = parseItem(payload, 3);
                    data.item = item;
                }
                break;
            }
            case InventoryMovementType.InventoryToGround: {
                data.slotInventory = payload.readUInt8(2);
                break;
            }
            case InventoryMovementType.ShopToInventory: {
                // [1]tabNumber [1]tabSlot [1]packageCount
                data.tabNumber = payload.readUInt8(2);
                data.tabSlot = payload.readUInt8(3);
                data.packageCount = payload.readUInt8(4);
                if (data.packageCount === 1) {
                    data.slotInventory = payload.readUInt8(5);
                    data.quantity = payload.readUInt16LE(6);
                    data.unkUInt = payload.readUInt32LE(8);
                }
                break;
            }
            case InventoryMovementType.InventoryToShop: {
                // [1]slotInventory [1]slotBuyBack [2]quantitySold
                data.slotInventory = payload.readUInt8(2);
                data.slotBuyBack = payload.readUInt8(3);
                data.quantitySold = payload.readUInt16LE(4);
                break;
            }
            case InventoryMovementType.InventoryToStorage: {
                data.slotInventory = payload.readUInt8(2);
                data.slotStorage = payload.readUInt8(3);
                break;
            }
            case InventoryMovementType.StorageToInventory: {
                data.slotStorage = payload.readUInt8(2);
                data.slotInventory = payload.readUInt8(3);
                break;
            }
            case InventoryMovementType.InventoryToExchange: {
                data.slotInventory = payload.readUInt8(2);
                break;
            }
            case InventoryMovementType.ExchangeToInventory: {
                data.slotExchange = payload.readUInt8(2);
                break;
            }
            case InventoryMovementType.AvatarToInventory:
            case InventoryMovementType.InventoryToAvatar: {
                data.slotSrc = payload.readUInt8(2);
                data.slotDst = payload.readUInt8(3);
                break;
            }
            case InventoryMovementType.GroundToPetToInventory: {
                data.uniqueID = payload.readUInt32LE(2);
                data.slotInventory = payload.readUInt8(6);
                if (data.slotInventory !== 254) {
                    const { item } = parseItem(payload, 7);
                    data.item = item;
                }
                break;
            }
            case InventoryMovementType.InventoryGoldToGround:
            case InventoryMovementType.StorageGoldToInventory:
            case InventoryMovementType.InventoryGoldToStorage:
            case InventoryMovementType.InventoryGoldToExchange:
            case InventoryMovementType.GuildGoldToInventory:
            case InventoryMovementType.InventoryGoldToGuild: {
                data.gold = Number(payload.readBigUInt64LE(2));
                break;
            }
            case InventoryMovementType.QuestToInventory: {
                data.slotInventory = payload.readUInt8(2);
                data.unkByte = payload.readUInt8(3);
                const { item } = parseItem(payload, 4);
                data.item = item;
                break;
            }
            case InventoryMovementType.InventoryToQuest: {
                data.slotInventory = payload.readUInt8(2);
                break;
            }
            case InventoryMovementType.GuildToGuild: {
                data.slotSrc = payload.readUInt8(2);
                data.slotDst = payload.readUInt8(3);
                data.quantity = payload.readUInt16LE(4);
                break;
            }
            case InventoryMovementType.InventoryToGuild: {
                data.slotInventory = payload.readUInt8(2);
                data.slotStorage = payload.readUInt8(3);
                break;
            }
            case InventoryMovementType.GuildToInventory: {
                data.slotStorage = payload.readUInt8(2);
                data.slotInventory = payload.readUInt8(3);
                break;
            }
            case InventoryMovementType.ShopBuyBack: {
                data.slotInventory = payload.readUInt8(2);
                data.slotBuyBack = payload.readUInt8(3);
                data.quantitySold = payload.readUInt16LE(4);
                break;
            }
            default: {
                // Para tipos no implementados, devolver raw
                data.raw = payload.slice(2).toString('hex');
                break;
            }
        }

        return { result, type, data };
    } catch (e) {
        Logger.error(`[InventoryParser] parseInventoryMovement error: ${e.message}`, 'InventoryParser');
        return null;
    }
}

/**
 * Parsea una actualización de item (0x3040).
 * 
 * Estructura (xBot):
 *   [1 byte] slot
 *   [1 byte] updateType
 *   case 8:    → [2 bytes] quantity
 *   case 0x40: → [1 byte] petState
 * 
 * @param {Buffer} payload - Payload del paquete
 * @returns {{ slot: number, updateType: number, quantity?: number, petState?: number }|null}
 */
export function parseInventoryUpdate(payload) {
    try {
        if (payload.length < 2) return null;

        const slot = payload.readUInt8(0);
        const updateType = payload.readUInt8(1);
        const result = { slot, updateType };

        switch (updateType) {
            case 8: // Quantity update
                if (payload.length >= 4) {
                    result.quantity = payload.readUInt16LE(2);
                }
                break;
            case 0x40: // Pet state update
                if (payload.length >= 3) {
                    result.petState = payload.readUInt8(2);
                }
                break;
        }

        return result;
    } catch (e) {
        Logger.error(`[InventoryParser] parseInventoryUpdate error: ${e.message}`, 'InventoryParser');
        return null;
    }
}

/**
 * Parsea una actualización de durabilidad (0x3052).
 * 
 * Estructura (xBot):
 *   [1 byte] slot
 *   [4 bytes] durability
 * 
 * @param {Buffer} payload - Payload del paquete
 * @returns {{ slot: number, durability: number }|null}
 */
export function parseDurabilityUpdate(payload) {
    try {
        if (payload.length < 5) return null;
        return {
            slot: payload.readUInt8(0),
            durability: payload.readUInt32LE(1),
        };
    } catch (e) {
        Logger.error(`[InventoryParser] parseDurabilityUpdate error: ${e.message}`, 'InventoryParser');
        return null;
    }
}

/**
 * Parsea actualización de capacidad de inventario (0x3092).
 * 
 * @param {Buffer} payload
 * @returns {{ maxSlots: number }|null}
 */
export function parseCapacityUpdate(payload) {
    try {
        if (payload.length < 1) return null;
        return { maxSlots: payload.readUInt8(0) };
    } catch (e) {
        Logger.error(`[InventoryParser] parseCapacityUpdate error: ${e.message}`, 'InventoryParser');
        return null;
    }
}

/**
 * Almacenamiento para reensamblaje de paquetes de storage (bodega).
 */
export class StorageAccumulator {
    constructor() {
        this.buffer = null;
        this.gold = 0;
    }

    begin(payload) {
        this.buffer = Buffer.alloc(0);
        this.gold = payload.length >= 8 ? Number(payload.readBigUInt64LE(0)) : 0;
        Logger.info(`[StorageAccumulator] Begin — gold=${this.gold}`, 'StorageAccumulator');
    }

    add(payload) {
        if (this.buffer) {
            this.buffer = Buffer.concat([this.buffer, payload]);
        }
    }

    end() {
        if (!this.buffer) return null;

        const p = this.buffer;
        let offset = 0;

        if (offset + 2 > p.length) return null;
        const maxSlots = p.readUInt8(offset); offset += 1;
        const itemCount = p.readUInt8(offset); offset += 1;

        Logger.info(`[StorageAccumulator] End — maxSlots=${maxSlots} items=${itemCount}`, 'StorageAccumulator');

        const items = [];
        for (let i = 0; i < itemCount && offset < p.length; i++) {
            const slot = p.readUInt8(offset); offset += 1;
            const { item, offset: newOffset } = parseItem(p, offset);
            if (item) {
                item.slot = slot;
                items.push(item);
            }
            offset = newOffset;
        }

        this.buffer = null;
        return { gold: this.gold, maxSlots, items };
    }

    reset() {
        this.buffer = null;
        this.gold = 0;
    }
}

export default {
    parseItem,
    parseInventory,
    parseInventoryMovement,
    parseInventoryUpdate,
    parseDurabilityUpdate,
    parseCapacityUpdate,
    StorageAccumulator,
    InventoryMovementType,
};
