# Auditoría de Coordenadas — BlackRose

> **Propósito**: Documentación exhaustiva de TODO el flujo de coordenadas, desde que se leen del paquete Silkroad hasta que se renderizan en el mapa del frontend.
>
> **⚠️ Esta auditoría NO corrige nada. Solo expone el estado actual.**

## Archivos

| # | Archivo | Contenido |
|---|---------|-----------|
| 1 | [`01-backend-reading.md`](./01-backend-reading.md) | Cómo el backend (Node.js) lee coordenadas de los paquetes TCP de Silkroad |
| 2 | [`02-frontend-rendering.md`](./02-frontend-rendering.md) | Cómo el frontend recibe, convierte y grafica coordenadas |
| 3 | [`03-movement.md`](./03-movement.md) | Flujo completo de movimiento |
| 4 | [`04-all-fields.md`](./04-all-fields.md) | Todos los campos leídos junto a las coordenadas |
| 5 | [`05-constants-and-formulas.md`](./05-constants-and-formulas.md) | Constantes, fórmulas y centros del sistema de coordenadas |

## Archivos de referencia antiguos (C# MerchBot)

Los archivos `.cs` en la raíz del proyecto son parsers originales escritos en C# (MerchBot) que sirvieron como referencia para la implementación actual en Node.js. Se incluyen extractos relevantes en los archivos de auditoría.

## Flujo de datos resumido

```
Paquete TCP Silkroad (0x3013, 0x3015, 0x3019, 0xB021, etc.)
    ↓
PacketRouter + Handlers (Node.js backend)
    ↓  parsea: sectorX, sectorY, floats de offset
    ↓  transforma: calcWorldCoords() → region, posX, posZ, posY, worldX, worldZ
    ↓
WebSocket → evento JSON al frontend
    ↓
GameSocketContext.jsx → playerState / entities
    ↓
usePlayerInit.js + useGameLoop.js → players.me.worldX, worldZ
    ↓
geo.js (coordToCanvas, worldToRender, renderToWorld) → píxeles de canvas
    ↓
GameContainer.jsx + EntityLayer.jsx → renderizado en DOM
```
