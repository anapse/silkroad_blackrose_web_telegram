// src/Componentes/CaptchaDialog.jsx
// Overlay modal para captcha estilo Silkroad Online

import { useState } from "react";

export default function CaptchaDialog({ image, onConfirm, onClose }) {
  const [code, setCode] = useState("");

  const handleConfirm = () => {
    onConfirm(code.trim());
    setCode("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <div style={s.overlay}>
      <div style={s.dialog}>
        {/* Título */}
        <div style={s.title}>Image code verification</div>

        {/* Texto descriptivo */}
        <p style={s.description}>
          To prevent auto creation, please enter the number/text as it appears.
        </p>

        {/* Imagen del captcha — si no hay imagen, no se muestra nada */}
        {image ? (
          <img
            src={image}
            alt="Captcha"
            style={s.image}
          />
        ) : null}

        {/* Input + botón */}
        <div style={s.inputRow}>
          <input
            style={s.input}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter code"
            autoFocus
          />
          <button
            style={s.confirmBtn}
            onClick={handleConfirm}
          >
            Confirm
          </button>
        </div>

        {/* Cerrar (opcional) */}
        <button style={s.closeBtn} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "16px",
  },
  dialog: {
    width: "100%",
    maxWidth: 360,
    background: "linear-gradient(180deg, #1a1200 0%, #0a0800 100%)",
    border: "2px solid #8b6914",
    borderRadius: 4,
    padding: "20px 16px 16px",
    boxShadow: "0 0 0 1px #3a2a00, inset 0 0 0 1px #3a2a00, 0 8px 32px #0008",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    fontFamily: "sans-serif",
  },
  title: {
    color: "#c9a84c",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.5px",
    textAlign: "center",
  },
  description: {
    color: "#a09070",
    fontSize: 11,
    textAlign: "center",
    margin: 0,
    lineHeight: 1.4,
  },
  image: {
    width: "100%",
    maxHeight: 80,
    objectFit: "contain",
    borderRadius: 2,
    border: "1px solid #8b6914",
    background: "#fff",
  },
  imagePlaceholder: {
    width: "100%",
    height: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6c5c3c",
    fontSize: 11,
    border: "1px dashed #8b6914",
    borderRadius: 2,
  },
  inputRow: {
    display: "flex",
    gap: 8,
    width: "100%",
  },
  input: {
    flex: 1,
    background: "#f5f0e0",
    border: "1px solid #8b6914",
    borderRadius: 2,
    color: "#1a0e00",
    fontSize: 13,
    padding: "6px 8px",
    outline: "none",
    fontFamily: "monospace",
  },
  confirmBtn: {
    background: "linear-gradient(180deg, #3a2a00 0%, #1a1200 100%)",
    color: "#f0c050",
    border: "2px solid #8b6914",
    borderRadius: 3,
    padding: "6px 16px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "sans-serif",
    whiteSpace: "nowrap",
  },
  closeBtn: {
    background: "transparent",
    color: "#a09070",
    border: "none",
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "sans-serif",
    textDecoration: "underline",
    padding: "4px 8px",
  },
};
