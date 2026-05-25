# 📚 docs/refs/ — Referencias Técnicas

> Esta carpeta contiene referencias. NO es código activo.
> El código aquí NO compila. NO se ejecuta. NO se desarrolla.
> Existe SOLO como material de consulta.

---

## Propósito

Esta carpeta centraliza todo el conocimiento auxiliar del proyecto para consulta rápida por agentes y desarrolladores.

### Usar para consultar:

- **Opcodes** — Definiciones de opcodes Silkroad v130
- **Parsers** — Lógica de parseo de paquetes binarios
- **Seguridad** — Blowfish, handshake, CRC, count bytes
- **Estructuras** — Formatos de paquetes, modelos de datos
- **Modelos** — Datos del juego (items, personajes, inventario)
- **Ejemplos** — Lógica de entrenamiento, auto-potion, movimiento
- **Repos externos** — Referencias a repositorios públicos

### Reglas de uso:

1. **No copiar automáticamente** — El código C# es referencia, no debe copiarse literalmente a Node.js
2. **Validar siempre contra código actual** — La implementación activa está en `blackrosebackend/` y `blackroseweb/`
3. **Preferir la documentación activa** — Si existe documentación en `docs/active/` o `docs/protocol/`, usar esa primero

---

## Origen

| Atributo | Valor |
|----------|-------|
| Framework original | .NET 8 + MAUI |
| IDE original | Visual Studio |
| Lenguaje original | C# |
| Propósito original | Bot automatizado para Silkroad Online |
| Estado actual | Convertido a referencia técnica |

---

## Estructura

```
docs/refs/
├── README.md              ← Este archivo
├── INDEX.md               ← Índice detallado del contenido
├── code/                  ← Código de referencia clasificado
│   ├── security/          ← Blowfish, paquetes, handshake
│   ├── opcodes/           ← Definiciones de opcodes
│   ├── packets/           ← Procesamiento de paquetes
│   ├── network/           ← Conexiones Gateway/Agent
│   ├── models/            ← Modelos de datos del juego
│   ├── examples/          ← Lógica de ejemplo
│   └── archive/           ← Código archivado (UI, config runtime)
│       ├── ui/            ← Interfaz MAUI (XAML, ViewModels)
│       └── runtime/       ← Config de proyecto (csproj, Platforms, Resources)
└── links/                 ← Referencias externas
    ├── repos.txt          ← Repositorios públicos de referencia
    └── notes.md           ← Notas sobre cada repositorio
```

---

## Uso

Este código es **consulta solamente**. Para entender cómo funciona:

1. `reference/security/` — Cifrado Blowfish, estructura de paquetes
2. `reference/opcodes/` — Opcodes del protocolo Silkroad v130
3. `reference/network/` — Conexión Gateway → Agent
4. `reference/packets/` — Procesamiento y control de paquetes
5. `reference/models/` — Modelos de datos del juego
6. `reference/examples/` — Lógica de bot (training, auto-potion, etc.)

Para referencia cruzada con la implementación activa en Node.js, ver:
- `blackrosebackend/src/gamegateway/` — Gateway TCP/WebSocket
- `blackrosebackend/src/shared/` — Protocolo compartido
- `docs/protocol/` — Documentación del protocolo
