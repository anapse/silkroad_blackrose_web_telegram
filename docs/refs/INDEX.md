# 📚 docs/refs/INDEX.md — Índice de referencias técnicas

> Todo el contenido en `docs/refs/` es material de consulta.
> Estado: REFERENCIA (no es código activo)

---

## code/opcodes/

| Ruta | Tipo | Descripción | Estado |
|------|------|-------------|--------|
| `code/opcodes/GlobalOpcodes.cs` | Referencia | Definiciones de opcodes Silkroad v130 | REFERENCIA |
| `code/opcodes/opcode.cs` | Referencia | Clase opcode individual | REFERENCIA |
| `code/opcodes/OpcodeParser.cs` | Referencia | Parseo de opcodes desde paquetes | REFERENCIA |

## code/packets/

| Ruta | Tipo | Descripción | Estado |
|------|------|-------------|--------|
| `code/packets/PacketProcessor.cs` | Referencia | Procesamiento de paquetes entrantes | REFERENCIA |
| `code/packets/HPMPPacket.cs` | Referencia | Paquetes HP/MP | REFERENCIA |
| `code/packets/InventoryControl.cs` | Referencia | Control de inventario vía paquetes | REFERENCIA |
| `code/packets/LogicControl.cs` | Referencia | Control de lógica general | REFERENCIA |
| `code/packets/Movement.cs` | Referencia | Paquetes de movimiento | REFERENCIA |
| `code/packets/PickupControl.cs` | Referencia | Paquetes de recogida de items | REFERENCIA |
| `code/packets/StartLooping.cs` | Referencia | Inicio del bucle principal | REFERENCIA |

## code/security/

| Ruta | Tipo | Descripción | Estado |
|------|------|-------------|--------|
| `code/security/Blowfish.cs` | Referencia | Implementación Blowfish para Silkroad | REFERENCIA |
| `code/security/Security.cs` | Referencia | Handshake, count byte, CRC | REFERENCIA |
| `code/security/Packet.cs` | Referencia | Representación de paquete Silkroad | REFERENCIA |
| `code/security/PacketReader.cs` | Referencia | Lectura secuencial de campos binarios | REFERENCIA |
| `code/security/PacketWriter.cs` | Referencia | Escritura secuencial de campos binarios | REFERENCIA |
| `code/security/TransferBuffer.cs` | Referencia | Manejo de buffers de transferencia | REFERENCIA |
| `code/security/Ultility.cs` | Referencia | Funciones auxiliares | REFERENCIA |

## code/network/

| Ruta | Tipo | Descripción | Estado |
|------|------|-------------|--------|
| `code/network/Gateway.cs` | Referencia | Conexión al Gateway Server (15880) | REFERENCIA |
| `code/network/Agent.cs` | Referencia | Conexión al Agent Server (15882) | REFERENCIA |
| `code/network/Global.cs` | Referencia | Variables globales de conexión | REFERENCIA |

## code/models/

| Ruta | Tipo | Descripción | Estado |
|------|------|-------------|--------|
| `code/models/ChatMessageItem.cs` | Referencia | Modelo de mensaje de chat | REFERENCIA |
| `code/models/DataItemInventory.cs` | Referencia | Datos de item en inventario | REFERENCIA |
| `code/models/ItemContext.cs` | Referencia | Contexto de item | REFERENCIA |
| `code/models/ItemData.cs` | Referencia | Datos genéricos de item | REFERENCIA |
| `code/models/ItemDetalleModel.cs` | Referencia | Detalle de item | REFERENCIA |
| `code/models/ItemInventario.cs` | Referencia | Item en inventario | REFERENCIA |
| `code/models/PageModel.cs` | Referencia | Modelo de paginación | REFERENCIA |
| `code/models/BotAction.cs` | Referencia | Acciones del bot | REFERENCIA |
| `code/models/Caracter.cs` | Referencia | Datos de personaje | REFERENCIA |
| `code/models/DataParser.cs` | Referencia | Parseo de datos del juego | REFERENCIA |
| `code/models/GeneralData.cs` | Referencia | Datos generales | REFERENCIA |
| `code/models/Globals.cs` | Referencia | Variables globales | REFERENCIA |
| `code/models/GroupSpawns.cs` | Referencia | Spawns de grupos | REFERENCIA |
| `code/models/ItemDataStats.cs` | Referencia | Estadísticas de item | REFERENCIA |
| `code/models/ItemsCount.cs` | Referencia | Conteo de items | REFERENCIA |
| `code/models/ItemStats.cs` | Referencia | Estadísticas de item | REFERENCIA |
| `code/models/PetInfo.cs` | Referencia | Información de mascota | REFERENCIA |
| `code/models/Spawn.cs` | Referencia | Datos de spawn | REFERENCIA |

