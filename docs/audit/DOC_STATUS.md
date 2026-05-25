# DOC_STATUS.md — Estado de toda la documentación .md

> Auditoría completa. Fecha: 2026-05-25
> Regla: NO modificar código. NO tocar backend/web/bot/.agent.

---

## A) DOCUMENTACIÓN VIVA — KEEP

### `README.md` (raíz)
| Campo | Valor |
|-------|-------|
| **última_evidencia_en_código** | README principal del frontend. Describe blackroseweb/ con precisión. |
| **referenciado_por** | Uso humano. No hay imports de código. |
| **estado_real** | ✅ Válido. Describe correctamente blackroseweb/ y su stack (React 18, Vite 5). |
| **nivel_confianza** | 95 |
| **acción** | **KEEP** |

### `blackroseweb/README.md`
| Campo | Valor |
|-------|-------|
| **última_evidencia_en_código** | README del frontend. Es el mismo archivo que README.md raíz (duplicado exacto). |
| **referenciado_por** | Uso humano. |
| **estado_real** | ✅ Válido pero **duplicado exacto** del README.md raíz. |
| **nivel_confianza** | 95 |
| **acción** | **MERGE** (eliminar este, mantener raíz) |

### `ARCHITECTURE.md`
| Campo | Valor |
|-------|-------|
| **última_evidencia_en_código** | Describe monorepo: blackrosebackend (transporte), blackroseweb (cliente), shared/ (protocolo). Coincide con estructura real. |
| **referenciado_por** | `.agent/agents/orchestrator.md` línea 32: "Read ARCHITECTURE.md to see full list of Scripts & Skills" |
| **estado_real** | ✅ Válido. Arquitectura actual del proyecto. |
| **nivel_confianza** | 95 |
| **acción** | **KEEP** |

### `DUAL_TCP_ARCHITECTURE.md`
| Campo | Valor |
|-------|-------|
| **última_evidencia_en_código** | Describe flujo Gateway→Agent. `TcpConnectionManager.js` existe en `blackrosebackend/src/gamegateway/tcp/`. |
| **referenciado_por** | `DUAL_TCP_STATUS.md`, `IMPLEMENTATION_PLAN.md` |
| **estado_real** | ✅ Válido. Arquitectura activa del Dual TCP. |
| **nivel_confianza** | 90 |
| **acción** | **KEEP** |

### `CORRECTIONS_LOG.md`
| Campo | Valor |
|-------|-------|
| **última_evidencia_en_código** | Describe correcciones en `LoginRequestBuilder.js` y `OPCODE_DEFINITIONS.js` que existen. |
| **referenciado_por** | Solo referenciado por humanos. |
| **estado_real** | ✅ Válido. Log de bugs corregidos útil para trazabilidad. |
| **nivel_confianza** | 85 |
| **acción** | **KEEP** |

### `LOGIN_IMPLEMENTATION_GUIDE.md`
| Campo | Valor |
|-------|-------|
| **última_evidencia_en_código** | Archivos listados existen: `OPCODE_DEFINITIONS.js`, `LoginRequestBuilder.js`, `LoginHandler.js`, `WebSocketLoginHandler.js`. |
| **referenciado_por** | `IMPLEMENTATION_SUMMARY.md` |
| **estado_real** | ✅ Válido. Guía completa del login flow. |
| **nivel_confianza** | 85 |
| **acción** | **KEEP** |

### `TESTING_GUIDE.md`
| Campo | Valor |
|-------|-------|
| **última_evidencia_en_código** | Pasos de prueba referencian archivos que existen. |
| **referenciado_por** | `VERIFICATION_CHECKLIST.md`, `IMPLEMENTATION_SUMMARY.md` |
| **estado_real** | ✅ Válido. Guía de testing funcional. |
| **nivel_confianza** | 80 |
| **acción** | **KEEP** |

### `PACKET_FIX_EXPLAINED.md`
| Campo | Valor |
|-------|-------|
| **última_evidencia_en_código** | Referencia `debug-packets.js` que existe. Describe correcciones aplicadas en `LoginRequestBuilder.js`. |
| **referenciado_por** | Solo referenciado por humanos. |
| **estado_real** | ✅ Válido. Documentación de bugfix históricamente útil. |
| **nivel_confianza** | 80 |
| **acción** | **KEEP** |

---

## B) DOCUMENTACIÓN DESACTUALIZADA PERO RESCATABLE — UPDATE

### `IMPLEMENTATION_PLAN.md`
| Campo | Valor |
|-------|-------|
| **última_evidencia_en_código** | `TcpConnectionManager.js` existe. Pero Pasos 2-5 están marcados PENDIENTES mientras que `IMPLEMENTATION_SUMMARY.md` y `DUAL_TCP_STATUS.md` dicen que el login flow está al 100%. |
| **referenciado_por** | `DUAL_TCP_STATUS.md` lo menciona como plan. |
| **estado_real** | ❌ **Desactualizado**. Dice Pasos 2-5 pendientes, pero hay evidencia de que se avanzó. |
| **nivel_confianza** | 75 |
| **acción** | **UPDATE** — Marcar pasos completados o alinear con estado real. |

