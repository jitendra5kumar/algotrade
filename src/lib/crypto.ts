
import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'node:crypto';

// Resolve encryption key with safe fallbacks
const envKey = (process.env.ENCRYPTION_KEY || '').trim();
let key: Buffer;
try {
  const decoded = envKey ? Buffer.from(envKey, 'base64') : Buffer.alloc(0);
  if (decoded.length === 32) {
    key = decoded;
  } else {
    // Fallback: derive a 32-byte key from provided string (or hard fallback) via SHA-256
    const fallbackSecret = envKey || 'c74e42e66ac93f76e56470';
    key = createHash('sha256').update(fallbackSecret).digest();
  }
} catch (_) {
  const fallbackSecret = envKey || 'c74e42e66ac93f76e56470';
  key = createHash('sha256').update(fallbackSecret).digest();
}

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


