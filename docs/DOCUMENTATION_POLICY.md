# 📜 DOCUMENTATION POLICY — Black Rose

> Política oficial de documentación del proyecto.
> Establecida: 2026-05-25
> Propósito: Mantener la documentación alineada, navegable y útil.

---

## 1. PROPÓSITO DE CADA CARPETA `docs/`

| Carpeta | Propósito | ¿Qué va aquí? |
|---------|-----------|---------------|
| `docs/active/` | Documentación técnica vigente de componentes específicos | Guías de implementación activas, manuales de uso de componentes |
| `docs/protocol/` | Protocolo de comunicación con el GameServer | Opcodes, flujo Dual TCP, cifrado, formato de paquetes |
| `docs/decisions/` | Decisiones técnicas y correcciones | ADRs (Architecture Decision Records), logs de bugs, explicaciones de fixes |
| `docs/plans/` | Planes de implementación (activos o históricos) | Roadmaps detallados, plan de fases, propuestas |
| `docs/archive/` | Documentación que ya no está vigente pero se conserva como referencia | Hitos completados, checklists temporales, docs reemplazadas |
| `docs/audit/` | Reportes de auditoría y limpieza documental | Análisis de documentación, reportes de alineación, governance |
| `docs/debug/` | Archivos temporales de investigación y debugging | Scripts de análisis, dumps de paquetes, experimentos |
| `docs/reference/` | Referencias externas y datos de servidor | Dumps de BD, documentación de terceros, notas históricas |
| `docs/deployment/` | Instrucciones y configuraciones de despliegue | Scripts de deploy, configs de servidor, guías de operación |

---

## 2. CUÁNDO CREAR UN NUEVO `.md`

Se crea un nuevo documento cuando:

- **Un nuevo componente** requiere explicación que no encaja en documentos existentes
- **Una decisión técnica importante** necesita ser registrada (ADR)
- **Un protocolo o flujo nuevo** necesita ser documentado
- **Una auditoría** revela necesidad de documentar algo no cubierto

**No crear** un nuevo `.md` cuando:

- La información puede agregarse a un documento existente
- El tema es temporal (usar `docs/debug/` en su lugar)
- El tema es una nota personal (usar `docs/reference/` o archivar)

---

## 3. CUÁNDO ACTUALIZAR UNO EXISTENTE

Se actualiza un documento cuando:

- **El código cambia** y la documentación ya no refleja la realidad
- **Se descubre un error** en la documentación existente
- **Una nueva versión** de un componente cambia su comportamiento
- **El roadmap avanza** y una feature pasa de PLAN a IMPLEMENTADO

**Regla**: Si el cambio es menor (typo, ruta incorrecta), actualizar directamente.
Si el cambio es estructural (nuevo flujo, nuevo componente), actualizar también:
- `README.md`
- `ARCHITECTURE.md`
- `SYSTEM_FLOW.md`

---

## 4. CUÁNDO ARCHIVAR

Un documento se archiva (mueve a `docs/archive/`) cuando:

- **El hito que describe está 100% completado** y la información está cubierta por otro documento activo
- **El plan fue ejecutado o reemplazado** por un plan más reciente
- **La guía temporal ya no es necesaria** (checklists, guías de prueba puntuales)
- **El documento fue reemplazado** por una versión más completa

**Formato de archivado**:
```
ARCHIVED_YYYY_MM_DD_nombre_original.md
```

**No archivar** documentos que aún son la fuente principal de información sobre un tema.

---

## 5. CONVENCIONES DE NOMBRES

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Documento principal | `MAYUSCULAS_CON_GUIONES.md` | `ARCHITECTURE.md`, `PROJECT_VISION.md` |
| Documento de protocolo | `MAYUSCULAS_CON_GUIONES.md` | `DUAL_TCP_ARCHITECTURE.md` |
| Documento activo | `MAYUSCULAS_CON_GUIONES.md` | `LOGIN_IMPLEMENTATION_GUIDE.md` |
| Decisión técnica | `MAYUSCULAS_CON_GUIONES.md` | `CORRECTIONS_LOG.md` |
| Plan | `MAYUSCULAS_CON_GUIONES.md` | `IMPLEMENTATION_PLAN.md` |
| Archivado | `ARCHIVED_YYYY_MM_DD_nombre.md` | `ARCHIVED_2026_05_25_TESTING_GUIDE.md` |
| Auditoría | `DOC_MAYUSCULAS.md` | `DOC_STATUS.md`, `DOC_ALIGNMENT_REPORT.md` |
| Debug | `nombre_descriptivo.ext` | `temp_project_scan.py` |
| Política | `DOCUMENTATION_POLICY.md` | Fijo |
| Changelog | `CHANGELOG_DOCS.md` | Fijo |
| Reporte de governance | `DOC_GOVERNANCE_REPORT.md` | Fijo |

