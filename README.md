# 🌹 Black Rose Web — Silkroad Online MMO Portal

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Status](https://img.shields.io/badge/Status-In--Development-yellow)](https://github.com/anapse)
[![License](https://img.shields.io/badge/License-Private-red)](LICENSE)

> Portal web oficial y motor de juego integrado para el servidor privado **Black Rose** de Silkroad Online. Una solución moderna que combina un portal web clásico con un motor de navegación MMO optimizado para dispositivos móviles y Telegram.

---

## 🚀 Vision General

**Black Rose Web** no es solo un sitio web informativo; es una plataforma híbrida que permite a los jugadores interactuar con el mundo de Silkroad directamente desde su navegador o a través de **Telegram Web Apps**. 

Cuenta con un motor de juego refactorizado bajo una arquitectura modular de hooks, permitiendo una navegación fluida, gestión de inventario, y visualización de personajes en tiempo real.

---

## ✨ Características Principales

### 🎮 Motor de Juego (Game Engine)
- **Arquitectura Modular**: Lógica desacoplada de la UI mediante hooks personalizados (`useGameLoop`, `useMMOCamera`, `useMapInteractions`).
- **Navegación Fluida**: Sistema de cámara inteligente que soporta tanto seguimiento automático del jugador como exploración manual.
- **Conversión de Coordenadas**: Sistema preciso de sincronización entre unidades de mundo (World Units) de Silkroad y coordenadas de píxeles en mapas de ciudades y mundo.
- **Telegram Integration**: Ruta protegida `/game` diseñada específicamente para la integración con el ecosistema de Telegram.

### 👤 Gestión de Personajes
- **Selector de Personajes**: Interfaz visual para elegir entre múltiples personajes asociados a una cuenta.
- **Visualización de Equipamiento**: Renderizado dinámico de slots de inventario y equipo basado en la raza del personaje (CH/EU).
- **Ventanas Draggable**: Interfaz de usuario (Skill, Character, Inventory) inspirada fielmente en el cliente original de Silkroad.

### 🗺️ Mapas e Interacciones
- **Mapas de Ciudades**: Soporte completo para mapas de ciudades detallados con transiciones automáticas.
- **Sistema de Marcadores**: Indicadores dinámicos para el jugador, NPCs y puntos de interés.
- **Detección de Colisiones**: Lógica para entrada a ciudades y zonas seguras.

---

## 📁 Estructura del Proyecto

```bash
blackroseweb/
├── src/
│   ├── game/               # 💎 Núcleo del Motor de Juego
│   │   ├── hooks/          # Hooks de lógica (GameLoop, Camera, Interactions)
│   │   ├── utils/          # Utilidades de conversión y matemáticas
│   │   └── constants/      # Datos maestros (Regiones, Mapas, Marcadores)
│   ├── Componentes/        # 🎨 Componentes de Interfaz
│   │   ├── game/           # Componentes específicos del juego (UnderBar, Windows)
│   │   │   └── Interfaces/ # Ventanas modulares (Character, Skills, Unified)
│   │   ├── Home.jsx        # Portal Web principal
│   │   └── ...             # Rankings, Descargas, Registro
│   ├── guards/             # 🔐 Seguridad y Protección de Rutas
│   ├── context/            # 🧠 Gestión de Estado Global (Auth)
│   ├── recursos/           # 🔌 Configuración de APIs y Assets
│   └── App.jsx             # Punto de entrada de la UI
├── public/                 # Assets estáticos (imágenes, iconos)
└── index.html              # Template principal
```

---

## ⚙️ Instalación y Configuración

### Requisitos Previos
- **Node.js** (v18.0 o superior)
- **npm** o **yarn**

### Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/anapse/silkroad_blackrose_web_telegram.git
   cd silkroad_blackrose_web_telegram
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configuración de Desarrollo:**
   Asegúrate de configurar las URLs de la API en `src/recursos/urlApis.jsx` si es necesario.

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

---

## 🏗️ Scripts Disponibles

| Script | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el entorno de desarrollo con Hot Module Replacement (HMR). |
| `npm run build` | Compila el proyecto para producción en la carpeta `dist/`. |
| `npm run lint` | Ejecuta ESLint para asegurar la calidad y consistencia del código. |
| `npm run preview` | Previsualiza el build de producción localmente. |
| `npm run host` | Expone el servidor de desarrollo en la red local (útil para pruebas en móviles). |

---

## 🌐 Despliegue

Para generar la versión de producción optimizada:

```bash
npm run build
```

El contenido de la carpeta `dist/` puede ser desplegado en cualquier servidor de archivos estáticos (Vercel, Netlify, Nginx, etc.).

---

## 🤝 Contribución

Si deseas contribuir al desarrollo de **Black Rose Web**:
1. Haz un **Fork** del proyecto.
2. Crea una nueva rama (`git checkout -b feature/NuevaFuncionalidad`).
3. Realiza tus cambios y haz **Commit** (`git commit -m 'Add: Nueva funcionalidad'`).
4. Haz **Push** a la rama (`git push origin feature/NuevaFuncionalidad`).
5. Abre un **Pull Request**.

---

## 👤 Autor

**anapse** — [GitHub Profile](https://github.com/anapse)

---

## 📜 Licencia

Este proyecto es propiedad privada y está desarrollado exclusivamente para el servidor **Black Rose**. Todos los derechos sobre los assets de Silkroad Online pertenecen a sus respectivos dueños.
