import app from "./app.js";
import { links } from "./direcciones/links.js";
import { startGateway } from "./gamegateway/index.js";

// Si TODAS las propiedades de links son middlewares/rutas
Object.values(links).forEach(link => {
    app.use(link);
});

app.listen(app.get("port"), '0.0.0.0', () => {
    console.log("server on port", app.get("port"));
});

// Iniciar el Gateway WebSocket-TCP para Silkroad
startGateway();