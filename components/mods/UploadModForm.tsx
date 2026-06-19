"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface UploadModFormProps {
  onSuccess: () => void;
}

export function UploadModForm({ onSuccess }: UploadModFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [description, setDescription] = useState("");
  const [isRequired, setIsRequired] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    if (!name) setName(f.name.replace(/\.jar$/i, ""));
  }, [name]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/java-archive": [".jar"] },
    maxFiles: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setProgress(10);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", name);
      fd.append("version", version);
      fd.append("description", description);
      fd.append("is_required", String(isRequired));

      setProgress(40);
      const res = await fetch("/api/mods", { method: "POST", body: fd });
      setProgress(90);

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Upload failed");
      }

      setProgress(100);
      setStatus("success");
      setTimeout(() => {
        setFile(null);
        setName("");
        setVersion("");
        setDescription("");
        setStatus("idle");
        setProgress(0);
        onSuccess();
      }, 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
      setStatus("error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragActive
            ? "border-[var(--nexus-green)] bg-[rgba(0,255,136,0.05)]"
            : "border-[var(--nexus-border)] hover:border-[rgba(0,255,136,0.4)] hover:bg-[rgba(0,255,136,0.02)]"
          }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[rgba(0,255,136,0.1)] flex items-center justify-center">
              <CheckCircle size={20} className="text-[var(--nexus-green)]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[var(--nexus-text)]">{file.name}</p>
              <p className="text-xs text-[var(--nexus-muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="ml-auto text-[var(--nexus-muted)] hover:text-[var(--nexus-red)]"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={32} className="text-[var(--nexus-muted)]" />
            <p className="text-sm text-[var(--nexus-muted)]">
              {isDragActive ? "Suelta el archivo aquí" : "Arrastra un .jar o haz clic para seleccionar"}
            </p>
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[var(--nexus-muted)] mb-1">Nombre *</label>
          <input
            className="nexus-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="OptiFine"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--nexus-muted)] mb-1">Versión</label>
          <input
            className="nexus-input"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.20.4"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-[var(--nexus-muted)] mb-1">Descripción</label>
        <textarea
          className="nexus-input resize-none h-16"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción del mod..."
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isRequired"
          checked={isRequired}
          onChange={(e) => setIsRequired(e.target.checked)}
          className="w-4 h-4 accent-[var(--nexus-green)]"
        />
        <label htmlFor="isRequired" className="text-sm text-[var(--nexus-text)]">
          Mod obligatorio
        </label>
      </div>

      {/* Progress */}
      {uploading && (
        <div className="space-y-1">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-[var(--nexus-muted)] text-right">{progress}%</p>
        </div>
      )}

      {/* Status */}
      {status === "success" && (
        <div className="flex items-center gap-2 text-[var(--nexus-green)] text-sm">
          <CheckCircle size={16} /> Mod subido correctamente
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 text-[var(--nexus-red)] text-sm">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      <button
        type="submit"
        className="btn-neon w-full flex items-center justify-center gap-2 py-2.5"
        disabled={!file || uploading}
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {uploading ? "Subiendo..." : "Subir Mod"}
      </button>
    </form>
  );
}
