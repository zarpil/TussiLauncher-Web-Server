"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, ToggleLeft, ToggleRight, RefreshCw, Plus, Package } from "lucide-react";
import { UploadModForm } from "@/components/mods/UploadModForm";

interface Mod {
  id: string;
  name: string;
  filename: string;
  version: string;
  md5: string;
  sha256: string;
  size_bytes: number;
  is_required: boolean;
  is_enabled: boolean;
  created_at: string;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export default function ModsPage() {
  const [mods, setMods] = useState<Mod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const fetchMods = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/mods");
    const data = await res.json();
    setMods(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMods(); }, [fetchMods]);

  const toggleEnabled = async (id: string, current: boolean) => {
    await fetch(`/api/mods/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_enabled: !current }),
    });
    fetchMods();
  };

  const deleteMod = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar el mod "${name}"? Esta acción es irreversible.`)) return;
    await fetch(`/api/mods/${id}`, { method: "DELETE" });
    fetchMods();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--nexus-text)]">
            Gestión de <span className="neon-green">Mods</span>
          </h1>
          <p className="text-xs text-[var(--nexus-muted)] mt-1">
            {mods.filter((m) => m.is_enabled).length} mods activos · {mods.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchMods}
            className="flex items-center gap-1.5 text-xs text-[var(--nexus-muted)] hover:text-[var(--nexus-text)] px-3 py-2 rounded-lg border border-[var(--nexus-border)] transition-colors"
          >
            <RefreshCw size={13} /> Actualizar
          </button>
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="btn-neon flex items-center gap-1.5 text-xs py-2"
          >
            <Plus size={13} />
            {showUpload ? "Cancelar" : "Subir Mod"}
          </button>
        </div>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="glass-card p-5 mb-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Package size={15} className="text-[var(--nexus-green)]" />
            Subir Nuevo Mod
          </h2>
          <UploadModForm onSuccess={() => { setShowUpload(false); fetchMods(); }} />
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-[var(--nexus-muted)]">
            <RefreshCw size={20} className="animate-spin mr-2" /> Cargando...
          </div>
        ) : mods.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-[var(--nexus-muted)]">
            <Package size={40} strokeWidth={1} />
            <p className="text-sm">No hay mods todavía. Sube el primero.</p>
          </div>
        ) : (
          <table className="nexus-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Versión</th>
                <th>Tamaño</th>
                <th>SHA256</th>
                <th>Estado</th>
                <th>Tipo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mods.map((mod) => (
                <tr key={mod.id}>
                  <td>
                    <div className="font-medium text-[var(--nexus-text)]">{mod.name}</div>
                    <div className="text-[10px] text-[var(--nexus-muted)] font-mono">{mod.filename}</div>
                  </td>
                  <td className="text-[var(--nexus-muted)]">{mod.version || "—"}</td>
                  <td className="text-[var(--nexus-muted)]">{formatBytes(mod.size_bytes)}</td>
                  <td>
                    <span className="text-[10px] font-mono text-[var(--nexus-muted)] truncate block w-24">
                      {mod.sha256.slice(0, 12)}…
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleEnabled(mod.id, mod.is_enabled)}
                      className="flex items-center gap-1.5"
                    >
                      {mod.is_enabled ? (
                        <><ToggleRight size={18} className="text-[var(--nexus-green)]" /><span className="badge-green">Activo</span></>
                      ) : (
                        <><ToggleLeft size={18} className="text-[var(--nexus-muted)]" /><span className="badge-red">Inactivo</span></>
                      )}
                    </button>
                  </td>
                  <td>
                    {mod.is_required
                      ? <span className="badge-blue">Obligatorio</span>
                      : <span className="badge-green">Opcional</span>
                    }
                  </td>
                  <td>
                    <button
                      onClick={() => deleteMod(mod.id, mod.name)}
                      className="p-1.5 text-[var(--nexus-muted)] hover:text-[var(--nexus-red)] rounded transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
