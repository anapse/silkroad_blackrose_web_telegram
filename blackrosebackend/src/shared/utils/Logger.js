/**
 * LOGGER — Sistema de Logging Centralizado
 * 
 * Reemplaza a src/gamegateway/utils/Logger.js
 * Ahora importa GATEWAY_CONFIG desde shared/config/gateway.js
 */

import { GATEWAY_CONFIG } from '../config/gateway.js';

// ANSI Colors for terminal output
const COLORS = {
    RESET: '\x1b[0m',
    BRIGHT: '\x1b[1m',
    DIM: '\x1b[2m',
    CYAN: '\x1b[36m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    RED: '\x1b[31m',
    MAGENTA: '\x1b[35m',
    GRAY: '\x1b[90m',
};

class Logger {
    static getTimestamp() {
        const now = new Date();
        return `${now.toLocaleDateString()} ${now.toLocaleTimeString()}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    }

    static formatContext(context) {
        return context ? `${COLORS.BRIGHT}${COLORS.MAGENTA}[${context}]${COLORS.RESET} ` : '';
    }

    static info(message, context = '') {
        const time = `${COLORS.DIM}[${this.getTimestamp()}]${COLORS.RESET}`;
        const tag = `${COLORS.BRIGHT}${COLORS.CYAN}[INFO]${COLORS.RESET}`;
        console.log(`${time} ${tag} ${this.formatContext(context)}${message}`);
    }

    static debug(message, context = '') {
        if (!GATEWAY_CONFIG.DEBUG) return;
        const time = `${COLORS.DIM}[${this.getTimestamp()}]${COLORS.RESET}`;
        const tag = `${COLORS.BRIGHT}${COLORS.GRAY}[DEBUG]${COLORS.RESET}`;
        console.log(`${time} ${tag} ${this.formatContext(context)}${message}`);
    }

    static warn(message, context = '') {
        const time = `${COLORS.DIM}[${this.getTimestamp()}]${COLORS.RESET}`;
        const tag = `${COLORS.BRIGHT}${COLORS.YELLOW}[WARN]${COLORS.RESET}`;
        console.warn(`${time} ${tag} ${this.formatContext(context)}${message}`);
    }

    static error(message, error = null, context = '') {
        const time = `${COLORS.DIM}[${this.getTimestamp()}]${COLORS.RESET}`;
        const tag = `${COLORS.BRIGHT}${COLORS.RED}[ERROR]${COLORS.RESET}`;
        let errMsg = message;
        if (error) {
            errMsg += ` - ${error.message || error}`;
            if (error.stack && GATEWAY_CONFIG.DEBUG) {
                errMsg += `\n${COLORS.DIM}${error.stack}${COLORS.RESET}`;
            }
        }
        console.error(`${time} ${tag} ${this.formatContext(context)}${errMsg}`);
    }

    static success(message, context = '') {
        const time = `${COLORS.DIM}[${this.getTimestamp()}]${COLORS.RESET}`;
        const tag = `${COLORS.BRIGHT}${COLORS.GREEN}[SUCCESS]${COLORS.RESET}`;
        console.log(`${time} ${tag} ${this.formatContext(context)}${message}`);
    }
}

export default Logger;
