// ────────────────────────────────────────────────────────────────────────────
//  POST /api/config/mod-loader-profile
//  Recibe un archivo JSON de perfil de mod loader (NeoForge, Fabric, etc.)
//  lo sube a Supabase Storage y guarda la URL pública en server_config.
// ────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const BUCKET = "nexus-mods";
const STORAGE_PATH = "config/mod-loader-profile.json";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("profile") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
    }

    if (!file.name.endsWith(".json")) {
      return NextResponse.json({ error: "El archivo debe ser un .json" }, { status: 400 });
    }

    // Leer el contenido y validar que es JSON válido
    const text = await file.text();
    try {
      JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "El archivo no es JSON válido." }, { status: 400 });
    }

    const buffer = Buffer.from(text, "utf-8");

    // Subir a Supabase Storage (bucket: nexus-mods, carpeta config/)
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(STORAGE_PATH, buffer, {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadError) {
      console.error("[mod-loader-profile] Upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Obtener URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(STORAGE_PATH);

    const publicUrl = urlData.publicUrl;

    // Guardar URL en server_config
    const { error: configError } = await supabaseAdmin
      .from("server_config")
      .upsert({ key: "mod_loader_profile_url", value: publicUrl }, { onConflict: "key" });

    if (configError) {
      console.error("[mod-loader-profile] Config error:", configError);
      return NextResponse.json({ error: configError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error("[mod-loader-profile] Server error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await supabaseAdmin.storage.from(BUCKET).remove([STORAGE_PATH]);

    await supabaseAdmin
      .from("server_config")
      .delete()
      .eq("key", "mod_loader_profile_url");

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
