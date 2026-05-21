import { parseOpcode, getOpcodeDefinition } from './opcodes/OPCODE_DEFINITIONS.js';

export const OPCODE_HANDLERS = {};

export function registerOpcode(opcode, handler) {
  const key = typeof opcode === 'string'
    ? opcode.toLowerCase()
    : `0x${Number(opcode).toString(16).padStart(4, '0')}`;
  OPCODE_HANDLERS[key] = handler;
}

export function translate(packet, direction) {
  const rawBuffer = packet && packet.payload ? packet.payload : packet;
  const buffer = Buffer.isBuffer(rawBuffer) ? rawBuffer : Buffer.from(rawBuffer);

  if (buffer.length < 6) {
    throw new Error(`Incomplete Silkroad packet: ${buffer.length} bytes`);
  }

  const payloadSize = buffer.readUInt16LE(0) & 0x7fff;
  const opcode = buffer.readUInt16LE(2);
  const opcodeHex = `0x${opcode.toString(16).padStart(4, '0')}`;

  // Intentar parsear el opcode si existe una definición
  let parsed = null;
  try {
    parsed = parseOpcode(buffer, opcodeHex);
  } catch (err) {
    // Silencio si falla el parseado
  }

  // Obtener definición del opcode para metadatos
  const definition = getOpcodeDefinition(opcodeHex);

  return {
    type: 'PACKET',
    direction,
    opcode: opcodeHex,
    opcodeName: definition ? definition.name : 'UNKNOWN',
    size: payloadSize + 6,
    payload: buffer,
    parsed, // Datos parseados (null si no hay definición)
    timestamp: Date.now(),
  };
}

export default { registerOpcode, translate, OPCODE_HANDLERS, parseOpcode, getOpcodeDefinition };
