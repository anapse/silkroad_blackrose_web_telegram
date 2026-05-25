# Análisis de Desencriptación de Paquetes Silkroad desde Repositorios

## Resumen Ejecutivo
Este documento analiza cómo los bots públicos de Silkroad manejan la desencriptación de paquetes del servidor, específicamente enfocado en el opcode 0xa102 (LOGIN_REPLY) y la estructura de seguridad.

---

## 1. CÁLCULO DE LONGITUD DE DATOS A DESENCRIPTAR

### Estructura de Encabezado del Paquete:
```
Byte 0-1: Size (ushort LE)     - Bits 0-14: Tamaño real, Bit 15: Flag encriptado
Byte 2-3: Opcode (ushort LE)   - Código de operación
Byte 4-5: Security Bytes        - Byte 4: Count Byte, Byte 5: CRC Byte
Byte 6+:  Datos Cifrados/Planos
```

### De JellyBitz/xBot-WinForms (C#):
```csharp
// Lectura del tamaño con flag de encriptación
int packet_size = m_recv_buffer.Buffer[1] << 8 | m_recv_buffer.Buffer[0];

// Verificar si está encriptado
if ((packet_size & 0x8000) > 0)
{
    packet_size &= 0x7FFF;  // Máscara: elimina bit 15
    packet_encrypted = true;
}

// Calcular tamaño total del buffer
if (m_security_flags.blowfish == 1)
{
    // Para encriptación Blowfish
    packet_size = 2 + m_blowfish.GetOutputLength(packet_size + 4);
    // packet_size = 2 (header) + GetOutputLength(payload_size + 4_security_bytes)
}
else
{
    // Paquete sin Blowfish
    packet_size += 6;  // header (6 bytes) + datos
}
```

**Clave**: El Blowfish se aplica SOLO a los datos desde byte 2 en adelante (opcode + security bytes + payload).

### De leolongvu/SilkroadLeoBot (C#):
```csharp
// Mismo patrón
int packet_size = m_recv_buffer.Buffer[1] << 8 | m_recv_buffer.Buffer[0];

if ((packet_size & 0x8000) > 0)
{
    packet_size &= 0x7FFF;
    packet_encrypted = true;
}
```

### De svalencius/silkroad-bot (JavaScript):
```javascript
// Lectura del tamaño
if (buffers[i].encry) {
    var decrypted = this.security.decode(buffers[i].buffer, 2, buffers[i].size - 2);
    //           offset = 2 (salta header size)
    //           length = buffers[i].size - 2 (total - size field)
    
    var real = new Buffer(2 + buffers[i].size);
    real.writeUInt16LE(buffers[i].real, 0);  // Re-escribir tamaño limpio
    decrypted.copy(real, 2);
}
```

---

## 2. MANEJO DE SECURITY BYTES (Count Byte + CRC Byte)

### Ubicación en el Paquete:
- **Byte 4**: Count Byte (generado dinámicamente)
- **Byte 5**: CRC Byte (checksum de validación)

### De JellyBitz/xBot-WinForms - Verificación al Recibir:
```csharp
byte packet_security_count = packet_data.ReadByte();  // Byte 4
byte packet_security_crc = packet_data.ReadByte();    // Byte 5

// Verificar count byte
if (m_security_flags.security_bytes == 1)
{
    byte expected_count = GenerateCountByte(true);
    if (packet_security_count != expected_count)
    {
        throw new Exception("[SecurityAPI::Recv] Count byte mismatch.");
    }
}

// Verificar CRC byte
buffer.Buffer[5] = 0;  // Limpiar para cálculo
byte expected_crc = GenerateCheckByte(buffer.Buffer);
if (packet_security_crc != expected_crc)
{
    throw new Exception("[SecurityAPI::Recv] CRC byte mismatch.");
}
```

### Generación de Count Byte:
```csharp
byte GenerateCountByte(bool update)
{
    byte result = (byte)(m_count_byte_seeds[2] * (~m_count_byte_seeds[0] + m_count_byte_seeds[1]));
    result = (byte)(result ^ (result >> 4));
    if (update)
    {
        m_count_byte_seeds[0] = result;  // Actualizar estado
    }
    return result;
}
```

