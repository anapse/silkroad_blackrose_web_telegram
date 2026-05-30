/**
 * validateItems.js — Validador y normalizador de items de Silkroad
 *
 * Pipeline de validación que se ejecuta en build-time para garantizar
 * que todos los items tengan rutas de icono consistentes y válidas.
 *
 * Uso:
 *   node scripts/validateItems.js
 *
 * Salida:
 *   - Valida items.json contra los assets reales en /public/icon/
 *   - Normaliza rutas de icono (lowercase, trim, forward slashes)
 *   - Genera items_normalized.json con datos limpios
 *   - Genera icon_errors.json con reporte de errores
 */

const fs = require('fs');
const path = require('path');

// ─── CONFIGURACIÓN ────────────────────────────────────────
const ITEMS_JSON_PATH = 'blackroseweb/public/data/items.json';
const ICON_DIR = 'blackroseweb/public/icon';
const OUTPUT_DIR = 'blackroseweb/public/data';
const NORMALIZED_FILENAME = 'items_normalized.json';
const ERROR_REPORT_FILENAME = 'icon_errors_report.json';

// Fallback para iconos que no existen
const FALLBACK_ICON = 'icon_default.png';

// ─── CARGA DE DATOS ───────────────────────────────────────
console.log('═'.repeat(60));
console.log('  VALIDADOR DE ITEMS — SILKROAD ONLINE');
console.log('═'.repeat(60));

// Cargar JSON de items
const raw = fs.readFileSync(ITEMS_JSON_PATH, 'utf8');
const data = JSON.parse(raw);
const items = data.items || data;
console.log(`\n📦 Items cargados: ${items.length}`);

// Escanear assets reales
console.log('🔍 Escaneando assets en /public/icon/...');
const realAssets = new Map(); // lowercase path → real filename
const assetCategories = new Set();

function scanDir(dir, prefix) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        const relPath = prefix ? prefix + '/' + entry.name : entry.name;
        if (entry.isDirectory()) {
            assetCategories.add(relPath);
            scanDir(fullPath, relPath);
        } else {
            const normalized = relPath.replace(/\\/g, '/');
            realAssets.set(normalized.toLowerCase(), normalized);
        }
    });
}
scanDir(ICON_DIR, '');
console.log(`   📁 Categorías: ${assetCategories.size}`);
console.log(`   🖼️  Assets encontrados: ${realAssets.size}`);

// ─── PIPELINE DE VALIDACIÓN ──────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log('  PIPELINE DE VALIDACIÓN');
console.log('═'.repeat(60));

const errors = [];
const warnings = [];
const normalizedItems = [];
let stats = {
    total: items.length,
    ok: 0,
    normalized: 0,
    fallback: 0,
    missing: 0,
    caseMismatch: 0,
    spaceInName: 0,
    badSlashes: 0,
    badExtension: 0,
    emptyIcon: 0,
};