## code/examples/

| Ruta | Tipo | Descripción | Estado |
|------|------|-------------|--------|
| `code/examples/Captcha.cs` | Referencia | Manejo de captcha | REFERENCIA |
| `code/examples/ChatService.cs` | Referencia | Servicio de chat | REFERENCIA |
| `code/examples/Cargarfilesdata.cs` | Referencia | Carga de archivos de datos | REFERENCIA |
| `code/examples/LoadTXT.cs` | Referencia | Carga de archivos TXT | REFERENCIA |
| `code/examples/ColoresApp.cs` | Referencia | Colores de aplicación | REFERENCIA |
| `code/examples/MessageTypeToColorConverter.cs` | Referencia | Conversor de tipo de mensaje | REFERENCIA |
| `code/examples/Logica/` | Referencia | Lógica de entrenamiento (varios .cs) | REFERENCIA |

## code/archive/

| Ruta | Tipo | Descripción | Estado |
|------|------|-------------|--------|
| `code/archive/ui/` | Archivado | Interfaz MAUI (XAML, ViewModels, App) | ARCHIVADO |
| `code/archive/runtime/` | Archivado | Config de proyecto (csproj, Platforms, Resources) | ARCHIVADO |

## links/

| Ruta | Tipo | Descripción | Estado |
|------|------|-------------|--------|
| `links/repos.txt` | Externo | Lista de repositorios públicos de referencia | EXTERNO |
| `links/notes.md` | Externo | Notas sobre cada repositorio | EXTERNO |
| `OpcodeParser.cs` | Parser | Parseo de opcodes desde paquetes | MEDIA — Lógica de parsing |

---

## reference/packets/

Procesamiento y control de paquetes.

| Archivo | Tipo | Descripción | Utilidad |
|---------|------|-------------|----------|
| `PacketProcessor.cs` | Procesador | Procesamiento principal de paquetes entrantes | ALTA — Lógica de ruteo por opcode |
| `HPMPPacket.cs` | Control | Manejo de paquetes HP/MP | ALTA — Estructura de paquetes de estado |
| `InventoryControl.cs` | Control | Control de inventario vía paquetes | ALTA — Lógica de inventario |
| `LogicControl.cs` | Control | Control de lógica general | MEDIA |
| `Movement.cs` | Control | Paquetes de movimiento | ALTA — Estructura de paquetes de movimiento |
| `PickupControl.cs` | Control | Paquetes de recogida de items | MEDIA |
| `StartLooping.cs` | Control | Inicio del bucle principal | BAJA |

---

## reference/network/

Conexiones de red Gateway y Agent.

| Archivo | Tipo | Descripción | Utilidad |
|---------|------|-------------|----------|
| `Gateway.cs` | Red | Conexión al Gateway Server (15880) | ALTA — Referencia para TcpClient.js |
| `Agent.cs` | Red | Conexión al Agent Server (15882) | ALTA — Referencia para TcpConnectionManager.js |
| `Global.cs` | Global | Variables globales de conexión | MEDIA |

---

## reference/models/

Modelos de datos del juego Silkroad.

| Archivo | Tipo | Descripción | Utilidad |
|---------|------|-------------|----------|
| `ChatMessageItem.cs` | Modelo | Modelo de mensaje de chat | MEDIA |
| `DataItemInventory.cs` | Modelo | Datos de item en inventario | ALTA |
| `ItemContext.cs` | Modelo | Contexto de item | MEDIA |
| `ItemData.cs` | Modelo | Datos genéricos de item | ALTA |
| `ItemDetalleModel.cs` | Modelo | Detalle de item | MEDIA |
| `ItemInventario.cs` | Modelo | Item en inventario | ALTA |
| `PageModel.cs` | Modelo | Modelo de paginación | BAJA |
| `BotAction.cs` | Modelo | Acciones del bot | MEDIA |
| `Caracter.cs` | Modelo | Datos de personaje | ALTA |
| `DataParser.cs` | Parser | Parseo de datos del juego | ALTA |
| `GeneralData.cs` | Modelo | Datos generales | MEDIA |
| `Globals.cs` | Global | Variables globales | MEDIA |
| `GroupSpawns.cs` | Modelo | Spawns de grupos | MEDIA |
| `ItemDataStats.cs` | Modelo | Estadísticas de item | ALTA |
| `ItemsCount.cs` | Modelo | Conteo de items | MEDIA |
| `ItemStats.cs` | Modelo | Estadísticas de item | ALTA |
| `PetInfo.cs` | Modelo | Información de mascota | MEDIA |
| `Spawn.cs` | Modelo | Datos de spawn | MEDIA |

