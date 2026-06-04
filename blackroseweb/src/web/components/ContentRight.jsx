import "../../App.css";
import { useState, useEffect } from "react";
import { useAuth } from "../../shared/context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { urlsapi } from "../../shared/recursos/urlApis.jsx";
import "../styles/contentRight.css";

function ContentRight() {
  const { user, login, setWsUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ user: "", password: "" });
  const [error, setError] = useState("");
  const [telegramId, setTelegramId] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [tgStatus, setTgStatus] = useState(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    const tgUser = tg.initDataUnsafe?.user;
    if (!tgUser) return;
    const id = tgUser.id;
    setTelegramId(id);
    fetch(urlsapi.telegramGet(id))
      .then(res => res.json())
      .then(data => {
        if (data.status === "OK") {
          setAccounts(data.accounts);
          setTgStatus("accounts");
        } else {
          setTgStatus("no_account");
        }
      })
      .catch(() => setTgStatus("error"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(urlsapi.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: form.user, password: form.password }),
      });
      const data = await res.json();

      if (data.status !== "OK") {
        setError(data.message || "Usuario o contraseña incorrectos");
        return;
      }
      localStorage.setItem("token", data.token);
      setWsUser({ name: data.user, email: data.email, jid: data.jid });
      if (telegramId) {
        fetch(urlsapi.telegramLink, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jid: data.jid, telegramId }),
        });
      }
      navigate("/");
    } catch (err) {
      setError("Error de conexión con el servidor");
    }
  };

  const handleTelegramLogin = (jid) => {
    fetch(urlsapi.telegramLogin, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jid, telegramId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "OK") {
          localStorage.setItem("token", data.token);
          setWsUser({ name: "TelegramUser" });
          navigate("/");
        }
      });
  };

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // 👤 LOGUEADO — panel con avatar
  if (user) {
    return (
      <div id="ContentR" className="user-panel-card">
        <div className="avatar">
          <svg viewBox="0 0 62 62" width="62" height="62">
            <circle cx="31" cy="24" r="13" fill="#888780"/>
            <ellipse cx="31" cy="54" rx="22" ry="16" fill="#888780"/>
          </svg>
        </div>
        <div className="user-info">
          <p className="username">{user.name}</p>
          <div className="info-box">
            <span className="label">cuenta</span>
            <span className="value">{user.name}</span>
          </div>
          <div className="info-box">
            <span className="label">correo</span>
            <span className="value">{user.email}</span>
          </div>
          <button onClick={() => navigate("/panel")}>Control Panel</button>
        </div>
      </div>
    );
  }

  // 🔐 NO LOGUEADO — formulario
  return (
    <div id="ContentR">
      <h3>BlackRose Login</h3>

      {tgStatus === "accounts" && (
        <div>
          <h4>Entrar con Telegram</h4>
          {accounts.map(acc => (
            <button key={acc.JID} onClick={() => handleTelegramLogin(acc.JID)}>
              {acc.StrUserID}
            </button>
          ))}
        </div>
      )}

      {tgStatus === "no_account" && (
        <p>No tienes cuenta vinculada a Telegram</p>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="user"
          placeholder="Usuario"
          value={form.user}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
        />
        <button type="submit">Entrar</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default ContentRight;