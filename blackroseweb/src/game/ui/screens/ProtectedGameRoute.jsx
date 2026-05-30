// src/Componentes/game/ProtectedGameRoute.jsx
// Flujo: sin sesión → GameLogin | con sesión → CharacterSelect → GameContainer

import { useState, useEffect } from "react";
import { useAuth } from "../../../shared/context/AuthContext.jsx";
import GameLogin       from "./GameLogin.jsx";
import CharacterSelect from "./Characterselect.jsx";
import GameContainer   from "../GameContainer.jsx";

export default function ProtectedGameRoute() {
  const { user, loading, logout } = useAuth();
  const [selectedChar, setSelectedChar] = useState(null);

  // Limpiar el personaje seleccionado si el usuario cierra sesión
  useEffect(() => {
    if (!user) {
      setSelectedChar(null);
    }
  }, [user]);

  // Verificando sesión guardada
  if (loading) {
    return <div style={{ ...loadingStyle, background: "#000" }} />;
  }

  // Sin sesión → login embebido
  if (!user) return <GameLogin />;

  // Con sesión pero sin personaje elegido → selección de personaje
  if (!selectedChar) {
    return (
      <CharacterSelect
        onStart={(char) => setSelectedChar(char)}   // eligió personaje → entra al juego
        onBack={logout}                              // Cancel → cierra sesión
      />
    );
  }

  // Personaje elegido → launcher / dashboard
  return (
    <GameContainer
      user={user}
      character={selectedChar}
      onBack={() => setSelectedChar(null)}          // vuelve a selección
    />
  );
}

const loadingStyle = {
  minHeight: "var(--tg-viewport-stable-height, 100vh)",
  background: "#0a0a0f",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};