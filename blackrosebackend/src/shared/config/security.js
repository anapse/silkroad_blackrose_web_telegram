/**
 * SECURITY — Configuración de Seguridad (JWT)
 * 
 * Centraliza la configuración de seguridad.
 */

import { ENV } from './env.js';

export const JWT_CONFIG = {
    secret: ENV.JWT_SECRET,
    expiresIn: '24h',
};

export default JWT_CONFIG;