### Generación de CRC Byte (Check Byte):
```csharp
byte GenerateCheckByte(byte[] stream, int offset, int length)
{
    uint checksum = 0xFFFFFFFF;
    uint moddedseed = m_crc_seed << 8;
    
    for (int x = offset; x < offset + length; ++x)
    {
        // Tabla de seguridad pre-generada (256x256 = 65536 valores)
        checksum = (checksum >> 8) ^ global_security_table[moddedseed + (((uint)stream[x] ^ checksum) & 0xFF)];
    }
    
    // Suma de los 4 bytes del checksum
    return (byte)(((checksum >> 24) & 0xFF) + ((checksum >> 8) & 0xFF) + 
                  ((checksum >> 16) & 0xFF) + (checksum & 0xFF));
}
```

### De svalencius/silkroad-bot - JavaScript:
```javascript
function GenerateCheckByte(stream, offset, length) {
    var checksum = 0xFFFFFFFF;
    var moddedseed = this.m_crc_seed << 8;
    
    for (var x = offset; x < offset + length; ++x) {
        checksum = (checksum >>> 8) ^ securitytable[(moddedseed + (((stream[x] ^ checksum) & 0xFF))) & 0xFFFF];
    }
    
    return (((checksum >>> 24) & 0xFF) + ((checksum >>> 8) & 0xFF) + 
            ((checksum >>> 16) & 0xFF) + (checksum & 0xFF)) & 0xFF;
}
```

---

## 3. ESTRUCTURA DEL PAQUETE 0xa102 (LOGIN_REPLY)

### Definición del Opcode:
```
0xa102 = LOGIN_REPLY (Login Response del Servidor)
```

### Estructura de Datos Desencriptados:
```csharp
// Después de desencriptar y verificar seguridad, la lectura típica es:

byte result = packet.ReadUInt8();           // Byte 6: 1 = Éxito, otro = Error
if (result == 1)
{
    // LOGIN EXITOSO
    uint agent_ip_length = packet.ReadUInt16();  // Longitud de IP
    string agent_ip = packet.ReadAscii();         // IP del Agente (ej: "192.168.1.1")
    ushort agent_port = packet.ReadUInt16();      // Puerto del Agente
    uint auth_token = packet.ReadUInt32();        // Token de Autenticación
    
    // Ejemplo de lectura en leolongvu/SilkroadLeoBot:
    byte result = packet.ReadUInt8();
    if (result == 1)
    {
        var ip_len = packet.ReadUInt16();
        var ip = packet.ReadAscii();
        var port = packet.ReadUInt16();
        var token = packet.ReadUInt32();
    }
}
else
{
    // LOGIN FALLIDO
    byte subcode = packet.ReadUInt8();      // Código de error específico
}
```

### Estructura Binaria Completa:
```
Offset  Tamaño  Campo               Tipo        Descripción
------  ------  -----               ----        -----------
0       2       Size                UInt16 LE   Tamaño sin incluir este campo (con bit 15 si cifrado)
2       2       Opcode              UInt16 LE   0xa102
4       1       Count Byte          UInt8       Byte de seguridad (dinámico)
5       1       CRC Byte            UInt8       Checksum de validación
6       1       Result              UInt8       1=Éxito, otro=Error
7       2       IP Length           UInt16 LE   Longitud del string IP (si Result=1)
9       N       IP Address          ASCII       IP del servidor agente (si Result=1)
9+N     2       Port                UInt16 LE   Puerto del servidor agente (si Result=1)
11+N    4       Auth Token          UInt32 LE   Token de autenticación (si Result=1)
```

---

## 4. RECONSTRUCCIÓN DEL PAQUETE DESPUÉS DE DESENCRIPTAR

