// src/Componentes/LoginPage.jsx
// Página de login con WebSocket — reemplaza el login HTTP de GameLogin
// Flujo: Conectar WS → SHARD_LIST_COMPLETE → enviar LOGIN → CAPTCHA → confirmar → LOGIN_OK → redirect

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CaptchaDialog from "./CaptchaDialog.jsx";

function getGatewayUrl() {
  const protocol =
    window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/ws`;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("DISCONNECTED");
  const [shardReady, setShardReady] = useState(false);

  // Captcha
  const [captchaImage, setCaptchaImage] = useState(null);
  const [showCaptcha, setShowCaptcha] = useState(false);

  // Login exitoso — guardamos para redirigir
  const [loginOk, setLoginOk] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const closeSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  // Limpiar socket al desmontar
  useEffect(() => {
    return () => closeSocket();
  }, [closeSocket]);

  // Redirigir cuando login es exitoso
  useEffect(() => {
    if (loginOk) {
      navigate("/test-connection");
    }
  }, [loginOk, navigate]);

  const handleConnect = () => {
    setError("");
    setShardReady(false);
    setLoginOk(false);
    setCaptchaImage(null);
    setShowCaptcha(false);
    setLoading(true);
    setStatus("CONNECTING");

    closeSocket();

    try {
      const ws = new WebSocket(getGatewayUrl());
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus("CONNECTED");
      };

      ws.onmessage = (event) => {
        if (typeof event.data !== "string") return;

        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "STATUS") {
            setStatus(msg.status);

            if (msg.status === "SHARD_LIST_COMPLETE") {
              setShardReady(true);
              // Enviar login automáticamente
              ws.send(JSON.stringify({
                type: "LOGIN",
                username: form.username,
                password: form.password,
              }));
            }
            return;
          }

          if (msg.type === "CAPTCHA") {
            setCaptchaImage(msg.image || null);
            setShowCaptcha(true);
            return;
          }

          if (msg.type === "EVENT") {
            // Procesar eventos de login
            if (msg.message) {
              if (msg.message.includes("❌ Login fallido")) {
                setError(msg.message);
                setLoading(false);
                setLoginOk(false);
                closeSocket();
              } else if (msg.message.includes("✅ Login exitoso")) {
                setError("");
                setLoginOk(true);
              } else if (msg.message.includes("👤 Personajes")) {
                // Login exitoso — también redirigimos
                setError("");
                setLoginOk(true);
              }
            }

            // Si el status es LOGIN_OK
            if (msg.status === "LOGIN_OK") {
              setError("");
              setLoginOk(true);
            }
            return;
          }
        } catch (err) {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setStatus("SESSION_CLOSED");
        socketRef.current = null;
        setLoading(false);
      };

      ws.onerror = () => {
        setError("No se pudo conectar al Gateway WebSocket.");
        setLoading(false);
        setStatus("ERROR");
      };
    } catch (err) {
      setError(err.message || "Error al inicializar WebSocket.");
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError("Ingresa usuario y contraseña");
      return;
    }
    handleConnect();
  };

  const handleCaptchaConfirm = (code) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "CAPTCHA_REPLY",
        code,
      }));
    }
    setShowCaptcha(false);
    setCaptchaImage(null);
  };

  const handleCaptchaClose = () => {
    setShowCaptcha(false);
    setCaptchaImage(null);
    closeSocket();
    setLoading(false);
    setStatus("DISCONNECTED");
  };

  const handleExit = () => {
    closeSocket();
    window.Telegram?.WebApp?.close();
  };

  return (
    <div style={s.wrapper}>
      {/* Barras negras arriba y abajo */}
      <div style={s.topBar} />
      <div style={s.bottomBar} />

      {/* Contenido centrado */}
      <div style={s.content}>
        {/* Panel estilo cliente con borde dorado */}
        <div style={s.panel}>
          <div style={s.panelInner}>
            <div style={s.row}>
              <span style={s.fieldLabel}>ID</span>
              <input
                style={s.input}
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div style={s.row}>
              <span style={s.fieldLabel}>PW</span>
              <input
                style={s.input}
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <div style={s.row}>
              <span style={s.fieldLabel}>Server</span>
              <div style={s.serverBox}>BlackRose</div>
            </div>

            {error && <p style={s.error}>{error}</p>}
            {loading && !error && (
              <p style={s.loadingText}>
                {status === "CONNECTING"
                  ? "Conectando al servidor..."
                  : status === "CONNECTED"
                  ? "Servidor conectado, iniciando sesión..."
                  : status === "SHARD_LIST_COMPLETE"
                  ? "Enviando credenciales..."
                  : "Conectando..."}
              </p>
            )}
          </div>
        </div>

        {/* Botones Conectar y Salir */}
        <div style={s.mainBtns}>
          <button
            style={{ ...s.btn, ...s.btnConnect }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Conectando..." : "Conectar"}
          </button>
          <button
            style={{ ...s.btn, ...s.btnExit }}
            onClick={handleExit}
            type="button"
            disabled={loading}
          >
            Salir
          </button>
        </div>

        {/* Registrar abajo */}
        <a href="/Registro" style={s.registerBtn}>
          ¿Sin cuenta? Regístrate
        </a>
      </div>

      {/* Captcha Dialog — overlay sobre el fondo */}
      {showCaptcha && (
        <CaptchaDialog
          image={captchaImage}
          onConfirm={handleCaptchaConfirm}
          onClose={handleCaptchaClose}
        />
      )}
    </div>
  );
}

const s = {
  wrapper: {
    position: "relative",
    width: "100%",
    minHeight: "var(--tg-viewport-stable-height, 100vh)",
    backgroundImage: "url('/fondo-login.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "serif",
    overflow: "hidden",
  },
  topBar: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: "env(safe-area-inset-top, 8px)",
    background: "#000",
    zIndex: 2,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: "env(safe-area-inset-bottom, 8px)",
    background: "#000",
    zIndex: 2,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    width: "100%",
    padding: "0 24px",
    zIndex: 3,
  },
  panel: {
    width: "100%",
    maxWidth: 340,
    background: "linear-gradient(180deg, #1a1200cc 0%, #0a0800cc 100%)",
    border: "2px solid #8b6914",
    borderRadius: 4,
    padding: 2,
    boxShadow: "0 0 0 1px #3a2a00, inset 0 0 0 1px #3a2a00",
  },
  panelInner: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "16px 14px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  fieldLabel: {
    color: "#c9a84c",
    fontSize: 13,
    fontWeight: 700,
    minWidth: 46,
    letterSpacing: "0.5px",
    fontFamily: "sans-serif",
  },
  input: {
    flex: 1,
    background: "#f5f0e0",
    border: "1px solid #8b6914",
    borderRadius: 2,
    color: "#1a0e00",
    fontSize: 13,
    padding: "5px 8px",
    outline: "none",
    fontFamily: "sans-serif",
  },
  serverBox: {
    flex: 1,
    background: "#f5f0e0",
    border: "1px solid #8b6914",
    borderRadius: 2,
    color: "#1a0e00",
    fontSize: 13,
    padding: "5px 8px",
    fontFamily: "sans-serif",
  },
  error: {
    color: "#ff6060",
    fontSize: 11,
    margin: 0,
    textAlign: "center",
    background: "#1a000088",
    borderRadius: 4,
    padding: "4px 8px",
    fontFamily: "sans-serif",
  },
  loadingText: {
    color: "#c9a84c",
    fontSize: 11,
    margin: 0,
    textAlign: "center",
    background: "#1a120088",
    borderRadius: 4,
    padding: "4px 8px",
    fontFamily: "sans-serif",
  },
  mainBtns: {
    display: "flex",
    gap: 12,
    width: "100%",
    maxWidth: 340,
  },
  btn: {
    flex: 1,
    padding: "10px 0",
    border: "2px solid #8b6914",
    borderRadius: 3,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.5px",
    fontFamily: "sans-serif",
    boxShadow: "0 2px 8px #0008",
    transition: "filter 0.15s",
  },
  btnConnect: {
    background: "linear-gradient(180deg, #3a2a00 0%, #1a1200 100%)",
    color: "#f0c050",
  },
  btnExit: {
    background: "linear-gradient(180deg, #2a0000 0%, #120000 100%)",
    color: "#e06060",
  },
  registerBtn: {
    color: "#c9a84c",
    fontSize: 12,
    textDecoration: "none",
    fontFamily: "sans-serif",
    borderBottom: "1px solid #8b691480",
    paddingBottom: 2,
    marginTop: 4,
    letterSpacing: "0.3px",
  },
};
