"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, CheckCircle, AlertCircle, Loader2, Link, FileUp } from "lucide-react";

interface UploadShaderFormProps {
  onSuccess: () => void;
}

export function UploadShaderForm({ onSuccess }: UploadShaderFormProps) {
  const [isExternal, setIsExternal] = useState(false);
  
  // Commons
  const [name, setName] = useState("");
  
  // File upload mode
  const [file, setFile] = useState<File | null>(null);
  
  // External link mode
  const [externalUrl, setExternalUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [sha256, setSha256] = useState("");
  const [md5, setMd5] = useState("");
  const [sizeBytes, setSizeBytes] = useState("");

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    if (!name) setName(f.name.replace(/\.zip$/i, ""));
  }, [name]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/zip": [".zip"] },
    maxFiles: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isExternal && !file) return;

    setUploading(true);
    setProgress(10);

    try {
      const fd = new FormData();
      fd.append("name", name);

      if (isExternal) {
        fd.append("custom_url", externalUrl);
        fd.append("filename", filename);
        fd.append("sha256", sha256);
        fd.append("md5", md5);
        fd.append("size_bytes", sizeBytes);
      } else if (file) {
        fd.append("file", file);
      }

      setProgress(40);
      const res = await fetch("/api/shaders", { method: "POST", body: fd });
      setProgress(90);

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Error al subir/guardar el shader pack");
      }

      setProgress(100);
      setStatus("success");
      setTimeout(() => {
        setFile(null);
        setName("");
        setExternalUrl("");
        setFilename("");
        setSha256("");
        setMd5("");
        setSizeBytes("");
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
      {/* Tab Selector */}
      <div className="flex border-b border-[var(--nexus-border)] mb-4">
        <button
          type="button"
          onClick={() => setIsExternal(false)}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            !isExternal
              ? "border-[var(--nexus-pink)] text-[var(--nexus-text)]"
              : "border-transparent text-[var(--nexus-muted)] hover:text-[var(--nexus-text)]"
          }`}
        >
          <FileUp size={14} /> Subir Archivo (.zip)
        </button>
        <button
          type="button"
          onClick={() => setIsExternal(true)}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            isExternal
              ? "border-[var(--nexus-pink)] text-[var(--nexus-text)]"
              : "border-transparent text-[var(--nexus-muted)] hover:text-[var(--nexus-text)]"
          }`}
        >
          <Link size={14} /> Enlace Externo (Google Drive, etc.)
        </button>
      </div>

      {/* File Mode or External Mode */}
      {!isExternal ? (
        /* Dropzone */
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${isDragActive
              ? "border-[var(--nexus-pink)] bg-[rgba(255,105,180,0.05)]"
              : "border-[var(--nexus-border)] hover:border-[rgba(255,105,180,0.4)] hover:bg-[rgba(255,105,180,0.02)]"
            }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(255,105,180,0.1)] flex items-center justify-center">
                <CheckCircle size={20} className="text-[var(--nexus-pink)]" />
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
                {isDragActive ? "Suelta el archivo aquí" : "Arrastra un .zip o haz clic para seleccionar"}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* External Link Inputs */
        <div className="space-y-3 p-4 rounded-xl border border-[var(--nexus-border)] bg-[rgba(255,255,255,0.01)]">
          <div>
            <label className="block text-xs text-[var(--nexus-muted)] mb-1">URL de descarga directa *</label>
            <input
              type="url"
              className="nexus-input"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://drive.google.com/uc?export=download&id=..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--nexus-muted)] mb-1">Nombre de archivo (ej. shader.zip) *</label>
              <input
                type="text"
                className="nexus-input"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="ComplementaryShaders_v5.2.2.zip"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--nexus-muted)] mb-1">Tamaño en bytes *</label>
              <input
                type="number"
                className="nexus-input"
                value={sizeBytes}
                onChange={(e) => setSizeBytes(e.target.value)}
                placeholder="1048576"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--nexus-muted)] mb-1">Hash SHA-256 *</label>
              <input
                type="text"
                className="nexus-input font-mono text-xs"
                value={sha256}
                onChange={(e) => setSha256(e.target.value)}
                placeholder="b0589eb7d03b13bbf3b9..."
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--nexus-muted)] mb-1">Hash MD5 *</label>
              <input
                type="text"
                className="nexus-input font-mono text-xs"
                value={md5}
                onChange={(e) => setMd5(e.target.value)}
                placeholder="dd7e3bb25bfa6d7863..."
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* Fields */}
      <div>
        <label className="block text-xs text-[var(--nexus-muted)] mb-1">Nombre para mostrar *</label>
        <input
          className="nexus-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Complementary Shaders"
          required
        />
      </div>

      {/* Progress */}
      {uploading && !isExternal && (
        <div className="space-y-1">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-[var(--nexus-muted)] text-right">{progress}%</p>
        </div>
      )}

      {/* Status */}
      {status === "success" && (
        <div className="flex items-center gap-2 text-[var(--nexus-pink)] text-sm">
          <CheckCircle size={16} /> Shader pack guardado correctamente
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
        disabled={(!isExternal && !file) || uploading}
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {uploading ? "Guardando..." : "Guardar Shader"}
      </button>
    </form>
  );
}
