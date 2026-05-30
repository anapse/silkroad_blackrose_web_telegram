/**
 * normalizeAssets.js — Normaliza los assets de /public/icon/
 * 
 * Renombra archivos a minúsculas y elimina espacios.
 * Esto garantiza consistencia total con el JSON normalizado.
 */

const fs = require('fs');
const path = require('path');

const ICON_DIR = 'blackroseweb/public/icon';

console.log('=== NORMALIZACIÓN DE ASSETS ===\n');

let renamed = 0;
let removedSpaces = 0;
let errors = [];

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(entry => {
        const fp = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(fp);
        } else {
            const ext = path.extname(entry.name);
            const base = path.basename(entry.name, ext);

            // 1. Eliminar espacios
            let newBase = base.replace(/\s+/g, '');
            if (newBase !== base) {
                removedSpaces++;
                console.log('  Espacio: "' + entry.name + '" -> "' + newBase + ext + '"');
            }

            // 2. Convertir a minúsculas
            const finalBase = newBase.toLowerCase();
            const finalName = finalBase + ext;

            if (finalName !== entry.name) {
                const newFp = path.join(dir, finalName);
                try {
                    fs.renameSync(fp, newFp);
                    renamed++;
                    console.log('  Renombrado: "' + entry.name + '" -> "' + finalName + '"');
                } catch (e) {
                    errors.push({ from: entry.name, to: finalName, error: e.message });
                }
            }
        }
    });
}

walk(ICON_DIR);

console.log('\n=== RESULTADOS ===');
console.log('  Archivos renombrados: ' + renamed);
console.log('  Espacios eliminados: ' + removedSpaces);
console.log('  Errores: ' + errors.length);

if (errors.length > 0) {
    console.log('\n  ERRORES:');
    errors.forEach(e => console.log('    ' + e.from + ' -> ' + e.to + ': ' + e.error));
}
