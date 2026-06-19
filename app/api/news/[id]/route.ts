// ────────────────────────────────────────────────────────────────────────────
//  /api/news/[id] — GET (single) + PATCH (update) + DELETE
// ────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("news")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  const allowed = ["title", "slug", "content", "cover_url", "is_published"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  // Set published_at when publishing for the first time
  if (body.is_published === true) {
    // Fetch current state
    const { data: current } = await supabaseAdmin
      .from("news")
      .select("is_published, published_at")
      .eq("id", id)
      .single();
    if (current && !current.is_published && !current.published_at) {
      updates.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabaseAdmin
    .from("news")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("news").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
