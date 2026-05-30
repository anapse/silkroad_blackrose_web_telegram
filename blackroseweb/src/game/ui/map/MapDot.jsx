import React, { memo } from 'react';

const MapDot = memo(({ type, label, size, x, y, zIndex, active, hov, onMouseEnter, onMouseLeave, onClick, zoom }) => {
  let bgColor = '#aaaaaa'; // Default grey
  let dotSize = (size || 6); // Tamaño base

  switch (type) {
    case 'mob':
      bgColor = '#ff4444'; // Rojo brillante para mobs
      break;
    case 'quest_npc':
      bgColor = '#44aaff'; // Azul claro para quest NPCs
      break;
    case 'player':
      bgColor = '#44ff44'; // Verde brillante para otros players
      dotSize = (size || 6) * 1.3; // Un poco más grande
      break;
    case 'unique_mob':
      bgColor = '#ff44ff'; // Magenta para mobs únicos
      dotSize = (size || 6) * 1.5; // Más grande para únicos
      break;
    case 'npc':
      bgColor = '#ffdd44'; // Amarillo dorado para NPCs
      break;
    case 'city':
      bgColor = '#44ddff'; // Cian para ciudades
      dotSize = (size || 6) * 2.5; // Más grande
      break;
    case 'fort':
      bgColor = '#ff8844'; // Naranja para fortalezas
      dotSize = (size || 6) * 2;
      break;
    default:
      bgColor = '#aaaaaa'; // Gris más claro
  }

  // Borde más claro para mejor visibilidad
  const borderColor = type === 'mob' ? '#ff8888' :
                      type === 'unique_mob' ? '#ff88ff' :
                      type === 'player' ? '#88ff88' :
                      type === 'npc' ? '#ffee88' :
                      type === 'quest_npc' ? '#88ccff' :
                      'rgba(255,255,255,0.3)';

  // Label visible debajo del punto, escala con el zoom
  const labelSize = Math.max(8, Math.min(14, 14 / (zoom || 1)));
  const labelOpacity = Math.min(1, Math.max(0.3, 1 / (zoom || 1)));

  return (
    <div style={{ position: 'absolute', left: x, top: y, zIndex: zIndex }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          backgroundColor: bgColor,
          border: `2px solid ${borderColor}`,
          transform: `translate(-50%,-50%) scale(${(hov && active) ? 1.5 : 1})`,
          transition: 'transform .15s',
          cursor: active ? 'pointer' : 'default',
          pointerEvents: active ? 'auto' : 'none',
          boxShadow: (hov && active) ? `0 0 ${dotSize}px ${bgColor}` : `0 0 ${dotSize * 0.4}px ${bgColor}`,
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        title={label}
      />
      {/* Label hover — solo visible al pasar el mouse */}
      {(hov && active) && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: dotSize / 2 + 4,
          transform: 'translateX(-50%)',
          padding: '2px 6px',
          background: 'rgba(0,0,0,0.85)',
          color: '#fff',
          fontSize: labelSize,
          borderRadius: 4,
          border: `1px solid ${borderColor || 'rgba(255,255,255,0.3)'}`,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          fontFamily: 'sans-serif',
          lineHeight: 1.2,
          boxShadow: '0 0 8px rgba(0,0,0,0.5)',
        }}>
          {label}
        </div>
      )}
    </div>
  );
});

export default MapDot;
