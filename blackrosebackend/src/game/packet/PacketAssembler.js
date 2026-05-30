import { GATEWAY_CONFIG } from '../../shared/config/gateway.js';

const HEADER_SIZE = 6;

/**
 * Calcula el tamaño real de un paquete considerando el padding de Blowfish.
 * 
 * Cuando un paquete está encriptado (bit 0x8000 en size), los datos
 * encriptados se alinean a múltiplos de 8 bytes.
 * 
 * Fórmula (confirmada por xBot-WinForms y silkroad-bot):
 *   packetSize = 2 + GetOutputLength(payloadSize + 4)
 * 
 * Donde GetOutputLength(n) = ceil(n/8)*8
 */
function getAlignedSize(payloadSize) {
  const encDataLen = payloadSize + 4; // opcode(2) + count(1) + check(1) + payload
  const remainder = encDataLen % 8;
  const alignedLen = remainder === 0 ? encDataLen : encDataLen + (8 - remainder);
  return 2 + alignedLen; // size field(2) + encrypted data
}

class PacketAssembler {
  constructor() {
    this.buffer = Buffer.alloc(0);
  }

  push(chunk) {
    if (!chunk || chunk.length === 0) {
      return [];
    }

    this.buffer = Buffer.concat([this.buffer, Buffer.from(chunk)]);
    const packets = [];

    while (this.buffer.length >= HEADER_SIZE) {
      const rawSize = this.buffer.readUInt16LE(0);
      const isEncrypted = (rawSize & 0x8000) !== 0;
      const payloadSize = rawSize & 0x7fff;

      // Cuando el paquete está encriptado con Blowfish, el tamaño real
      // incluye el padding a múltiplos de 8 bytes.
      const packetSize = isEncrypted
        ? getAlignedSize(payloadSize)
        : payloadSize + HEADER_SIZE;

      if (packetSize > GATEWAY_CONFIG.PACKET_LIMITS.MAX_SIZE) {
        throw new Error(`Silkroad packet exceeds max size: ${packetSize}`);
      }

      if (this.buffer.length < packetSize) {
        break;
      }

      const payload = this.buffer.subarray(0, packetSize);
      const opcode = this.buffer.readUInt16LE(2);

      packets.push({
        opcode: `0x${opcode.toString(16).padStart(4, '0')}`,
        size: packetSize,
        payload,
      });

      this.buffer = this.buffer.subarray(packetSize);
    }

    return packets;
  }

  reset() {
    this.buffer = Buffer.alloc(0);
  }
}

export default PacketAssembler;
