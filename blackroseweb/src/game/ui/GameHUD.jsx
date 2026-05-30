import { useMemo } from "react";
import { GAME_CONSTANTS } from "../../shared/constants/gameConstants.js";
import { worldToRender } from "../utils/geo.js";
import { getEntityName } from "../utils/entityNames.js";

const { MAP } = GAME_CONSTANTS;
const { UNITS_PER_REGION } = MAP;

export default function GameHUD({
  players, entities, playerReady, connected, isCity, cityData,
  regionInfo, me, wsPlayer, character, isMapActive, setIsMapActive,
  world, activeWindow, setActiveWindow, isCombatMode,
}) {
  const regionByXZ = {};
  // Nota: regionInfo se pasa desde el padre

  return (
    <>
      {/* PLAYER HUD */}
      <div className="gc-player-hud">
        <div className="gc-ph-portrait-frame">
          <img src={`/character/${character?.refObjId || character?.RefObjID}.gif`} className="gc-ph-portrait" alt=""
            onError={e => e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='} />
          <div className="gc-ph-deco" style={{ top: 4, left: -2 }} />
          <div className="gc-ph-deco" style={{ top: 20, left: -5 }} />
          <div className="gc-ph-deco" style={{ top: 36, left: -2 }} />
          <img src={`/character/race_${me?.race}.png`} style={{ position: "absolute", bottom: -5, right: -5, width: 24, height: 24, zIndex: 10 }} alt={me?.race} />
          <div className="gc-ph-dragon-icon"><span style={{ fontSize: 10 }}>🐉</span></div>
        </div>
        <div className="gc-ph-info">
          <div className="gc-ph-top-line">
            <span className="gc-ph-name">{me?.charName}</span>
            <span className="gc-ph-level">Lv {me?.level}</span>
          </div>
          <div className="gc-ph-bar-wrap">
            <div className="gc-ph-bar" style={{ background: "linear-gradient(to bottom, #d42222, #8b0000)", width: `${((me?.hp || 0) / (me?.maxHp || 1)) * 100}%` }} />
            <div className="gc-ph-bar-text">{me?.hp || 0} / {me?.maxHp || 0}</div>
          </div>
          <div className="gc-ph-bar-wrap">
            <div className="gc-ph-bar" style={{ background: "linear-gradient(to bottom, #2255d4, #00008b)", width: `${((me?.mp || 0) / (me?.maxMp || 1)) * 100}%` }} />
            <div className="gc-ph-bar-text">{me?.mp || 0} / {me?.maxMp || 0}</div>
          </div>
        </div>
      </div>

      {/* MINIMAP HUD */}
      <div className="gc-minimap-ui">
        <div className="gc-mm-header">
          <div className="gc-mm-title">{isCity ? cityData?.name : (regionInfo?.name || "Unknown Area")}</div>
        </div>
        <div className="gc-mm-coords">
          <div className="gc-mm-coord-item gc-mm-coord-item-left">X:{Math.round(me?.worldX || 0)}</div>
          <div className="gc-mm-coord-item gc-mm-coord-item-right">Y:{Math.round(me?.worldZ || 0)}</div>
        </div>
        <div className="gc-mm-circle-wrap">
          <div className="gc-mm-circle">
            <div style={{ width: "100%", height: "100%", background: "repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(0,0,0,0.1) 19px, rgba(0,0,0,0.1) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(0,0,0,0.1) 19px, rgba(0,0,0,0.1) 20px)" }} />
            {playerReady && me && Object.values(entities).map(e => {
              const eRegionX = e.region & 0xFF;
              const eRegionZ = (e.region >> 8) & 0xFF;
              const eWorldX = eRegionX * UNITS_PER_REGION + (e.posX || 0);
              const eWorldZ = eRegionZ * UNITS_PER_REGION + (e.posZ || 0);
              const dx = eWorldX - me.worldX;
              const dz = eWorldZ - me.worldZ;
              const mmScale = 110 / 4000;
              const mmX = 55 + dx * mmScale;
              const mmY = 55 + dz * mmScale;
              const dist = Math.sqrt((mmX - 55) ** 2 + (mmY - 55) ** 2);
              if (dist > 50) return null;
              const isChar = e.entityType === 'CHAR';
              const isMob = e.entityType === 'MOB';
              const color = isChar ? '#44dd66' : isMob ? '#ff4444' : '#ffcc00';
              return (
                <div key={`mm-${e.uniqueId}`} style={{
                  position: 'absolute', left: mmX - 2, top: mmY - 2, width: 4, height: 4,
                  borderRadius: '50%', backgroundColor: color,
                  border: `1px solid ${isMob ? '#ff8888' : '#88ff88'}`,
                  zIndex: 5, pointerEvents: 'none',
                }} />
              );
            })}
          </div>
          <button className="gc-mm-globe-btn" onClick={() => setIsMapActive(prev => !prev)}>
            <img src={isMapActive ? "/interface/worldmap/wmap_small_button_world_press.png" : "/interface/worldmap/wmap_small_button_world_focus.png"}
              style={{ width: "100%", height: "100%" }} alt="Toggle Map Interaction" />
          </button>
          <div className="gc-mm-compass gc-mm-compass-n">N</div>
          <div className="gc-mm-compass gc-mm-compass-s">S</div>
          <div className="gc-mm-compass gc-mm-compass-e">E</div>
          <div className="gc-mm-compass gc-mm-compass-w">W</div>
          <div style={{ position: "absolute", top: "50%", left: "50%", width: 0, height: 0, transformOrigin: '0 0', transform: `rotate(${me?.angle}deg)`, zIndex: 10, overflow: 'visible' }}>
            <span style={{ position: 'absolute', left: '-2px', top: '-2px', fontSize: '4px', lineHeight: 1, color: me?.race === 'euro' ? '#88aaff' : '#ff5555', textShadow: '0 0 3px #000', userSelect: 'none' }}>▶</span>
          </div>
        </div>
      </div>
    </>
  );
}
