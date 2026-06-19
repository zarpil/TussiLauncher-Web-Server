// ────────────────────────────────────────────────────────────────────────────
//  Nexus Panel — Storage Helper (Supabase Storage)
//  Abstracts file upload/delete operations.
//  To switch to Cloudflare R2, replace the implementation here — the API
//  surface stays identical for all consumers.
// ────────────────────────────────────────────────────────────────────────────
import { supabaseAdmin } from "./supabase";

const BUCKET = "nexus-mods";

export interface UploadResult {
  publicUrl: string;
  path: string;
}

/**
 * Upload a mod .jar file to Supabase Storage.
 * Returns the public URL for the file.
 */
export async function uploadMod(
  filename: string,
  data: Buffer | Uint8Array,
  contentType = "application/java-archive"
): Promise<UploadResult> {
  const path = `mods/${filename}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, data, {
      contentType,
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

  return { publicUrl, path };
}

/**
 * Delete a mod .jar file from Supabase Storage.
 */
export async function deleteMod(filename: string): Promise<void> {
  const path = `mods/${filename}`;
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}

/**
 * Upload a news cover image.
 */
export async function uploadNewsCover(
  slug: string,
  data: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const ext = contentType.split("/")[1] ?? "jpg";
  const path = `news/${slug}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, data, { contentType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}