items.forEach((item, index) => {
    const itemId = item.ID;
    const itemName = item.CodeName128 || `ID#${itemId}`;
    const originalIcon = item.AssocFileIcon128;

    // ─── 1. Validar campo de icono ────────────────────────
    if (!originalIcon || (typeof originalIcon === 'string' && originalIcon.trim() === '')) {
        stats.emptyIcon++;
        errors.push({
            id: itemId,
            name: itemName,
            error: 'ICONO_VACIO',
            original: originalIcon,
            resolution: `Asignado fallback: ${FALLBACK_ICON}`
        });
        normalizedItems.push({
            ...item,
            AssocFileIcon128: FALLBACK_ICON,
            _iconValidated: false,
            _iconError: 'ICONO_VACIO'
        });
        return;
    }

    let iconStr = String(originalIcon);
    const itemErrors = [];
    let needsNormalization = false;

    // ─── 2. Detectar slashes incorrectos ──────────────────
    // El formato original usa backslashes: item\\china\\weapon\\sword_12.ddj
    // Pero también puede venir con forward slashes mixtos
    const hasMixedSlashes = (iconStr.includes('\\') && iconStr.includes('/'));
    const hasOnlyBackslashes = iconStr.includes('\\') && !iconStr.includes('/');
    if (hasMixedSlashes) {
        stats.badSlashes++;
        itemErrors.push('SLASHES_MIXTOS');
        needsNormalization = true;
    }

    // ─── 3. Detectar espacios ocultos ─────────────────────
    if (iconStr !== iconStr.trim()) {
        stats.spaceInName++;
        itemErrors.push('ESPACIOS_LEADING_TRAILING');
        needsNormalization = true;
    }
    if (iconStr.includes(' ')) {
        stats.spaceInName++;
        if (!itemErrors.includes('ESPACIOS_INTERNOS')) {
            itemErrors.push('ESPACIOS_INTERNOS');
        }
        needsNormalization = true;
    }

    // ─── 4. Detectar mayúsculas en la ruta ──────────────
    // Después de convertir slashes, verificar si hay mayúsculas
    const tempNormalized = iconStr
        .trim()
        .replace(/\\\\/g, '/')
        .replace(/\\/g, '/')
        .replace('.ddj', '.png');

    if (tempNormalized !== tempNormalized.toLowerCase()) {
        stats.caseMismatch++;
        itemErrors.push('CASE_MISMATCH');
        needsNormalization = true;
    }

    // ─── 5. Detectar extensiones inválidas ────────────────
    const ext = path.extname(iconStr).toLowerCase();
    if (ext !== '.ddj') {
        stats.badExtension++;
        itemErrors.push(`EXTENSION_INVALIDA: ${ext}`);
        needsNormalization = true;
    }

    // ─── 6. NORMALIZAR ────────────────────────────────────
    let normalized = tempNormalized
        .toLowerCase();          // ← CASE NORMALIZATION (crítico)

    // Eliminar espacios internos (los que no se deben)
    normalized = normalized.replace(/\s+/g, '');

    // ─── 7. VERIFICAR CONTRA ASSETS REALES ────────────────
    const assetExists = realAssets.has(normalized);

    if (!assetExists) {
        // El asset no existe
        stats.missing++;
        itemErrors.push('ASSET_NO_EXISTE');
        normalizedItems.push({
            ...item,
            AssocFileIcon128: FALLBACK_ICON,
            _iconValidated: false,
            _iconError: 'ASSET_NO_EXISTE',
            _iconOriginal: originalIcon,
            _iconExpected: normalized
        });
        stats.fallback++;
        return;
    }

    // ─── 8. CONSTRUIR ITEM NORMALIZADO ────────────────────
    if (needsNormalization || itemErrors.length > 0) {
        stats.normalized++;
        if (itemErrors.length > 0) {
            errors.push({
                id: itemId,
                name: itemName,
                errors: itemErrors,
                original: originalIcon,
                normalized: normalized
            });
        }
    } else {
        stats.ok++;
    }

    normalizedItems.push({
        ...item,
        AssocFileIcon128: normalized,
        _iconValidated: true,
        _iconError: null
    });
});

// ─── REPORTE ──────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log('  ESTADÍSTICAS DE VALIDACIÓN');
console.log('═'.repeat(60));
console.log(`  Total items:           ${stats.total}`);
console.log(`  ✅ OK (sin cambios):   ${stats.ok}`);
console.log(`  🔧 Normalizados:       ${stats.normalized}`);
console.log(`  ⚠️  Fallback asignado:  ${stats.fallback}`);
console.log(`  ❌ Con errores:        ${errors.length}`);
console.log('');

console.log('  Detalle de errores:');
console.log(`     Case mismatch:      ${stats.caseMismatch}`);
console.log(`     Espacios en nombre: ${stats.spaceInName}`);
console.log(`     Slashes incorrectos:${stats.badSlashes}`);
console.log(`     Extensiones inválidas:${stats.badExtension}`);
console.log(`     Icono vacío:        ${stats.emptyIcon}`);
console.log(`     Asset no existe:    ${stats.missing}`);

// ─── GUARDAR RESULTADOS ──────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log('  GUARDANDO RESULTADOS');
console.log('═'.repeat(60));

// Guardar JSON normalizado
const outputPath = path.join(OUTPUT_DIR, NORMALIZED_FILENAME);
fs.writeFileSync(outputPath, JSON.stringify({ items: normalizedItems }, null, 2), 'utf8');
console.log(`  ✅ ${NORMALIZED_FILENAME} — ${normalizedItems.length} items normalizados`);

// Guardar reporte de errores
const errorReport = {
    generatedAt: new Date().toISOString(),
    stats,
    totalErrors: errors.length,
    errors: errors.slice(0, 1000), // limitar a 1000 para no saturar
    warnings: warnings.slice(0, 500)
};
const reportPath = path.join(OUTPUT_DIR, ERROR_REPORT_FILENAME);
fs.writeFileSync(reportPath, JSON.stringify(errorReport, null, 2), 'utf8');
console.log(`  ✅ ${ERROR_REPORT_FILENAME} — ${errors.length} errores registrados`);

// ─── RESUMEN DE ERRORES POR CATEGORÍA ────────────────────
console.log('\n' + '═'.repeat(60));
console.log('  ERRORES POR CATEGORÍA');
console.log('═'.repeat(60));

const categoryCount = {};
errors.forEach(err => {
    const errList = Array.isArray(err.errors) ? err.errors : [err.error];
    errList.forEach(e => {
        const cat = e.split(':')[0];
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
});
Object.keys(categoryCount).sort().forEach(cat => {
    console.log(`  ${cat}: ${categoryCount[cat]}`);
});

console.log('\n' + '═'.repeat(60));
console.log('  VALIDACIÓN COMPLETADA');
console.log('═'.repeat(60));
