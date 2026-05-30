// src/main.jsx  — VERSIÓN ACTUALIZADA
// ─────────────────────────────────────────────────────────────
// La ruta /game está FUERA de <App> (sin Menubar, sin header).
// Tiene su propia cadena de guards:
//   TelegramGuard → ProtectedGameRoute → (GameLogin | GameContainer)
// ─────────────────────────────────────────────────────────────

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App.jsx";
import Home from "./web/pages/Home.jsx";
import Descargas from "./web/pages/Descargas.jsx";
import Rankings from "./web/pages/Rankings.jsx";
import Registro from "./web/pages/Registro.jsx";
import PlayerDashboard from "./web/pages/PlayerDashboard.jsx";

// 🎮 Rutas del juego
import TelegramGuard from "./shared/guards/TelegramGuard.jsx";
import ProtectedGameRoute from "./game/ui/screens/ProtectedGameRoute.jsx";

import { AuthProvider } from "./shared/context/AuthContext.jsx";
import { GameSocketProvider } from "./shared/context/GameSocketContext.jsx";

const router = createBrowserRouter([
  // ── Rutas públicas (con layout principal) ─────────────────
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/",              element: <Home /> },
      { path: "/descargas",     element: <Descargas /> },
      { path: "/rankings",      element: <Rankings /> },
      { path: "/Registro",      element: <Registro /> },
      { path: "/player-dashboard", element: <PlayerDashboard /> },
    ],
  },

  // ── Ruta privada /game (SIN layout principal) ─────────────
  // TelegramGuard  → bloquea si no viene de Telegram
  // ProtectedGameRoute → muestra login o launcher según sesión
  {
    path: "/game",
    element: (
      <TelegramGuard>
        <ProtectedGameRoute />
      </TelegramGuard>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <GameSocketProvider>
      <RouterProvider router={router} />
    </GameSocketProvider>
  </AuthProvider>
);