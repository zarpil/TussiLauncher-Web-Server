"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Sparkles,
  Newspaper,
  Settings,
  ExternalLink,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",         label: "Overview",      icon: LayoutDashboard },
  { href: "/dashboard/mods",    label: "Mods",          icon: Package },
  { href: "/dashboard/shaders", label: "Shaders",       icon: Sparkles },
  { href: "/dashboard/news",    label: "Noticias",      icon: Newspaper },
  { href: "/dashboard/config",  label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[var(--nexus-surface)] border-r border-[var(--nexus-border)] p-4 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2 pt-2">
        <div className="w-9 h-9 rounded-xl border border-[var(--nexus-border)] overflow-hidden shadow-[0_0_15px_rgba(255,105,180,0.3)]">
          <img src="/logo.png" alt="Tussi Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="font-bold text-sm text-[var(--nexus-text)] leading-none">Tussi</p>
          <p className="text-[10px] text-[var(--nexus-muted)] leading-none mt-0.5">Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${isActive ? "active" : ""}`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="mt-auto pt-4 border-t border-[var(--nexus-border)] flex flex-col gap-2">
        <a
          href="/api/v1/manifest"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-link text-[var(--nexus-blue)]"
        >
          <ExternalLink size={14} />
          <span className="text-xs">API Manifest</span>
        </a>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="sidebar-link text-[var(--nexus-red)] hover:bg-[rgba(255,68,102,0.08)] cursor-pointer w-full text-left"
        >
          <LogOut size={14} />
          <span className="text-xs">{loggingOut ? "Saliendo..." : "Cerrar sesión"}</span>
        </button>
      </div>
    </aside>
  );
}
