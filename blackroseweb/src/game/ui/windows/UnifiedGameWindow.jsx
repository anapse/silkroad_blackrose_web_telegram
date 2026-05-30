import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import './sro-window-base.css';
import './InventoryWindow.css';
import './CharacterWindow.css';
import './SkillWindow.css';
import InventoryWindow from './InventoryWindow.jsx';

/* ─────────────────────────────────────────
   CHARACTER CONTENT — Estilo clásico Silkroad 2005
   Layout fijo, pixel-perfect, compacto.
───────────────────────────────────────── */
const CharacterContent = ({ data }) => {
  const hp = data.hp ?? 0;
  const maxHp = data.maxHp ?? 1;
  const mp = data.mp ?? 0;
  const maxMp = data.maxMp ?? 1;
  return (
    <div className="sro-window-content">

      {/* NAME & LEVEL BAR */}
      <div className="char-name-bar">
        <span className="char-name">{data.name ?? '?'}</span>
        <span className="char-level">Lv {data.level ?? 0}</span>
      </div>

      {/* EXPERIENCE ROW */}
      <div className="char-exp-row">
        <div className="char-exp-block">
          <span className="label-gold">Current Exp.</span>
          <span className="value-green">{data.currentExp ?? 0}</span>
        </div>
        <div className="char-exp-block">
          <span className="label-gold">Next Exp.</span>
          <span className="value-green">{data.nextExp ?? 0}</span>
        </div>
      </div>

      {/* STAT / HONOR ROW */}
      <div className="char-stat-honor-row">
        <div className="char-stat-honor-block">
          <span className="label-gold">Stat Point</span>
          <span className="value-yellow">{data.statPoint ?? 0}</span>
        </div>
        <div className="char-stat-honor-block">
          <span className="label-gold">Honor Point</span>
          <span className="value-yellow">{data.honorPoint ?? 'N/A'}</span>
        </div>
      </div>

      {/* STR / INT + HP/MP BARS */}
      <div className="char-str-int-grid">
        <div className="char-stat-bar-row">
          <span className="label-white">Str</span>
          <button className="stat-plus-btn">+</button>
          <span className="value-white">{data.str ?? 0}</span>
          <div className="char-hp-bar-outer">
            <div className="char-hp-bar-fill" style={{ width: `${Math.round((hp / maxHp) * 100)}%` }}></div>
            <span className="bar-text">{hp} / {maxHp}</span>
          </div>
        </div>
        <div className="char-stat-bar-row">
          <span className="label-white">Int</span>
          <button className="stat-plus-btn">+</button>
          <span className="value-white">{data.int ?? 0}</span>
          <div className="char-mp-bar-outer">
            <div className="char-mp-bar-fill" style={{ width: `${Math.round((mp / maxMp) * 100)}%` }}></div>
            <span className="bar-text">{mp} / {maxMp}</span>
          </div>
        </div>
      </div>

      {/* DETAILED STATS — 2-COLUMN GRID */}
      <div className="char-detailed-grid">
        <div className="char-detailed-col">
          <div className="char-stat-line">
            <span className="label-gold">Phy. atk.</span>
            <span className="value-white">{data.phyAtk ?? '?'}</span>
          </div>
          <div className="char-stat-line">
            <span className="label-gold">Phy. def.</span>
            <span className="value-white">{data.phyDef ?? 0}</span>
          </div>
          <div className="char-stat-line">
            <span className="label-gold">Phy. balance</span>
            <span className="value-white">{data.phyBalance ?? '?'}</span>
          </div>
          <div className="char-stat-line">
            <span className="label-gold">Hit rate</span>
            <span className="value-white">{data.hitRate ?? 0}</span>
          </div>
        </div>
        <div className="char-detailed-col">
          <div className="char-stat-line">
            <span className="label-gold">Mag. atk.</span>
            <span className="value-white">{data.magAtk ?? '?'}</span>
          </div>
          <div className="char-stat-line">
            <span className="label-gold">Mag. def.</span>
            <span className="value-white">{data.magDef ?? 0}</span>
          </div>
          <div className="char-stat-line">
            <span className="label-gold">Mag. balance</span>
            <span className="value-white">{data.magBalance ?? '?'}</span>
          </div>
          <div className="char-stat-line">
            <span className="label-gold">Parry ratio</span>
            <span className="value-white">{data.parryRatio ?? 0}</span>
          </div>
        </div>
      </div>

      {/* SEPARATOR */}
      <div className="char-separator"></div>

      {/* JOB SECTION */}
      <div className="char-job-section">
        <div className="char-job-row">
          <span className="label-gold">Job alias</span>
          <span className="value-white">{data.jobAlias ?? '&lt;Nothing&gt;'}</span>
        </div>
        <div className="char-job-row">
          <span className="label-gold">Job level</span>
          <span className="value-white">{data.jobLevel ?? '&lt;Nothing&gt;'}</span>
        </div>
        <div className="char-job-row">
          <span className="label-gold">Job experience</span>
          <div className="char-job-exp-bar-outer">
            <div className="char-job-exp-fill" style={{ width: `${data.jobExp ?? 0}%` }}></div>
            <span className="bar-text">{data.jobExp ?? 0}%</span>
          </div>
        </div>
      </div>

    </div>
  );
};

