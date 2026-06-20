// ────────────────────────────────────────────────────────────────────────────
//  GET /api/v1/manifest — Public endpoint consumed by the Launcher
// ────────────────────────────────────────────────────────────────────────────
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { NexusManifest } from "@/types/manifest";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // ── Fetch mods ──────────────────────────────────────────────────────────
    const { data: mods, error: modsError } = await supabaseAdmin
      .from("mods")
      .select("filename, r2_url, md5, sha256, size_bytes, is_required")
      .eq("is_enabled", true)
      .order("name");

    if (modsError) throw modsError;

    // ── Fetch latest published news (last 10) ───────────────────────────────
    const { data: news, error: newsError } = await supabaseAdmin
      .from("news")
      .select("id, title, slug, cover_url, published_at, content")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(10);

    if (newsError) throw newsError;

    // ── Fetch shaders ───────────────────────────────────────────────────────
    const { data: shaders, error: shadersError } = await supabaseAdmin
      .from("shaders")
      .select("filename, r2_url, md5, sha256, size_bytes")
      .eq("is_enabled", true)
      .order("name");

    if (shadersError) throw shadersError;

    // ── Fetch server config ─────────────────────────────────────────────────
    const { data: config, error: configError } = await supabaseAdmin
      .from("server_config")
      .select("key, value");

    if (configError) throw configError;

    const cfg = Object.fromEntries(config.map((r) => [r.key, r.value]));

    // ── Build manifest ──────────────────────────────────────────────────────
    const manifest: NexusManifest = {
      version: "1.0",
      generated_at: new Date().toISOString(),
      game: {
        minecraft_version: cfg.minecraft_version ?? "1.20.4",
        mod_loader: (cfg.mod_loader as NexusManifest["game"]["mod_loader"]) ?? "fabric",
        mod_loader_version: cfg.mod_loader_version ?? "0.15.7",
        java_args: cfg.java_args ?? "-Xmx4G -Xms1G",
        mod_loader_profile_url: cfg.mod_loader_profile_url ?? null,
        mod_loader_installer_url: cfg.mod_loader_installer_url ?? null,
      },
      mods: (mods ?? []).map((m) => ({
        filename: m.filename,
        url: m.r2_url,
        md5: m.md5,
        sha256: m.sha256,
        size_bytes: m.size_bytes,
        required: m.is_required,
      })),
      shaders: (shaders ?? []).map((s) => ({
        filename: s.filename,
        url: s.r2_url,
        md5: s.md5,
        sha256: s.sha256,
        size_bytes: s.size_bytes,
      })),
      news: (news ?? []).map((n) => ({
        id: n.id,
        title: n.title,
        slug: n.slug,
        cover_url: n.cover_url ?? null,
        published_at: n.published_at,
        excerpt: (n.content as string).slice(0, 200),
      })),
    };

    return NextResponse.json(manifest, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("[manifest] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate manifest" },
      { status: 500 }
    );
  }
}
