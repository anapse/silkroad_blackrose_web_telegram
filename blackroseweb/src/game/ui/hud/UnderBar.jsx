import React, { useState } from 'react';
import './UnderBar.css';
import CharacterWindow from '../windows/CharacterWindow.jsx';

// Helper component for buttons with Focus/Press states
const UnderBarButton = ({ id, baseIcon, className, onClick }) => {
  const [state, setState] = useState('normal'); // 'normal', 'focus', 'press'

  // Construct the icon path based on state
  const getIconPath = () => {
    const basePath = '/interface/underbar/';
    const name = baseIcon.replace('.png', '');
    if (state === 'press') return `${basePath}${name}_press.png`;
    if (state === 'focus') return `${basePath}${name}_focus.png`;
    return `${basePath}${baseIcon}`;
  };

  return (
    <button
      className={className}
      onClick={onClick}
      onMouseEnter={() => setState('focus')}
      onMouseLeave={() => setState('normal')}
      onMouseDown={() => setState('press')}
      onMouseUp={() => setState('focus')}
    >
      <img src={getIconPath()} alt={id} />
    </button>
  );
};

const UnderBar = ({ hp, maxHp, mp, maxMp, exp, level, sp, isCombat, activeWindow, setActiveWindow }) => {
  const [showMenu, setShowMenu] = useState(false);

  const menuButtons = [
    { id: 'character', icon: 'ub_new_character.png' },
    { id: 'inventory', icon: 'ub_new_inventory.png' },
    { id: 'skill', icon: 'ub_new_skill.png' },
    { id: 'mall', icon: 'ub_new_mall.png' },
  ];

  const systemMenuOptions = [
    { label: 'Party ( P )', icon: 'ub_new_icon_pt.png' },
    { label: 'Party Match ( E )', icon: 'ub_new_icon_ptm.png' },
    { label: 'Guild ( U )', icon: 'ub_new_icon_guild.png' },
    { label: 'Academy ( L )', icon: 'ub_new_icon_apprenticeship.png' },
    { label: 'Guardian Matching', icon: 'ub_new_icon_apprenticeship_m.png' },
    { type: 'separator' },
    { label: 'Action ( A )', icon: 'ub_new_icon_action.png' },
    { label: 'Community ( U )', icon: 'ub_new_icon_commu.png' },
    { label: 'Quest ( Q )', icon: 'ub_new_icon_quest.png' },
    { label: 'Alchemy ( Y )', icon: 'ub_new_icon_alchemy.png' },
    { label: 'Craft', icon: 'ub_new_icon_making.png' },
    { label: 'Collection book', icon: 'ub_new_icon_collection.png' },
    { type: 'separator' },
    { label: 'Stall', icon: 'ub_new_icon_stall.png' },
    { label: 'Auto Potion ( T )', icon: 'ub_new_icon_recovery.png' },
    { type: 'separator' },
    { label: 'System ( Esc )', icon: 'ub_new_icon_system.png' },
  ];

  return (
    <div className="underbar-container">
      {showMenu && (
        <div className="system-menu-popup">
          {systemMenuOptions.map((opt, idx) => (
            opt.type === 'separator' ? (
              <div key={idx} className="system-menu-separator"></div>
            ) : (
              <div key={idx} className="system-menu-item">
                <div className="system-menu-icon-frame">
                  <img src={`/interface/underbar/${opt.icon}`} alt="" className="system-menu-icon-img" />
                </div>
                <span className="system-menu-label">{opt.label}</span>
              </div>
            )
          ))}
        </div>
      )}

      <div className="underbar-layout">
        <div className="underbar-ornament-left">
          <img src="/interface/underbar/ub_new_deco_left.png" alt="" />
        </div>

        <div className="underbar-main-content">
          <div className="underbar-main-bg">
            <div className="underbar-section-left">
              <div className="underbar-stats-box">
                <div className="stats-row top">
                  <span className="skill-point-label">Skill point</span>
                  <span className="skill-point-value">{sp ?? 0}</span>
                </div>
                <div className="sp-bar-container">
                  <div className="sp-bar-fill" style={{ width: (sp ?? 0) > 0 ? Math.min((sp ?? 0) / 100 * 100, 100) + '%' : '0%' }}></div>
                </div>
                <div className="stats-row bottom">
                  <span className="lvl-text">Lv. {level}</span>
                  <div className="exp-display">
                    <span className="exp-label-green">EXP</span>
                    <span className="exp-percent-value">{Number(exp || 0).toFixed(2)} %</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="underbar-section-right">
              <div className="menu-group-container">
                <UnderBarButton 
                  id="menu"
                  baseIcon="ub_new_menu.png"
                  className={`menu-main-btn-trapezoid ${showMenu ? 'active' : ''}`}
                  onClick={() => setShowMenu(!showMenu)}
                />
                <div className="menu-icons-rounded-box">
                  {menuButtons.map(btn => (
                    <UnderBarButton 
                      key={btn.id}
                      id={btn.id}
                      baseIcon={btn.icon}
                      className="menu-icon-btn"
                      onClick={() => setActiveWindow(activeWindow === btn.id ? null : btn.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="underbar-exp-bar">
            <div className="exp-segment-counter">
              {Math.floor(Number(exp || 0) / 10)}
            </div>
            <div className="exp-fill-green" style={{ width: `${exp}%` }}></div>
            <span className="exp-text-centered">{Number(exp || 0).toFixed(2)}%</span>
          </div>
        </div>

        <div className="underbar-ornament-right">
          <img src="/interface/underbar/ub_new_deco_right.png" alt="" />
        </div>
      </div>
    </div>
  );
};

export default UnderBar;