---

## 6. ESTADOS DE LA DOCUMENTACIÓN

Cada documento debe reflejar su estado real. Usar estos marcadores:

| Estado | Significado | Dónde se usa |
|--------|-------------|--------------|
| **IMPLEMENTADO** | La feature existe en código y funciona | Documentos principales, ROADMAP.md |
| **PARCIAL** | La feature existe pero incompleta o con bugs | ROADMAP.md, docs activas |
| **PLAN** | La feature está planeada pero no implementada | ROADMAP.md, docs/plans/ |
| **VISIÓN** | Concepto futuro sin plan concreto | PROJECT_VISION.md |
| **ARCHIVADO** | Documento histórico, movido a docs/archive/ | docs/archive/ |

**Formato recomendado en documentos**:
```markdown
| Feature | Estado |
|---------|--------|
| Login request/response | ✅ IMPLEMENTADO |
| Reconexión al Agent | 🟡 PARCIAL |
| Chat en tiempo real | 🔵 PLAN |
| App Android | 🟡 VISIÓN |
```

---

## 7. REGLA: NO CREAR DOCUMENTOS TEMPORALES EN RAÍZ

**Todo documento nuevo debe crearse dentro de `docs/`.**

La raíz del proyecto solo contiene:
- `README.md` — Portal de entrada
- `ARCHITECTURE.md` — Arquitectura del sistema
- `PROJECT_VISION.md` — Visión del producto
- `ROADMAP.md` — Plan de desarrollo
- `SYSTEM_FLOW.md` — Flujo de datos
- `DOCUMENTATION_INDEX.md` — (en `docs/`) Índice central

Excepciones:
- `CHANGELOG_DOCS.md` puede estar en raíz o en `docs/`
- Archivos de código (`.js`, `.jsx`, `.py`, `.bat`) no son documentación

**Cualquier `.md` temporal, de auditoría, debug o referencia debe ir a su subcarpeta correspondiente en `docs/`.**

---

## 8. REGLA: CAMBIOS ARQUITECTÓNICOS REQUIEREN ACTUALIZACIÓN MÚLTIPLE

Cuando se realiza un cambio arquitectónico significativo (nuevo componente, nuevo flujo, cambio de protocolo), **todos** estos documentos deben actualizarse:

1. **`README.md`** — Si la estructura del proyecto cambia
2. **`ARCHITECTURE.md`** — Si los componentes o su relación cambian
3. **`SYSTEM_FLOW.md`** — Si el flujo de datos cambia

Adicionalmente, según el alcance:
4. **`docs/protocol/`** — Si cambia el protocolo Silkroad
5. **`docs/decisions/`** — Si es una decisión técnica relevante

---

## 9. REGLA: DOCUMENTOS DE AUDITORÍA EN `docs/audit/`

Todos los reportes de auditoría, validación y limpieza documental deben vivir exclusivamente en `docs/audit/`.

Esto incluye:
- Análisis de documentación (`DOC_STATUS.md`)
- Planes de limpieza (`DOC_MERGE_PLAN.md`, `DOC_ARCHIVE_PLAN.md`, `DOC_DELETE_CANDIDATES.md`)
- Reportes de cambios (`CAMBIOS_REALIZADOS.md`, `PREVIEW_CHANGES.md`)
- Árboles de proyecto (`ROOT_BEFORE_TREE.md`, `ROOT_AFTER_TREE.md`)
- Reportes de alineación (`DOC_ALIGNMENT_REPORT.md`)
- Reportes de governance (`DOC_GOVERNANCE_REPORT.md`)

**No crear reportes de auditoría en la raíz del proyecto.**

---

## 10. REGLA: NO DUPLICAR DOCUMENTACIÓN

Antes de crear un documento nuevo, verificar:
- ¿La información ya existe en otro documento?
- ¿Puedo agregar una sección a un documento existente en lugar de crear uno nuevo?
- ¿El tema es lo suficientemente distinto como para justificar un archivo separado?

**Si dos documentos contienen más del 60% de información duplicada, deben fusionarse.**

Excepción: Los documentos principales (`README.md`, `ARCHITECTURE.md`, `SYSTEM_FLOW.md`) pueden contener resúmenes de información detallada en otros documentos, siempre que referencien al documento fuente.
