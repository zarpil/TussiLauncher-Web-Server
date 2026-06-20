// ────────────────────────────────────────────────────────────────────────────
//  /api/mods — GET (list) + POST (upload)
// ────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { computeHashes } from "@/lib/hash";
import { uploadMod } from "@/lib/storage";

export const dynamic = "force-dynamic";

// ── GET /api/mods ─────────────────────────────────────────────────────────
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("mods")
    .select("*")
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// ── POST /api/mods — multipart/form-data upload ──────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;
    const version = (formData.get("version") as string) ?? "";
    const description = (formData.get("description") as string) ?? "";
    const isRequired = formData.get("is_required") !== "false";

    const customUrl = formData.get("custom_url") as string | null;
    const customFilename = formData.get("filename") as string | null;
    const customSha256 = formData.get("sha256") as string | null;
    const customMd5 = formData.get("md5") as string | null;
    const customSizeBytes = formData.get("size_bytes") as string | null;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let finalFilename = "";
    let finalUrl = "";
    let finalSha256 = "";
    let finalMd5 = "";
    let finalSizeBytes = 0;

    if (customUrl) {
      if (!customFilename || !customSha256 || !customMd5 || !customSizeBytes) {
        return NextResponse.json(
          { error: "Para enlaces externos, debes ingresar: Nombre de archivo, SHA256, MD5 y Tamaño." },
          { status: 400 }
        );
      }
      if (!customFilename.endsWith(".jar")) {
        return NextResponse.json(
          { error: "El nombre de archivo debe terminar en .jar" },
          { status: 400 }
        );
      }
      finalFilename = customFilename;
      finalUrl = customUrl;
      finalSha256 = customSha256;
      finalMd5 = customMd5;
      finalSizeBytes = parseInt(customSizeBytes, 10);
    } else {
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      if (!file.name.endsWith(".jar")) {
        return NextResponse.json(
          { error: "Only .jar files are allowed" },
          { status: 400 }
        );
      }

      // Read file bytes
      const bytes = Buffer.from(await file.arrayBuffer());
      const { md5, sha256 } = computeHashes(bytes);
      
      finalFilename = file.name;
      finalSha256 = sha256;
      finalMd5 = md5;
      finalSizeBytes = bytes.byteLength;

      // Upload to storage
      const { publicUrl } = await uploadMod(file.name, bytes);
      finalUrl = publicUrl;
    }

    // Upsert into database (by filename — allows re-upload to update hash)
    const { data, error } = await supabaseAdmin
      .from("mods")
      .upsert(
        {
          name,
          filename: finalFilename,
          version,
          description,
          md5: finalMd5,
          sha256: finalSha256,
          size_bytes: finalSizeBytes,
          r2_url: finalUrl,
          is_required: isRequired,
          is_enabled: true,
        },
        { onConflict: "filename" }
      )
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[mods/POST]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
