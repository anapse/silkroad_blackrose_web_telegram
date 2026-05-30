// src/Componentes/game/CharacterSelect.jsx
// Usa /public/character/{RefObjID}.gif para mostrar cada personaje
// Los personajes vienen del WebSocket (GameSocketContext), NO de la API REST
//
// Campos del WebSocket (0xB007): name, level, refObjId, region, posX, posZ, posY, angle
// HP/MP/STR/INT no están en 0xB007; llegan después vía PLAYER_UPDATE.

import { useState, useCallback } from "react";
import { useGameSocket } from "../../../shared/context/GameSocketContext.jsx";

// HP/MP no están disponibles en 0xB007 (CHARACTER_LIST).
// Se mostrarán como "?" hasta que lleguen vía PLAYER_UPDATE/CHARACTER_DATA por WebSocket.
// Valores hardcodeados eliminados — los datos reales vienen del servidor.
// TODO: cuando el backend envíe HP/MP en CHARACTER_LIST, reemplazar esta lógica.

export default function CharacterSelect({ onStart, onBack }) {
  const { characters: wsChars, connected, send } = useGameSocket();
  const [selected, setSelected]     = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Los personajes llegan por WebSocket, no por API REST
  const chars = wsChars ?? [];
  const loadingChars = !connected || chars.length === 0;
  const errorChars = !connected ? "Conectando al servidor..." : "";

  // Mientras carga
  if (loadingChars) {
    return (
      <div style={{
        minHeight: "var(--tg-viewport-stable-height,100vh)",
        background: "#000",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 12,
      }}>
        <span style={{ fontSize: 36 }}>🌹</span>
        <span style={{ color: "#8b6914", fontFamily: "sans-serif", fontSize: 13 }}>
          Cargando personajes...
        </span>
      </div>
    );
  }

  // Si hay error
  if (errorChars) {
    return (
      <div style={{
        minHeight: "var(--tg-viewport-stable-height,100vh)",
        background: "#000",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 12,
      }}>
        <span style={{ fontSize: 32 }}>⚠️</span>
        <span style={{ color: "#ff6060", fontFamily: "sans-serif", fontSize: 13 }}>
          {errorChars}
        </span>
        <button
          onClick={onBack}
          style={{ color: "#8b6914", background: "none", border: "1px solid #8b6914",
            padding: "6px 16px", borderRadius: 4, cursor: "pointer", fontFamily: "sans-serif" }}
        >
          Volver
        </button>
      </div>
    );
  }

  const handleSelect = (char) => {
    setSelected(char);
    setConfirmDelete(false);
  };

  const handleCancel = () => {
    setSelected(null);
    setConfirmDelete(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    alert(`Borrar ${selected.name} — conecta con tu API`);
    setSelected(null);
    setConfirmDelete(false);
  };

  // HP/MP no vienen en 0xB007, asumimos vivos por defecto
  const hpAlive = true;
  const mpAlive = true;

  // EXP no disponible en 0xB007
  const expPct = "—";

  return (
    <div style={s.root}>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.mascot}>🌹</span>
          <span style={s.headerTitle}>CHARACTER SELECT</span>
        </div>
        <img
          src="/logo-icon.png"
          alt="BlackRose"
          style={s.headerLogo}
          onError={(e) => { e.target.style.display = "none"; }}
        />
      </div>

      {/* ── ESCENA ── */}
      <div style={s.scene}>
        <div style={s.sceneBg} />

        {/* Nombre flotante */}
        {selected && (
          <div style={s.floatingName}>{selected.name}</div>
        )}

        {/* HUD info — esquina superior derecha */}
        {selected && (
          <div style={s.hud}>
            <div style={s.hudInner}>
              <span style={s.hudName}>{selected.name}</span>

              {/* HP: llena=roja, muerto=negra */}
              <div style={s.hudBarBg}>
                <div style={{
                  ...s.hudBarFill,
                  background: hpAlive ? "#cc0000" : "#1a0000",
                  width: hpAlive ? "100%" : "100%",
                  opacity: hpAlive ? 1 : 0.3,
                }} />
              </div>
              {/* MP: llena=azul, vacía=negra */}
              <div style={s.hudBarBg}>
                <div style={{
                  ...s.hudBarFill,
                  background: mpAlive ? "#0055cc" : "#00001a",
                  width: mpAlive ? "100%" : "100%",
                  opacity: mpAlive ? 1 : 0.3,
                }} />
              </div>

              <div style={s.hudGrid}>
                <span style={s.hudLabel}>EXP</span>
                <span style={s.hudVal}>{expPct}%</span>

                <span style={s.hudLabel}>Stat</span>
                <span style={s.hudVal}>{0}</span>

                <span style={s.hudLabel}>Level</span>
                <span style={s.hudVal}>{selected.level}</span>

                <span style={s.hudLabel}>STR</span>
                <span style={s.hudVal}>0</span>

                <span style={s.hudLabel}>INT</span>
                <span style={s.hudVal}>0</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Personajes en escena ── */}
        <div style={selected ? s.charsSelected : s.charsNormal}>
          {chars.map((char) => {
            const isSel   = selected?.index === char.index;
            const isOther = selected && !isSel;
            return (
              <div
                key={char.index}
                style={{
                  ...s.charWrap,
                  opacity:       isOther ? 0 : 1,
                  transform:     isSel ? "scale(1.12) translateY(-8px)" : "scale(1)",
                  zIndex:        isSel ? 3 : 1,
                  transition:    "all 0.4s ease",
                  pointerEvents: isOther ? "none" : "auto",
                  cursor:        "pointer",
                }}
                onClick={() => handleSelect(char)}
              >
                {/* GIF del personaje por RefObjID */}
                <img
                  src={`/chars_2d/${char.refObjId}.png`}
                  alt={char.name}
                  style={{
                    ...s.charImg,
                    width:     isSel ? 160 : 110,
                    height:    isSel ? 260 : 180,
                    transition: "all 0.4s ease",
                  }}
                  onError={(e) => {
                    // fallback si no existe el gif
                    e.target.style.display = "none";
                  }}
                />

                {/* Nombre solo si no hay selección */}
                {!selected && (
                  <span style={s.charName}>{char.name}</span>
                )}
                {!selected && (
                  <span style={s.charLevel}>Lv. {char.level}</span>
                )}
              </div>
            );
          })}

          {/* Slot vacío para crear nuevo */}
          {chars.length < 4 && !selected && (
            <div
              style={{ ...s.charWrap, cursor: "pointer" }}
              onClick={() => alert("Crear — conecta con tu API")}
            >
              <div style={s.emptySlot}>
                <span style={{ fontSize: 32, lineHeight: 1 }}>+</span>
                <span style={{ fontSize: 10, color: "#c9a84c", letterSpacing: "0.5px", fontWeight: 700 }}>
                  CREAR
                </span>
              </div>
              <span style={{ ...s.charName, color: "#c9a84c" }}>Nuevo</span>
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={s.footer}>
        <div style={s.footerEmblem}>
          <img
            src="/emblema.png"
            alt=""
            style={{ height: 44, opacity: 0.6 }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </div>

        <span style={s.copyright}>
          COPYRIGHT © <strong>BlackRose</strong> ALL RIGHTS RESERVED
        </span>

        <div style={s.btnGroup}>
          {!selected ? (
            <>
              <GameBtn label="Create" onClick={() => alert("Crear — conecta con tu API")} />
              <GameBtn label="Cancel" onClick={onBack} />
            </>
          ) : (
            <>
              <GameBtn label="Start"  color="gold" onClick={() => {
                // Enviar CHARACTER_SELECT al WebSocket ANTES de montar GameContainer
                if (send) {
                  send({ type: 'CHARACTER_SELECT', characterName: selected.name });
                  console.log('[CHARACTER_SELECT] Sent selection for', selected.name);
                }
                onStart(selected);
              }} />
              <GameBtn
                label={confirmDelete ? "¿Seguro?" : "Delete"}
                color="red"
                onClick={handleDelete}
              />
              <GameBtn label="Cancel" onClick={handleCancel} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Botón ────────────────────────────────────────── */
function GameBtn({ label, color, onClick }) {
  const styles = {
    gold: { bg: "linear-gradient(180deg,#3a2a00,#1a1200)", border: "#8b6914", text: "#f0c050" },
    red:  { bg: "linear-gradient(180deg,#2a0000,#0a0000)", border: "#6b1414", text: "#ff6060" },
    dark: { bg: "linear-gradient(180deg,#1a1a1a,#0a0a0a)", border: "#444",    text: "#ccc"    },
  };
  const c = styles[color] || styles.dark;
  return (
    <button onClick={onClick} style={{
      padding: "7px 16px",
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 3,
      color: c.text,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "sans-serif",
      boxShadow: "0 2px 8px #0009",
      whiteSpace: "nowrap",
    }}>
      {label}
    </button>
  );
}

/* ── Estilos ──────────────────────────────────────── */
const s = {
  root: {
    position: "relative",
    width: "100%",
    minHeight: "var(--tg-viewport-stable-height, 100vh)",
    display: "flex",
    flexDirection: "column",
    background: "#000",
    overflow: "hidden",
    fontFamily: "sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#000",
    borderBottom: "2px solid #5a4200",
    padding: "6px 12px",
    height: 52,
    flexShrink: 0,
    zIndex: 10,
  },
  headerLeft:  { display: "flex", alignItems: "center", gap: 8 },
  mascot:      { fontSize: 26 },
  headerTitle: {
    color: "#c9a84c",
    fontSize: 17,
    fontWeight: 900,
    letterSpacing: "2px",
    textTransform: "uppercase",
    fontFamily: "serif",
    textShadow: "0 0 10px #8b6914",
  },
  headerLogo: { height: 40, objectFit: "contain" },

  scene: {
    position: "relative",
    flex: 1,
    overflow: "hidden",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  sceneBg: {
    position: "absolute",
    inset: 0,
    backgroundImage: "url('/fondo-select.png')",
    backgroundSize: "cover",
    backgroundPosition: "center top",
    zIndex: 0,
  },

  floatingName: {
    position: "absolute",
    top: 12,
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    textShadow: "0 1px 6px #000",
    zIndex: 4,
    background: "#00000077",
    padding: "2px 14px",
    borderRadius: 10,
  },

  hud: {
    position: "absolute",
    top: 12,
    right: 10,
    zIndex: 5,
    background: "linear-gradient(180deg,#0a0800f2,#000000f2)",
    border: "2px solid #8b6914",
    borderRadius: 3,
    boxShadow: "0 0 0 1px #3a2a00, 0 4px 20px #0009",
    minWidth: 160,
  },
  hudInner: {
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  hudName:  { color: "#f0c050", fontSize: 13, fontWeight: 700 },
  hudBarBg: {
    height: 7,
    background: "#1a0000",
    borderRadius: 3,
    border: "1px solid #2a0000",
    overflow: "hidden",
  },
  hudBarFill: { height: "100%", borderRadius: 3, transition: "width 0.3s" },
  hudGrid: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    columnGap: 10,
    rowGap: 2,
    marginTop: 3,
  },
  hudLabel: { color: "#8b6914", fontSize: 11 },
  hudVal:   { color: "#fff",    fontSize: 11, fontWeight: 600 },

  charsNormal: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 20,
    width: "100%",
    paddingBottom: 0,
  },
  charsSelected: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    width: "100%",
  },

  charWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    userSelect: "none",
  },
  charImg: {
    objectFit: "contain",
    imageRendering: "pixelated",
  },
  charName: {
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    textShadow: "0 1px 4px #000",
    marginTop: 4,
    background: "#00000066",
    padding: "1px 8px",
    borderRadius: 8,
  },
  charLevel: {
    color: "#c9a84c",
    fontSize: 10,
    textShadow: "0 1px 4px #000",
    marginTop: 2,
  },

  emptySlot: {
    width: 100,
    height: 160,
    background: "linear-gradient(180deg, #1a1200aa, #0a0800aa)",
    border: "2px dashed #8b6914",
    borderRadius: 4,
    boxShadow: "0 0 0 1px #3a2a00, inset 0 0 20px #f0c05011",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 36,
    color: "#c9a84c",
    gap: 8,
    transition: "all 0.2s",
  },

  footer: {
    position: "relative",
    background: "#000",
    borderTop: "2px solid #5a4200",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "8px 14px",
    gap: 8,
    minHeight: 54,
    flexShrink: 0,
    zIndex: 10,
  },
  footerEmblem: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%,-50%)",
    pointerEvents: "none",
  },
  copyright: {
    position: "absolute",
    left: "50%",
    bottom: 3,
    transform: "translateX(-50%)",
    color: "#333",
    fontSize: 9,
    whiteSpace: "nowrap",
  },
  btnGroup: { display: "flex", gap: 8, zIndex: 2 },
};