---

## reference/examples/

Lógica de ejemplo del bot (training, auto-potion, comercio).

| Archivo | Tipo | Descripción | Utilidad |
|---------|------|-------------|----------|
| `Captcha.cs` | Utilidad | Manejo de captcha del servidor | ALTA |
| `ChatService.cs` | Servicio | Servicio de chat | MEDIA |
| `Cargarfilesdata.cs` | Carga | Carga de archivos de datos | MEDIA |
| `LoadTXT.cs` | Carga | Carga de archivos TXT | BAJA |
| `ColoresApp.cs` | Utilidad | Colores de la aplicación | BAJA |
| `MessageTypeToColorConverter.cs` | Converter | Conversor de tipo de mensaje a color | BAJA |
| `Logica/` | Lógica | Subcarpeta con lógica de entrenamiento | |
| `Logica/Location.cs` | Lógica | Gestión de ubicaciones | MEDIA |
| `Logica/Items/InventoryControl.cs` | Lógica | Control de inventario (lógica) | ALTA |
| `Logica/Loop/BuyControl.cs` | Lógica | Control de compras | MEDIA |
| `Logica/Loop/SellControl.cs` | Lógica | Control de ventas | MEDIA |
| `Logica/Loop/Teleport.cs` | Lógica | Teletransporte | MEDIA |
| `Logica/Training/Autopot.cs` | Lógica | Auto-potion automático | ALTA |
| `Logica/Training/Berserk.cs` | Lógica | Modo berserk | MEDIA |
| `Logica/Training/LoopControl.cs` | Lógica | Control del bucle de entrenamiento | ALTA |
| `Logica/Training/MonsterControl.cs` | Lógica | Control de monstruos | ALTA |
| `Logica/Training/Skill.cs` | Lógica | Uso de habilidades | ALTA |
| `Logica/Training/StorageControl.cs` | Lógica | Control de almacenamiento | MEDIA |
| `Logica/Training/Stuck.cs` | Lógica | Detección de stuck | ALTA |
| `Logica/Training/Training.cs` | Lógica | Lógica principal de entrenamiento | ALTA |
| `Logica/Training/Walking.cs` | Lógica | Lógica de caminata | ALTA |

---

## archive/ui/

Interfaz de usuario MAUI (XAML y ViewModels). Archivada — no es referencia activa.

| Archivo | Descripción |
|---------|-------------|
| `views/MainPage.xaml/.cs` | Página principal |
| `views/Chat.xaml/.cs` | Ventana de chat |
| `views/Player.xaml/.cs` | Ventana de jugador |
| `views/Stall.xaml/.cs` | Ventana de stall |
| `views/Botconfig.xaml/.cs` | Configuración del bot |
| `views/ItemDetallesPopup.xaml/.cs` | Popup de detalles de item |
| `views/ItemStats/` | Estadísticas de items (UI) |
| `views/BoolToColorConverter.cs` | Convertidor UI |
| `viewmodel/` | ViewModels (BotConfig, Chat, ItemDetails, ItemStats, Main, Player, Stall) |
| `App.xaml/.cs` | Punto de entrada de la aplicación |
| `AppShell.xaml/.cs` | Shell de navegación |
| `MauiProgram.cs` | Configuración MAUI |

---

## archive/runtime/

Configuración de proyecto y plataformas. Archivada.

| Archivo | Descripción |
|---------|-------------|
| `bot.csproj` | Archivo de proyecto .NET |
| `bot.sln` | Solución de Visual Studio |
| `Properties/launchSettings.json` | Configuración de lanzamiento |
| `Platforms/` | Código específico de plataforma (Android, iOS, Mac, Tizen, Windows) |
| `Resources/` | Recursos de la aplicación (iconos, fuentes, imágenes, estilos) |
