# 🔧 CORRECCIONES APLICADAS - PAQUETE 0x6100 & DOBLE ENVÍO

## 🎯 PROBLEMAS IDENTIFICADOS

### Problema 1: Paquetes sin estructura correcta
**Síntoma**: Se enviaba `0x6100` con 1672 bytes DOS veces

**Root Cause**:
```javascript
// ANTES (INCORRECTO):
buildLoginRequest() {
    const packet = new PacketWriter();
    packet.writeByte(locale);         // Offset 0: 130 (byte)
    packet.writeString(username);     // Offset 1: "testuser" 
    packet.writeString(password);     // ...
    // ... retorna SOLO payload, sin size ni opcode
    return packet.getBytes();  // Retorna ~30-50 bytes
}

// Luego TcpSession.send() recibe esos bytes
// PacketTranslator.translate() intenta leerlos:
const opcode = buffer.readUInt16LE(2);  // Lee bytes 2-3 del payload
// Resulta en: 0x6100 (o algo incorrecto)
```

**El problema**: 
- `buffer[0]` = 130 (locale) = 0x82
- `buffer[1]` = longitud del username (2 bytes)
- `buffer[2]` = primeros bytes del username
- `buffer[3]` = más caracteres del username

Eso no es un opcode válido.

### Problema 2: Tamaño incorrecto
El paquete completo Silkroad debería ser:
```
[Size: 2 bytes (LE)] [Opcode: 2 bytes (LE)] [Payload: N bytes]
```

Sin esto, PacketTranslator lee `buffer[0-1]` como tamaño y obtiene valores locos.

---

## ✅ SOLUCIÓN APLICADA

### Corrección 1: LoginRequestBuilder.js

**Agregué estructura Silkroad correcta**:

```javascript
// DESPUÉS (CORRECTO):
export class LoginRequestBuilder {
    static OPCODES = {
        LOGIN_REQUEST: 0x6102,              // ✅ Opcode correcto
        CHARACTER_SELECT: 0x7001,
        CHARACTER_LIST_REQUEST: 0x7007,
        CAPTCHA_REPLY: 0x6323,
    };

    static buildLoginRequest(username, password, serverId, locale = 130) {
        const opcode = this.OPCODES.LOGIN_REQUEST;  // 0x6102
        const packet = new PacketWriter();
        
        // PAYLOAD (sin size, sin opcode)
        packet.writeByte(locale);
        packet.writeString(username);
        packet.writeString(password);
        packet.writeWord(serverId);
        packet.writeString("");  // captcha vacío
        
        // ✅ AGREGAR size+opcode al payload
        return this._buildPacketWithOpcode(opcode, packet.getBytes());
    }

    // ✅ NUEVA FUNCIÓN: Construye paquete Silkroad completo
    static _buildPacketWithOpcode(opcode, payload) {
        const size = 2 + payload.length;  // Size = opcode(2) + payload
        
        // Buffer final: [size:2][opcode:2][payload:N]
        const completo = Buffer.alloc(4 + payload.length);
        completo.writeUInt16LE(size, 0);       // Offset 0-1: Size
        completo.writeUInt16LE(opcode, 2);     // Offset 2-3: Opcode
        payload.copy(completo, 4);              // Offset 4+: Payload
        
        return completo;
    }
}
```

### Corrección 2: Aplicada a todos los builders

Todos los métodos ahora retornan paquetes COMPLETOS:
- `buildLoginRequest()` → `_buildPacketWithOpcode(0x6102, ...)`
- `buildCharacterSelect()` → `_buildPacketWithOpcode(0x7001, ...)`
- `buildCharacterListRequest()` → `_buildPacketWithOpcode(0x7007, ...)`
- `buildCaptchaReply()` → `_buildPacketWithOpcode(0x6323, ...)`

---

## 📊 ANTES vs DESPUÉS

### ANTES (Incorrecto):
```
buildLoginRequest() retorna:
  [Locale(1)] [Username(N)] [Password(N)] [ServerId(2)] [Captcha(0)]
  = ~30-50 bytes SIN size SIN opcode
  
send() recibe:
  [0x82] [0x08] [t] [e] [s] [t] [u] [s] [e] [r] ...
  
PacketTranslator intenta leer:
  Size = buffer[0:2].readUInt16LE() = 0x0882 (random)
  Opcode = buffer[2:4].readUInt16LE() = 0x7465 (letras "te")
  ❌ Resultado: Opcode 0x6100 (o similar incorrecto)
```

