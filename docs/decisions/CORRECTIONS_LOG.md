# 🔧 CORRECCIONES IDENTIFICADAS Y SOLUCIONES

## Problemas Encontrados

### 1. **Paquetes sin Opcode/Size**
- **Antes**: `LoginRequestBuilder.buildLoginRequest()` solo retornaba el payload
- **Problema**: El opcode nunca se agregaba al paquete
- **Resultado**: Paquetes malformados con size/opcode incorrectos

### 2. **Opcodes Incorrectos (0x6100 vs 0x6102)**
- **Incorrecto**: 0x6100, 0x865a, 0x4ad0
- **Correcto para v130 Vietnam**:
  - 0x6102 = LOGIN_REQUEST
  - 0x7007 = CHARACTER_LIST_REQUEST
  - 0x7001 = CHARACTER_SELECT
  - 0xa102 = LOGIN_RESPONSE (server)
  - 0xb007 = CHARACTER_LIST (server)
  - 0xb001 = CHARACTER_SELECT_CONFIRM (server)

### 3. **Estructura de Paquete Silkroad Incorrecta**
Silkroad requiere:
```
[Size (word, LE)] [Opcode (word, LE)] [Payload]
```
Donde Size = tamaño de (Opcode + Payload)

### 4. **Posible Doble Envío**
- `buildCharacterSelect()` retorna un packet pero nunca se envía automáticamente
- Posible que algo esté llamando dos veces

## Soluciones Aplicadas

### ✅ Corrección 1: LoginRequestBuilder.js
- Agregado diccionario OPCODES con valores correctos
- Nuevo método `_buildPacketWithOpcode()` que agrega Size + Opcode + Payload
- Todos los builders ahora retornan paquetes COMPLETOS

**Antes**:
```javascript
static buildLoginRequest(username, password, serverId, locale = 130) {
    const packet = new PacketWriter();
    packet.writeByte(locale);
    packet.writeString(username);
    // ... retorna solo payload, SIN opcode
    return packet.getBytes();
}
```

**Después**:
```javascript
static buildLoginRequest(username, password, serverId, locale = 130) {
    const opcode = 0x6102;  // ✅ Opcode correcto
    const packet = new PacketWriter();
    packet.writeByte(locale);
    packet.writeString(username);
    // ...
    return this._buildPacketWithOpcode(opcode, packet.getBytes());  // ✅ Con size+opcode
}

static _buildPacketWithOpcode(opcode, payload) {
    const size = 2 + payload.length;  // Opcode (2) + Payload
    const packet = new PacketWriter();
    packet.writeWord(size);      // Size del opcode+payload
    packet.writeWord(opcode);    // Opcode correcto
    // ... retorna paquete COMPLETO
}
```

### ✅ Corrección 2: OPCODE_DEFINITIONS.js
- Documentación clara de opcodes correctos para v130
- Comentarios explicativos

## Verificación Post-Corrección

### ✅ Prueba 1: Tamaño de Paquete
El paquete LOGIN_REQUEST debería ser aproximadamente:
- Size: 2 bytes
- Opcode: 2 bytes
- Locale: 1 byte
- Username length: 2 bytes + string
- Password length: 2 bytes + string
- ServerId: 2 bytes
- Captcha: 2 bytes (0 length)
**Total esperado: ~30-50 bytes** (NO 1672 bytes)

Si ves 1672 bytes → Hay un problema de construcción

### ✅ Prueba 2: Opcodes en Monitor de Paquetes
Esperado:
```
[TX] Opcode: 0x6102 - LOGIN_REQUEST (XX bytes)
[RX] Opcode: 0xa102 - LOGIN_RESPONSE (YY bytes)
[TX] Opcode: 0x7007 - CHARACTER_LIST_REQUEST (Z bytes)
[RX] Opcode: 0xb007 - CHARACTER_LIST (AAA bytes)
```

Si ves:
- 0x6100 → Opcode erróneo
- 0x4ad0, 0x865a → Bytes en orden incorrecto (endianness)

### ✅ Prueba 3: No Duplicado
Debería ver UNA sola vez cada opcode, no dos

## Cómo Verificar que las Correcciones Funcionan

1. **Detener el servidor**:
   ```bash
   Ctrl+C en terminal del backend
   ```

2. **Limpiar caché**:
   ```bash
   rm -rf blackrosebackend/node_modules/.cache
   # o en Windows:
   rmdir /s blackrosebackend\node_modules\.cache
   ```

3. **Reiniciar**:
   ```bash
   cd blackrosebackend
   npm run dev
   ```

4. **Monitorear paquetes**:
   - Abre DevTools → Network → WS
   - Envía LOGIN desde frontend
   - Verifica que veas:
     - Opcode 0x6102 (una sola vez)
     - Tamaño razonable (<100 bytes)
     - Seguido de 0xa102 respuesta

## Próximas Verificaciones Necesarias

Necesito revisar:
1. ¿PacketWriter.getBytes() retorna todo lo que se escribió?
2. ¿TcpSession.send() espera el paquete completo con size+opcode?
3. ¿Hay algo que esté duplicando el envío?

## Archivos Afectados
- ✅ LoginRequestBuilder.js (CORREGIDO)
- ✅ OPCODE_DEFINITIONS.js (DOCUMENTACIÓN ACTUALIZADA)
- ⏳ WebSocketLoginHandler.js (Revisar si hay doble llamada)
- ⏳ TcpSession.js (Verificar que espera paquetes correctos)
