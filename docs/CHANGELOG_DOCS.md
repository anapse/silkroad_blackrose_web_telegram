# 📋 CHANGELOG_DOCS — Registro de cambios en documentación

> Registro cronológico de todas las modificaciones a la documentación del proyecto.
> Formato: [Fecha] - [Tipo] - [Archivo] - [Descripción]

---

## 2026-05-25 — Reconstrucción documental completa

### Creados

| Archivo | Descripción |
|---------|-------------|
| `PROJECT_VISION.md` | Visión del producto: propósito, plataformas, experiencia objetivo, modelo económico |
| `ROADMAP.md` | Plan de desarrollo por etapas: MVP → Beta → Lanzamiento → Post |
| `SYSTEM_FLOW.md` | Flujo completo: usuario → frontend → backend → GameServer |
| `docs/DOCUMENTATION_POLICY.md` | Política oficial de documentación (10 reglas) |
| `docs/CHANGELOG_DOCS.md` | Este archivo — registro de cambios documentales |
| `docs/audit/DOC_REBUILD_REPORT.md` | Reporte de reconstrucción documental |
| `docs/audit/DOC_ALIGNMENT_REPORT.md` | Validación documentación vs código real |
| `docs/audit/ROOT_BEFORE_TREE.md` | Árbol de la raíz antes de la limpieza |
| `docs/audit/ROOT_AFTER_TREE.md` | Árbol de la raíz después de la limpieza |
| `docs/audit/ROOT_CLEANUP_REPORT.md` | Reporte final de limpieza de raíz |

### Reescritos

| Archivo | Cambio principal |
|---------|------------------|
| `README.md` | De "portal web" a "plataforma multiplataforma Silkroad". Nueva sección de arquitectura, plataformas objetivo, estructura real. |
| `ARCHITECTURE.md` | De descripción genérica de monorepo a arquitectura real: diagrama, Dual TCP, componentes backend/frontend, seguridad. |

### Actualizados

| Archivo | Cambio |
|---------|--------|
| `docs/DOCUMENTATION_INDEX.md` | Reorganizado 3 veces para reflejar estructura final: raíz, active, protocol, decisions, plans, archive, audit, debug, reference |

### Movidos

| Archivo | Origen → Destino |
|---------|-----------------|
| `DUAL_TCP_ARCHITECTURE.md` | `docs/active/` → `docs/protocol/` |
| `SILKROAD_PACKET_DECRYPT_ANALYSIS.md` | `docs/reference/` → `docs/protocol/` |
| `CORRECTIONS_LOG.md` | `docs/active/` → `docs/decisions/` |
| `PACKET_FIX_EXPLAINED.md` | `docs/active/` → `docs/decisions/` |
| `DUAL_TCP_STATUS.md` | `docs/active/` → `docs/archive/` |
| `TESTING_GUIDE.md` | `docs/active/` → `docs/archive/` |
| `PREVIEW_CHANGES.md` | Raíz → `docs/audit/` |
| `CAMBIOS_REALIZADOS.md` | Raíz → `docs/audit/` |
| `DOC_STATUS.md` | Raíz → `docs/audit/` |
| `DOC_MERGE_PLAN.md` | Raíz → `docs/audit/` |
| `DOC_ARCHIVE_PLAN.md` | Raíz → `docs/audit/` |
| `DOC_DELETE_CANDIDATES.md` | Raíz → `docs/audit/` |
| `ROOT_BEFORE_TREE.md` | Raíz → `docs/audit/` |
| `QUICK_START.txt` | Raíz → `docs/reference/` |
| `README_DUAL_TCP.txt` | Raíz → `docs/reference/` |
| `temp_project_scan.py` | Raíz → `docs/debug/` |
| `tmp_dump_6102.js` | Raíz → `docs/debug/` |

### Fusionados

| Archivo | Acción |
|---------|--------|
| `blackroseweb/README.md` | Contenido reemplazado por redirect a `README.md` raíz (duplicado exacto) |

### Eliminados

**0 archivos eliminados.**

---

## 2026-05-25 — Congelación y governance

| Archivo | Acción |
|---------|--------|
| `docs/DOCUMENTATION_POLICY.md` | Creado — política oficial de documentación |
| `docs/CHANGELOG_DOCS.md` | Creado — registro de cambios |
| `docs/DOCUMENTATION_INDEX.md` | Actualizado — sección "Documentación Oficial" agregada |
| `docs/audit/DOC_GOVERNANCE_REPORT.md` | Creado — reporte de governance |

---

## Totales acumulados

| Operación | Cantidad |
|-----------|----------|
| Documentos creados | 10 |
| Documentos reescritos | 2 |
| Documentos actualizados | 1 (3 revisiones) |
| Documentos movidos | 17 |
| Documentos fusionados | 1 |
| Documentos eliminados | 0 |
