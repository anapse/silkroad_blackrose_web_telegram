# 🧪 GUÍA DE PRUEBAS - LOGIN IMPLEMENTATION

## PRE-REQUISITOS

### Backend
- Node.js 16+ con Babel configurado
- Carpeta `blackrosebackend/`
- `npm install` completado

### Frontend  
- React con Vite configurado
- Carpeta `blackroseweb/`
- `npm install` completado

### Red
- Conexión a Internet (para conectar a Silkroad)
- Firewall permite TCP 15880 y 15882

---

## ⚙️ PASO 1: CONFIGURAR EL GATEWAY

### 1.1 Verificar `gateway.config.js`

```javascript
// blackrosebackend/src/gamegateway/config/gateway.config.js

export const GATEWAY_CONFIG = {
  // WebSocket para clientes
  WS_HOST: '0.0.0.0',
  WS_PORT: 8081,  // Puerto local

  // Conexión al Game Server
  AGENT_IP: '26.74.212.246',      // ← Tu IP del servidor
  AGENT_PORT: 15882,               // ← Puerto Agent/Game Server
  
  // Security
  ENABLE_SECURITY: true,
  ENABLE_ENCRYPTION: true,
};
```

### 1.2 Iniciar el Gateway Backend

```bash
cd blackrosebackend
npm run dev
# o si usas script: npm start
```

Deberías ver:

```
✅ WebSocket Server running on ws://0.0.0.0:8081
✅ Gateway ready to relay connections to 26.74.212.246:15882
```

---

## ⚙️ PASO 2: INICIAR EL FRONTEND

### 2.1 En otra terminal, iniciar Vite

```bash
cd blackroseweb
npm run dev
# o: npm start
```

Deberías ver:

```
  ➜  Local:   http://localhost:5173/
```

### 2.2 Abrir el navegador

Abre: `http://localhost:5173/`

---

## 🧪 PASO 3: PROBAR EL LOGIN

### 3.1 Navegar a ConnectionTester

Si implementaste el componente LoginExample, accede a él:
- Ruta: `/test` o donde lo hayas puesto
- O usa la consola del navegador para conectar manualmente

### 3.2 Llenar el formulario

```
Usuario:    test_user  (cuenta válida en el servidor)
Contraseña: test_pass  (contraseña correcta)
Servidor:   64
Locale:     130 (Vietnam)
```

### 3.3 Hacer clic en "🔑 Login"

**Lo que debería ocurrir:**

```
[HH:MM:SS] ✅ WebSocket conectado
[HH:MM:SS] 📤 Enviando LOGIN: test_user@64
[HH:MM:SS] 🔹 Opcode: 0x6102 (LOGIN_REQUEST) - TX
[HH:MM:SS] 🔹 Opcode: 0xa102 (LOGIN_RESPONSE) - RX
[HH:MM:SS]   └─ Datos parseados: {"success":true,"sessionId":12345,...}
[HH:MM:SS] ✅ Login exitoso! SessionId: 12345
[HH:MM:SS] 🖥️ Agent Server: 26.74.212.246:15882
[HH:MM:SS] 📤 Solicitando lista de personajes
[HH:MM:SS] 🔹 Opcode: 0xb007 (CHARACTER_LIST) - RX
[HH:MM:SS] 👥 Personajes recibidos: 2
```

### 3.4 Seleccionar un personaje

- Si todo funciona, verás una tabla con tus personajes
- Haz clic en "Seleccionar" en el que quieras
- O usa "Auto-seleccionar disponible"

---

## 🔍 DEBUGGING - ERRORES COMUNES

### ❌ ERROR: "WebSocket no conectado"

**Causa**: El gateway no está corriendo

**Solución**:
```bash
# En terminal 1
cd blackrosebackend
npm run dev
```

Verifica que veas el log de WebSocket iniciado.

---

### ❌ ERROR: "Conexión rechazada en 26.74.212.246:15882"

**Causa**: No puedes conectar al servidor de juego

**Solución**:
1. Verifica la IP y puerto son correctos
2. Abre firewall (Windows):
   ```powershell
   # Admin PowerShell
   New-NetFirewallRule -DisplayName "Silkroad Gateway" -Direction Outbound -Protocol TCP -RemotePort 15882 -Action Allow
   ```
3. Prueba con `telnet`:
   ```bash
   telnet 26.74.212.246 15882
   ```

---

