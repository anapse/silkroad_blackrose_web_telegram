# 📚 DOCUMENTATION INDEX — Black Rose

> Índice central de toda la documentación del proyecto.
> Actualizado: 2026-05-25 (5ª revisión — refs migration)

---

## 📖 Documentación Oficial

Documentación principal que define el proyecto. Leer en este orden para entender el proyecto completo.

| # | Archivo | Descripción | Tiempo |
|---|---------|-------------|--------|
| 1 | [`README.md`](../README.md) | Visión general, inicio rápido, estructura, tecnologías | 1 min |
| 2 | [`PROJECT_VISION.md`](../PROJECT_VISION.md) | Visión del producto, plataformas, experiencia objetivo, modelo económico | 3 min |
| 3 | [`ARCHITECTURE.md`](../ARCHITECTURE.md) | Arquitectura del sistema: Gateway, buffers, opcodes, componentes | 5 min |
| 4 | [`SYSTEM_FLOW.md`](../SYSTEM_FLOW.md) | Flujo completo: usuario → frontend → backend → GameServer | 5 min |
| 5 | [`ROADMAP.md`](../ROADMAP.md) | Plan de desarrollo por etapas (MVP → Beta → Lanzamiento → Post) | 3 min |

**Tiempo total de lectura: ~17 minutos**

---

## 📖 Documentación Activa — `docs/active/`

Documentación que refleja el estado actual de componentes específicos.

| Archivo | Descripción |
|---------|-------------|
| [`LOGIN_IMPLEMENTATION_GUIDE.md`](active/LOGIN_IMPLEMENTATION_GUIDE.md) | Guía del flujo de login: archivos, opcodes, cómo usar |

---

## 🔌 Protocolo Silkroad — `docs/protocol/`

Documentación del protocolo de comunicación con el GameServer.

| Archivo | Descripción |
|---------|-------------|
| [`DUAL_TCP_ARCHITECTURE.md`](protocol/DUAL_TCP_ARCHITECTURE.md) | Arquitectura de doble conexión TCP (Gateway → Agent) para Silkroad v130 |
| [`SILKROAD_PACKET_DECRYPT_ANALYSIS.md`](protocol/SILKROAD_PACKET_DECRYPT_ANALYSIS.md) | Análisis de desencriptación: Blowfish, security bytes, CRC |

---

## 🧠 Decisiones Técnicas — `docs/decisions/`

Registro de decisiones, correcciones y bugs encontrados durante el desarrollo.

| Archivo | Descripción |
|---------|-------------|
| [`CORRECTIONS_LOG.md`](decisions/CORRECTIONS_LOG.md) | Log de bugs corregidos en paquetes Silkroad |
| [`PACKET_FIX_EXPLAINED.md`](decisions/PACKET_FIX_EXPLAINED.md) | Explicación detallada de correcciones de paquetes |

---

## 📋 Planes — `docs/plans/`

Planes de implementación históricos.

| Archivo | Descripción |
|---------|-------------|
| [`IMPLEMENTATION_PLAN.md`](plans/IMPLEMENTATION_PLAN.md) | Plan original de implementación Dual TCP (histórico, parcialmente ejecutado) |

---

## 📜 Histórica — `docs/archive/`

Documentación de hitos completados que ya no están activos.

| Archivo | Descripción |
|---------|-------------|
| `ARCHIVED_2026_05_25_IMPLEMENTATION_SUMMARY.md` | Resumen ejecutivo del login flow (hito completado) |
| `ARCHIVED_2026_05_25_VERIFICATION_CHECKLIST.md` | Checklist de verificación post-implementación |
| `ARCHIVED_2026_05_25_DUAL_TCP_STATUS.md` | Estado del Dual TCP (redundante con DUAL_TCP_ARCHITECTURE.md) |
| `ARCHIVED_2026_05_25_TESTING_GUIDE.md` | Guía de pruebas del login flow (info cubierta por LOGIN_IMPLEMENTATION_GUIDE.md) |

---

## 🧾 Auditoría — `docs/audit/`

Reportes de auditoría y limpieza documental (generados durante mayo 2026).

