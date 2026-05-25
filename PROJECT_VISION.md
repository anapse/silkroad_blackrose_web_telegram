# 🌟 PROJECT VISION — Black Rose

> Este documento describe la visión del producto.
> No asume implementación existente. Es una guía hacia el futuro.

---

## 🎯 Propósito

Black Rose existe para **democratizar el acceso** al universo de Silkroad Online.

El juego 3D tradicional seguirá existiendo. No lo reemplazamos.
Construimos una **capa externa de interacción** que permite a los jugadores:

- Conectarse desde cualquier dispositivo (web, móvil, Telegram)
- Interactuar con su personaje y el mundo en 2D
- Socializar, comerciar y gestionar sin abrir el cliente 3D
- Acceder al juego desde lugares donde el cliente 3D no es viable

---

## 🧭 Experiencia objetivo

### Para el jugador casual

> "Abro mi navegador, ingreso mi usuario y contraseña, y veo mi personaje en el mapa.
> Puedo moverme, ver mi inventario, hablar con otros jugadores.
> No necesito instalar nada. No necesito una PC gaming."

### Para el jugador avanzado

> "Desde el trabajo, desde mi celular, desde Telegram:
> puedo ver quién está en línea, revisar mi inventario, poner items en venta,
> y hasta hacer algunas actividades del juego sin estar en mi PC."

### Para el administrador del servidor

> "Mis jugadores tienen una experiencia moderna y accesible.
> El servidor retiene el control total. No hay lógica duplicada.
> Black Rose es un puente, no un reemplazo."

---

## 🌐 Plataformas

| Plataforma | Experiencia | Prioridad |
|-----------|-------------|-----------|
| **Web (escritorio)** | Portal completo + mapa 2D + gestión | 🥇 MVP |
| **Web (móvil)** | Interfaz táctil adaptada | 🥇 MVP |
| **Telegram Web App** | Mini app integrada en Telegram | 🥈 Beta |
| **Android** | App nativa MAUI | 🥉 Post-MVP |
| **iOS** | App nativa MAUI | 🥉 Post-MVP |

---

## 💎 Valores diferenciales

1. **Sin cliente 3D** — Funciona en cualquier dispositivo con navegador
2. **Tiempo real** — Conexión directa al GameServer vía protocolo nativo
3. **Multiplataforma** — Misma cuenta, mismo personaje, misma experiencia
4. **No invasivo** — No modifica el juego original, no requiere parches
5. **Extensible** — Nuevas plataformas se añaden como clientes del Gateway

---

## 💰 Modelo económico (visión)

> ⚠️ **Esto es una visión. No hay implementación actual.**

El modelo económico explora formas de sostener el desarrollo y la operación
sin comprometer la accesibilidad:

- **Activos digitales / coleccionables** — Objetos visuales exclusivos para la interfaz 2D
- **Recompensas por participación** — Incentivos por actividad comunitaria
- **Monetización social** — Sistemas de gremios, eventos, torneos
- **Marketplace** — Espacio para intercambio entre jugadores
- **Crecimiento orgánico** — El valor está en la comunidad, no en paywalls

**No se prometen retornos financieros. No es un instrumento de inversión.**

---

## 🚫 Lo que NO es Black Rose

- ❌ No es un bot automatizado (el bot en `bot/` es una herramienta separada)
- ❌ No reemplaza el cliente 3D de Silkroad
- ❌ No modifica el GameServer
- ❌ No es una blockchain ni criptomoneda
- ❌ No es un "remake" del juego
- ❌ No almacena el estado del juego (el GameServer es la autoridad)

---

## ✅ Lo que SÍ es Black Rose

- ✅ Una capa de acceso multiplataforma
- ✅ Un traductor de protocolo binario a experiencias 2D
- ✅ Un ecosistema social alrededor del juego
- ✅ Una puerta de entrada para nuevos jugadores
- ✅ Una herramienta para la comunidad

---

## 📐 Principios de diseño

1. **El GameServer manda** — No duplicamos lógica de juego
2. **Los buffers son la API** — No inventamos REST donde no hace falta
3. **Rendimiento primero** — La experiencia 2D debe ser fluida en cualquier dispositivo
4. **Social por defecto** — La interacción entre jugadores es el núcleo
5. **Privacidad y control** — El usuario controla sus datos y su sesión
