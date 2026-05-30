import React, { useState, useRef, useEffect } from 'react';
import '../styles/ChatBox.css';

/**
 * Colores oficiales de Silkroad Online:
 *   All    → #FFFFFF (blanco)
 *   PM     → #9FFFFE (cyan)
 *   Global → #FFFF00 (amarillo)
 *   Notice → #FFAEC3 (rosado)
 */
const CHAT_COLORS = {
  1: '#9FFFFE', // PM recibido
  2: '#9FFFFE', // PM enviado
  3: '#FFFFFF', // All
  6: '#FFFF00', // Global
  7: '#FFAEC3', // Notice
};

export default function ChatBox({ chatMessages = [], onChatSend, playerInfo, embedded = false }) {
  const [inputText, setInputText] = useState('');
  const [chatMode, setChatMode] = useState(3);
  const [privateTarget, setPrivateTarget] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text || !onChatSend) return;
    onChatSend(chatMode, text, chatMode === 2 ? privateTarget : '');
    setInputText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNameClick = (charname) => {
    if (!charname || charname === 'Notice' || charname === playerInfo?.playerName) return;
    setPrivateTarget(charname);
    setChatMode(2);
    inputRef.current?.focus();
  };

  /**
   * Formatea un mensaje como en Silkroad:
   *   All:       nombre: mensaje
   *   PM RX:     nombre(From): mensaje
   *   PM TX:     nombre(To): mensaje
   *   Global:    [Global] nombre: mensaje
   *   Notice:    [Notice] mensaje
   */
  const formatMessage = (msg) => {
    const name = msg.charname || '???';
    const cleanName = name.startsWith('[UID:') ? '???' : name;
    const text = msg.message || '';
    const isMine = msg.direction === 'TX';

    switch (msg.chatType) {
      case 1: // PM recibido
        return { prefix: `${cleanName}(From): `, suffix: text, color: CHAT_COLORS[1] };
      case 2: // PM enviado
        return { prefix: isMine ? `${cleanName}(To): ` : `${cleanName}(From): `, suffix: text, color: CHAT_COLORS[2] };
      case 6: // Global
        return { prefix: `[Global] ${cleanName}: `, suffix: text, color: CHAT_COLORS[6] };
      case 7: // Notice
        return { prefix: '[Notice] ', suffix: text, color: CHAT_COLORS[7] };
      case 3: // All
      default:
        return { prefix: `${cleanName}: `, suffix: text, color: '#FFFFFF' };
    }
  };

  const getLineStyle = (msg) => {
    const isMine = msg.direction === 'TX';
    return {
      backgroundColor: isMine && msg.chatType === 2 ? 'rgba(255,255,255,0.04)' : 'transparent',
      padding: '1px 6px',
      borderRadius: '2px',
      marginBottom: '1px',
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      lineHeight: '1.5',
      wordBreak: 'break-word',
      textAlign: 'left',
    };
  };

  const filteredMessages = chatMessages.filter((msg) => {
    if (chatMode === 3) return true; // All = mostrar todo
    if (chatMode === 6) return msg.chatType === 6; // Global
    if (chatMode === 2) return msg.chatType === 1 || msg.chatType === 2; // PM
    return true;
  });

  return (
    <div className={`chatbox-container${embedded ? ' chatbox-embedded' : ''}`}>
      <div className="chatbox-header">
        <span>💬 Chat</span>
        <div className="chatbox-modes">
          <button className={`chat-mode-btn ${chatMode === 3 ? 'active' : ''}`} onClick={() => setChatMode(3)}>All</button>
          <button className={`chat-mode-btn ${chatMode === 6 ? 'active' : ''}`} onClick={() => setChatMode(6)} style={{ color: '#FFFF00' }}>Global</button>
          <button className={`chat-mode-btn ${chatMode === 2 ? 'active' : ''}`} onClick={() => setChatMode(2)} style={{ color: '#9FFFFE' }}>PM</button>
        </div>
      </div>

      {chatMode === 2 && (
        <div className="chatbox-target">
          <span style={{ color: '#9FFFFE', fontSize: '12px' }}>Para:</span>
          <input type="text" value={privateTarget} onChange={(e) => setPrivateTarget(e.target.value)} placeholder="Click en un nombre o escribe" className="chatbox-target-input" />
        </div>
      )}

      <div className="chatbox-messages">
        {chatMessages.length === 0 && (
          <div className="chatbox-empty">
            {!playerInfo ? 'Conéctate al juego para usar el chat' : 'Click en un nombre para responder por PM'}
          </div>
        )}
        {filteredMessages.map((msg) => {
          const { prefix, suffix, color } = formatMessage(msg);
          return (
            <div key={msg.id} style={getLineStyle(msg)} className="chat-msg-line">
              <span style={{ color }}>{prefix}</span>
              <span style={{ color }}>{suffix}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {playerInfo ? (
        <div className="chatbox-input-area">
          <input ref={inputRef} type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={chatMode === 2 ? `Mensaje para ${privateTarget || '...'}...` : chatMode === 6 ? 'Mensaje global...' : 'Escribe un mensaje...'}
            className="chatbox-input" maxLength={200} />
          <button onClick={sendMessage} className="chatbox-send-btn">Enviar</button>
        </div>
      ) : (
        <div className="chatbox-input-area">
          <input type="text" disabled placeholder="Conéctate al juego para enviar mensajes" className="chatbox-input" style={{ opacity: 0.5 }} />
          <button disabled className="chatbox-send-btn" style={{ opacity: 0.3 }}>Enviar</button>
        </div>
      )}
    </div>
  );
}