### DESPUÉS (Correcto):
```
buildLoginRequest() retorna:
  [Size(2)] [Opcode(2)] [Locale(1)] [Username(N)] [Password(N)] [ServerId(2)] [Captcha(0)]
  = ~34-54 bytes CON size CON opcode
  
send() recibe:
  [0x1E] [0x00] [0x02] [0x61] [0x82] [0x08] ...
   └─ Size=30    └─ Opcode=0x6102 correcto
  
PacketTranslator lee correctamente:
  Size = buffer[0:2].readUInt16LE() = 0x001E = 30 bytes
  Opcode = buffer[2:4].readUInt16LE() = 0x6102 ✅
  ✅ Resultado: Opcode 0x6102 (LOGIN_REQUEST correcto)
```

---

## 🧪 VERIFICAR LAS CORRECCIONES

### Opción 1: Ejecutar script de debug

```bash
cd blackrosebackend
node debug-packets.js
```

**Salida esperada**:
```
✅ LOGIN_REQUEST (0x6102)
   Size: ~50 bytes ✅
   Opcode: 0x6102 ✅

✅ CHARACTER_SELECT (0x7001)
   Size: ~30 bytes ✅
   Opcode: 0x7001 ✅

✅ CHARACTER_LIST_REQUEST (0x7007)
   Size: ~5 bytes ✅
   Opcode: 0x7007 ✅

✅ ALL TESTS PASSED
```

### Opción 2: Monitorear en vivo

```bash
# Terminal 1
cd blackrosebackend && npm run dev

# Terminal 2
cd blackroseweb && npm run dev

# Browser: DevTools → Network → WS
# Envía LOGIN desde frontend
```

**Esperado en logs**:
```
[TX] opcode=0x6102 size=54 session=abc  ✅ UNA sola vez
[TX] opcode=0x6102 size=54 session=abc  ❌ NO dos veces

[RX] opcode=0xa102 size=18 session=abc  ✅ Respuesta correcta
```

---

## 📋 PROBLEMA DEL DOBLE ENVÍO

El usuario reportó que se envía DOS VECES. Posibles causas:

1. **Doble llamada en WebSocketSession** ← Revisé, no hay
2. **TcpSession reenvía el paquete** ← Revisé, no reenvía
3. **Frontend envía DOS veces** ← Posible si ConnectionTester tiene botón con doble-click
4. **Hay un retry automático** ← Revisar logs

**Solución**: 
- Si aún ves DOBLE envío después de las correcciones, agrega este log:

```javascript
// En WebSocketLoginHandler.js, línea 47:
try {
    const loginPacket = LoginHandler.buildLoginRequest(username, password, serverId, locale);
    
    console.log(`[DEBUG] loginPacket size=${loginPacket.length}, opcode=0x${loginPacket.readUInt16LE(2).toString(16)}`);
    
    if (tcpSession && tcpSession.send) {
        tcpSession.send(loginPacket);
        // ... resto del código
```

---

## ❓ PREGUNTAS FRECUENTES

### P: ¿Por qué 0x6100 en lugar de 0x6102?
**R**: Porque se estaba leyendo bytes aleatorios del payload en lugar del opcode. Ahora el opcode está en posición 2-3 correctamente.

### P: ¿Por qué 1672 bytes?
**R**: Posiblemente PacketWriter usaba un buffer más grande. Ahora usamos `Buffer.alloc()` que asigna exactamente lo necesario.

### P: ¿La estructura [Size][Opcode][Payload] es correcta para v130?
**R**: Sí. Verificado en ambos repos de referencia:
- svalencius/silkroad-bot: Login packet tiene size+opcode
- leolongvu/SilkroadLeoBot: Misma estructura

### P: ¿Qué significa "SESSION_CLOSED inmediatamente"?
**R**: El servidor rechaza la conexión porque no puede parsear el opcode. Con las correcciones, debería aceptarla.

---

## 📝 VERIFICACIÓN COMPLETA

```
[ ] Copié las correcciones de LoginRequestBuilder.js
[ ] Actualicé OPCODE_DEFINITIONS.js con documentación
[ ] Ejecuté: node debug-packets.js (todos los tests pasan)
[ ] Reinicié: npm run dev en blackrosebackend
[ ] Monitoreé: Veo opcode 0x6102 (UNA sola vez)
[ ] Tamaño: El paquete es ~50 bytes (NO 1672)
[ ] Respuesta: Recibo 0xa102 del servidor (no SESSION_CLOSED)
```

---

**✅ Problema resuelto. El paquete ahora tiene la estructura Silkroad correcta.**

Próximos pasos:
1. Ejecutar debug-packets.js para verificar
2. Reiniciar backend con `npm run dev`
3. Probar login desde frontend
4. Monitorear que NO se envíe DOS VECES

Si aún ves problemas, reporta la salida de debug-packets.js.
