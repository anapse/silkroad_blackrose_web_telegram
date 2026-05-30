/**
 * INVENTORY WINDOW
 *
 * Panel de inventario y equipamiento.
 * Los datos provienen EXCLUSIVAMENTE del servidor vía GameSocketContext.playerState.inventory.
 *
 * Slots 0-12  → Equipment (panel derecho)
 * Slots 13+   → Inventory (panel izquierdo con paginación)
 *
 * Cada slot muestra:
 *   - Icono desde /icon/... (resuelto con itemDB.getItemIcon)
 *   - Imagen default de /interface/equipment/ si está vacío
 *   - Tooltip con datos combinados (itemDB + servidor)
 *
 * TODO Fase 2:
 *   - drag & drop entre slots
 *   - equip/unequip (click derecho)
 *   - appearance update (chars_2d dinámico según equipo)
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useGameSocket } from "../../../shared/context/GameSocketContext.jsx";
import { getItem, getItemIcon, loadItemDB } from "../../../shared/utils/itemDB.js";

// ─── Constantes ───────────────────────────────────────────
const SLOTS_PER_PAGE = 32;
const EQ_OFFSET = 13;

// Mapa de slot → imagen default en /interface/equipment/
const EQ_DEFAULT_IMG = {
  0:  "equip_slot_helm.png",
  1:  "equip_slot_mail.png",
  2:  "equip_slot_shoulderguard.png",
  3:  "equip_slot_gauntlet.png",
  4:  "equip_slot_pants.png",
  5:  "equip_slot_boots.png",
  6:  "equip_slot_weapon.png",
  7:  "equip_slot_shield.png",
  8:  "equip_slot_specialdress.png",
  9:  "equip_slot_earring.png",
  10: "equip_slot_necklace.png",
  11: "equip_slot_l_ring.png",
  12: "equip_slot_r_ring.png",
};

const EQ_LABELS = {
  0: "Helm", 1: "Mail", 2: "Shoulder", 3: "Gauntlet",
  4: "Pants", 5: "Boots", 6: "Weapon", 7: "Shield",
  8: "Job Item", 9: "Earring", 10: "Necklace", 11: "L-Ring", 12: "R-Ring",
};

const EQ_LEFT_SLOTS = [6, 0, 1, 4, 9, 11];
const EQ_RIGHT_SLOTS = [7, 2, 3, 5, 10, 12];

const SLOT_SIZE = 40;
const SLOT_LARGE = 48;
const SLOT_GAP = 6;
const COL_WIDTH = SLOT_SIZE;
const CHAR_WIDTH = 120;

const EQ_COL_HEIGHT = EQ_LEFT_SLOTS.length * SLOT_SIZE + (EQ_LEFT_SLOTS.length - 1) * SLOT_GAP;
const EQ_TOTAL_HEIGHT = EQ_COL_HEIGHT + SLOT_LARGE + SLOT_GAP;

// ─── buildTooltip ─────────────────────────────────────────
// Construye el tooltip combinando datos del servidor + itemDB.
function buildTooltip(serverItem, dbItem) {
  if (!serverItem) return '';
  const name = dbItem?.CodeName128 || `Item #${serverItem.id}`;
  let tip = name;
  if (serverItem.plus > 0) tip += ` +${serverItem.plus}`;
  if (serverItem.durability > 0) tip += ` | Dur: ${serverItem.durability}`;
  if (dbItem?.ReqLevel1 > 0) tip += ` | ReqLv: ${dbItem.ReqLevel1}`;
  if (dbItem?.ItemClass > 0) tip += ` | Deg: ${dbItem.ItemClass}`;
  if (serverItem.quantity > 1) tip += ` | Qty: ${serverItem.quantity}`;
  tip += ` | Slot: ${serverItem.slot}`;
  return tip;
}

// ─── EquipmentSlot ────────────────────────────────────────
// Muestra imagen del item si existe, o la imagen default del slot si está vacío.
// Recibe dbItem ya resuelto desde el padre para evitar problemas de sincronía.
const FALLBACK_ICON = "/icon/icon_default.png";

const EquipmentSlot = React.memo(({ slotId, item, dbItem, large }) => {
  const size = large ? SLOT_LARGE : SLOT_SIZE;
  const defaultImg = `/interface/equipment/${EQ_DEFAULT_IMG[slotId] || "equip_slot_extraneous.png"}`;

  // Resolver icono desde itemDB
  const imgSrc = dbItem ? getItemIcon(dbItem) : null;
  const resolvedSrc = imgSrc || (item ? FALLBACK_ICON : defaultImg);

  return (
    <div
      className="eq-slot"
      style={{
        width: size,
        height: size,
        background: "#050505",
        border: item ? "1px solid #555" : "1px solid #333",
        boxShadow: "inset 0 0 5px #000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
      title={item ? buildTooltip(item, dbItem) : EQ_LABELS[slotId] || `Slot ${slotId}`}
    >
      <img
        src={resolvedSrc}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "contain", opacity: item ? 1 : 0.4 }}
        onError={(e) => {
          // Si la imagen del item no existe, mostrar fallback
          if (item) {
            e.target.src = FALLBACK_ICON;
            e.target.style.opacity = "0.6";
            e.target.onerror = null;
          } else {
            e.target.style.display = "none";
          }
        }}
      />
    </div>
  );
});
EquipmentSlot.displayName = "EquipmentSlot";

// ─── InventorySlot ────────────────────────────────────────
const InventorySlot = React.memo(({ slotIdx, item, dbItem }) => {
  // Resolver icono desde itemDB
  const imgSrc = dbItem ? getItemIcon(dbItem) : null;
  const resolvedSrc = imgSrc || (item ? FALLBACK_ICON : null);

  return (
    <div
      className={`inv-slot ${item ? "inv-slot--filled" : ""}`}
      title={item ? buildTooltip(item, dbItem) : `Slot ${slotIdx}`}
    >
      {item ? (
        <img
          src={resolvedSrc}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK_ICON;
            e.target.style.opacity = "0.6";
          }}
        />
      ) : (
        <div className="inv-slot-inner" />
      )}
    </div>
  );
});
InventorySlot.displayName = "InventorySlot";

// ─── EquipmentPanel ───────────────────────────────────────
const EquipmentPanel = React.memo(({ equipmentItems, refObjId }) => {
  const [showAvatar, setShowAvatar] = useState(false);

  // Construir mapa slot → item con dbItem incluido
  const itemMap = useMemo(() => {
    const map = {};
    for (const it of equipmentItems) {
      map[it.slot] = it;
    }
    return map;
  }, [equipmentItems]);

  const totalWidth = COL_WIDTH + CHAR_WIDTH + COL_WIDTH;
  const panelInnerWidth = totalWidth;

  // Armas centradas, separadas solo 8px entre sí
  const weaponY = 0;
  const weaponX = Math.floor((CHAR_WIDTH - SLOT_LARGE) / 2) + COL_WIDTH - SLOT_LARGE - 4;
  const shieldX = Math.floor((CHAR_WIDTH - SLOT_LARGE) / 2) + COL_WIDTH + 4;
  const colStartY = SLOT_LARGE + SLOT_GAP + 4; // un poco más de separación vertical

  // Espacio extra abajo para slot 8 y botón
  const bottomOffset = 14; // píxeles extra debajo de las columnas

  // Slots a mostrar según el toggle: equipment (0-12) o avatar (13+)
  // Por ahora siempre muestra equipment
  const slotsToRender = showAvatar
    ? { left: [], right: [] } // TODO: avatar slots
    : {
        left: EQ_LEFT_SLOTS.filter(s => s !== 6),
        right: EQ_RIGHT_SLOTS.filter(s => s !== 7),
      };

  return (
    <div
      className="inventory-right"
      style={{
        flex: 1,
        minWidth: 0,
        background: "#0a0a0a",
        border: "1px solid #333",
        position: "relative",
        overflow: "hidden",
        boxShadow: "inset 0 0 20px #000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{
        position: "relative",
        width: panelInnerWidth,
        height: EQ_TOTAL_HEIGHT,
        flexShrink: 0,
      }}>
        {/* Armas arriba */}
        <div style={{ position: "absolute", left: weaponX, top: weaponY }}>
          <EquipmentSlot slotId={6} item={itemMap[6] || null} dbItem={itemMap[6]?.dbItem || null} large={true} />
        </div>
        <div style={{ position: "absolute", left: shieldX + COL_WIDTH, top: weaponY }}>
          <EquipmentSlot slotId={7} item={itemMap[7] || null} dbItem={itemMap[7]?.dbItem || null} large={true} />
        </div>

        {/* Columna izquierda */}
        <div style={{ position: "absolute", left: 0, top: colStartY, display: "flex", flexDirection: "column", gap: SLOT_GAP }}>
          {slotsToRender.left.map((slotId) => (
            <EquipmentSlot key={slotId} slotId={slotId} item={itemMap[slotId] || null} dbItem={itemMap[slotId]?.dbItem || null} />
          ))}
        </div>

        {/* Centro: personaje */}
        <div style={{
          position: "absolute", left: COL_WIDTH, top: colStartY,
          width: CHAR_WIDTH, height: EQ_COL_HEIGHT - SLOT_LARGE,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {refObjId ? (
            <img
              src={`/chars_2d/${refObjId}.png`}
              alt="character"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", opacity: 0.85 }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div style={{ color: "#333", fontSize: 10, textAlign: "center" }}>Sin personaje</div>
          )}
        </div>

        {/* Columna derecha */}
        <div style={{ position: "absolute", left: COL_WIDTH + CHAR_WIDTH, top: colStartY, display: "flex", flexDirection: "column", gap: SLOT_GAP }}>
          {slotsToRender.right.map((slotId) => (
            <EquipmentSlot key={slotId} slotId={slotId} item={itemMap[slotId] || null} dbItem={itemMap[slotId]?.dbItem || null} />
          ))}
        </div>

        {/* Abajo izquierda: botón Avatar toggle */}
        <div style={{
          position: "absolute",
          left: 0,
          top: colStartY + (EQ_LEFT_SLOTS.length - 1) * (SLOT_SIZE + SLOT_GAP) + SLOT_GAP,
        }}>
          <div
            className="eq-slot"
            style={{
              width: SLOT_SIZE, height: SLOT_SIZE,
              background: showAvatar ? "#1a1a3a" : "#0a0a1a",
              border: showAvatar ? "1px solid #668" : "1px solid #334",
              boxShadow: "inset 0 0 5px #000",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            title={showAvatar ? "Equipamiento" : "Avatar"}
            onClick={() => setShowAvatar(!showAvatar)}
          >
            <img
              src={`/interface/equipment/${showAvatar ? "equip_slot_equipment_button.png" : "equip_slot_avata_button.png"}`}
              alt={showAvatar ? "EQ" : "AV"}
              style={{ width: "80%", height: "80%", objectFit: "contain", opacity: 0.7 }}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentNode.innerHTML = `<span style="color:#666;font-size:9px">${showAvatar ? "EQ" : "AV"}</span>`;
              }}
            />
          </div>
        </div>

        {/* Abajo derecha: slot 8 (Job Item) */}
        <div style={{
          position: "absolute",
          left: COL_WIDTH + CHAR_WIDTH,
          top: colStartY + (EQ_RIGHT_SLOTS.length - 1) * (SLOT_SIZE + SLOT_GAP) + SLOT_GAP,
        }}>
          <EquipmentSlot slotId={8} item={itemMap[8] || null} dbItem={itemMap[8]?.dbItem || null} />
        </div>
      </div>
    </div>
  );
});
EquipmentPanel.displayName = "EquipmentPanel";

