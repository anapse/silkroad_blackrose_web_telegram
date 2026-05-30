import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useGameSocket } from '../../../shared/context/GameSocketContext.jsx';
import './sro-window-base.css';
import './CharacterWindow.css';

const CharacterWindow = ({ onClose }) => {
  const { playerState } = useGameSocket();
  const [pos, setPos] = useState({ x: 0, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const windowRef = useRef(null);

  useLayoutEffect(() => {
    if (windowRef.current) {
      const containerWidth = windowRef.current.offsetWidth;
      const viewportWidth = document.documentElement.clientWidth;
      setPos({
        x: Math.max(0, (viewportWidth - containerWidth) / 2),
        y: 50,
      });
      setReady(true);
    }
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartPos.current = {
      x: clientX - pos.x,
      y: clientY - pos.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setPos({
        x: clientX - dragStartPos.current.x,
        y: clientY - dragStartPos.current.y
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  // Datos desde playerState del WebSocket
  const ps = playerState || {};
  const hp = ps.hp ?? 0;
  const maxHp = ps.maxHp ?? 1;
  const mp = ps.mp ?? 0;
  const maxMp = ps.maxMp ?? 1;

  return (
    <div
      ref={windowRef}
      className="sro-window-container character-window"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        visibility: ready ? 'visible' : 'hidden',
      }}
    >
      {/* ═══ HEADER — "Action" ═══ */}
      <div
        className="sro-window-header"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'move' }}
      >
        <span className="sro-window-title">Action</span>
        <button className="sro-window-close" onClick={onClose}>×</button>
      </div>

      <div className="sro-window-content">

        {/* ═══ NAME & LEVEL BAR ═══ */}
        <div className="char-name-bar">
          <span className="char-name">{ps.name ?? '?'}</span>
          <span className="char-level">Lv {ps.level ?? 0}</span>
        </div>

        {/* ═══ EXPERIENCE ROW ═══ */}
        <div className="char-exp-row">
          <div className="char-exp-block">
            <span className="label-gold">Current Exp.</span>
            <span className="value-green">{ps.currentExp ?? 0}</span>
          </div>
          <div className="char-exp-block">
            <span className="label-gold">Next Exp.</span>
            <span className="value-green">{ps.nextExp ?? 0}</span>
          </div>
        </div>

        {/* ═══ STAT / HONOR ROW ═══ */}
        <div className="char-stat-honor-row">
          <div className="char-stat-honor-block">
            <span className="label-gold">Stat Point</span>
            <span className="value-yellow">{ps.statPoint ?? 0}</span>
          </div>
          <div className="char-stat-honor-block">
            <span className="label-gold">Honor Point</span>
            <span className="value-yellow">{ps.honorPoint ?? 'N/A'}</span>
          </div>
        </div>

        {/* ═══ STR / INT + HP/MP BARS ═══ */}
        <div className="char-str-int-grid">
          {/* STR row */}
          <div className="char-stat-bar-row">
            <span className="label-white">Str</span>
            <button className="stat-plus-btn">+</button>
            <span className="value-white">{ps.str ?? 0}</span>
            <div className="char-hp-bar-outer">
              <div className="char-hp-bar-fill" style={{ width: `${Math.round((hp / maxHp) * 100)}%` }}></div>
              <span className="bar-text">{hp} / {maxHp}</span>
            </div>
          </div>
          {/* INT row */}
          <div className="char-stat-bar-row">
            <span className="label-white">Int</span>
            <button className="stat-plus-btn">+</button>
            <span className="value-white">{ps.int ?? 0}</span>
            <div className="char-mp-bar-outer">
              <div className="char-mp-bar-fill" style={{ width: `${Math.round((mp / maxMp) * 100)}%` }}></div>
              <span className="bar-text">{mp} / {maxMp}</span>
            </div>
          </div>
        </div>

        {/* ═══ DETAILED STATS — 2-COLUMN GRID ═══ */}
        <div className="char-detailed-grid">
          {/* LEFT COLUMN */}
          <div className="char-detailed-col">
            <div className="char-stat-line">
              <span className="label-gold">Phy. atk.</span>
              <span className="value-white">{ps.phyAtk ?? '?'}</span>
            </div>
            <div className="char-stat-line">
              <span className="label-gold">Phy. def.</span>
              <span className="value-white">{ps.phyDef ?? 0}</span>
            </div>
            <div className="char-stat-line">
              <span className="label-gold">Phy. balance</span>
              <span className="value-white">{ps.phyBalance ?? '?'}</span>
            </div>
            <div className="char-stat-line">
              <span className="label-gold">Hit rate</span>
              <span className="value-white">{ps.hitRate ?? 0}</span>
            </div>
          </div>
          {/* RIGHT COLUMN */}
          <div className="char-detailed-col">
            <div className="char-stat-line">
              <span className="label-gold">Mag. atk.</span>
              <span className="value-white">{ps.magAtk ?? '?'}</span>
            </div>
            <div className="char-stat-line">
              <span className="label-gold">Mag. def.</span>
              <span className="value-white">{ps.magDef ?? 0}</span>
            </div>
            <div className="char-stat-line">
              <span className="label-gold">Mag. balance</span>
              <span className="value-white">{ps.magBalance ?? '?'}</span>
            </div>
            <div className="char-stat-line">
              <span className="label-gold">Parry ratio</span>
              <span className="value-white">{ps.parryRatio ?? 0}</span>
            </div>
          </div>
        </div>

        {/* ═══ SEPARATOR ═══ */}
        <div className="char-separator"></div>

        {/* ═══ JOB SECTION ═══ */}
        <div className="char-job-section">
          <div className="char-job-row">
            <span className="label-gold">Job alias</span>
            <span className="value-white">{ps.jobAlias ?? '&lt;Nothing&gt;'}</span>
          </div>
          <div className="char-job-row">
            <span className="label-gold">Job level</span>
            <span className="value-white">{ps.jobLevel ?? '&lt;Nothing&gt;'}</span>
          </div>
          <div className="char-job-row">
            <span className="label-gold">Job experience</span>
            <div className="char-job-exp-bar-outer">
              <div className="char-job-exp-fill" style={{ width: `${ps.jobExp ?? 0}%` }}></div>
              <span className="bar-text">{ps.jobExp ?? 0}%</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CharacterWindow;