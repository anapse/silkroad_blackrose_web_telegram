# PREVIEW_CHANGES.md — Vista previa de cambios documentales

> Fecha: 2026-05-25
> Basado en: DOC_STATUS.md, DOC_MERGE_PLAN.md, DOC_ARCHIVE_PLAN.md, DOC_DELETE_CANDIDATES.md

---

## Resumen de operaciones

| Operación | Cantidad | Archivos |
|-----------|----------|----------|
| CREAR estructura | 6 | docs/, docs/active/, docs/archive/, docs/plans/, docs/debug/, docs/reference/ |
| MOVER (archive) | 4 | IMPLEMENTATION_SUMMARY.md, VERIFICATION_CHECKLIST.md, SILKROAD_PACKET_DECRYPT_ANALYSIS.md, itemdeplayerreales.md |
| ACTUALIZAR (UPDATE) | 2 | IMPLEMENTATION_PLAN.md, DUAL_TCP_STATUS.md |
| FUSIONAR (MERGE) | 1 | blackroseweb/README.md → README.md (raíz) |
| CREAR índice | 1 | DOCUMENTATION_INDEX.md |
| CREAR reporte | 1 | CAMBIOS_REALIZADOS.md |
| **TOTAL** | **15** | |

---

## ARCHIVO: docs/ (crear)
- **ACCIÓN**: Crear estructura de carpetas
- **MOTIVO**: Organizar documentación por tipo (activa, archive, planes, debug, referencias)
- **RIESGO**: Ninguno. Solo creación de carpetas.
- **RECUPERACIÓN**: Eliminar carpetas si es necesario.

---

## ARCHIVO: IMPLEMENTATION_SUMMARY.md
- **ACCIÓN**: MOVE → docs/archive/ARCHIVED_2026_05_25_IMPLEMENTATION_SUMMARY.md
- **MOTIVO**: Describe hito completado (login flow 100%). Ya no es documentación activa.
- **RIESGO**: Bajo. Información cubierta por LOGIN_IMPLEMENTATION_GUIDE.md y TESTING_GUIDE.md.
- **RECUPERACIÓN**: Mover de vuelta a raíz.

---

## ARCHIVO: VERIFICATION_CHECKLIST.md
- **ACCIÓN**: MOVE → docs/archive/ARCHIVED_2026_05_25_VERIFICATION_CHECKLIST.md
- **MOTIVO**: Checklist temporal de verificación post-implementación. Ya se verificó.
- **RIESGO**: Bajo. No hay referencias externas.
- **RECUPERACIÓN**: Mover de vuelta a raíz.

---

## ARCHIVO: SILKROAD_PACKET_DECRYPT_ANALYSIS.md
- **ACCIÓN**: MOVE → docs/reference/SILKROAD_PACKET_DECRYPT_ANALYSIS.md
- **MOTIVO**: Documento de investigación. Mejor ubicación en docs/reference/ que en archive/.
- **RIESGO**: Bajo. No hay código que lo referencie.
- **RECUPERACIÓN**: Mover de vuelta a raíz.

---

## ARCHIVO: itemdeplayerreales.md
- **ACCIÓN**: MOVE → docs/reference/ARCHIVED_2026_05_25_itemdeplayerreales.md
- **MOTIVO**: Dump de datos crudos. Mejor en reference/ que en archive/ por ser data útil.
- **RIESGO**: Bajo. No hay código que lo referencie.
- **RECUPERACIÓN**: Mover de vuelta a raíz.

---

## ARCHIVO: IMPLEMENTATION_PLAN.md
- **ACCIÓN**: UPDATE — Agregar encabezado de estado, mover a docs/plans/
- **MOTIVO**: Plan parcialmente ejecutado. Debe reflejar estado real.
- **RIESGO**: Medio. Contiene código ejemplo que puede ser útil. Se conserva íntegro.
- **RECUPERACIÓN**: Revertir cambios de encabezado, mover de vuelta.

---

## ARCHIVO: DUAL_TCP_STATUS.md
- **ACCIÓN**: UPDATE — Agregar encabezado de estado y nota de contradicción resuelta
- **MOTIVO**: Estado parcialmente desactualizado. Debe alinearse con realidad.
- **RIESGO**: Bajo. Solo se agrega metadata, no se modifica contenido.
- **RECUPERACIÓN**: Revertir cambios de encabezado.

---

## ARCHIVO: blackroseweb/README.md
- **ACCIÓN**: MERGE — Reemplazar contenido con referencia al README.md raíz
- **MOTIVO**: Duplicado exacto (>95% de contenido idéntico).
- **RIESGO**: Bajo. Contenido idéntico verificado. Se conserva archivo con redirect.
- **RECUPERACIÓN**: Restaurar contenido original desde README.md raíz.

---

## ARCHIVO: DOCUMENTATION_INDEX.md
- **ACCIÓN**: CREAR — Índice central de documentación
- **MOTIVO**: Facilitar navegación de toda la documentación organizada.
- **RIESGO**: Ninguno. Archivo nuevo.
- **RECUPERACIÓN**: Eliminar archivo.

---

## ARCHIVO: CAMBIOS_REALIZADOS.md
- **ACCIÓN**: CREAR — Reporte final de cambios ejecutados
- **MOTIVO**: Documentar qué se hizo para trazabilidad.
- **RIESGO**: Ninguno. Archivo nuevo.
- **RECUPERACIÓN**: Eliminar archivo.

---

## Validación de referencias cruzadas

| Archivo a mover/actualizar | Referenciado por | ¿Se rompe? |
|---------------------------|------------------|------------|
| IMPLEMENTATION_SUMMARY.md | VERIFICATION_CHECKLIST.md (también se mueve), LOGIN_IMPLEMENTATION_GUIDE.md (KEEP) | NO — LOGIN_IMPLEMENTATION_GUIDE.md no tiene enlaces directos al summary |
| VERIFICATION_CHECKLIST.md | IMPLEMENTATION_SUMMARY.md (también se mueve) | NO — ambos van al mismo destino |
| SILKROAD_PACKET_DECRYPT_ANALYSIS.md | Ninguna | NO |
| itemdeplayerreales.md | Ninguna | NO |
| IMPLEMENTATION_PLAN.md | DUAL_TCP_STATUS.md (se actualiza también) | NO — se actualiza referencia internamente |
| DUAL_TCP_STATUS.md | Solo lectura humana | NO |
| blackroseweb/README.md | Solo lectura humana | NO |
| ARCHITECTURE.md | .agent/agents/orchestrator.md | **NO SE TOCA** (KEEP) |
| README.md (raíz) | Solo lectura humana | **NO SE TOCA** (KEEP) |

**Conclusión**: 0 referencias rotas. Riesgo general: **MUY BAJO**.
