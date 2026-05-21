/**
 * CONNECTION TESTER - FRONTEND LOGIN EXAMPLE
 * 
 * Este archivo muestra cómo integrar el LoginHandler en el frontend
 * Para implementarlo, actualiza tu ConnectionTester.jsx con este código
 */

import React, { useState, useEffect, useRef } from 'react';

export function LoginExample() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [serverId, setServerId] = useState('64');
  const [locale, setLocale] = useState('130');

  const [loginStatus, setLoginStatus] = useState('IDLE');
  const [characters, setCharacters] = useState([]);
  const [selectedChar, setSelectedChar] = useState(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);

  const wsRef = useRef(null);

  useEffect(() => {
    // Conectar a WebSocket del gateway
    wsRef.current = new WebSocket('ws://localhost:8081');

    wsRef.current.onopen = () => {
      addLog('✅ WebSocket conectado');
      setLoginStatus('CONNECTED');
    };

    wsRef.current.onmessage = (event) => {
      try {
        // Mensajes JSON desde el gateway (parseo de opcodes)
        const message = JSON.parse(event.data);
        handleServerMessage(message);
      } catch (err) {
        // Si no es JSON, es binario (ignorar)
        addLog('📦 Paquete binario recibido (ignorado en frontend)');
      }
    };

    wsRef.current.onerror = (err) => {
      addLog('❌ Error WebSocket: ' + err);
      setError('Error de conexión');
    };

    wsRef.current.onclose = () => {
      addLog('🔌 WebSocket cerrado');
      setLoginStatus('DISCONNECTED');
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const addLog = (message) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleServerMessage = (message) => {
    if (message.type === 'STATUS') {
      switch (message.status) {
        case 'LOGIN_OK':
          addLog(`✅ Login exitoso! SessionId: ${message.detail.sessionId}`);
          addLog(`🖥️ Agent Server: ${message.detail.host}:${message.detail.port}`);
          setLoginStatus('LOGIN_OK');
          // Auto-solicitar lista de personajes
          setTimeout(() => requestCharacterList(), 500);
          break;

        case 'LOGIN_FAILED':
          const errorMsg = `❌ Login fallido: ${message.detail.error} (code: ${message.detail.code})`;
          addLog(errorMsg);
          setError(message.detail.error);
          setLoginStatus('LOGIN_FAILED');
          break;

        case 'CHARACTER_LIST_RECEIVED':
          addLog(`👥 Personajes recibidos: ${message.detail.charCount}`);
          const characterList = message.detail.characters.map((char, idx) => ({
            index: idx,
            name: char.name,
            level: char.level,
            exp: char.exp,
            hp: char.hp,
            mp: char.mp,
            deleted: char.deleted,
          }));
          setCharacters(characterList);
          setLoginStatus('CHARACTER_LIST_RECEIVED');
          break;

        case 'CHARACTER_SELECT_OK':
          addLog(`🎮 Personaje seleccionado! Entrando al mundo...`);
          setLoginStatus('PLAYING');
          break;

        default:
          addLog(`📨 Status: ${message.status}`);
      }
    } else if (message.type === 'PACKET') {
      // Paquete con parsing automático
      addLog(
        `🔹 Opcode: ${message.opcode} (${message.opcodeName}) - ${message.direction}`
      );
      if (message.parsed) {
        addLog(`  └─ Datos parseados: ${JSON.stringify(message.parsed).substring(0, 100)}`);
      }
    }
  };

  const sendLogin = async () => {
    if (!username || !password) {
      setError('Usuario y contraseña requeridos');
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const loginData = {
        type: 'LOGIN',
        username,
        password,
        serverId: parseInt(serverId),
        locale: parseInt(locale),
      };

      addLog(`📤 Enviando LOGIN: ${username}@${serverId}`);
      wsRef.current.send(JSON.stringify(loginData));
      setLoginStatus('LOGIN_SENT');
      setError('');
    } else {
      setError('WebSocket no conectado');
    }
  };

  const requestCharacterList = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      addLog('📤 Solicitando lista de personajes');
      wsRef.current.send(
        JSON.stringify({
          type: 'REQUEST_CHARACTER_LIST',
        })
      );
    }
  };

  const selectCharacter = (charName) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      addLog(`📤 Seleccionando personaje: ${charName}`);
      wsRef.current.send(
        JSON.stringify({
          type: 'CHARACTER_SELECT',
          characterName: charName,
        })
      );
      setSelectedChar(charName);
    }
  };

  const selectFirstAvailable = () => {
    const available = characters.find((c) => !c.deleted);
    if (available) {
      selectCharacter(available.name);
    } else {
      setError('No hay personajes disponibles');
    }
  };

  return (
    <div style={styles.container}>
      <h1>🎮 Silkroad Login Tester</h1>

      {/* LOGIN FORM */}
      <div style={styles.section}>
        <h2>Login</h2>
        <div style={styles.formGroup}>
          <label>Usuario:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="tu_usuario"
            disabled={loginStatus !== 'CONNECTED' && loginStatus !== 'LOGIN_FAILED'}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label>Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="tu_contraseña"
            disabled={loginStatus !== 'CONNECTED' && loginStatus !== 'LOGIN_FAILED'}
            style={styles.input}
          />
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label>Servidor ID:</label>
            <input
              type="number"
              value={serverId}
              onChange={(e) => setServerId(e.target.value)}
              disabled={loginStatus !== 'CONNECTED' && loginStatus !== 'LOGIN_FAILED'}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label>Locale:</label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              disabled={loginStatus !== 'CONNECTED' && loginStatus !== 'LOGIN_FAILED'}
              style={styles.input}
            >
              <option value="130">Vietnam (130)</option>
              <option value="131">China (131)</option>
              <option value="132">Japan (132)</option>
              <option value="133">Korea (133)</option>
            </select>
          </div>
        </div>

        <button
          onClick={sendLogin}
          disabled={
            loginStatus === 'LOGIN_SENT' ||
            loginStatus === 'PLAYING' ||
            loginStatus === 'CHARACTER_LIST_RECEIVED'
          }
          style={styles.button}
        >
          {loginStatus === 'LOGIN_SENT' ? '⏳ Esperando...' : '🔑 Login'}
        </button>

        {error && <div style={styles.error}>{error}</div>}
        <div style={styles.status}>Estado: {loginStatus}</div>
      </div>

      {/* CHARACTER SELECTION */}
      {characters.length > 0 && (
        <div style={styles.section}>
          <h2>👥 Personajes ({characters.length})</h2>

          <table style={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Nivel</th>
                <th>HP</th>
                <th>MP</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {characters.map((char) => (
                <tr key={char.index} style={char.deleted ? styles.deleted : {}}>
                  <td>{char.name}</td>
                  <td>{char.level}</td>
                  <td>{char.hp}</td>
                  <td>{char.mp}</td>
                  <td>{char.deleted ? '🗑️ Eliminado' : '✅ Disponible'}</td>
                  <td>
                    <button
                      onClick={() => selectCharacter(char.name)}
                      disabled={char.deleted || selectedChar === char.name}
                      style={styles.selectBtn}
                    >
                      {selectedChar === char.name ? '✓' : 'Seleccionar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={selectFirstAvailable} style={styles.button}>
            Auto-seleccionar disponible
          </button>
        </div>
      )}

      {/* LOGS */}
      <div style={styles.section}>
        <h2>📋 Logs</h2>
        <div style={styles.logs}>
          {logs.map((log, idx) => (
            <div key={idx} style={styles.logLine}>
              {log}
            </div>
          ))}
        </div>
        <button
          onClick={() => setLogs([])}
          style={{ ...styles.button, backgroundColor: '#888' }}
        >
          Limpiar logs
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '20px auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    padding: '20px',
    marginBottom: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  formGroup: {
    marginBottom: '15px',
  },
  formRow: {
    display: 'flex',
    gap: '20px',
  },
  input: {
    width: '100%',
    padding: '8px',
    marginTop: '5px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    marginTop: '10px',
  },
  selectBtn: {
    padding: '5px 10px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  error: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
  },
  status: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#e7f3ff',
    color: '#0066cc',
    borderRadius: '4px',
    fontWeight: 'bold',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '15px',
    backgroundColor: 'white',
  },
  deleted: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  logs: {
    backgroundColor: '#1e1e1e',
    color: '#00ff00',
    padding: '15px',
    borderRadius: '4px',
    fontFamily: 'Courier New, monospace',
    fontSize: '12px',
    height: '300px',
    overflowY: 'auto',
    marginBottom: '15px',
  },
  logLine: {
    marginBottom: '4px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};

export default LoginExample;
