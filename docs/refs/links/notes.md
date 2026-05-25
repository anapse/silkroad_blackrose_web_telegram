# docs/refs/links/notes.md — Notas sobre repositorios externos

> Referencias a repositorios públicos usados como inspiración técnica.
> NO copiar código automáticamente. Validar siempre contra implementación actual.

---

## Repositorios listados en `repos.txt`

| Repositorio | Lenguaje | Qué consultar | Qué evitar copiar |
|-------------|----------|---------------|-------------------|
| [leolongvu/SilkroadLeoBot](https://github.com/leolongvu/SilkroadLeoBot) | C# | Estructura de opcodes, manejo de paquetes, Blowfish | Lógica específica del bot, UI |
| [JellyBitz/xBot-WinForms](https://github.com/JellyBitz/xBot-WinForms) | C# | Security bytes, CRC, handshake Blowfish | UI WinForms, config de usuario |
| [svalencius/silkroad-bot](https://github.com/svalencius/silkroad-bot) | JavaScript | **Referencia principal para Dual TCP** — flujo Gateway→Agent | Lógica de bot específica |
| [myildirimofficial/RSBot](https://github.com/myildirimofficial/RSBot) | C# | Estructuras de paquetes, opcodes v130 | UI, sistema de plugins |
| [tarekwiz/SilkroadBot](https://github.com/tarekwiz/SilkroadBot) | C# | Manejo de conexiones, parsing de paquetes | Lógica de entrenamiento |

---

## Relación con el código actual

| Concepto | Referencia principal | Implementación actual |
|----------|---------------------|----------------------|
| Dual TCP (Gateway → Agent) | svalencius/silkroad-bot | `blackrosebackend/src/gamegateway/tcp/TcpConnectionManager.js` |
| Blowfish + Handshake | JellyBitz/xBot-WinForms, SilkroadLeoBot | `blackrosebackend/src/gamegateway/security/Security.js` |
| Opcodes v130 | Múltiples repos | `blackrosebackend/src/shared/opcodes/OPCODE_DEFINITIONS.js` |
| Login flow | svalencius/silkroad-bot | `blackrosebackend/src/shared/handlers/LoginHandler.js` |
| Packet structure | Todos | `blackrosebackend/src/gamegateway/packet/PacketReader.js` |