// ─── InventoryGrid (una página) ───────────────────────────
const InventoryGrid = React.memo(({ pageSlots }) => (
  <div className="inventory-grid-container">
    <div className="inventory-grid inv-grid-4x8">
      {pageSlots.map(({ slotIdx, item, dbItem }) => (
        <InventorySlot key={slotIdx} slotIdx={slotIdx} item={item} dbItem={dbItem} />
      ))}
    </div>
  </div>
));
InventoryGrid.displayName = "InventoryGrid";

// ─── Tabs de paginación ───────────────────────────────────
const Tabs = React.memo(({ totalPages, activePage, onPageChange }) => (
  <div className="inventory-tabs">
    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
      <div
        key={p}
        className={`inv-tab ${activePage === p ? "active" : ""}`}
        onClick={() => onPageChange(p)}
      >
        Page {p}
      </div>
    ))}
  </div>
));
Tabs.displayName = "Tabs";

// ─── InventoryWindow (componente principal) ───────────────
export default function InventoryWindow({ gold: propGold, refObjId }) {
  const { playerState } = useGameSocket();
  const [activePage, setActivePage] = useState(1);
  const [itemDB, setItemDB] = useState(null);
  const dbLoadStarted = useRef(false);

  // ── Cargar itemDB una sola vez al montar ──
  useEffect(() => {
    if (dbLoadStarted.current) return;
    dbLoadStarted.current = true;
    loadItemDB()
      .then((map) => {
        setItemDB(map);
      })
      .catch((err) => {
        // Error cargando itemDB
      });
  }, []);

  // ── Leer datos del servidor (SOLO playerState.inventory) ──
  const rawItems = playerState.inventory || [];
  const gold = propGold ?? playerState.gold ?? 0;

  // Capacidad máxima del inventario enviada por el servidor.
  // InventorySize incluye slots 0-12 (equipment), así que restamos EQ_OFFSET.
  // Si no está disponible, usar 32 (1 página por defecto) para mostrar la UI.
  const rawCapacity = playerState.inventoryCapacity > 0 ? playerState.inventoryCapacity : 0;
  const inventorySlotCount = rawCapacity > EQ_OFFSET ? rawCapacity - EQ_OFFSET : SLOTS_PER_PAGE;

  // ── Separar equipment (0-12) e inventory (13+) y resolver itemDB ──
  const { equipmentItems, inventoryItems } = useMemo(() => {
    const eq = [];
    const inv = [];
    for (const serverItem of rawItems) {
      const dbItem = itemDB?.get(serverItem.id) || null;
      const enriched = { ...serverItem, dbItem };
      if (serverItem.slot >= 0 && serverItem.slot <= 12) {
        eq.push(enriched);
      } else if (serverItem.slot >= 13) {
        inv.push(enriched);
      }
    }
    eq.sort((a, b) => a.slot - b.slot);
    inv.sort((a, b) => a.slot - b.slot);
    return { equipmentItems: eq, inventoryItems: inv };
  }, [rawItems, itemDB]);

  //    ── Calcular páginas por CAPACIDAD real de inventario (slots 13+) ──
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(inventorySlotCount / SLOTS_PER_PAGE)),
    [inventorySlotCount]
  );

  // ── Slots de la página activa ──
  const pageSlots = useMemo(() => {
    const pageStart = EQ_OFFSET + (activePage - 1) * SLOTS_PER_PAGE;
    const slotsInPage = Math.min(SLOTS_PER_PAGE, inventorySlotCount - (activePage - 1) * SLOTS_PER_PAGE);
    return Array.from({ length: slotsInPage }, (_, i) => {
      const slotIdx = pageStart + i;
      const found = inventoryItems.find((it) => it.slot === slotIdx) || null;
      return { slotIdx, item: found, dbItem: found?.dbItem || null };
    });
  }, [inventoryItems, activePage, inventorySlotCount]);

  // ── Resetear página si se excede

  // Resetear página si se excede
  if (activePage > totalPages) {
    setActivePage(1);
  }

  return (
    <div className="sro-window-content inventory-layout">
      {/* ── IZQUIERDA: Inventario ── */}
      <div className="inventory-left">
        <Tabs
          totalPages={totalPages}
          activePage={activePage}
          onPageChange={setActivePage}
        />
        <InventoryGrid pageSlots={pageSlots} />
        <div className="inventory-gold-bar">
          <div className="gold-icon" />
          <div className="gold-value">{Number(gold).toLocaleString()}</div>
          <span className="gold-label">Gold</span>
        </div>
      </div>

      {/* ── DERECHA: Equipamiento ── */}
      <EquipmentPanel equipmentItems={equipmentItems} refObjId={refObjId} />
    </div>
  );
}
