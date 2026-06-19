// ────────────────────────────────────────────────────────────────────────────
//  Nexus Panel — Secure Sessions (Middleware & API compatible)
// ────────────────────────────────────────────────────────────────────────────

const encoder = new TextEncoder();

function arrayBufferToHex(buffer: ArrayBuffer): string {
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function base64Encode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

function base64Decode(str: string): string {
  return decodeURIComponent(escape(atob(str)));
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const keyBuf = encoder.encode(secret);
  return await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** Signs a session payload and returns a token string */
export async function createSessionToken(secret: string, maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<string> {
  const payload = JSON.stringify({
    user: "admin",
    expiresAt: Date.now() + maxAgeMs,
  });
  
  const payloadB64 = base64Encode(payload);
  const key = await getCryptoKey(secret);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  const signatureHex = arrayBufferToHex(signatureBuffer);
  
  return `${payloadB64}.${signatureHex}`;
}

/** Verifies a session token and returns true if valid and not expired */
export async function verifySessionToken(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false;
  
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  
  const [payloadB64, signatureHex] = parts;
  
  try {
    const key = await getCryptoKey(secret);
    const expectedBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
    const expectedHex = arrayBufferToHex(expectedBuffer);
    
    if (signatureHex !== expectedHex) return false;
    
    const payloadStr = base64Decode(payloadB64);
    const payload = JSON.parse(payloadStr);
    
    if (payload.expiresAt < Date.now()) return false;
    
    return true;
  } catch {
    return false;
  }
}
