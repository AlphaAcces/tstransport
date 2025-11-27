import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM

// Use an encryption key taken from env for real deployments.
// For local/testing we derive it from ENV or fallback to a dev key (NOT for production).
function getMasterKey(): Buffer {
  const env = process.env.AI_KEY_MASTER || process.env.AI_MASTER_KEY;
  if (!env) {
    // WARNING: fallback key for local/dev only
    return Buffer.from('dev-master-key-32-bytes-length!!!!', 'utf8').slice(0, 32);
  }
  return Buffer.from(env, 'base64').slice(0, 32);
}

export function encrypt(plaintext: string): { cipherText: string; iv: string; tag: string } {
  const key = getMasterKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { cipherText: encrypted.toString('base64'), iv: iv.toString('base64'), tag: tag.toString('base64') };
}

export function decrypt(cipherText: string, ivB64: string, tagB64: string): string {
  const key = getMasterKey();
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(cipherText, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}

export default { encrypt, decrypt };
