# ROOT_BEFORE_TREE.md — Árbol de la raíz ANTES de la limpieza

> Fecha: 2026-05-25

---

## Estructura de la raíz (ANTES)

```
/ (webblackrose)
├── 📄 .gitignore
├── 📄 ARCHITECTURE.md
├── 📄 CAMBIOS_REALIZADOS.md          ← mover a docs/audit/
├── 📄 DOC_ARCHIVE_PLAN.md            ← mover a docs/audit/
├── 📄 DOC_DELETE_CANDIDATES.md       ← mover a docs/audit/
├── 📄 DOC_MERGE_PLAN.md              ← mover a docs/audit/
├── 📄 DOC_STATUS.md                  ← mover a docs/audit/
├── 📄 LOGIN_FRONTEND_EXAMPLE.jsx     ← NO TOCAR (no es .md, es componente de prueba)
├── 📄 PREVIEW_CHANGES.md             ← mover a docs/audit/
├── 📄 QUICK_START.txt                ← mover a docs/reference/
├── 📄 README.md                      ← CONSERVAR
├── 📄 README_DUAL_TCP.txt            ← mover a docs/reference/
├── 📄 backend.bat                    ← CONSERVAR
├── 📄 couflaretunel.bat              ← CONSERVAR
├── 📄 ngrok.bat                      ← CONSERVAR
├── 📄 package-lock.json              ← CONSERVAR
├── 📄 repos.txt                      ← CONSERVAR (opcional)
├── 📄 temp_project_scan.py           ← mover a docs/debug/
├── 📄 tmp_dump_6102.js               ← mover a docs/debug/
├── 📄 web.bat                        ← CONSERVAR
│
├── 📁 blackrosebackend/              ← NO TOCAR
├── 📁 blackroseweb/                  ← NO TOCAR
├── 📁 bot/                           ← NO TOCAR
├── 📁 .agent/                        ← NO TOCAR
├── 📁 docs/                          ← YA EXISTE
│   ├── 📁 active/
│   ├── 📁 archive/
│   ├── 📁 plans/
│   ├── 📁 reference/
│   └── 📄 DOCUMENTATION_INDEX.md
│
└── 📁 node_modules/                  ← ignorado
```

## Conteo

| Tipo | Cantidad |
|------|----------|
| Archivos en raíz | **20** |
| Carpetas en raíz | 5 (backend, web, bot, .agent, docs) + node_modules |
| Archivos a CONSERVAR en raíz | **9** |
| Archivos a MOVER fuera de raíz | **11** |
| Archivos a ELIMINAR | **0** |
