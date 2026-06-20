"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, ToggleLeft, ToggleRight, RefreshCw, Plus, Sparkles, Search } from "lucide-react";
import { UploadShaderForm } from "@/components/shaders/UploadShaderForm";

interface Shader {
  id: string;
  name: string;
  filename: string;
  md5: string;
  sha256: string;
  size_bytes: number;
  is_enabled: boolean;
  created_at: string;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export default function ShadersPage() {
  const [shaders, setShaders] = useState<Shader[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");

  const fetchShaders = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/shaders");
    const data = await res.json();
    setShaders(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchShaders(); }, [fetchShaders]);

  const toggleEnabled = async (id: string, current: boolean) => {
    await fetch(`/api/shaders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_enabled: !current }),
    });
    fetchShaders();
  };

  const deleteShader = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar el shader pack "${name}"? Esta acción es irreversible y eliminará el archivo del servidor.`)) return;
    await fetch(`/api/shaders/${id}`, { method: "DELETE" });
    fetchShaders();
  };

  const filteredShaders = shaders.filter((shader) =>
    shader.name.toLowerCase().includes(search.toLowerCase()) ||
    shader.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--nexus-text)]">
            Gestión de <span className="neon-blue">Shaders</span>
          </h1>
          <p className="text-xs text-[var(--nexus-muted)] mt-1">
            {shaders.filter((s) => s.is_enabled).length} shaders activos · {shaders.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchShaders}
            className="flex items-center gap-1.5 text-xs text-[var(--nexus-muted)] hover:text-[var(--nexus-text)] px-3 py-2 rounded-lg border border-[var(--nexus-border)] transition-colors"
          >
            <RefreshCw size={13} /> Actualizar
          </button>
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="btn-neon flex items-center gap-1.5 text-xs py-2"
          >
            <Plus size={13} />
            {showUpload ? "Cancelar" : "Subir Shader"}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--nexus-muted)]" size={15} />
          <input
            type="text"
            placeholder="Buscar shader por nombre o archivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="nexus-input pl-9"
          />
        </div>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="glass-card p-5 mb-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Sparkles size={15} className="text-[var(--nexus-blue)]" />
            Subir Nuevo Shader Pack
          </h2>
          <UploadShaderForm onSuccess={() => { setShowUpload(false); fetchShaders(); }} />
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-[var(--nexus-muted)]">
            <RefreshCw size={20} className="animate-spin mr-2" /> Cargando...
          </div>
        ) : shaders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-[var(--nexus-muted)]">
            <Sparkles size={40} strokeWidth={1} />
            <p className="text-sm">No hay shaders todavía. Sube el primero.</p>
          </div>
        ) : filteredShaders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-[var(--nexus-muted)]">
            <Search size={40} strokeWidth={1} />
            <p className="text-sm">No se encontraron shaders que coincidan con "{search}"</p>
          </div>
        ) : (
          <table className="nexus-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tamaño</th>
                <th>SHA256</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredShaders.map((shader) => (
                <tr key={shader.id}>
                  <td>
                    <div className="font-medium text-[var(--nexus-text)]">{shader.name}</div>
                    <div className="text-[10px] text-[var(--nexus-muted)] font-mono">{shader.filename}</div>
                  </td>
                  <td className="text-[var(--nexus-muted)]">{formatBytes(shader.size_bytes)}</td>
                  <td>
                    <span className="text-[10px] font-mono text-[var(--nexus-muted)] truncate block w-24">
                      {shader.sha256.slice(0, 12)}…
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleEnabled(shader.id, shader.is_enabled)}
                      className="flex items-center gap-1.5"
                    >
                      {shader.is_enabled ? (
                        <><ToggleRight size={18} className="text-[var(--nexus-blue)]" /><span className="badge-blue">Activo</span></>
                      ) : (
                        <><ToggleLeft size={18} className="text-[var(--nexus-muted)]" /><span className="badge-red">Inactivo</span></>
                      )}
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => deleteShader(shader.id, shader.name)}
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