### ❌ ERROR: "Login fallido: contraseña incorrecta"

**Causa**: Las credenciales son inválidas

**Solución**:
1. Verifica usuario y contraseña
2. Prueba crear un usuario nuevo en el servidor
3. Confirma que tienes permisos de login

---

### ❌ ERROR: "Personajes no recibidos"

**Causa**: No se envió 0x7007 (CHARACTER_LIST_REQUEST)

**Solución**:
1. Verifica que TcpSession.js importa LoginHandler
2. Busca logs con `[REQUEST_CHARACTER_LIST]`
3. Si no ves logs, revisa WebSocketSession.js:
   ```javascript
   if (parsed.type === 'REQUEST_CHARACTER_LIST') {
     // ← Esto debería ejecutarse
   }
   ```

---

### ❌ ERROR: "Paquete binario recibido (ignorado)"

**Causa**: Frontend recibió datos binarios en lugar de JSON

**Solución**:
1. Esto es NORMAL para algunos paquetes
2. El JSON con parsing viene en `sendStatus()`
3. Verifica que `WebSocketSession.sendStatus()` envía JSON

---

## 📊 MONITOREO EN TIEMPO REAL

### Backend - Ver todos los paquetes

En `TcpSession.js`, los logs mostrarán:

```
[RX] opcode=0xa102 size=18 session=abc123
[RX] opcode=0xb007 size=156 session=abc123
```

### Frontend - Abrir DevTools

1. F12 → Network → WS
2. Filtra por WebSocket
3. Haz clic en los mensajes para ver el contenido JSON

Ejemplo de LOGIN enviado:
```json
{
  "type": "LOGIN",
  "username": "test_user",
  "password": "test_pass",
  "serverId": 64,
  "locale": 130
}
```

Ejemplo de respuesta CHARACTER_LIST:
```json
{
  "type": "STATUS",
  "status": "CHARACTER_LIST_RECEIVED",
  "detail": {
    "charCount": 2,
    "characters": [
      {
        "name": "MyCharacter",
        "level": 50,
        "hp": 1000,
        "mp": 500,
        "deleted": false
      }
    ]
  }
}
```

---

## 🎯 FLUJO COMPLETO PASO A PASO

### Sesión de prueba típica:

**Terminal 1 (Backend):**
```bash
cd blackrosebackend
npm run dev

# Ver estos logs:
✅ WebSocket Server running on ws://0.0.0.0:8081
✅ Client connected: session-xyz
```

**Terminal 2 (Frontend):**
```bash
cd blackroseweb  
npm run dev

# Abrir browser: http://localhost:5173
```

**Browser (Console):**
```javascript
// Conectar manualmente (si no usas LoginExample)
const ws = new WebSocket('ws://localhost:8081');

ws.onmessage = (e) => console.log(JSON.parse(e.data));

ws.send(JSON.stringify({
  type: 'LOGIN',
  username: 'test_user',
  password: 'test_pass',
  serverId: 64,
  locale: 130
}));

// Esperar respuesta
// └─ Deberías ver LOGIN_OK + CHARACTER_LIST_RECEIVED
```

---

## ✅ VALIDACIÓN EXITOSA

Cuando **TODO FUNCIONE**, verás:

```
✅ WebSocket conectado
✅ Login enviado
✅ Respuesta 0xa102 recibida
✅ Login exitoso! SessionId: [número]
✅ Agent Server: [IP]:[Puerto]
✅ Personajes recibidos: [n]
✅ [Nombre del personaje] Level [n]
✅ Personaje seleccionado
✅ Entrando al mundo...
```

---

## 🚀 PASOS SIGUIENTES

Una vez el login funcione:

1. **Implementar opcodes de Game**:
   - Movimiento (0xb100)
   - Ataque (0xb108)
   - Skills (0xb0d8)

2. **Agregar UI**:
   - Pantalla del mundo
   - HUD con inventario
   - Chat

3. **Optimizaciones**:
   - Compresión de paquetes
   - Caché de NPCs/Items
   - Smooth movement

---

## 📝 NOTAS IMPORTANTES

1. **Security**: Los paquetes van encriptados con Blowfish después del handshake
2. **Versión**: Tu protocolo es v130 (Vietnam)
3. **Captcha**: El servidor espera captcha vacío, no dará validación de captcha
4. **Session ID**: Se reasigna cuando cambias de Gateway a Agent

---

**¡Listo para probar!** 🎮