### Proceso de Desencriptación de JellyBitz (C#):
```csharp
// Paso 1: Identificar si está cifrado
if ((packet_size & 0x8000) > 0)  // Bit 15 activado
{
    packet_size &= 0x7FFF;  // Limpiar bit 15
    packet_encrypted = true;
}

// Paso 2: Si está encriptado con Blowfish, desencriptar desde byte 2
if (packet_encrypted)
{
    byte[] decrypted = m_blowfish.Decode(buffer.Buffer, 2, buffer.Size - 2);
    //                                    offset=2  (salta campo Size)
    //                                    length = total - 2
    
    // Paso 3: Reconstruir buffer limpio
    byte[] new_buffer = new byte[6 + packet_size];
    
    // Re-escribir header limpio (tamaño sin bit 15)
    Buffer.BlockCopy(BitConverter.GetBytes((ushort)packet_size), 0, new_buffer, 0, 2);
    
    // Copiar datos desencriptados (opcode + security bytes + payload)
    Buffer.BlockCopy(decrypted, 0, new_buffer, 2, 4 + packet_size);
    //                           (opcode=2 + security=2 + payload)
    
    buffer.Buffer = new_buffer;  // Reemplazar con buffer limpio
}

// Paso 4: Parsear como paquete limpio
PacketReader packet_data = new PacketReader(buffer.Buffer);
packet_size = packet_data.ReadUInt16();
ushort packet_opcode = packet_data.ReadUInt16();
byte packet_security_count = packet_data.ReadByte();
byte packet_security_crc = packet_data.ReadByte();

// Payload comienza en offset 6
```

### Proceso en svalencius/silkroad-bot (JavaScript):
```javascript
// Paso 1: Detectar encriptación
var buffers = [];  // Buffers de entrada
var p;

if (buffers[i].encry) {
    // Paso 2: Desencriptar desde offset 2
    var decrypted = this.security.decode(
        buffers[i].buffer,  // Buffer encriptado
        2,                  // Offset: salta Size field
        buffers[i].size - 2 // Longitud: total - size field
    );
    
    // Paso 3: Reconstruir con header limpio
    var real = new Buffer(2 + buffers[i].size);
    real.writeUInt16LE(buffers[i].real, 0);  // Size limpio (sin bit 15)
    decrypted.copy(real, 2);                 // Copiar decriptado a offset 2
    
    // Paso 4: Crear PacketReader con buffer limpio
    p = new PacketReader(real);
    p.encrypted = true;
} else {
    // Paquete sin encriptar
    p = new PacketReader(buffers[i].buffer);
    p.encrypted = false;
}

// Paso 5: Leer desde el PacketReader
var size = p.readWord();      // Offset 0
var opcode = p.readWord();    // Offset 2
var count = p.readByte();     // Offset 4
var crc = p.readByte();       // Offset 5
// Payload comienza en offset 6
```

### Detalles Críticos de Blowfish:

```javascript
// De silkroad-bot - Decode
Decode: function(stream, offset, length)
{
    if(length % 8 != 0 || length == 0)
    {
        console.log("ERROR invalid Length");
        return;
    }
    
    // Blowfish solo funciona con múltiplos de 8 bytes
    var workspace = new Buffer(length);
    stream.copy(workspace, 0, offset);

    for(var x = 0; x < length; x += 8)
    {
        var l = workspace.readUInt32LE(x);
        var r = workspace.readUInt32LE(x + 4);

        var t = this.Blowfish_decipher(l, r);  // Desencriptar bloque de 8 bytes
        l = t.xl;
        r = t.xr;
        
        workspace.writeUInt32LE(l, x);
        workspace.writeUInt32LE(r, x + 4);
    }
    
    return { size: length, buff: workspace };
}
```

---

## 5. FLUJO COMPLETO: DEL PAQUETE ENCRIPTADO AL PARSEADO

```
┌─────────────────────────────────────────────────────────────┐
│ PAQUETE ENCRIPTADO RECIBIDO (desde servidor Silkroad)      │
│ [Size: 0x8000+X | Opcode | CB | CRC | DATA_ENCRYPTED...]  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │ PASO 1: Leer SIZE y detectar flag   │
         │ size = 0x8000 + payload_size        │
         │ encrypted = true                     │
         │ clean_size = size & 0x7FFF          │
         └──────────────┬──────────────────────┘
                        │
                        ▼
         ┌─────────────────────────────────────┐
         │ PASO 2: Desencriptar desde byte 2   │
         │ decrypted = BF_Decode(              │
         │   buffer, offset=2,                 │
         │   length=total_received-2)          │
         └──────────────┬──────────────────────┘
                        │
                        ▼
         ┌─────────────────────────────────────┐
         │ PASO 3: Reconstruir paquete limpio  │
         │ new_buffer[0:2] = clean_size        │
         │ new_buffer[2:] = decrypted[0:]      │
         └──────────────┬──────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────────────┐
         │ PASO 4: Verificar security bytes     │
         │ count_check = GenerateCountByte()    │
         │ if (count_check != buffer[4])        │
         │    THROW ERROR                       │
         │                                      │
         │ crc_check = GenerateCheckByte(...)   │
         │ if (crc_check != buffer[5])          │
         │    THROW ERROR                       │
         └──────────────┬──────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────────────┐
         │ PASO 5: Parsear payload              │
         │ result = buffer.ReadUInt8(6)         │
         │ if (result == 1) {                   │
         │   agent_ip = buffer.ReadAscii(7+)   │
         │   agent_port = buffer.ReadUInt16()  │
         │   auth_token = buffer.ReadUInt32()  │
         │ }                                    │
         └──────────────┬──────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────────────┐
         │ PAQUETE PARSEADO EXITOSAMENTE       │
         │ Listo para procesar datos LOGIN_OK   │
         └──────────────────────────────────────┘
```