**Qué corregir:**
- Paso 2 (TcpSession.js): Verificar si ya se actualizó o sigue pendiente
- Paso 3 (LoginHandler.js): Verificar estado real
- Pasos 4-5: Ídem
- Agregar sección de estado actual vs plan original

### `DUAL_TCP_STATUS.md`
| Campo | Valor |
|-------|-------|
| **última_evidencia_en_código** | `TcpConnectionManager.js` existe. Dice Pasos 2-5 PENDIENTES. |
| **referenciado_por** | Solo lectura humana. |
| **estado_real** | ⚠️ **Parcialmente desactualizado**. El summary dice login flow 100%, pero este status report dice pasos pendientes. Hay contradicción. |
| **nivel_confianza** | 70 |
| **acción** | **UPDATE** — Resolver contradicción con IMPLEMENTATION_SUMMARY.md |

**Qué corregir:**
- Verificar qué pasos del plan realmente se ejecutaron
- Actualizar tabla de resumen de cambios
- Alinear con IMPLEMENTATION_SUMMARY.md

---

## C) DOCUMENTACIÓN HISTÓRICA — MOVE → docs/archive/

### `IMPLEMENTATION_SUMMARY.md`
| Campo | Valor |
|-------|-------|
| **última_evidencia_en_código** | Archivos listados existen. Describe un hito completado. |
| **referenciado_por** | Referencia cruzada con `VERIFICATION_CHECKLIST.md` y `LOGIN_IMPLEMENTATION_GUIDE.md` |
| **estado_real** | ✅ Fue útil. Describe un hito **completado** (login flow al 100%). Ya no es plan, es historia. |
| **nivel_confianza** | 90 |
| **acción** | **MOVE → docs/archive/IMPLEMENTATION_SUMMARY.md** |

### `VERIFICATION_CHECKLIST.md`
| Campo | Valor |
|-------|-------|
| **última_evidencia_en_código** | Checklist de verificación post-implementación. Archivos listados existen. |
| **referenciado_por** | Solo lectura humana. |
| **estado_real** | ✅ Fue útil como checklist temporal. Ya se verificó. |
| **nivel_confianza** | 80 |
| **acción** | **MOVE → docs/archive/VERIFICATION_CHECKLIST.md** |

### `SILKROAD_PACKET_DECRYPT_ANALYSIS.md`
| Campo | Valor |
|-------|-------|
| **última_evidencia_en_código** | Análisis de desencriptación basado en repos de referencia. No hay código que lo importe. |
| **referenciado_por** | Ninguna referencia en código. |
| **estado_real** | 📄 Documento de investigación útil como referencia pero no es documentación activa del proyecto. |
| **nivel_confianza** | 70 |
| **acción** | **MOVE → docs/archive/SILKROAD_PACKET_DECRYPT_ANALYSIS.md** |

### `itemdeplayerreales.md`
| Campo | Valor |
|-------|-------|
| **última_evidencia_en_código** | Dump de ítems de BD del servidor. No hay código que lo referencie. |
| **referenciado_por** | Ninguna referencia. |
| **estado_real** | 📄 Dump de datos crudos. Útil como referencia de ítems pero no es documentación activa. |
| **nivel_confianza** | 50 |
| **acción** | **MOVE → docs/archive/itemdeplayerreales.md** |

---

## D) DOCUMENTACIÓN DUPLICADA — MERGE

### `README.md` (raíz) ↔ `blackroseweb/README.md`
| Campo | Valor |
|-------|-------|
| **evidencia** | Contenido idéntico. Ambos describen blackroseweb/. |
| **archivo destino** | `README.md` (raíz) |
| **archivos a eliminar** | `blackroseweb/README.md` |
| **nivel_confianza** | 95 |
| **acción** | **MERGE** — Eliminar `blackroseweb/README.md`, mantener raíz |

---

## E) DOCUMENTACIÓN BASURA / TEMPORAL — DELETE_CANDIDATE

*(Ninguno de los .md analizados califica como basura pura. Los archivos temporales están en otros formatos.)*

---

## F) DOCUMENTACIÓN .agent/ (FUERA DE ALCANCE — NO TOCAR)

Todos los .md dentro de `.agent/` (workflows/, skills/, agents/, rules/, ARCHITECTURE.md) son parte del **sistema de agentes AI activo** y NO deben tocarse. Esto incluye:

- 14 workflows en `.agent/workflows/`
- ~45 skills en `.agent/skills/` (con SKILL.md y sub-archivos)
- 20 agentes en `.agent/agents/`
- `.agent/rules/GEMINI.md`
- `.agent/ARCHITECTURE.md`
- `.agent/skills/doc.md`

**Excepción**: Si se detectan skills no usadas por ningún agente, pueden marcarse como candidatas a revisión, pero NO eliminación.
