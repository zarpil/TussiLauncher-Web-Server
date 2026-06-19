// ────────────────────────────────────────────────────────────────────────────
//  /api/mods/[id] — PATCH (toggle enabled/required) + DELETE
// ────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { deleteMod } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  const allowed = ["is_enabled", "is_required", "name", "version", "description"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabaseAdmin
    .from("mods")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  // Fetch filename first (needed for storage deletion)
  const { data: mod, error: fetchError } = await supabaseAdmin
    .from("mods")
    .select("filename")
    .eq("id", id)
    .single();

  if (fetchError || !mod)
    return NextResponse.json({ error: "Mod not found" }, { status: 404 });

  // Remove from storage
  try {
    await deleteMod(mod.filename);
  } catch (e) {
    console.warn("[mods/DELETE] Storage remove failed (continuing):", e);
  }

  // Remove from DB
  const { error } = await supabaseAdmin.from("mods").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
