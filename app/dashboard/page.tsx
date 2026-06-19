import { supabaseAdmin } from "@/lib/supabase";
import { Package, Newspaper, Zap, Activity } from "lucide-react";

async function getStats() {
  const [{ count: modCount }, { count: newsCount }, { data: config }] =
    await Promise.all([
      supabaseAdmin.from("mods").select("*", { count: "exact", head: true }).eq("is_enabled", true),
      supabaseAdmin.from("news").select("*", { count: "exact", head: true }).eq("is_published", true),
      supabaseAdmin.from("server_config").select("key, value"),
    ]);
  const cfg = Object.fromEntries((config ?? []).map((r) => [r.key, r.value]));
  return { modCount: modCount ?? 0, newsCount: newsCount ?? 0, cfg };
}

export default async function DashboardPage() {
  const { modCount, newsCount, cfg } = await getStats();

  const stats = [
    { label: "Mods Activos",    value: modCount,         icon: Package,   color: "var(--nexus-green)" },
    { label: "Noticias",        value: newsCount,         icon: Newspaper, color: "var(--nexus-blue)"  },
    { label: "Versión MC",      value: cfg.minecraft_version ?? "—", icon: Zap,      color: "var(--nexus-yellow)" },
    { label: "Mod Loader",      value: cfg.mod_loader ?? "—",        icon: Activity, color: "var(--nexus-red)"    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--nexus-text)]">
          Panel de Control <span className="neon-green">Tussi</span>
        </h1>
        <p className="text-[var(--nexus-muted)] text-sm mt-1">
          Estado del servidor y métricas en tiempo real
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[var(--nexus-muted)] font-medium uppercase tracking-wider">
                {label}
              </p>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${color}20` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <p
              className="text-2xl font-bold"
              style={{ color }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Server Info */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold text-[var(--nexus-text)] mb-4 flex items-center gap-2">
          <Activity size={16} className="text-[var(--nexus-green)]" />
          Configuración del Servidor
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["Minecraft", cfg.minecraft_version ?? "—"],
            ["Mod Loader", `${cfg.mod_loader ?? "—"} ${cfg.mod_loader_version ?? ""}`],
            ["Java Args", cfg.java_args ?? "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-[10px] text-[var(--nexus-muted)] uppercase tracking-widest mb-1">{k}</p>
              <p className="text-sm font-mono text-[var(--nexus-text)] truncate">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
