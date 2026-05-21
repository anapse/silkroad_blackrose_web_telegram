import { GATEWAY_CONFIG } from '../config/gateway.config.js';

const HEADER_SIZE = 6;

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
      const payloadSize = this.buffer.readUInt16LE(0) & 0x7fff;
      const packetSize = payloadSize + HEADER_SIZE;

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
