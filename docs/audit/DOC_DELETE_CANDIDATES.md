# DOC_DELETE_CANDIDATES.md — Candidatos a eliminación

> Solo propuesta. NO ejecutar cambios todavía.
> Regla: NUNCA borrar sin antes archivar.

---

## Candidatos a eliminación (archivos .md)

**NINGÚN archivo .md califica como DELETE puro.**

Todos los .md de documentación fuera de `.agent/` tienen algún valor, aunque sea histórico. La estrategia recomendada es **archivar** en lugar de eliminar.

---

## Archivos temporales (NO .md) que sí son candidatos a DELETE

Estos no son .md pero son basura temporal identificada:

| Archivo | Formato | Razón | Acción propuesta |
|---------|---------|-------|------------------|
| `temp_project_scan.py` | .py | Script temporal de análisis de dependencias | Archivar o eliminar |
| `tmp_dump_6102.js` | .js | Dump de debug de paquete 0x6102 | Archivar o eliminar |

---

## Riesgo de eliminar algo mal

| Escenario | Riesgo | Mitigación |
|-----------|--------|------------|
| Eliminar `.md` sin verificar referencias en `.agent/` | ALTO — Los agentes podrían referenciar archivos | Buscar referencias en todos los agentes/workflows primero |
| Eliminar `IMPLEMENTATION_PLAN.md` | MEDIO — Contiene código ejemplo útil | Archivar antes |
| Eliminar `README_DUAL_TCP.txt` | BAJO — Es duplicado .txt de .md | Verificar que nadie lo referencie |
| Eliminar `temp_project_scan.py` | BAJO — Script temporal | Confirmar que ya no se necesita |
