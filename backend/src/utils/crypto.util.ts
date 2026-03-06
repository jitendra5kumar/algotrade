// @ts-nocheck
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const keyB64 = process.env.ENCRYPTION_KEY;
if (!keyB64) throw new Error('ENCRYPTION_KEY not set');
const key = Buffer.from(keyB64, 'base64');
if (key.length !== 32) throw new Error('ENCRYPTION_KEY must decode to 32 bytes');

export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decrypt(encB64: string) {
  const buf = Buffer.from(encB64, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}


