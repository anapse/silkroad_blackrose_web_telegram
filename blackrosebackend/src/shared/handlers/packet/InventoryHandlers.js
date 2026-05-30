// Handlers for Inventory & Storage opcodes: 0xB034, 0x3040, 0x3052, 0x3092, 0x3047, 0x3049, 0x304A
// Extracted from PacketRouter.js
import Logger from '../../utils/Logger.js';
import { parseInventoryMovement, parseInventoryUpdate, parseDurabilityUpdate, parseCapacityUpdate } from '../../InventoryParser.js';

export function createInventoryHandlers(router) {
    return {
        handleInventoryMovement(rawPacket, packetObj) {
            const payload = rawPacket.slice(6);
            try {
                const result = parseInventoryMovement(payload);
                if (result && router.session && router.session.wsSession) {
                    router.session.wsSession.sendEvent('', {
                        type: 'INVENTORY_MOVEMENT',
                        movementType: result.movementType,
                        data: result,
                    });
                    Logger.info('[INVENTORY] Movement type=' + result.movementType + ' src=' + result.slotSrc + ' dst=' + result.slotDst, 'Inventory');
                }
            } catch (e) {
                Logger.warn('[INVENTORY] Movement parse error: ' + e.message, 'Inventory');
            }
        },

        handleInventoryUpdate(rawPacket, packetObj) {
            const payload = rawPacket.slice(6);
            try {
                const result = parseInventoryUpdate(payload);
                if (result && router.session && router.session.wsSession) {
                    router.session.wsSession.sendEvent('', {
                        type: 'INVENTORY_UPDATE',
                        data: result,
                    });
                    Logger.info('[INVENTORY] Update slot=' + result.slot + ' id=' + result.id, 'Inventory');
                }
            } catch (e) {
                Logger.warn('[INVENTORY] Update parse error: ' + e.message, 'Inventory');
            }
        },

        handleDurabilityUpdate(rawPacket, packetObj) {
            const payload = rawPacket.slice(6);
            try {
                const result = parseDurabilityUpdate(payload);
                if (result && router.session && router.session.wsSession) {
                    router.session.wsSession.sendEvent('', {
                        type: 'DURABILITY_UPDATE',
                        data: result,
                    });
                }
            } catch (e) {
                Logger.warn('[DURABILITY] Parse error: ' + e.message, 'Inventory');
            }
        },

        handleCapacityUpdate(rawPacket, packetObj) {
            const payload = rawPacket.slice(6);
            try {
                const result = parseCapacityUpdate(payload);
                if (result && router.session && router.session.wsSession) {
                    router.session.wsSession.sendEvent('', {
                        type: 'CAPACITY_UPDATE',
                        data: result,
                    });
                }
            } catch (e) {
                Logger.warn('[CAPACITY] Parse error: ' + e.message, 'Inventory');
            }
        },

        handleStorageBegin(rawPacket, packetObj) {
            const payload = rawPacket.slice(6);
            router._storageAccumulator.begin(payload);
            Logger.info('[STORAGE] Begin - gold=' + router._storageAccumulator.gold, 'Inventory');
        },

        handleStorageData(rawPacket, packetObj) {
            const payload = rawPacket.slice(6);
            router._storageAccumulator.add(payload);
        },

        handleStorageEnd(rawPacket, packetObj) {
            const storage = router._storageAccumulator.end();
            if (storage && router.session && router.session.wsSession) {
                router.session.wsSession.sendEvent('', {
                    type: 'STORAGE_DATA',
                    data: storage,
                });
            }
            router._storageAccumulator.reset();
        }
    };
}
