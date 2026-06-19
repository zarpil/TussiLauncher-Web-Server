"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, RefreshCw, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Article {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

interface ArticleFull extends Article {
  content: string;
}

type Mode = "list" | "create" | "edit";

function SlugInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center">
      <span className="px-2 py-1.5 bg-[var(--nexus-surface)] border border-r-0 border-[var(--nexus-border)] rounded-l-lg text-xs text-[var(--nexus-muted)]">
        /news/
      </span>
      <input
        className="nexus-input rounded-l-none"
        value={value}
        onChange={(e) => onChange(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
        placeholder="mi-noticia"
      />
    </div>
  );
}

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<ArticleFull | null>(null);

  // Editor state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/news");
    setArticles(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const openCreate = () => {
    setEditing(null);
    setTitle(""); setSlug(""); setContent(""); setCoverUrl(""); setIsPublished(false);
    setMode("create");
  };

  const openEdit = async (id: string) => {
    const res = await fetch(`/api/news/${id}`);
    const a: ArticleFull = await res.json();
    setEditing(a);
    setTitle(a.title); setSlug(a.slug); setContent(a.content);
    setCoverUrl(a.cover_url ?? ""); setIsPublished(a.is_published);
    setMode("edit");
  };

  const save = async () => {
    setSaving(true);
    const body = { title, slug, content, cover_url: coverUrl || null, is_published: isPublished };
    if (mode === "create") {
      await fetch("/api/news", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await fetch(`/api/news/${editing!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setSaving(false);
    setMode("list");
    fetchArticles();
  };

  const deleteArticle = async (id: string, t: string) => {
    if (!confirm(`¿Eliminar "${t}"?`)) return;
    await fetch(`/api/news/${id}`, { method: "DELETE" });
    fetchArticles();
  };

  const togglePublish = async (id: string, cur: boolean) => {
    await fetch(`/api/news/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !cur }),
    });
    fetchArticles();
  };

  // ── Editor View ──────────────────────────────────────────────────────────
  if (mode === "create" || mode === "edit") {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">
            {mode === "create" ? "Nueva " : "Editar "}<span className="neon-blue">Noticia</span>
          </h1>
          <button onClick={() => setMode("list")} className="text-sm text-[var(--nexus-muted)] hover:text-[var(--nexus-text)]">
            ← Volver
          </button>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Main editor */}
          <div className="col-span-2 space-y-4">
            <input
              className="nexus-input text-lg font-semibold"
              placeholder="Título de la noticia..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (mode === "create") setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
              }}
            />

            {/* Tab bar */}
            <div className="flex gap-1 border-b border-[var(--nexus-border)] pb-0">
              {(["write", "preview"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    tab === t
                      ? "text-[var(--nexus-green)] border-[var(--nexus-green)]"
                      : "text-[var(--nexus-muted)] border-transparent hover:text-[var(--nexus-text)]"
                  }`}
                >
                  {t === "write" ? "Escribir" : "Vista previa"}
                </button>
              ))}
            </div>

            {tab === "write" ? (
              <textarea
                className="nexus-input font-mono text-sm resize-none h-80"
                placeholder="Escribe aquí en Markdown..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            ) : (
              <div className="h-80 overflow-auto glass-card p-4 prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{content || "*Sin contenido aún…*"}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Sidebar settings */}
          <div className="space-y-4">
            <div className="glass-card p-4 space-y-3">
              <p className="text-xs font-semibold text-[var(--nexus-muted)] uppercase tracking-wider">Publicación</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">Estado</span>
                <button
                  onClick={() => setIsPublished((v) => !v)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full transition-colors ${
                    isPublished ? "badge-green" : "badge-red"
                  }`}
                >
                  {isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                  {isPublished ? "Publicada" : "Borrador"}
                </button>
              </div>

              <div>
                <label className="block text-xs text-[var(--nexus-muted)] mb-1">Slug (URL)</label>
                <SlugInput value={slug} onChange={setSlug} />
              </div>

              <div>
                <label className="block text-xs text-[var(--nexus-muted)] mb-1">URL Imagen portada</label>
                <input
                  className="nexus-input"
                  placeholder="https://..."
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                />
                {coverUrl && (
                  <img src={coverUrl} alt="preview" className="mt-2 rounded-lg w-full h-24 object-cover opacity-80" />
                )}
              </div>

              <button
                onClick={save}
                disabled={!title || !slug || saving}
                className="btn-neon w-full py-2 text-sm"
              >
                {saving ? "Guardando…" : mode === "create" ? "Crear Noticia" : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── List View ─────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold"><span className="neon-blue">Noticias</span></h1>
          <p className="text-xs text-[var(--nexus-muted)] mt-1">
            {articles.filter((a) => a.is_published).length} publicadas · {articles.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchArticles} className="flex items-center gap-1.5 text-xs text-[var(--nexus-muted)] hover:text-[var(--nexus-text)] px-3 py-2 rounded-lg border border-[var(--nexus-border)] transition-colors">
            <RefreshCw size={13} /> Actualizar
          </button>
          <button onClick={openCreate} className="btn-neon flex items-center gap-1.5 text-xs py-2">
            <Plus size={13} /> Nueva Noticia
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-[var(--nexus-muted)]">
            <RefreshCw size={20} className="animate-spin mr-2" /> Cargando...
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-[var(--nexus-muted)]">
            <FileText size={40} strokeWidth={1} />
            <p className="text-sm">No hay noticias. Crea la primera.</p>
          </div>
        ) : (
          <table className="nexus-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Slug</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      {a.cover_url && (
                        <img src={a.cover_url} alt="" className="w-8 h-8 rounded object-cover" />
                      )}
                      <span className="font-medium text-[var(--nexus-text)]">{a.title}</span>
                    </div>
                  </td>
                  <td className="font-mono text-xs text-[var(--nexus-muted)]">{a.slug}</td>
                  <td>
                    <button onClick={() => togglePublish(a.id, a.is_published)}>
                      {a.is_published
                        ? <span className="badge-green flex items-center gap-1"><Eye size={11} /> Publicada</span>
                        : <span className="badge-red flex items-center gap-1"><EyeOff size={11} /> Borrador</span>
                      }
                    </button>
                  </td>
                  <td className="text-xs text-[var(--nexus-muted)]">
                    {a.published_at ? new Date(a.published_at).toLocaleDateString("es") : "—"}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(a.id)} className="p-1.5 text-[var(--nexus-muted)] hover:text-[var(--nexus-blue)] rounded transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteArticle(a.id, a.title)} className="p-1.5 text-[var(--nexus-muted)] hover:text-[var(--nexus-red)] rounded transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
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