---

## 6. COMPARATIVA ENTRE REPOSITORIOS

| Aspecto | JellyBitz (C#) | LeoBot (C#) | silkroad-bot (JS) | SilkroadBot (C#) |
|---------|---|---|---|---|
| Desencriptación | `m_blowfish.Decode()` | Idéntico | `Blowfish_decipher()` | Idéntico |
| Offset desencriptación | 2 (Size) | 2 | 2 | 2 |
| Verificación CRC | `GenerateCheckByte()` | Idéntico | `GenerateCheckByte()` | Idéntico |
| Reconstrucción | `Buffer.BlockCopy()` | Idéntico | `Buffer.copy()` | `Buffer.BlockCopy()` |
| Tabla seguridad | 65536 uint32s | Idéntico | 65536 uint32s | Idéntico |

---

## 7. NOTAS CRÍTICAS PARA IMPLEMENTACIÓN

### ⚠️ Errores Comunes:

1. **Offset Incorrecto**: Desencriptar desde byte 0 (SÍ es error)
   - Correcto: Desencriptar desde byte 2
   - El campo Size NO se encripta

2. **No incluir security bytes en longitud**:
   - Al desencriptar: `length = total - 2` (Size field)
   - Los security bytes (4-5) ESTÁN dentro de lo encriptado

3. **Verificación de CRC DESPUÉS de limpiar byte 5**:
   ```csharp
   buffer.Buffer[5] = 0;  // IMPORTANTE: limpiar antes de calcular
   byte expected_crc = GenerateCheckByte(buffer.Buffer);
   ```

4. **Bit 15 del Size**:
   - Si Size & 0x8000: Está encriptado CON Blowfish
   - Limpiar SIEMPRE antes de reconstruir

### ✅ Validaciones:
- Count byte debe cambiar dinámicamente (estado actualizado)
- CRC falla si cualquier byte se daña
- Todos los repos usan idéntico algoritmo de generación

---

## 8. REFERENCIA: TABLA DE SEGURIDAD

La tabla de seguridad tiene 65536 valores (256 x 256), generados mediante:

```csharp
static uint[] GenerateSecurityTable()
{
    uint[] security_table = new uint[0x10000];
    byte[] base_security_table = { /* 256 bytes predefinidos */ };
    
    using (MemoryStream in_memory_stream = new MemoryStream(base_security_table, false))
    {
        using (BinaryReader reader = new BinaryReader(in_memory_stream))
        {
            for (int edi = 0; edi < 1024; edi += 4)
            {
                uint edx = reader.ReadUInt32();
                for (uint ecx = 0; ecx < 256; ++ecx)
                {
                    uint eax = ecx >> 1;
                    if ((ecx & 1) != 0)
                        eax ^= edx;
                    for (int bit = 0; bit < 7; ++bit)
                    {
                        if ((eax & 1) != 0)
                        {
                            eax >>= 1;
                            eax ^= edx;
                        }
                        else
                            eax >>= 1;
                    }
                    security_table[index++] = eax;
                }
            }
        }
    }
    return security_table;
}
```

---

## Conclusión

La desencriptación de Silkroad sigue un patrón consistente:
1. **Detectar** bit 15 en Size para saber si hay Blowfish
2. **Desencriptar** desde byte 2 (omitiendo Size)
3. **Reconstruir** con Size limpio + datos desencriptados
4. **Verificar** security bytes (count y CRC)
5. **Parsear** payload normal desde byte 6

Todos los repositorios analizados implementan el mismo algoritmo con variaciones mínimas en lenguaje.
