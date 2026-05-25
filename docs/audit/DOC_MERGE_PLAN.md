# DOC_MERGE_PLAN.md — Plan de fusión de documentación

> Solo propuesta. NO ejecutar cambios.

---

## Fusión 1: README duplicados

### Origen
- `blackroseweb/README.md` (duplicado exacto de raíz)

### Destino
- `README.md` (raíz) — conservar

### Acción
1. Verificar que `README.md` (raíz) esté actualizado
2. Eliminar `blackroseweb/README.md`
3. No se pierde información

### Riesgo
- Bajo. Es duplicado exacto.

---

## Fusión 2: Documentación Dual TCP (3 archivos → 2 archivos)

### Archivos involucrados
| Archivo | Rol | Acción |
|---------|-----|--------|
| `DUAL_TCP_ARCHITECTURE.md` | Arquitectura | CONSERVAR |
| `DUAL_TCP_STATUS.md` | Estado | CONSERVAR (actualizar) |
| `IMPLEMENTATION_PLAN.md` | Plan | FUSIONAR en DUAL_TCP_STATUS.md |

### Plan
1. Mover secciones de plan no ejecutadas de `IMPLEMENTATION_PLAN.md` a `DUAL_TCP_STATUS.md` como "Próximos pasos"
2. Eliminar `IMPLEMENTATION_PLAN.md` (o archivarlo)
3. Actualizar `DUAL_TCP_STATUS.md` con estado real

### Riesgo
- Medio. `IMPLEMENTATION_PLAN.md` contiene código ejemplo que podría seguir siendo útil.

---

## Fusión 3: Documentación de Login (3 archivos → 2 archivos)

### Archivos involucrados
| Archivo | Rol | Acción |
|---------|-----|--------|
| `LOGIN_IMPLEMENTATION_GUIDE.md` | Guía completa | CONSERVAR |
| `IMPLEMENTATION_SUMMARY.md` | Resumen ejecutivo | ARCHIVAR |
| `TESTING_GUIDE.md` | Pruebas | CONSERVAR |

### Plan
1. `IMPLEMENTATION_SUMMARY.md` → archivo histórico (mover a docs/archive/)
2. No hay fusión real, solo re-clasificación

### Riesgo
- Bajo. El summary ya cumplió su propósito.
