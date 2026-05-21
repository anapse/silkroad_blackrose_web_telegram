/**
 * DEBUG SCRIPT - Verificar estructura de paquetes LOGIN
 * 
 * Ejecutar con: node debug-packets.js
 * Desde: blackrosebackend/
 */

import { LoginRequestBuilder } from './src/shared/builders/LoginRequestBuilder.js';

console.log('\n════════════════════════════════════════════════════════════════');
console.log('🧪 PACKET DEBUG - LoginRequestBuilder v130');
console.log('════════════════════════════════════════════════════════════════\n');

// Test 1: buildLoginRequest
console.log('1️⃣  buildLoginRequest("testuser", "testpass", 64, 130)');
console.log('─────────────────────────────────────────────────────────────');

const loginPacket = LoginRequestBuilder.buildLoginRequest('testuser', 'testpass', 64, 130);

console.log(`  Total Size: ${loginPacket.length} bytes`);
console.log(`  Hex: ${loginPacket.toString('hex')}`);
console.log(`  Analysis:`);
console.log(`    [0-1]  Size field (LE): 0x${loginPacket.readUInt16LE(0).toString(16).padStart(4, '0')} = ${loginPacket.readUInt16LE(0)} bytes`);
console.log(`    [2-3]  Opcode (LE):     0x${loginPacket.readUInt16LE(2).toString(16).padStart(4, '0')} (should be 0x6102)`);
console.log(`    [4+]   Payload:         ${loginPacket.length - 4} bytes`);

if (loginPacket.readUInt16LE(2) !== 0x6102) {
    console.log(`  ❌ ERROR: Opcode is ${loginPacket.readUInt16LE(2).toString(16)}, not 0x6102!`);
} else {
    console.log(`  ✅ OPCODE CORRECT: 0x6102`);
}

if (loginPacket.length > 100) {
    console.log(`  ⚠️  WARNING: Packet is ${loginPacket.length} bytes (expected ~40-50 bytes)`);
}

// Test 2: buildCharacterSelect
console.log('\n2️⃣  buildCharacterSelect("MyCharacter")');
console.log('─────────────────────────────────────────────────────────────');

const selectPacket = LoginRequestBuilder.buildCharacterSelect('MyCharacter');

console.log(`  Total Size: ${selectPacket.length} bytes`);
console.log(`  Hex: ${selectPacket.toString('hex')}`);
console.log(`  Analysis:`);
console.log(`    [0-1]  Size field (LE): 0x${selectPacket.readUInt16LE(0).toString(16).padStart(4, '0')} = ${selectPacket.readUInt16LE(0)} bytes`);
console.log(`    [2-3]  Opcode (LE):     0x${selectPacket.readUInt16LE(2).toString(16).padStart(4, '0')} (should be 0x7001)`);
console.log(`    [4+]   Payload:         ${selectPacket.length - 4} bytes`);

if (selectPacket.readUInt16LE(2) !== 0x7001) {
    console.log(`  ❌ ERROR: Opcode is ${selectPacket.readUInt16LE(2).toString(16)}, not 0x7001!`);
} else {
    console.log(`  ✅ OPCODE CORRECT: 0x7001`);
}

// Test 3: buildCharacterListRequest
console.log('\n3️⃣  buildCharacterListRequest()');
console.log('─────────────────────────────────────────────────────────────');

const listPacket = LoginRequestBuilder.buildCharacterListRequest();

console.log(`  Total Size: ${listPacket.length} bytes`);
console.log(`  Hex: ${listPacket.toString('hex')}`);
console.log(`  Analysis:`);
console.log(`    [0-1]  Size field (LE): 0x${listPacket.readUInt16LE(0).toString(16).padStart(4, '0')} = ${listPacket.readUInt16LE(0)} bytes`);
console.log(`    [2-3]  Opcode (LE):     0x${listPacket.readUInt16LE(2).toString(16).padStart(4, '0')} (should be 0x7007)`);
console.log(`    [4+]   Payload:         ${listPacket.length - 4} bytes`);

if (listPacket.readUInt16LE(2) !== 0x7007) {
    console.log(`  ❌ ERROR: Opcode is ${listPacket.readUInt16LE(2).toString(16)}, not 0x7007!`);
} else {
    console.log(`  ✅ OPCODE CORRECT: 0x7007`);
}

// Test 4: buildCaptchaReply
console.log('\n4️⃣  buildCaptchaReply()');
console.log('─────────────────────────────────────────────────────────────');

const captchaPacket = LoginRequestBuilder.buildCaptchaReply();

console.log(`  Total Size: ${captchaPacket.length} bytes`);
console.log(`  Hex: ${captchaPacket.toString('hex')}`);
console.log(`  Analysis:`);
console.log(`    [0-1]  Size field (LE): 0x${captchaPacket.readUInt16LE(0).toString(16).padStart(4, '0')} = ${captchaPacket.readUInt16LE(0)} bytes`);
console.log(`    [2-3]  Opcode (LE):     0x${captchaPacket.readUInt16LE(2).toString(16).padStart(4, '0')} (should be 0x6323)`);
console.log(`    [4+]   Payload:         ${captchaPacket.length - 4} bytes`);

if (captchaPacket.readUInt16LE(2) !== 0x6323) {
    console.log(`  ❌ ERROR: Opcode is ${captchaPacket.readUInt16LE(2).toString(16)}, not 0x6323!`);
} else {
    console.log(`  ✅ OPCODE CORRECT: 0x6323`);
}

console.log('\n════════════════════════════════════════════════════════════════');
console.log('🔍 SUMMARY');
console.log('════════════════════════════════════════════════════════════════\n');

const tests = [
    { name: 'LOGIN_REQUEST (0x6102)', packet: loginPacket, expected: 0x6102, maxSize: 100 },
    { name: 'CHARACTER_SELECT (0x7001)', packet: selectPacket, expected: 0x7001, maxSize: 50 },
    { name: 'CHARACTER_LIST_REQUEST (0x7007)', packet: listPacket, expected: 0x7007, maxSize: 10 },
    { name: 'CAPTCHA_REPLY (0x6323)', packet: captchaPacket, expected: 0x6323, maxSize: 10 },
];

let allPass = true;
tests.forEach((test) => {
    const opcode = test.packet.readUInt16LE(2);
    const size = test.packet.length;
    const opcodeOk = opcode === test.expected;
    const sizeOk = size <= test.maxSize;

    console.log(`${opcodeOk && sizeOk ? '✅' : '❌'} ${test.name}`);
    console.log(`   Size: ${size} bytes ${sizeOk ? '✅' : `❌ (max ${test.maxSize})`}`);
    console.log(`   Opcode: 0x${opcode.toString(16).padStart(4, '0')} ${opcodeOk ? '✅' : `❌ (expected 0x${test.expected.toString(16).padStart(4, '0')})`}`);
    console.log('');

    if (!opcodeOk || !sizeOk) allPass = false;
});

console.log('════════════════════════════════════════════════════════════════');
if (allPass) {
    console.log('✅ ALL TESTS PASSED - Packet builders are correct!');
} else {
    console.log('❌ SOME TESTS FAILED - See errors above');
}
console.log('════════════════════════════════════════════════════════════════\n');
