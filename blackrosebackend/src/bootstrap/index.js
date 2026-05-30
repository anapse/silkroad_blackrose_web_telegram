/**
 * BOOTSTRAP — Entry Point del Backend
 *
 * Punto de entrada único.
 * Monta la aplicación Express y el Gateway Silkroad.
 *
 * El puerto es FIJO (100). Nginx es el reverse proxy.
 * Si el puerto ya está ocupado, se detecta con una sonda TCP
 * antes de hacer listen, evitando crashes.
 */

import { createConnection } from 'net';
import { execSync } from 'child_process';
import app from './app.js';
import { links } from '../web/routes/index.js';
import { startGateway } from '../game/index.js';

const PORT = app.get("port");

// ─── Forzar cierre de procesos en el puerto ────────────
function killProcessOnPort(port) {
    try {
        const result = execSync(`netstat -ano | findstr ":${port} "`, { encoding: 'utf8', timeout: 3000 });
        const lines = result.trim().split('\n').filter(l => l.includes('LISTENING'));
        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(pid)) {
                try {
                    execSync(`taskkill /F /PID ${pid}`, { encoding: 'utf8', timeout: 3000 });
                    console.log(`[Bootstrap] ✅ Proceso PID ${pid} liberado del puerto ${port}`);
                } catch (e) {
                    // ignorar
                }
            }
        }
    } catch (e) {
        // No hay proceso en ese puerto
    }
}

// ─── Verificar puerto antes de listen ───────────────────
function isPortInUse(port) {
    return new Promise((resolve) => {
        const sock = createConnection({ port, host: '127.0.0.1', timeout: 1000 }, () => {
            sock.destroy();
            resolve(true);
        });
        sock.on('error', () => resolve(false));
        sock.on('timeout', () => {
            sock.destroy();
            resolve(false);
        });
    });
}

(async () => {
    // Matar cualquier proceso en el puerto 100 antes de iniciar
    console.log(`[Bootstrap] 🔪 Limpiando puerto ${PORT}...`);
    killProcessOnPort(PORT);
    killProcessOnPort(8081);
    await new Promise(r => setTimeout(r, 1000));

    const inUse = await isPortInUse(PORT);
    if (inUse) {
        console.log('');
        console.log('╔══════════════════════════════════════════════════╗');
        console.log(`║   ⚠️  PUERTO ${PORT} OCUPADO                       ║`);
        console.log('║                                                ║');
        console.log('║   No se pudo liberar automáticamente.          ║');
        console.log('║   Reinicia el backend manualmente.             ║');
        console.log('╚══════════════════════════════════════════════════╝');
        console.log('');
        process.exit(0);
    }

    // ─── Montar rutas ────────────────────────────────────
    Object.values(links).forEach(link => {
        app.use(link);
    });

    // ─── Iniciar servidor Express ────────────────────────
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`[Bootstrap] Servidor Express escuchando en puerto ${PORT}`);
    });

    // ─── Iniciar Gateway Silkroad (comparte puerto con Express) ───
    startGateway(server);
})();
