// src/Componentes/game/GameLogin.jsx
// Al recargar: limpia todo, conecta WebSocket automáticamente y muestra login.
// El usuario escribe usuario/contraseña y hace clic en "Conectar" → envía LOGIN.
// No guarda credenciales en ningún lado.

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../../shared/context/AuthContext.jsx";
import { useGameSocket } from "../../../shared/context/GameSocketContext.jsx";
import CaptchaDialog from "./CaptchaDialog.jsx";

export default function GameLogin() {
  const { setWsUser, logout } = useAuth();
  const { connect, disconnect, send, socketRef } = useGameSocket();
  const formRef = useRef({ username: "", password: "" });
  const handlerRef = useRef(null);
  const mountedRef = useRef(true);
  const shardReadyRef = useRef(false);

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shardReady, setShardReady] = useState(false);

  // Captcha
  const [captchaImage, setCaptchaImage] = useState(null);
  const [showCaptcha, setShowCaptcha] = useState(false);

  // Status log
  const [statusLog, setStatusLog] = useState("");

  const addLog = (msg) => setStatusLog(msg);

  // ── Al montar: limpiar TODO y conectar WebSocket ──────
  useEffect(() => {
    sessionStorage.clear();
    localStorage.removeItem("blackrose_user");
    logout();

    // Cerrar cualquier WS anterior y conectar uno nuevo
    disconnect();
    addLog("Conectando...");
    connect();

    return () => { mountedRef.current = false; };
  }, []); // eslint-disable-line

  // Sincronizar ref con estado
  useEffect(() => {
    shardReadyRef.current = shardReady;
  }, [shardReady]);

  const handleChange = (e) => {
    const next = { ...form, [e.target.name]: e.target.value };
    setForm(next);
    formRef.current = next;
  };

  // Handler de mensajes
  const handleMessage = useCallback((event) => {
    if (typeof event.data !== "string") return;

    try {
      const msg = JSON.parse(event.data);

      if (msg.type === "STATUS") {
        if (msg.status === "SHARD_LIST_COMPLETE") {
          setShardReady(true);
          addLog("Listo — ingresa tus datos");
        }
        if (msg.status === "CAPTCHA_REQUESTED") {
          setCaptchaImage(null);
          setShowCaptcha(true);
          addLog("Ingresa el código captcha");
        }
        if (msg.status === "LOGIN_OK" || msg.status === "AGENT_REDIRECT") {
          addLog("Login exitoso — obteniendo datos...");
          setLoading(false);
          setShowCaptcha(false);
          setWsUser({ username: formRef.current.username });
        }
        return;
      }

      if (msg.type === "CAPTCHA") {
        setCaptchaImage(msg.image || null);
        setShowCaptcha(true);
        addLog("Esperando captcha...");
        return;
      }

      if (msg.type === "EVENT") {
        // Solo navegar a CharacterSelect cuando lleguen los personajes,
        // no antes. Así CharacterSelect se monta con datos listos.
        if (msg.message?.includes("👤 Personajes")) {
          addLog("Login exitoso — cargando personajes...");
          setLoading(false);
          setShowCaptcha(false);
          setWsUser({ username: formRef.current.username });
          return;
        }

        if (msg.message?.includes("❌ Login fallido")) {
          addLog("Login fallido");
          setError(msg.message);
          setLoading(false);
          return;
        }
      }
    } catch {
      // ignore
    }
  }, []); // eslint-disable-line

  // ── Registrar handler cuando el WS esté disponible ────
  useEffect(() => {
    const checkAndAttach = setInterval(() => {
      if (!mountedRef.current) { clearInterval(checkAndAttach); return; }
      const ws = socketRef.current;
      if (ws && handlerRef.current !== ws) {
        handlerRef.current = ws;
        ws.addEventListener("message", handleMessage);
        clearInterval(checkAndAttach);
      }
    }, 50);

    return () => {
      clearInterval(checkAndAttach);
      const ws = socketRef.current;
      if (ws) {
        ws.removeEventListener("message", handleMessage);
      }
      handlerRef.current = null;
    };
  }, [handleMessage, socketRef]);

  // ── Enviar login cuando el usuario hace clic ──────────
  const handleConnect = () => {
    if (!form.username || !form.password) {
      setError("Ingresa usuario y contraseña");
      return;
    }

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError("WebSocket no conectado. Espera un momento...");
      return;
    }

    if (!shardReadyRef.current) {
      setError("Esperando lista de servidores...");
      return;
    }

    setError("");
    setCaptchaImage(null);
    setShowCaptcha(false);
    setLoading(true);
    addLog("Enviando credenciales...");

    send({ type: "LOGIN", username: form.username, password: form.password });
  };

  const handleCaptchaConfirm = (code) => {
    addLog("Enviando captcha...");
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
    setError("Captcha cancelado");
    setLoading(false);
  };

  const handleExit = () => {
    disconnect();
    window.Telegram?.WebApp?.close();
  };

  return (
    <div style={s.wrapper}>
      <div style={s.topBar} />
      <div style={s.bottomBar} />

      <div style={s.content}>

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
              <p style={s.loadingText}>{statusLog}</p>
            )}
          </div>
        </div>

        <div style={s.mainBtns}>
          <button
            style={{ ...s.btn, ...s.btnConnect }}
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? "Conectando..." : "Conectar"}
          </button>
          {!shardReady && !loading && (
            <div style={{ color: "#f0c050", fontSize: 10, textAlign: "center", marginTop: 4 }}>
              Conectando al servidor...
            </div>
          )}
          <button
            style={{ ...s.btn, ...s.btnExit }}
            onClick={handleExit}
            type="button"
            disabled={loading}
          >
            Salir
          </button>
        </div>

        <a href="/Registro" style={s.registerBtn}>
          ¿Sin cuenta? Regístrate
        </a>
      </div>

      {showCaptcha && (
        <CaptchaDialog
          image={captchaImage}
          onConfirm={handleCaptchaConfirm}
          onClose={handleCaptchaClose}
        />
      )}

      {/* Status log — abajo a la derecha */}
      <div style={s.statusLog}>
        <span style={{
          display: "inline-block",
          width: 8, height: 8,
          borderRadius: "50%",
          background: shardReady ? "#51cf66" : loading ? "#f0c050" : "#e06060",
          flexShrink: 0,
        }} />
        {statusLog}
      </div>
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
  logo: {
    width: "70%",
    maxWidth: 280,
    objectFit: "contain",
    filter: "drop-shadow(0 2px 8px #000a)",
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
  statusLog: {
    position: "fixed",
    bottom: 12,
    right: 12,
    zIndex: 999,
    background: "#000000bb",
    border: "1px solid #5a4200",
    borderRadius: 4,
    color: "#c9a84c",
    fontSize: 10,
    padding: "4px 10px",
    fontFamily: "sans-serif",
    display: "flex",
    alignItems: "center",
    gap: 6,
    pointerEvents: "none",
    backdropFilter: "blur(4px)",
  },
};