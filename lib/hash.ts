// ────────────────────────────────────────────────────────────────────────────
//  Nexus Panel — Hash Utilities (MD5 + SHA256)
//  Runs server-side only (Node.js crypto)
// ────────────────────────────────────────────────────────────────────────────
import crypto from "crypto";

/**
 * Compute MD5 hex digest from a Buffer or Uint8Array.
 */
export function computeMd5(data: Buffer | Uint8Array): string {
  return crypto.createHash("md5").update(data).digest("hex");
}

/**
 * Compute SHA256 hex digest from a Buffer or Uint8Array.
 */
export function computeSha256(data: Buffer | Uint8Array): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Compute both hashes in one pass.
 */
export function computeHashes(data: Buffer | Uint8Array): {
  md5: string;
  sha256: string;
} {
  return {
    md5: computeMd5(data),
    sha256: computeSha256(data),
  };
}
