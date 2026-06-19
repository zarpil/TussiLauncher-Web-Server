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

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
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
    const size_bytes = bytes.byteLength;

    // Upload to storage
    const { publicUrl } = await uploadMod(file.name, bytes);

    // Upsert into database (by filename — allows re-upload to update hash)
    const { data, error } = await supabaseAdmin
      .from("mods")
      .upsert(
        {
          name,
          filename: file.name,
          version,
          description,
          md5,
          sha256,
          size_bytes,
          r2_url: publicUrl,
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
