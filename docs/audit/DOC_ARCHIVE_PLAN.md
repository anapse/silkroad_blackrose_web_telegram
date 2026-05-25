# DOC_ARCHIVE_PLAN.md — Plan de archivado de documentación

> Solo propuesta. NO ejecutar cambios.

---

## Archivos a mover a `docs/archive/`

### Crear estructura
```
docs/
└── archive/
    ├── IMPLEMENTATION_SUMMARY.md
    ├── VERIFICATION_CHECKLIST.md
    ├── SILKROAD_PACKET_DECRYPT_ANALYSIS.md
    └── itemdeplayerreales.md
```

---

### 1. `IMPLEMENTATION_SUMMARY.md`

| Campo | Valor |
|-------|-------|
| **Propósito original** | Resumen ejecutivo del login flow implementado |
| **Por qué archivar** | Describe un hito **completado**. Ya no es plan activo. |
| **Riesgo de archivar** | Bajo. La información está cubierta por `LOGIN_IMPLEMENTATION_GUIDE.md` y `TESTING_GUIDE.md`. |
| **Confianza** | 90 |

---

### 2. `VERIFICATION_CHECKLIST.md`

| Campo | Valor |
|-------|-------|
| **Propósito original** | Checklist de verificación post-implementación |
| **Por qué archivar** | Era un checklist temporal para verificar que la implementación de login funcionaba. Ya se verificó. |
| **Riesgo de archivar** | Bajo. Es una lista de verificación que ya no se necesita. |
| **Confianza** | 80 |

---

### 3. `SILKROAD_PACKET_DECRYPT_ANALYSIS.md`

| Campo | Valor |
|-------|-------|
| **Propósito original** | Investigación de cómo los bots públicos manejan desencriptación Silkroad |
| **Por qué archivar** | Documento de investigación que no es documentación activa del proyecto. Útil como referencia. |
| **Riesgo de archivar** | Bajo. No hay código que lo referencie. |
| **Confianza** | 70 |

---

### 4. `itemdeplayerreales.md`

| Campo | Valor |
|-------|-------|
| **Propósito original** | Dump de ítems reales del servidor Silkroad |
| **Por qué archivar** | Datos crudos de BD. No es documentación activa. Útil como referencia de ítems. |
| **Riesgo de archivar** | Bajo. No hay código que lo referencie. |
| **Confianza** | 50 |
