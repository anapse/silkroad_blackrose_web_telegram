import "../styles/UserPanel.css";
import { useNavigate } from "react-router-dom";

function UserPanel({ user }) {
  const navigate = useNavigate();

  return (
    <div  className="user-panel-card">
      <div className="avatar">
  <svg viewBox="0 0 62 62">
    <circle cx="31" cy="24" r="13" fill="#888780"/>
    <ellipse cx="31" cy="54" rx="22" ry="16" fill="#888780"/>
  </svg>
</div>

      <div className="user-info">
       

        <div className="info-box">
          <div className="label">cuenta </div>
          <div className="value">{user.name}</div>
        </div>

        <div className="info-box">
          <div className="label">correo </div>
          <div className="value">{user.email ?? "sin correo"}</div>
        </div>

        <button onClick={() => navigate("/player-dashboard")}>
          Control Panel
        </button>
      </div>
    </div>
  );
}

export default UserPanel;