/* ─────────────────────────────────────────
   SKILL CONTENT
───────────────────────────────────────── */
const SkillContent = ({ race, skillPoints }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState(0);
  const tabs = race === 'china' ? ['Weapon', 'Force', 'VIP'] : ['Melee', 'Caster', 'Buff'];
  const subTabs = race === 'china'
    ? [['Bicheon', 'Heuksal', 'Pacheon', 'Dual'], ['Cold', 'Lightning', 'Fire', 'LightT Force', 'Evil Force'], ['VIP']]
    : [['Warrior', 'Rogue'], ['Wizard', 'Warlock'], ['Bard', 'Cleric']];

  return (
    <div className="sro-window-content">
      <div className="skill-tabs-main">
        {tabs.map((tab, idx) => (
          <div key={tab} className={`skill-tab ${activeTab === idx ? 'active' : ''}`}
            onClick={() => { setActiveTab(idx); setActiveSubTab(0); }}>{tab}</div>
        ))}
      </div>
      <div className="skill-tabs-sub">
        {subTabs[activeTab].map((sub, idx) => (
          <div key={sub} className={`skill-sub-tab ${activeSubTab === idx ? 'active' : ''}`}
            onClick={() => setActiveSubTab(idx)}>{sub}</div>
        ))}
      </div>
      <div className="skill-mastery-box">
        <div className="mastery-icon-placeholder"></div>
        <div className="mastery-info">
          <span className="mastery-name">{subTabs[activeTab][activeSubTab]} Mastery</span>
          <div className="mastery-actions">
            <button className="skill-level-up-btn">LEVEL UP</button>
            <div className="mastery-lvl-indicator">Lv 0</div>
          </div>
        </div>
      </div>
      <div className="skill-grid-scrollable">
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(row => (
          <div key={row} className="skill-row">
            <div className="skill-category-icon"></div>
            <div className="skill-cells">
              {[1,2,3,4,5,6,7,8].map(cell => (
                <div key={cell} className="skill-cell"><div className="skill-icon-inner"></div></div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="skill-footer">
        <div className="footer-sp"><span className="label-gold">Skill point</span><span className="value-yellow">{skillPoints}</span></div>
        <div className="footer-mastery"><span className="label-blue">Mastery level total</span><span className="value-blue">0/390</span></div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   INVENTORY CONTENT
───────────────────────────────────────── */
// NOTA: InventoryContent ahora es InventoryWindow (componente separado).
// Se importa arriba y se usa directamente en el render.
// Los datos vienen del GameSocketContext automáticamente.

/* ─────────────────────────────────────────
   MALL CONTENT
───────────────────────────────────────── */
const MallContent = ({ onClose }) => (
  <div className="sro-window-content mall-content">
    <div className="mall-banner">
      <div className="mall-banner-inner">
        <span className="mall-banner-text">ITEM MALL</span>
        <span className="mall-banner-subtext">Silkroad Online Item Shopping Mall</span>
      </div>
    </div>
    
    <div className="mall-warning-box">
      <p>You can be attacked by monsters or other players while using Item Mall.</p>
      <p>It is recommended to use Item Mall in safe zones.</p>
    </div>

    <div className="mall-footer-btns">
      <button className="mall-btn mall-btn-yes" onClick={onClose}>Yes</button>
      <button className="mall-btn mall-btn-no" onClick={onClose}>No</button>
    </div>
  </div>
);

/* ─────────────────────────────────────────
   UNIFIED GAME WINDOW
───────────────────────────────────────── */
const UnifiedGameWindow = ({ activeType, onClose, charData, race }) => {
  const [pos, setPos] = useState({ x: 0, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const windowRef = useRef(null);

  useLayoutEffect(() => {
    if (windowRef.current && !ready) {
      const containerWidth = windowRef.current.offsetWidth;
      const viewportWidth  = document.documentElement.clientWidth;
      setPos({ x: Math.max(0, (viewportWidth - containerWidth) / 2), y: 50 });
      setReady(true);
    }
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartPos.current = { x: clientX - pos.x, y: clientY - pos.y };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setPos({ x: clientX - dragStartPos.current.x, y: clientY - dragStartPos.current.y });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup',   handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend',  handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup',   handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend',  handleMouseUp);
    };
  }, [isDragging]);

  const titles = { 
    character: 'Action', 
    skill: 'Skill', 
    inventory: 'Inventory',
    mall: 'Enter Silkroad Item Mall'
  };

  return (
    <div
      ref={windowRef}
      className={`sro-window-container ${activeType}-window`}
      style={{
        left: `${pos.x}px`,
        top:  `${pos.y}px`,
        transform: 'none',
        visibility: ready ? 'visible' : 'hidden',
      }}
    >
      <div
        className="sro-window-header"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'move' }}
      >
        <span className="sro-window-title">{titles[activeType]}</span>
        <button className="sro-window-close" onClick={onClose}>×</button>
      </div>

      {activeType === 'character' && <CharacterContent data={charData} />}
      {activeType === 'skill'     && <SkillContent race={race} skillPoints={charData?.skillPoints} />}
      {activeType === 'inventory' && (
        <InventoryWindow gold={charData?.gold || 0} refObjId={charData?.refObjId} />
      )}
      {activeType === 'mall' && <MallContent onClose={onClose} />}
    </div>
  );
};

export default UnifiedGameWindow;