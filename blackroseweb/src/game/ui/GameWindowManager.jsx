import UnifiedGameWindow from "./windows/UnifiedGameWindow.jsx";

export default function GameWindowManager({
  activeWindow, setActiveWindow, dialog, setDialog,
  me, wsPlayer, character,
}) {
  return (
    <>
      {/* Dialog overlay */}
      {dialog && (
        <div className="gc-overlay" onClick={() => setDialog(null)}>
          <div className="gc-dialog-box" onClick={e => e.stopPropagation()}>
            <div className="gc-dialog-head">
              <span className="gc-dialog-title">{dialog.title}</span>
              <button className="gc-dialog-close" onClick={() => setDialog(null)}>✕</button>
            </div>
            <p className="gc-dialog-text">{dialog.text}</p>
            <button className="gc-dialog-btn" onClick={() => setDialog(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Game windows */}
      {activeWindow && (
        <UnifiedGameWindow
          activeType={activeWindow}
          onClose={() => setActiveWindow(null)}
          race={me?.race}
          charData={{
            name: character?.CharName || wsPlayer?.playerName || '?',
            level: me?.level,
            refObjId: character?.refObjId ?? character?.RefObjID ?? null,
            inventorySize: character?.InventorySize ?? 96,
            gold: wsPlayer?.gold || 0,
            currentExp: (wsPlayer?.exp ?? character?.ExpOffset) || 0,
            nextExp: character?.Exp_C || 0,
            statPoint: character?.RemainStatPoint || 0,
            honorPoint: 'N/A',
            str: character?.Strength || 0,
            int: character?.Intellect || 0,
            hp: me?.hp,
            maxHp: me?.maxHp,
            mp: me?.mp,
            maxMp: me?.maxMp,
            phyAtk: wsPlayer?.phyAtk || '?',
            magAtk: wsPlayer?.magAtk || '?',
            phyDef: wsPlayer?.phyDef || 0,
            magDef: wsPlayer?.magDef || 0,
            phyBalance: wsPlayer?.phyBalance || '?',
            magBalance: wsPlayer?.magBalance || '?',
            hitRate: wsPlayer?.hitRate || 0,
            parryRatio: wsPlayer?.parryRatio || 0,
            jobAlias: '<Nothing>',
            jobLevel: '<Nothing>',
            jobExp: 0,
            skillPoints: wsPlayer?.sp ?? character?.RemainSkillPoint ?? 0,
          }}
        />
      )}
    </>
  );
}
