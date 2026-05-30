import React, { useEffect, useState } from "react";
import { useAuth } from "../../shared/context/AuthContext.jsx";
import { urlsapi } from "../../shared/recursos/urlApis.jsx";
import { useGameSocket } from "../../shared/context/GameSocketContext.jsx";
import "../styles/PlayerDashboard.css";

export default function PlayerDashboard() {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const { user } = useAuth();
  const { playerState } = useGameSocket();

  const hp = playerState?.hp;
  const maxHp = playerState?.maxHp;
  const mp = playerState?.mp;
  const maxMp = playerState?.maxMp;
  const hasStats = hp !== undefined && maxHp !== undefined && maxHp > 0;
  const hpPercent = hasStats ? Math.round((hp / maxHp) * 100) : 0;
  const mpPercent = hasStats ? Math.round((mp / maxMp) * 100) : 0;

  useEffect(() => {
    if (!user) return;

    fetch(urlsapi.playerData(user.jid))
      .then(res => res.json())
      .then(data => {
        if (data.status === "OK") {
          setPlayers(data.characters);
          setSelectedPlayer(data.characters[0]);
        }
      });
  }, [user]);

  return (
    <div className="game-container">

      {/* 🔹 SELECTOR SOLO IMAGEN */}
      <div className="player-selector">
        {players.map(p => (
          <img
            key={p.CharID}
            src={`/character/${p.RefObjID}.gif`}
            className={`selector-img ${selectedPlayer?.CharID === p.CharID ? "active" : ""}`}
            onClick={() => setSelectedPlayer(p)}
          />
        ))}
      </div>

      {/* 🔹 PLAYER + EQUIP */}
      <div className="character-panel">
        {selectedPlayer && (
          <>
            {/* PERSONAJE */}
            <img
              className="character-main"
              src={`/character/${selectedPlayer.RefObjID}.gif`}
            />

            {/* EQUIP (POSICIONADO) */}
            <div className="equip weapon">
              <img src="/interface/equipment/equip_slot_weapon.png" />
            </div>

            <div className="equip shield">
              <img src="/interface/equipment/equip_slot_shield.png" />
            </div>

            <div className="equip helmet">
              <img src="/interface/equipment/equip_slot_helm.png" />
            </div>

            <div className="equip chest">
              <img src="/interface/equipment/equip_slot_mail.png" />
            </div>

            <div className="equip legs">
              <img src="/interface/equipment/equip_slot_pants.png" />
            </div>

            <div className="equip boots">
              <img src="/interface/equipment/equip_slot_boots.png" />
            </div>
          </>
        )}
      </div>

      {/* 🔹 INFO */}
      <div className="info-box">
        {selectedPlayer && (
          <>
            <h2>{playerState?.playerName || selectedPlayer.CharName16}</h2>

            <div className="bars">
              <div className="bar hp">
                <span>HP {hasStats ? hp + '/' + maxHp : '?'}</span>
                <div style={{ width: hpPercent + "%" }} />
              </div>

              <div className="bar mp">
                <span>MP {hasStats ? mp + '/' + maxMp : '?'}</span>
                <div style={{ width: mpPercent + "%" }} />
              </div>
            </div>

            <div className="stats">
              <p>Lv {playerState?.level || selectedPlayer.CurLevel}</p>
              <p>STR {selectedPlayer.Strength}</p>
              <p>INT {selectedPlayer.Intellect}</p>
              <p>Gold {playerState?.gold ?? selectedPlayer.RemainGold}</p>
            </div>
          </>
        )}
      </div>

    </div>
  );
}