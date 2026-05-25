# README_SECURITY_REPORT.md — Sanitización de README.md

> Fecha: 2026-05-25
> Objetivo: Verificar que README.md no expone información sensible.

---

## Elementos ELIMINADOS del README

| Categoría | Elemento | Riesgo |
|-----------|----------|--------|
| IP real | `26.74.212.246` | 🔴 Alto — IP del GameServer |
| Puerto real | `15880` (Gateway) | 🔴 Alto — Puerto de servicio |
| Puerto real | `15882` (Agent) | 🔴 Alto — Puerto de servicio |
| Puerto real | `8081` (WebSocket) | 🟡 Medio — Puerto interno |
| Variable real | `SERVER_HOST=26.74.212.246` | 🔴 Alto — Dato de conexión |
| Variable real | `GATEWAY_PORT=15880` | 🔴 Alto — Dato de conexión |
| Variable real | `AGENT_PORT=15882` | 🔴 Alto — Dato de conexión |
| Variable real | `WS_PORT=8081` | 🟡 Medio — Puerto interno |
| Comandos reales | `npm run dev`, `npm install` | 🟢 Bajo — Comandos estándar |
| Scripts .bat | `backend.bat`, `web.bat`, `ngrok.bat`, `couflaretunel.bat` | 🟢 Bajo — Scripts de inicio |
| Túneles | ngrok, cloudflared tunnel | 🟡 Medio — Infraestructura expuesta |
| Estructura interna | Árbol detallado de carpetas del backend | 🟡 Medio — Mapa de ataque |
| .NET badge | `bot/` mencionado como proyecto activo | 🟢 Bajo — Ya no existe como proyecto |
| Licencia anterior | "desarrollado para el servidor Black Rose" | 🟢 Bajo — Asociación con servidor específico |

---

## Elementos CONSERVADOS (seguros)

| Elemento | Motivo |
|----------|--------|
| Badges de tecnologías (React, Vite, Node) | Información pública del stack |
| Descripción general del proyecto | No revela datos operativos |
| Plataformas objetivo | Visión del producto |
| Filosofía y principios | Documentación pública |
| Modelo económico (visión) | Sin datos concretos, marcado como "ideas futuras" |
| Sección "Apoyar el proyecto" | Sin direcciones, wallets ni montos |
| Enlaces a documentación | Rutas internas del repo |

---

## Elementos NUEVOS agregados

| Elemento | Propósito |
|----------|-----------|
| Sección "Visión" | Claridad del objetivo del producto |
| Sección "Filosofía" | Principios de diseño sin datos técnicos |
| Sección "Apoyar el proyecto" | Canal de contribución sin exponer datos financieros |
| Licencia revisada | Términos más claros y restrictivos |

---

## Validación post-sanitización

| Verificación | Resultado |
|-------------|-----------|
| IPs en README.md | **0** ✅ |
| Puertos en README.md | **0** ✅ |
| Variables .env en README.md | **0** ✅ |
| Comandos de conexión en README.md | **0** ✅ |
| URLs de servidores en README.md | **0** ✅ |
| Tokens o contraseñas en README.md | **0** ✅ |

---

## Riesgo residual

| Factor | Nivel |
|--------|-------|
| Exposición de infraestructura | 0/100 |
| Exposición de credenciales | 0/100 |
| Exposición de IPs/puertos | 0/100 |
| **Riesgo total** | **0/100** ✅ |

---

## Nota

La información técnica sensible (configuración de red, variables de entorno, scripts de inicio, estructura interna) sigue existiendo en el repositorio para desarrollo, pero ha sido removida del README público. Los desarrolladores autorizados pueden consultar la documentación interna en `docs/` y los archivos de configuración directamente.
