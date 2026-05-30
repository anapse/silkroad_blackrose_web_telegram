import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import './sro-window-base.css';
import './SkillWindow.css';

const SkillWindow = ({ onClose, race, skillPoints }) => {
  const [pos, setPos] = useState({ x: 0, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const windowRef = useRef(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState(0); // 0: Weapon/Melee, 1: Force/Caster, 2: VIP/Buff
  const [activeSubTab, setActiveSubTab] = useState(0);

  // Define tabs based on race
  const tabs = race === 'china' 
    ? ['Weapon', 'Force', 'VIP'] 
    : ['Melee', 'Caster', 'Buff'];

  const subTabs = race === 'china'
    ? [
        ['Bicheon', 'Heuksal', 'Pacheon', 'Dual'], // Weapon subtabs
        ['Cold', 'Lightning', 'Fire', 'LightT Force', 'Evil Force'], // Force subtabs
        ['VIP'] // VIP subtabs
      ]
    : [
        ['Warrior', 'Rogue'], // Melee subtabs
        ['Wizard', 'Warlock'], // Caster subtabs
        ['Bard', 'Cleric'] // Buff subtabs
      ];

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

  return (
    <div
      ref={windowRef}
      className="sro-window-container skill-window"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        visibility: ready ? 'visible' : 'hidden',
      }}
    >
      {/* WINDOW HEADER */}
      <div
        className="sro-window-header"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'move' }}
      >
        <span className="sro-window-title">Skill</span>
        <button className="sro-window-close" onClick={onClose}>×</button>
      </div>

      <div className="sro-window-content">
        {/* MAIN TABS */}
        <div className="skill-tabs-main">
          {tabs.map((tab, idx) => (
            <div 
              key={tab} 
              className={`skill-tab ${activeTab === idx ? 'active' : ''}`}
              onClick={() => { setActiveTab(idx); setActiveSubTab(0); }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* SUB TABS */}
        <div className="skill-tabs-sub">
          {subTabs[activeTab].map((sub, idx) => (
            <div 
              key={sub} 
              className={`skill-sub-tab ${activeSubTab === idx ? 'active' : ''}`}
              onClick={() => setActiveSubTab(idx)}
            >
              {sub}
            </div>
          ))}
        </div>

        {/* MASTERY INFO BOX */}
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

        {/* SKILLS GRID CONTAINER */}
        <div className="skill-grid-scrollable">
          {[1, 2, 3, 4].map(row => (
            <div key={row} className="skill-row">
              <div className="skill-category-icon"></div>
              <div className="skill-cells">
                {[1, 2, 3, 4, 5, 6].map(cell => (
                  <div key={cell} className="skill-cell">
                    <div className="skill-icon-placeholder"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* WINDOW FOOTER */}
        <div className="skill-footer">
          <div className="footer-sp">
            <span className="label-gold">Skill point</span>
            <span className="value-yellow">{skillPoints || 0}</span>
          </div>
          <div className="footer-mastery">
            <span className="label-blue">Mastery level total</span>
            <span className="value-blue">0/390</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SkillWindow;
