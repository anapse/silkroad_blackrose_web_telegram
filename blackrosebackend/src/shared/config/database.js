/**
 * DATABASE — Configuración de Conexión MSSQL
 * 
 * Centraliza la configuración de la base de datos.
 * Importa ENV en lugar de leer process.env directamente.
 */

import { ENV } from './env.js';

export const DB_CONFIG = {
    user: ENV.DB_USER,
    password: ENV.DB_PASSWORD,
    server: ENV.DB_SERVER,
    port: ENV.DB_PORT,
    database: ENV.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

export default DB_CONFIG;
