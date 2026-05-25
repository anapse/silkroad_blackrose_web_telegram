const username = 'anapse';
const password = '123456';
const locale = 22;
const serverId = 64;
const captcha = '';
const crypto = require('crypto');
const hashed = crypto.createHash('md5').update(password).digest('hex');
function writeString(str) {
    const len = Buffer.byteLength(str, 'ascii');
    const b = Buffer.alloc(2 + len);
    b.writeUInt16LE(len, 0);
    if (len > 0) b.write(str, 2, 'ascii');
    return b;
}
const parts = [Buffer.from([locale]), writeString(username), writeString(hashed), (function () { const b = Buffer.alloc(2); b.writeUInt16LE(serverId, 0); return b })(), writeString(captcha)];
const payload = Buffer.concat(parts);
const size = 2 + payload.length;
const buf = Buffer.alloc(4 + payload.length);
buf.writeUInt16LE(size, 0);
buf.writeUInt16LE(0x6102, 2);
payload.copy(buf, 4);

function pad(n) { return String(n).padStart(2, '0'); }
function hexSlice(s, e) { return buf.slice(s, e + 1).toString('hex'); }
function fmtRange(s, e, desc) { const bytes = hexSlice(s, e); console.log(`[${pad(s)}-${pad(e)}] ${bytes}     → ${desc}`); }

console.log('\nFull packet hex:\n', buf.toString('hex'), '\n');

fmtRange(0, 1, `size (${size} bytes)`);
fmtRange(2, 3, `opcode 0x6102`);
let p = 4;
fmtRange(p, p, `locale ${locale}`); p += 1;
const unameLen = buf.readUInt16LE(p);
fmtRange(p, p + 1, `username length ${unameLen}`); p += 2;
fmtRange(p, p + unameLen - 1, `username "${buf.slice(p, p + unameLen).toString('ascii')}"`); p += unameLen;
const pwdLen = buf.readUInt16LE(p);
fmtRange(p, p + 1, `password length ${pwdLen}`); p += 2;
fmtRange(p, p + pwdLen - 1, `password MD5 "${buf.slice(p, p + pwdLen).toString('ascii')}"`); p += pwdLen;
fmtRange(p, p + 1, `serverId (word) ${buf.readUInt16LE(p)}`); p += 2;
const capLen = buf.readUInt16LE(p);
fmtRange(p, p + 1, `captcha length ${capLen}`); p += 2;
if (capLen > 0) { fmtRange(p, p + capLen - 1, `captcha "${buf.slice(p, p + capLen).toString('ascii')}"`); p += capLen; }

console.log('\nTotal buffer length:', buf.length, 'bytes');
console.log('\nMD5(password) =', hashed);
