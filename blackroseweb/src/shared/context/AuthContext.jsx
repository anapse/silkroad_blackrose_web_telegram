// src/context/AuthContext.jsx
import { createContext, useContext, useState } from "react";
import { urlsapi } from "../recursos/urlApis.jsx";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const loading = false; // no hay carga inicial, siempre parte desde null

  const login = async (username, password) => {
    const res = await fetch(urlsapi.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: username, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.status === "ERROR") {
      throw new Error(data.message || "Credenciales incorrectas");
    }

    // Normalizar la forma del usuario
    const userData = {
      name: data.user,
      email: data.email,
      jid: data.jid,
      token: data.token,
    };
    setUser(userData);
    return userData;
  };

  // Guardar usuario directamente desde WebSocket (sin HTTP)
  const setWsUser = (userData) => {
    const data = { ...userData, status: "OK" };
    setUser(data);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, setWsUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);