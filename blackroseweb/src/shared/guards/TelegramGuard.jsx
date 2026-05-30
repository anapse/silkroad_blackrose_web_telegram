// src/guards/TelegramGuard.jsx
// ─────────────────────────────────────────────────────────────
// Protege cualquier ruta para que SOLO sea accesible desde
// Telegram WebApp. Cambia ALLOW_WEB_ACCESS a true cuando
// quieras habilitarlo también desde el navegador normal.
// ─────────────────────────────────────────────────────────────
 
const ALLOW_WEB_ACCESS = true; // 👈 cambia a true cuando quieras abrir desde web
 
function isTelegramWebApp() {
  return Boolean(window.Telegram?.WebApp?.initData);
}
 
export default function TelegramGuard({ children }) {
  const fromTelegram = isTelegramWebApp();

  if (!ALLOW_WEB_ACCESS && !fromTelegram) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.icon}>🔒</div>
          <h2 style={styles.title}>Acceso restringido</h2>
          <p style={styles.desc}>
            Esta sección solo está disponible dentro de{" "}
            <strong>Telegram</strong>.
          </p>
          <p style={styles.sub}>
            Abre el bot de BlackRose desde Telegram para acceder.
          </p>
        </div>
      </div>
    );
  }
 
  return children;
}
 
const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "#0a0a0f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "sans-serif",
  },
  card: {
    background: "#13131a",
    border: "1px solid #2a2a3a",
    borderRadius: 16,
    padding: "48px 40px",
    textAlign: "center",
    maxWidth: 340,
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { color: "#fff", fontSize: 20, fontWeight: 600, margin: "0 0 12px" },
  desc: { color: "#aaa", fontSize: 14, lineHeight: 1.6, margin: "0 0 8px" },
  sub: { color: "#555", fontSize: 12, margin: 0 },
};
 