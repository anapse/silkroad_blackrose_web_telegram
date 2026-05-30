import React, { useEffect, useRef, useState } from "react";
import ChatBox from "../web/components/ChatBox.jsx";
import ActionPanel from "../web/components/ActionPanel.jsx";

function getGatewayUrl(useLocalGateway) {
  if (useLocalGateway) {
    return "ws://localhost:8081";
  }

  const protocol =
    window.location.protocol === "https:" ? "wss" : "ws";

  return `${protocol}://${window.location.host}/ws`;
}

function formatTime(ts) {
  const d = new Date(ts);
  return `${d.toLocaleTimeString()}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

function normalizePacket(packet) {
  return {
    type: packet.type || "PACKET",
    direction: packet.direction || "--",
    opcode: packet.opcode || "0x0000",
    size: packet.size || 0,
    payload: typeof packet.payload === "string" ? packet.payload : "",
    timestamp: packet.timestamp || Date.now(),
  };
}

export default function ConnectionTester() {
  const [status, setStatus] = useState("DISCONNECTED");
  const [errorMsg, setErrorMsg] = useState("");
  const [packets, setPackets] = useState([]);
  const [events, setEvents] = useState([]);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [characters, setCharacters] = useState([]);
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [stats, setStats] = useState({
    rxPackets: 0,
    txPackets: 0,
    lastOpcode: null,
    lastPacketAt: null,
    lastRxAt: null,
    connectedAt: null,
  });
  const [isPaused, setIsPaused] = useState(false);
  const [useLocalGateway, setUseLocalGateway] = useState(false);
  const [captchaImage, setCaptchaImage] = useState(null);
  const [captchaCode, setCaptchaCode] = useState("");
  const [shardListReceived, setShardListReceived] = useState(false);
  const [playerInfo, setPlayerInfo] = useState(null); // datos del jugador en mundo
  const [chatMessages, setChatMessages] = useState([]); // mensajes de chat
  const socketRef = useRef(null);
  const packetIdRef = useRef(0);
  const eventIdRef = useRef(0);
  const monitorRef = useRef(null);
  const isPausedRef = useRef(false);
  const activeWsUrl = getGatewayUrl(useLocalGateway);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    if (!isPaused && monitorRef.current) {
      monitorRef.current.scrollTop = monitorRef.current.scrollHeight;
    }
  }, [packets, isPaused]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current || status === "DISCONNECTED" || status === "SESSION_CLOSED" || status === "ERROR") {
      return undefined;
    }

    const timer = setInterval(() => {
      const lastRxAt = stats.lastRxAt || stats.connectedAt;
      if (!lastRxAt) return;
      if (Date.now() - lastRxAt >= 10000) {
        setStatus("SERVER_IDLE");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [status, stats.lastRxAt, stats.connectedAt]);

  const addPacket = (packet) => {
    if (isPausedRef.current) return;
    packetIdRef.current += 1;
    setPackets((prev) => [
      ...prev.slice(-499),
      { ...normalizePacket(packet), _id: packetIdRef.current },
    ]);
  };

  const addEvent = (event) => {
    eventIdRef.current += 1;
    const eventObj = {
      _id: eventIdRef.current,
      message: event.message || event.status || 'Evento recibido',
      detail: event.detail || {},
      timestamp: event.timestamp || Date.now(),
    };
    
    // Procesar eventos para extraer errores y personajes
    if (event.message) {
      if (event.message.includes('❌ Login fallido')) {
        setLoginError(event.message);
        setLoginSuccess(false);
        setCharacters([]);
        setPlayerInfo(null);
      } else if (event.message.includes('✅ Login exitoso')) {
        setLoginError("");
        setLoginSuccess(true);
      } else if (event.message.includes('👤 Personajes')) {
        // Extraer lista de personajes desde el detail
        if (event.detail && event.detail.characters) {
          const availableCharacters = event.detail.characters.filter((c) => !c.deleted);
          setCharacters(availableCharacters);
        }
      } else if (event.message.includes('🌟 Jugador')) {
        // Player spawned- extraer info del detail
        if (event.detail && event.detail.type === 'PLAYER_SPAWNED') {
          setPlayerInfo(event.detail);
        }
      }
    }
    
    // Procesar cambios de estado
    if (event.status === 'IN_GAME' && event.detail) {
      setPlayerInfo(event.detail);
    }
    
    // Capturar mensajes de chat (CHAT_MESSAGE) - todos vienen del backend
    if (event.detail && event.detail.type === 'CHAT_MESSAGE') {
      setChatMessages((prev) => [
        ...prev.slice(-199),
        {
          id: Date.now() + Math.random(),
          chatType: event.detail.chatType,
          charname: event.detail.charname || '???',
          message: event.detail.message || '',
          uniqueID: event.detail.uniqueID,
          timestamp: event.timestamp || Date.now(),
          direction: 'RX',
        },
      ]);
    }
    
    setEvents((prev) => [
      ...prev.slice(-99),
      eventObj,
    ]);
  };

  const handleConnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    setStatus("CONNECTING");
    setErrorMsg("");
    setPackets([]);
    setCharacters([]);
    setLoginError("");
    setLoginSuccess(false);
    setStats({
      rxPackets: 0,
      txPackets: 0,
      lastOpcode: null,
      lastPacketAt: null,
      lastRxAt: null,
      connectedAt: null,
    });
    packetIdRef.current = 0;

    try {
      const ws = new WebSocket(activeWsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        const now = Date.now();
        setStatus("CONNECTED");
        setStats((prev) => ({
          ...prev,
          connectedAt: now,
        }));
      };

      ws.onmessage = (event) => {
        if (typeof event.data !== "string") {
          return;
        }

        try {
          const message = JSON.parse(event.data);
          if (message.type === "STATUS") {
            setStatus(message.status);
            if (message.status === 'SHARD_LIST_COMPLETE') {
              setShardListReceived(true);
            }
            // IN_GAME trae datos del jugador (posición, hp, etc.)
            if (message.status === 'IN_GAME' && message.detail) {
              setPlayerInfo(message.detail);
            }
            return;
          }

          if (message.type === "CAPTCHA") {
            setCaptchaImage(message.image || null);
            return;
          }

          if (message.type === "EVENT") {
            addEvent(message);
            return;
          }

          if (message.type === "PACKET") {
            setStatus("CONNECTED");
            if (message.stats) {
              setStats((prev) => ({
                rxPackets: message.stats.rxPackets || 0,
                txPackets: message.stats.txPackets || 0,
                lastOpcode: message.stats.lastOpcode || message.opcode,
                lastPacketAt: message.stats.lastPacketAt || message.timestamp,
                lastRxAt: message.stats.lastRxAt || (message.direction === "RX" ? message.timestamp : null),
                connectedAt: prev.connectedAt,
              }));
            } else {
              setStats((prev) => ({
                rxPackets: message.direction === "RX" ? prev.rxPackets + 1 : prev.rxPackets,
                txPackets: message.direction === "TX" ? prev.txPackets + 1 : prev.txPackets,
                lastOpcode: message.opcode,
                lastPacketAt: message.timestamp,
                lastRxAt: message.direction === "RX" ? message.timestamp : prev.lastRxAt,
                connectedAt: prev.connectedAt,
              }));
            }
            addPacket(message);
          }
        } catch (err) {
          setErrorMsg(`Mensaje WS no valido: ${event.data.slice(0, 80)}`);
        }
      };

      ws.onclose = () => {
        setStatus((prev) => (prev === "ERROR" ? "ERROR" : "SESSION_CLOSED"));
        socketRef.current = null;
      };

      ws.onerror = () => {
        setStatus("ERROR");
        setErrorMsg("No se pudo conectar al Gateway WebSocket.");
      };
    } catch (err) {
      setStatus("ERROR");
      setErrorMsg(err.message || "Error al inicializar WebSocket.");
    }
  };

  const handleDisconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setStatus("DISCONNECTED");
  };

  const handleLogin = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setErrorMsg("WebSocket no conectado.");
      return;
    }

    socketRef.current.send(JSON.stringify({
      type: "LOGIN",
      username: account,
      password,
    }));
  };

  const handleSelectCharacter = (characterName) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setErrorMsg("WebSocket no conectado.");
      return;
    }

    socketRef.current.send(JSON.stringify({
      type: "CHARACTER_SELECT",
      characterName,
    }));
  };

  const handleDisconnectCharacter = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setErrorMsg("WebSocket no conectado.");
      return;
    }
    socketRef.current.send(JSON.stringify({
      type: "DISCONNECT_CHARACTER",
    }));
    setPlayerInfo(null);
  };

  const handleCaptchaSend = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setErrorMsg("WebSocket no conectado.");
      return;
    }
    socketRef.current.send(JSON.stringify({
      type: "CAPTCHA_REPLY",
      code: captchaCode,
    }));
    setCaptchaImage(null);
    setCaptchaCode("");
  };

  const handleClear = () => {
    setPackets([]);
    packetIdRef.current = 0;
  };

  // Enviar mensaje de chat al servidor
  const handleChatSend = (chatType, message, target) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    
    socketRef.current.send(JSON.stringify({
      type: 'CHAT_SEND',
      chatType,
      message,
      target: target || '',
    }));

    // Agregar localmente con el nombre del jugador
    setChatMessages((prev) => [
      ...prev.slice(-199),
      {
        id: Date.now() + Math.random(),
        chatType,
        charname: playerInfo?.playerName || playerInfo?.name || 'Yo',
        message,
        uniqueID: null,
        timestamp: Date.now(),
        direction: 'TX',
      },
    ]);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(packets, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blackrose-packets-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = () => {
    switch (status) {
      case "CONNECTED":
        return "#2f9e44";
      case "TCP_OPEN":
        return "#1971c2";
      case "CONNECTING":
        return "#f08c00";
      case "SESSION_CLOSED":
        return "#7048e8";
      case "SERVER_IDLE":
        return "#c92a2a";
      case "HANDSHAKE":
        return "#6741d9";
      case "HANDSHAKE_COMPLETE":
        return "#0ca678";
      case "LOGIN_SENT":
        return "#1864ab";
      case "LOGIN_OK":
        return "#2b8a3e";
      case "LOGIN_FAILED":
        return "#c92a2a";
      case "AGENT_REDIRECT":
        return "#087f5b";
      case "ERROR":
        return "#e03131";
      default:
        return "#868e96";
    }
  };

  // Agrupar paquetes consecutivos iguales: 0x2002(5), 0x3019(3), etc.
  const groupedPackets = [];
  for (let i = 0; i < packets.length; i++) {
    const prev = groupedPackets[groupedPackets.length - 1];
    if (prev && prev.opcode === packets[i].opcode && prev.direction === packets[i].direction) {
      prev.count = (prev.count || 1) + 1;
      prev.lastId = packets[i]._id;
      prev.lastTime = packets[i].timestamp;
      prev.lastSize = packets[i].size;
    } else {
      groupedPackets.push({ ...packets[i], count: 1, lastId: packets[i]._id, lastTime: packets[i].timestamp, lastSize: packets[i].size });
    }
  }

  const SX = {
    root: {
      width: "100%",
      maxWidth: "1400px",
      height: "100vh",
      overflow: "hidden",
      paddingTop: "8px",
      paddingBottom: "8px",
      background: "#0a0b0f",
      color: "#f0f1f3",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      fontSize: "11px",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
    },
    // ─── NAVBAR ───
    navbar: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "6px 10px",
      background: "linear-gradient(180deg, #12141c 0%, #0e1017 100%)",
      borderBottom: "1px solid #1e2330",
      flexWrap: "wrap",
    },
    logo: { fontWeight: "bold", fontSize: "13px", color: "#e9ecef", letterSpacing: "0.3px" },
    urlChip: {
      background: "#161a24",
      border: "1px solid #1e2330",
      borderRadius: "4px",
      padding: "3px 10px",
      color: "#91a7ff",
      fontSize: "10px",
    },
    chipGroup: { display: "flex", gap: "5px", marginLeft: "auto", alignItems: "center" },
    chip: (bg, color) => ({
      background: bg,
      color,
      border: "none",
      borderRadius: "4px",
      padding: "2px 8px",
      fontSize: "10px",
      fontWeight: "bold",
      lineHeight: "1.6",
    }),
    badge: (color) => ({
      background: color,
      color: "#fff",
      borderRadius: "4px",
      padding: "2px 10px",
      fontSize: "10px",
      fontWeight: "bold",
      lineHeight: "1.6",
    }),
    // ─── BODY 3 COLUMNAS (responsive) ───
    body: {
      display: "flex",
      flex: 1,
      minHeight: 0,
      overflow: "hidden",
      gap: "4px",
      padding: "6px 4px",
    },
    // ─── COLUMNA IZQUIERDA: PANEL CONTROL ───
    leftCol: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      padding: "6px 8px",
      overflowY: "auto",
      overflowX: "hidden",
      flex: "0 0 280px",
      width: "280px",
      maxHeight: "100%",
      boxSizing: "border-box",
      border: "1px solid #1e2330",
      borderRadius: "6px",
      background: "#0b0d14",
    },
    input: {
      padding: "4px 6px",
      background: "#0e1017",
      color: "#f0f1f3",
      border: "1px solid #1e2330",
      borderRadius: "4px",
      fontSize: "11px",
      fontFamily: "inherit",
      outline: "none",
      width: "100%",
      boxSizing: "border-box",
    },
    btn: (bg = "#1e2330", color = "#e9ecef", disabled = false) => ({
      padding: "4px 8px",
      cursor: disabled ? "not-allowed" : "pointer",
      background: disabled ? "#0e1017" : bg,
      color: disabled ? "#3c4048" : color,
      border: `1px solid ${disabled ? "#1a1d23" : "#2a3040"}`,
      borderRadius: "4px",
      fontSize: "10px",
      fontFamily: "inherit",
      fontWeight: "bold",
      lineHeight: "1.4",
      width: "100%",
      boxSizing: "border-box",
      opacity: disabled ? 0.4 : 1,
    }),
    label: { color: "#6c727c", fontSize: "9px", marginBottom: "1px", textTransform: "uppercase", letterSpacing: "0.4px" },
    // ─── COLUMNA CENTRAL: MONITOR ───
    midCol: {
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      flex: "1 1 0",
      minWidth: 0,
      border: "1px solid #1e2330",
      borderRadius: "6px",
      background: "#0b0d14",
      padding: "6px",
    },
    monHeader: {
      display: "grid",
      gridTemplateColumns: "28px 32px 1fr 1fr",
      gap: "2px",
      padding: "4px 6px",
      background: "#0e1017",
      border: "1px solid #1e2330",
      borderRadius: "6px 6px 0 0",
      fontWeight: "bold",
      color: "#6c727c",
      fontSize: "9px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      flexShrink: 0,
    },
    monBody: {
      flex: "1 1 0",
      overflowY: "auto",
      overflowX: "hidden",
      background: "#080a0e",
      border: "1px solid #1e2330",
      borderTop: "none",
      borderRadius: "0 0 6px 6px",
      minHeight: "100px",
    },
    monRow: {
      display: "grid",
      gridTemplateColumns: "28px 32px 1fr 1fr",
      gap: "2px",
      padding: "2px 6px",
      borderBottom: "1px solid #0e1118",
      alignItems: "center",
      lineHeight: "1.5",
      fontSize: "10px",
    },
    // ─── COLUMNA DERECHA: CHAT + EVENTOS ───
    rightCol: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      flex: "0 0 300px",
      width: "300px",
      minWidth: 0,
      maxHeight: "100%",
      overflow: "hidden",
    },
    panel: {
      background: "#0b0d14",
      border: "1px solid #1e2330",
      borderRadius: "6px",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      flex: 1,
      minHeight: 0,
    },
    panelHead: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "4px 8px",
      background: "#0e1017",
      borderBottom: "1px solid #1e2330",
      flexShrink: 0,
    },
    panelTitle: { color: "#748ffc", fontWeight: "bold", fontSize: "10px", letterSpacing: "0.4px", textTransform: "uppercase" },
    panelBody: { flex: 1, overflowY: "auto", padding: "4px 8px", minHeight: 0 },
    errorBox: {
      color: "#ffc9c9",
      background: "#2a0a0a",
      border: "1px solid #5c1a1a",
      padding: "4px 8px",
      borderRadius: "4px",
      flexShrink: 0,
      fontSize: "10px",
    },
    successBox: {
      color: "#b7f5b0",
      background: "#0a2a0a",
      border: "1px solid #1a5c1a",
      padding: "4px 8px",
      borderRadius: "4px",
      flexShrink: 0,
      fontSize: "10px",
    },
    charCard: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "4px 8px",
      background: "#0e1017",
      border: "1px solid #1e2330",
      borderRadius: "4px",
      marginBottom: "3px",
    },
    infoLabel: {
      color: "#6c727c",
      fontSize: "10px",
      fontWeight: 600,
    },
    infoValue: {
      color: "#e9ecef",
      fontSize: "11px",
      fontWeight: 700,
      textAlign: "right",
      wordBreak: "break-all",
    },
    // ── Panel izquierdo mejorado ──
    statusBar: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 8px",
      background: "#0e1017",
      borderRadius: "6px",
      border: "1px solid #1e2330",
      marginBottom: "6px",
    },
    statusDot: (color) => ({
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      background: color,
      flexShrink: 0,
      boxShadow: `0 0 6px ${color}`,
    }),
    statsMini: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "3px",
      marginBottom: "6px",
    },
    statChip: (bg, fg) => ({
      background: bg,
      color: fg,
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "10px",
      fontWeight: 600,
      textAlign: "center",
      fontFamily: "monospace",
    }),
    sectionHeader: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      color: "#748ffc",
      fontSize: "10px",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "4px",
      marginTop: "6px",
    },
    compactInput: {
      width: "100%",
      background: "#080a0e",
      color: "#e9ecef",
      border: "1px solid #1e2330",
      borderRadius: "4px",
      padding: "5px 8px",
      fontSize: "11px",
      fontFamily: "inherit",
      outline: "none",
      boxSizing: "border-box",
    },
    compactRow: {
      display: "grid",
      gridTemplateColumns: "1fr auto",
      gap: "3px",
      alignItems: "center",
    },
    playerMiniCard: {
      background: "#0a1a0f",
      border: "1px solid #1a5c1a",
      borderRadius: "6px",
      padding: "6px 8px",
      marginBottom: "4px",
    },
    playerPlaceholder: {
      background: "#0e1017",
      border: "1px solid #1e2330",
      borderRadius: "6px",
      padding: "8px",
      textAlign: "center",
      color: "#3c4048",
      fontSize: "10px",
    },
  };

  return (
    <div style={SX.root}>
      {/* ─── NAVBAR ─── */}
      <div style={SX.navbar}>
        <span style={SX.logo}>⬡ BlackRose Gateway</span>
        <span style={SX.urlChip}>{activeWsUrl}</span>
        <div style={SX.chipGroup}>
          <span style={SX.chip("#1a1f2a", "#ffd43b")}>{stats.lastOpcode || "----"}</span>
          <span style={SX.chip("#1a2a1a", "#51cf66")}>RX {stats.rxPackets}</span>
          <span style={SX.chip("#1a1a2a", "#4dabf7")}>TX {stats.txPackets}</span>
          <span style={SX.chip("#1a1f2a", "#da77f2")}>
            {playerInfo ? `Lv${playerInfo.level}` : "Lv—"}
          </span>
          <span style={{ background: getStatusColor(), color: "#fff", borderRadius: "4px", padding: "2px 10px", fontSize: "10px", fontWeight: "bold" }}>{status}</span>
          {loginSuccess && <span style={{ background: "#0a2a0a", color: "#b7f5b0", border: "1px solid #1a5c1a", borderRadius: "4px", padding: "2px 8px", fontSize: "10px", fontWeight: "bold" }}>✅ Login OK</span>}
        </div>
      </div>

      {/* ─── BODY 3 COLUMNAS ─── */}
      <div style={SX.body}>
        {/* ═══ COLUMNA IZQUIERDA: PANEL CONTROL (40%) ═══ */}
        <div style={SX.leftCol}>
          {/* ── Conectar / Desconectar ── */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
            <button onClick={handleConnect} style={{ ...SX.btn("#2b8a3e", "#fff"), padding: "3px 8px", fontSize: "10px", width: "auto", flex: 1 }}>🔌 Conectar</button>
            <button onClick={handleDisconnect} style={{ ...SX.btn("#c92a2a", "#fff"), padding: "3px 8px", fontSize: "10px", width: "auto", flex: 1 }}>⏏ Desconectar</button>
          </div>

          {/* ── Login: usuario + contraseña + botón en una línea ── */}
          <div style={SX.sectionHeader}>🔑 Login</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "4px", marginBottom: "6px" }}>
            <input type="text" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Usuario" style={SX.compactInput} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" style={SX.compactInput} />
            <button onClick={handleLogin} disabled={!shardListReceived} style={{ ...SX.btn("#1971c2", "#fff", !shardListReceived), width: "auto", padding: "5px 14px" }}>Login</button>
          </div>

          {/* ── Captcha en una línea ── */}
          <div style={SX.sectionHeader}>🔐 Captcha</div>
          {captchaImage ? (
            <img src={captchaImage} alt="captcha" style={{ width: "100%", borderRadius: "4px", border: "1px solid #1e2330", background: "#fff", maxHeight: "48px", objectFit: "contain", marginBottom: "4px" }} />
          ) : (
            <div style={{ color: "#3c4048", fontSize: "9px", marginBottom: "4px" }}>Esperando captcha...</div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "4px", marginBottom: "6px" }}>
            <input type="text" value={captchaCode} onChange={(e) => setCaptchaCode(e.target.value)} placeholder="Código" style={SX.compactInput} />
            <button onClick={handleCaptchaSend} style={{ ...SX.btn("#1971c2", "#fff", false), width: "auto", padding: "5px 14px" }}>Enviar</button>
          </div>

          {/* ── Personajes ── */}
          <div style={SX.sectionHeader}>👤 Personajes ({characters.length})</div>
          {loginError && <div style={{ ...SX.errorBox, marginBottom: "4px", fontSize: "10px" }}>{loginError}</div>}
          {characters.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "4px", marginBottom: "6px" }}>
              <select
                id="char-select"
                style={{
                  background: "#080a0e",
                  color: "#e9ecef",
                  border: "1px solid #1e2330",
                  borderRadius: "4px",
                  padding: "5px 6px",
                  fontSize: "11px",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                {characters.map((ch) => (
                  <option key={ch.index} value={ch.name}>
                    {ch.name} (Lv{ch.level || "?"})
                  </option>
                ))}
              </select>
              <button onClick={() => {
                const sel = document.getElementById("char-select");
                if (sel) handleSelectCharacter(sel.value);
              }} style={{ ...SX.btn("#2b8a3e", "#fff"), width: "auto", padding: "5px 14px" }}>Entrar</button>
            </div>
          ) : (
            <div style={{ color: "#6c727c", fontSize: "9px", marginBottom: "6px" }}>
              {loginSuccess ? "⏳ Cargando..." : shardListReceived ? "📡 Conectando..." : "🔌 Inicia sesión"}
            </div>
          )}

          {/* ── Jugador en mundo ── */}
          <div style={SX.sectionHeader}>🌍 Jugador</div>
          {playerInfo ? (
            <div style={SX.playerMiniCard}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "3px", fontSize: "10px" }}>
                <div><span style={{ color: "#6c727c" }}>Lv</span> <span style={{ color: "#ffd43b", fontWeight: 700 }}>{playerInfo.level || "?"}</span></div>
                <div><span style={{ color: "#6c727c" }}>HP</span> <span style={{ color: "#51cf66", fontWeight: 700 }}>{playerInfo.hp || "?"}</span></div>
                <div><span style={{ color: "#6c727c" }}>MP</span> <span style={{ color: "#339af0", fontWeight: 700 }}>{playerInfo.mp || "?"}</span></div>
                <div style={{ gridColumn: "1 / -1" }}><span style={{ color: "#6c727c" }}>Región</span> <span style={{ color: "#e9ecef", fontWeight: 700 }}>{playerInfo.region || "?"}</span></div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={{ color: "#6c727c" }}>Pos </span>
                  <span style={{ color: "#da77f2", fontWeight: 700, fontFamily: "monospace" }}>
                    ({typeof playerInfo.posX === 'number' ? Math.round(playerInfo.posX) : "?"}, {typeof playerInfo.posY === 'number' ? Math.round(playerInfo.posY) : "?"}, {typeof playerInfo.posZ === 'number' ? Math.round(playerInfo.posZ) : "?"})
                  </span>
                </div>
              </div>
              <button onClick={handleDisconnectCharacter} style={{ ...SX.btn("#c92a2a", "#fff"), marginTop: "6px", width: "100%" }}>↩ Desconectar personaje</button>
            </div>
          ) : (
            <div style={SX.playerPlaceholder}>
              {status === "IN_GAME" ? "⏳ Esperando spawn..." : "No has entrado al mundo"}
            </div>
          )}

          {/* ── Acciones ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px", marginTop: "8px" }}>
            <button onClick={handleClear} style={SX.btn()}>✕ Clear</button>
            <button onClick={() => setIsPaused((p) => !p)} style={SX.btn()}>{isPaused ? "▶" : "⏸"}</button>
            <button onClick={handleExport} style={SX.btn()}>↓ Export</button>
          </div>

          {/* ── Dev Mode ── */}
          <div style={{ paddingTop: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "5px", color: "#6c727c", fontSize: "10px", cursor: "pointer" }}>
              <input type="checkbox" checked={useLocalGateway} onChange={(e) => setUseLocalGateway(e.target.checked)} />
              Dev Mode (localhost)
            </label>
          </div>

          {errorMsg && <div style={{ ...SX.errorBox, marginTop: "4px" }}>{errorMsg}</div>}
        </div>

        {/* ═══ COLUMNA CENTRAL: MONITOR PAQUETES + ACCIONES ═══ */}
        <div style={SX.midCol}>

          {/* Monitor de paquetes — ocupa 55% */}
          <div style={{ flex: "0 0 55%", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
            <div style={SX.monHeader}>
              <span>#</span>
              <span>DIR</span>
              <span>OPCODE</span>
              <span>TIME</span>
            </div>
            <div ref={monitorRef} style={SX.monBody}>
              {packets.length === 0 ? (
                <div style={{ color: "#3c4048", textAlign: "center", paddingTop: "35%", fontSize: "11px" }}>Esperando paquetes...</div>
              ) : (
                groupedPackets.map((pkt, idx) => (
                  <div key={pkt._id} style={SX.monRow}>
                    <span style={{ color: "#5c6370" }}>{pkt.lastId || pkt._id}</span>
                    <span style={{ color: pkt.direction === "RX" ? "#51cf66" : "#4dabf7", fontWeight: "bold" }}>{pkt.direction}</span>
                    <span style={{ color: "#ffd43b" }}>
                      {pkt.opcode}{pkt.count > 1 ? <span style={{ color: "#ff922b", fontWeight: "bold", fontSize: "10px" }}> ({pkt.count})</span> : ''}
                    </span>
                    <span style={{ color: "#6c727c", fontSize: "10px" }}>{formatTime(pkt.lastTime || pkt.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Panel de Acciones — ocupa 45% */}
          <div style={{ flex: "0 0 45%", minHeight: 0, overflow: "hidden" }}>
            <ActionPanel socketRef={socketRef} playerInfo={playerInfo} />
          </div>

        </div>

        {/* ═══ COLUMNA DERECHA: CHAT + EVENTOS (33%) ═══ */}
        <div style={SX.rightCol}>
          {/* Panel Chat */}
          <div style={{ ...SX.panel, flex: "1 1 60%", display: "flex", flexDirection: "column", minHeight: "200px" }}>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <ChatBox
                chatMessages={chatMessages}
                onChatSend={handleChatSend}
                playerInfo={playerInfo}
                embedded={true}
              />
            </div>
          </div>

          {/* Panel Eventos */}
          <div style={{ ...SX.panel, flex: "1 1 40%" }}>
            <div style={SX.panelHead}>
              <span style={SX.panelTitle}>⚡ Eventos</span>
              <span style={{ color: "#6c727c", fontSize: "9px" }}>{events.length}</span>
            </div>
            <div style={SX.panelBody}>
              {events.length === 0 ? (
                <div style={{ color: "#3c4048", padding: "20px 0", textAlign: "center", fontSize: "10px" }}>Esperando eventos...</div>
              ) : (
                events.map((ev) => (
                  <div key={ev._id} style={{ display: "flex", justifyContent: "space-between", gap: "6px", padding: "3px 0", borderBottom: "1px solid #0e1118", alignItems: "center" }}>
                    <span style={{ color: "#e9ecef", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "10px" }}>{ev.message}</span>
                    <span style={{ color: "#5c6370", fontSize: "9px", whiteSpace: "nowrap", flexShrink: 0 }}>{formatTime(ev.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
