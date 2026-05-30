import React from "react";
import { urlsapi } from "../../shared/recursos/urlApis.jsx";
import Usegeturl from "../hooks/Usegeturl.jsx";
import "../styles/rankingP.css";
// Importa el archivo CSS

function Rankings() {
  const data = Usegeturl(urlsapi.rnkplayer);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        padding: 5,

        overflow: "hidden",
      }}
    >
      <div className="rankings-container">Rankings Players</div>
      <div className="rankings-header">
        <div className="rankings-cell tl">#</div>
        <div className="rankings-cell tl">Raza</div>
        <div className="rankings-cell tl">Player</div>
        <div className="rankings-cell tl">Lvl</div>
        <div className="rankings-cell tl job">Job</div>
        <div className="rankings-cell tl exp">Exp</div>
        <div className="rankings-cell tl">Str</div>
        <div className="rankings-cell tl">Int</div>
        <div className="rankings-cell tl hp">HP</div>
        <div className="rankings-cell tl mp">MP</div>
      </div>

      {data.map((dato, Index) => (
        <div key={dato.CharID} className="rankings-row">
          <div className="rankings-cell">{Index + 1}</div>
          <div
            className="rankings-cell race-icon"
            style={{
              backgroundImage:
                dato.RefObjID < 10000
                  ? `url("/src/assets/race_china.png")`
                  : `url("/src/assets/race_euro.png")`,
            }}
          />
          <div className="rankings-cell">{dato.CharName16}</div>
          <div className="rankings-cell">{dato.CurLevel}</div>
          <div className="rankings-cell job">{dato.JobType}</div>
          <div className="rankings-cell exp">
            {((dato.ExpOffset * 100) / dato.Exp_C).toFixed(2)}%
          </div>
          <div className="rankings-cell str ">{dato.Strength}</div>
          <div className="rankings-cell int ">{dato.Intellect}</div>
          <div className="rankings-cell hp str">{dato.HP}</div>
          <div className="rankings-cell mp int">{dato.MP}</div>
        </div>
      ))}
    </div>
  );
}

export default Rankings;
