// ────────────────────────────────────────────────────────────────────────────
//  /api/news — GET (list) + POST (create)
// ────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// ── GET /api/news ─────────────────────────────────────────────────────────
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("news")
    .select("id, title, slug, cover_url, is_published, published_at, created_at")
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// ── POST /api/news — create article ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, slug, content, cover_url, is_published } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: "title and slug are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("news")
      .insert({
        title,
        slug: slug.toLowerCase().replace(/\s+/g, "-"),
        content: content ?? "",
        cover_url: cover_url ?? null,
        is_published: is_published ?? false,
        published_at: is_published ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[news/POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