| Archivo | Descripción |
|---------|-------------|
| `DOC_STATUS.md` | Estado de toda la documentación .md del proyecto |
| `DOC_MERGE_PLAN.md` | Plan de fusión de documentación duplicada |
| `DOC_ARCHIVE_PLAN.md` | Plan de archivado de documentación histórica |
| `DOC_DELETE_CANDIDATES.md` | Candidatos a eliminación |
| `PREVIEW_CHANGES.md` | Vista previa de cambios (pre-ejecución) |
| `CAMBIOS_REALIZADOS.md` | Reporte de cambios ejecutados en limpieza documental |
| `ROOT_BEFORE_TREE.md` | Árbol de la raíz antes de la limpieza |
| `ROOT_AFTER_TREE.md` | Árbol de la raíz después de la limpieza |
| `ROOT_CLEANUP_REPORT.md` | Reporte final de limpieza de raíz |
| `DOC_REBUILD_REPORT.md` | Reporte de reconstrucción documental |
| `DOC_ALIGNMENT_REPORT.md` | Validación documentación vs código real |
| `DOC_GOVERNANCE_REPORT.md` | Reporte de governance y congelación |

---

## 🔍 Debug — `docs/debug/`

Archivos temporales de investigación y debugging.

| Archivo | Descripción |
|---------|-------------|
| `temp_project_scan.py` | Script temporal de análisis de dependencias entre archivos |
| `tmp_dump_6102.js` | Dump de debug de paquete 0x6102 (login request) |

---

## 📎 Referencias — `docs/reference/`

Documentación de referencia externa.

| Archivo | Descripción |
|---------|-------------|
| `ARCHIVED_2026_05_25_itemdeplayerreales.md` | Dump de ítems reales del servidor (datos crudos de BD) |
| `QUICK_START.txt` | Instrucciones rápidas de inicio (histórico) |
| `README_DUAL_TCP.txt` | Notas rápidas sobre Dual TCP (histórico, info en DUAL_TCP_ARCHITECTURE.md) |

---

## 📜 Políticas y governance

| Archivo | Descripción |
|---------|-------------|
| [`DOCUMENTATION_POLICY.md`](DOCUMENTATION_POLICY.md) | Política oficial de documentación del proyecto |
| [`CHANGELOG_DOCS.md`](CHANGELOG_DOCS.md) | Registro cronológico de cambios en documentación |

---

## 📚 Referencias Técnicas — `docs/refs/`

Código de referencia (C#/.NET) y enlaces externos. NO es código activo.

| Archivo | Descripción |
|---------|-------------|
| [`refs/README.md`](refs/README.md) | Propósito y reglas de uso de las referencias |
| [`refs/INDEX.md`](refs/INDEX.md) | Índice detallado de todo el contenido de referencia |
| `refs/code/security/` | Blowfish, handshake, paquetes (C#) |
| `refs/code/opcodes/` | Definiciones de opcodes Silkroad v130 (C#) |
| `refs/code/packets/` | Procesamiento de paquetes (C#) |
| `refs/code/network/` | Conexiones Gateway/Agent (C#) |
| `refs/code/models/` | Modelos de datos del juego (C#) |
| `refs/code/examples/` | Lógica de ejemplo: training, items, etc. (C#) |
| `refs/code/archive/` | UI MAUI y config de proyecto archivadas |
| `refs/links/repos.txt` | Repositorios públicos de referencia |
| `refs/links/notes.md` | Notas sobre cada repositorio y su relación con el código actual |

---

## 🛡️ .agent/ (NO TOCAR)

Sistema de agentes AI (AG Kit). No modificable.

| Ruta | Descripción |
|------|-------------|
| `.agent/agents/` | 20 agentes especializados |
| `.agent/skills/` | ~45 skills con carga condicional |
| `.agent/workflows/` | 14 comandos slash |
| `.agent/rules/` | Reglas globales del sistema |
| `.agent/ARCHITECTURE.md` | Arquitectura del sistema AG Kit |

---

## 📊 Estadísticas

| Categoría | Cantidad |
|-----------|----------|
| Documentos oficiales (raíz) | 5 |
| Documentos activos | 1 |
| Protocolo | 2 |
| Decisiones técnicas | 2 |
| Planes | 1 |
| Histórica | 4 |
| Auditoría | 12 |
| Debug | 2 |
| Referencias (docs/reference/) | 3 |
| Políticas y governance | 2 |
| Referencias técnicas (docs/refs/) | 1 carpeta completa |
| **Total documentado** | **34 + carpeta refs/** |
