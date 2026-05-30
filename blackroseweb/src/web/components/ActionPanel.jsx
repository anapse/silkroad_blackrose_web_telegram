import React, { useState } from 'react';
import '../styles/ActionPanel.css';

/**
 * Panel de acciones del juego.
 * Se coloca debajo del monitor de paquetes en la columna central.
 */
export default function ActionPanel({ socketRef, playerInfo, onSendPacket }) {
  const [stallTitle, setStallTitle] = useState('');
  const [stallGreeting, setStallGreeting] = useState('');
  const [stallOpen, setStallOpen] = useState(false);
  const [showStall, setShowStall] = useState(false);
  const [isSitting, setIsSitting] = useState(false);

  const sendPacket = (type, data = {}) => {
    if (!socketRef?.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ type, ...data }));
  };

  // ── STALL ──
  const handleCreateStall = () => {
    const title = stallTitle || `[${playerInfo?.playerName || 'Player'}]'s stall.`;
    const greeting = stallGreeting || `Welcome to [${playerInfo?.playerName || 'Player'}]'s stall.`;
    sendPacket('STALL_CREATE', { title, greeting });
    setStallOpen(true);
  };

  const handleOpenStall = () => {
    sendPacket('STALL_OPEN');
  };

  const handleModifyStall = () => {
    sendPacket('STALL_MODIFY');
  };

  const handleCloseStall = () => {
    sendPacket('STALL_CLOSE');
    setStallOpen(false);
    setShowStall(false);
  };

  // ── MOVEMENT ──
  const handleSitToggle = () => {
    if (isSitting) {
      sendPacket('GET_UP');
      setIsSitting(false);
    } else {
      sendPacket('SIT_DOWN');
      setIsSitting(true);
    }
  };

  if (!playerInfo) {
    return (
      <div className="action-panel">
        <div className="action-panel-header">🎮 Acciones</div>
        <div className="action-panel-empty">Conéctate al juego para usar acciones</div>
      </div>
    );
  }

  return (
    <div className="action-panel">
      <div className="action-panel-header">🎮 Acciones</div>

      <div className="action-panel-body">
        {/* ── Stall Section ── */}
        <div className="action-section">
          <div className="action-section-title" onClick={() => setShowStall(!showStall)}>
            <span>🏪 Stall</span>
            <span style={{ fontSize: '10px', color: '#666' }}>{showStall ? '▲' : '▼'}</span>
          </div>

          {showStall && (
            <div className="action-section-content">
              {!stallOpen ? (
                <>
                  <input
                    type="text"
                    value={stallTitle}
                    onChange={(e) => setStallTitle(e.target.value)}
                    placeholder="Título del stall"
                    className="action-input"
                    maxLength={50}
                  />
                  <input
                    type="text"
                    value={stallGreeting}
                    onChange={(e) => setStallGreeting(e.target.value)}
                    placeholder="Mensaje de bienvenida"
                    className="action-input"
                    maxLength={100}
                  />
                  <button onClick={handleCreateStall} className="action-btn action-btn-primary">
                    Crear Stall
                  </button>
                </>
              ) : (
                <div className="action-btn-group">
                  <button onClick={handleOpenStall} className="action-btn action-btn-success">
                    Abrir Stall
                  </button>
                  <button onClick={handleModifyStall} className="action-btn action-btn-warning">
                    Modificar
                  </button>
                  <button onClick={handleCloseStall} className="action-btn action-btn-danger">
                    Cerrar Stall
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Movement Section ── */}
        <div className="action-section" style={{ opacity: 0.5 }}>
          <div className="action-section-title">🚶 Movimiento (WIP)</div>
          <div className="action-section-content">
            <button disabled className="action-btn" title="No soportado por este servidor">
              🧎 Sentarse / Levantarse
            </button>
          </div>
        </div>

        {/* ── Placeholder para más funciones ── */}
        <div className="action-section" style={{ opacity: 0.4 }}>
          <div className="action-section-title">🔜 Más funciones...</div>
        </div>
      </div>
    </div>
  );
}
