// ────────────────────────────────────────────────────────────────────────────
//  /api/shaders/[id] — PATCH (toggle enabled) + DELETE
// ────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { deleteShader } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  const allowed = ["is_enabled", "name"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabaseAdmin
    .from("shaders")
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
  const { data: shader, error: fetchError } = await supabaseAdmin
    .from("shaders")
    .select("filename")
    .eq("id", id)
    .single();

  if (fetchError || !shader)
    return NextResponse.json({ error: "Shader not found" }, { status: 404 });

  // Remove from storage
  try {
    await deleteShader(shader.filename);
  } catch (e) {
    console.warn("[shaders/DELETE] Storage remove failed (continuing):", e);
  }

  // Remove from DB
  const { error } = await supabaseAdmin.from("shaders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
