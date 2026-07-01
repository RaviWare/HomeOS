 // Client-side encryption helpers using the Web Crypto API (AES-256-GCM + PBKDF2).
 // No dependencies. Used for passphrase-protected HomeOS backups.
 const enc = new TextEncoder();
 const dec = new TextDecoder();
 function buf2b64(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
 }
 function b642buf(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
 }
 async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" }, baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
 }
 export interface EncEnvelope { app: string; enc: string; kdf: string; iter: number; salt: string; iv: string; data: string; }
 export async function encryptText(plaintext: string, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext));
  const env: EncEnvelope = { app: "HomeOS", enc: "AES-GCM", kdf: "PBKDF2", iter: 150000, salt: buf2b64(salt.buffer), iv: buf2b64(iv.buffer), data: buf2b64(ct) };
  return JSON.stringify(env, null, 2);
 }
 export async function decryptText(envelopeJson: string, passphrase: string): Promise<string> {
  const env = JSON.parse(envelopeJson) as EncEnvelope;
  const key = await deriveKey(passphrase, b642buf(env.salt));
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b642buf(env.iv) }, key, b642buf(env.data));
  return dec.decode(pt);
 }
 export function isEncryptedEnvelope(text: string): boolean {
  try { const o = JSON.parse(text); return !!o && o.enc === "AES-GCM" && o.kdf === "PBKDF2" && typeof o.data === "string"; } catch (e) { return false; }
 }
 
