// ────────────────────────────────────────────────────────────────────────────
//  /api/config — GET + PATCH server config (minecraft version, mod loader…)
// ────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("server_config")
    .select("key, value");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const config = Object.fromEntries(data.map((r) => [r.key, r.value]));
  return NextResponse.json(config);
}

export async function PATCH(req: NextRequest) {
  try {
    const body: Record<string, string> = await req.json();

    const upserts = Object.entries(body).map(([key, value]) => ({
      key,
      value: String(value),
    }));

    const { error } = await supabaseAdmin
      .from("server_config")
      .upsert(upserts, { onConflict: "key" });

    if (error) {
      console.error("[config/PATCH] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[config/PATCH] Server error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
