"use client";

import { useState, useEffect, useRef } from "react";
import { Save, RefreshCw, Settings, Upload, Trash2, CheckCircle, FileJson } from "lucide-react";

interface Config {
  minecraft_version: string;
  mod_loader: string;
  mod_loader_version: string;
  java_args: string;
  mod_loader_profile_url?: string;
  mod_loader_installer_url?: string;
}

export default function ConfigPage() {
  const [config, setConfig] = useState<Config>({
    minecraft_version: "",
    mod_loader: "fabric",
    mod_loader_version: "",
    java_args: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Mod loader profile upload state
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadMsg, setUploadMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mod loader installer upload state
  const [installerFile, setInstallerFile] = useState<File | null>(null);
  const [uploadingInstaller, setUploadingInstaller] = useState(false);
  const [uploadInstallerStatus, setUploadInstallerStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadInstallerMsg, setUploadInstallerMsg] = useState("");
  const installerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => { setConfig(d); setLoading(false); });
  }, []);

  const save = async () => {
    setSaving(true);
    // Don't send mod_loader_profile_url or mod_loader_installer_url through this endpoint
    const { mod_loader_profile_url: _, mod_loader_installer_url: __, ...body } = config;
    await fetch("/api/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const uploadProfile = async () => {
    if (!profileFile) return;
    setUploading(true);
    setUploadStatus("idle");
    setUploadMsg("");

    const form = new FormData();
    form.append("profile", profileFile);

    try {
      const res = await fetch("/api/config/mod-loader-profile", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setUploadStatus("success");
      setUploadMsg("Perfil subido correctamente");
      setConfig((c) => ({ ...c, mod_loader_profile_url: data.url }));
      setProfileFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploadStatus("error");
      setUploadMsg((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const deleteProfile = async () => {
    if (!confirm("¿Eliminar el perfil del mod loader?")) return;
    await fetch("/api/config/mod-loader-profile", { method: "DELETE" });
    setConfig((c) => ({ ...c, mod_loader_profile_url: undefined }));
    setUploadStatus("idle");
    setUploadMsg("");
  };

  const uploadInstaller = async () => {
    if (!installerFile) return;
    setUploadingInstaller(true);
    setUploadInstallerStatus("idle");
    setUploadInstallerMsg("");

    const form = new FormData();
    form.append("installer", installerFile);

    try {
      const res = await fetch("/api/config/mod-loader-installer", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setUploadInstallerStatus("success");
      setUploadInstallerMsg("Instalador subido correctamente");
      setConfig((c) => ({ ...c, mod_loader_installer_url: data.url }));
      setInstallerFile(null);
      if (installerInputRef.current) installerInputRef.current.value = "";
    } catch (err) {
      setUploadInstallerStatus("error");
      setUploadInstallerMsg((err as Error).message);
    } finally {
      setUploadingInstaller(false);
    }
  };

  const deleteInstaller = async () => {
    if (!confirm("¿Eliminar el instalador del mod loader?")) return;
    await fetch("/api/config/mod-loader-installer", { method: "DELETE" });
    setConfig((c) => ({ ...c, mod_loader_installer_url: undefined }));
    setUploadInstallerStatus("idle");
    setUploadInstallerMsg("");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-[var(--nexus-muted)]">
      <RefreshCw size={20} className="animate-spin mr-2" /> Cargando configuración...
    </div>
  );

  return (
    <div className="max-w-xl space-y-6">
      <div className="mb-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings size={20} className="text-[var(--nexus-blue)]" />
          <span className="neon-blue">Configuración</span> del Servidor
        </h1>
        <p className="text-xs text-[var(--nexus-muted)] mt-1">
          Estos valores se publican en el manifest y el launcher los consume automáticamente.
        </p>
      </div>

      {/* ── Configuración básica ── */}
      <div className="glass-card p-6 space-y-5">
        <div>
          <label className="block text-xs text-[var(--nexus-muted)] mb-1.5 uppercase tracking-wider">Versión de Minecraft</label>
          <input className="nexus-input" value={config.minecraft_version} onChange={(e) => setConfig((c) => ({ ...c, minecraft_version: e.target.value }))} placeholder="1.21.1" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--nexus-muted)] mb-1.5 uppercase tracking-wider">Mod Loader</label>
            <select
              className="nexus-input"
              value={config.mod_loader}
              onChange={(e) => setConfig((c) => ({ ...c, mod_loader: e.target.value }))}
            >
              <option value="fabric">Fabric</option>
              <option value="forge">Forge</option>
              <option value="quilt">Quilt</option>
              <option value="neoforge">NeoForge</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--nexus-muted)] mb-1.5 uppercase tracking-wider">Versión Loader</label>
            <input className="nexus-input" value={config.mod_loader_version} onChange={(e) => setConfig((c) => ({ ...c, mod_loader_version: e.target.value }))} placeholder="21.1.172" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[var(--nexus-muted)] mb-1.5 uppercase tracking-wider">Argumentos JVM</label>
          <input className="nexus-input font-mono text-sm" value={config.java_args} onChange={(e) => setConfig((c) => ({ ...c, java_args: e.target.value }))} placeholder="-Xmx4G -Xms1G -XX:+UseG1GC" />
          <p className="text-xs text-[var(--nexus-muted)] mt-1">Separados por espacio. El launcher los pasará directamente a la JVM.</p>
        </div>

        <button onClick={save} disabled={saving} className="btn-neon w-full flex items-center justify-center gap-2 py-2.5">
          {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
          {saved ? "¡Guardado!" : saving ? "Guardando..." : "Guardar Configuración"}
        </button>
      </div>

      {/* ── Mod Loader Profile JSON ── */}
      <div className="glass-card p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-1">
            <FileJson size={16} className="text-[var(--nexus-blue)]" />
            Perfil del Mod Loader (JSON)
          </h2>
          <p className="text-xs text-[var(--nexus-muted)]">
            Sube el JSON de perfil generado por el instalador de NeoForge, Fabric, etc.
            El launcher lo usará para lanzar el juego con el mod loader correcto.
          </p>
        </div>

        {/* Estado actual */}
        {config.mod_loader_profile_url ? (
          <div className="flex items-center justify-between bg-[var(--nexus-surface)] rounded-lg px-3 py-2 border border-[rgba(var(--nexus-blue-rgb),0.3)]">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle size={14} className="text-green-400 shrink-0" />
              <span className="text-xs text-[var(--nexus-muted)] truncate">Perfil cargado</span>
            </div>
            <button
              onClick={deleteProfile}
              className="text-red-400 hover:text-red-300 transition-colors ml-2 shrink-0"
              title="Eliminar perfil"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <div className="text-xs text-[var(--nexus-muted)] bg-[rgba(255,200,0,0.05)] border border-[rgba(255,200,0,0.2)] rounded-lg px-3 py-2">
            ⚠️ Sin perfil — el launcher no podrá usar el mod loader
          </div>
        )}

        {/* Upload */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            id="mod-loader-profile-input"
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)}
          />
          <div
            className="border-2 border-dashed border-[rgba(var(--nexus-blue-rgb),0.3)] rounded-lg p-4 text-center cursor-pointer hover:border-[rgba(var(--nexus-blue-rgb),0.6)] transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {profileFile ? (
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--nexus-text)]">
                <FileJson size={16} className="text-[var(--nexus-blue)]" />
                {profileFile.name}
              </div>
            ) : (
              <div className="text-xs text-[var(--nexus-muted)]">
                <Upload size={16} className="mx-auto mb-1 opacity-50" />
                Haz clic para seleccionar el JSON del perfil
              </div>
            )}
          </div>

          {profileFile && (
            <button
              onClick={uploadProfile}
              disabled={uploading}
              className="btn-neon w-full flex items-center justify-center gap-2 py-2"
            >
              {uploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "Subiendo..." : "Subir Perfil"}
            </button>
          )}

          {uploadStatus !== "idle" && (
            <p className={`text-xs text-center ${uploadStatus === "success" ? "text-green-400" : "text-red-400"}`}>
              {uploadMsg}
            </p>
          )}
        </div>

        {/* Instrucciones */}
        <details className="text-xs text-[var(--nexus-muted)]">
          <summary className="cursor-pointer hover:text-[var(--nexus-text)] transition-colors">¿Dónde encuentro el JSON del perfil?</summary>
          <div className="mt-2 space-y-1 pl-2 border-l border-[rgba(255,255,255,0.1)]">
            <p><strong className="text-[var(--nexus-text)]">NeoForge:</strong> Ejecuta el instalador → instala el client → ve a <code className="bg-[var(--nexus-surface)] px-1 rounded">%APPDATA%\.minecraft\versions\neoforge-X.X.X\</code> y sube el <code className="bg-[var(--nexus-surface)] px-1 rounded">.json</code> de esa carpeta.</p>
            <p><strong className="text-[var(--nexus-text)]">Fabric:</strong> Se genera automáticamente, pero también puedes subir uno personalizado aquí.</p>
          </div>
        </details>
      </div>

      {/* ── Mod Loader Installer JAR ── */}
      <div className="glass-card p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-1">
            <FileJson size={16} className="text-[var(--nexus-blue)]" />
            Instalador del Mod Loader (JAR)
          </h2>
          <p className="text-xs text-[var(--nexus-muted)]">
            Sube el archivo JAR del instalador (por ejemplo, <code className="bg-[var(--nexus-surface)] px-1 rounded">neoforge-21.1.233-installer.jar</code>).
            El launcher lo descargará y ejecutará automáticamente para instalar todo.
          </p>
        </div>

        {/* Estado actual */}
        {config.mod_loader_installer_url ? (
          <div className="flex items-center justify-between bg-[var(--nexus-surface)] rounded-lg px-3 py-2 border border-[rgba(var(--nexus-blue-rgb),0.3)]">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle size={14} className="text-green-400 shrink-0" />
              <span className="text-xs text-[var(--nexus-muted)] truncate">Instalador cargado</span>
            </div>
            <button
              onClick={deleteInstaller}
              className="text-red-400 hover:text-red-300 transition-colors ml-2 shrink-0"
              title="Eliminar instalador"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <div className="text-xs text-[var(--nexus-muted)] bg-[rgba(255,200,0,0.05)] border border-[rgba(255,200,0,0.2)] rounded-lg px-3 py-2">
            ⚠️ Sin instalador subido — el launcher intentará descargarlo de internet si es necesario
          </div>
        )}

        {/* Upload */}
        <div className="space-y-2">
          <input
            ref={installerInputRef}
            id="mod-loader-installer-input"
            type="file"
            accept=".jar"
            className="hidden"
            onChange={(e) => setInstallerFile(e.target.files?.[0] ?? null)}
          />
          <div
            className="border-2 border-dashed border-[rgba(var(--nexus-blue-rgb),0.3)] rounded-lg p-4 text-center cursor-pointer hover:border-[rgba(var(--nexus-blue-rgb),0.6)] transition-colors"
            onClick={() => installerInputRef.current?.click()}
          >
            {installerFile ? (
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--nexus-text)]">
                <FileJson size={16} className="text-[var(--nexus-blue)]" />
                {installerFile.name}
              </div>
            ) : (
              <div className="text-xs text-[var(--nexus-muted)]">
                <Upload size={16} className="mx-auto mb-1 opacity-50" />
                Haz clic para seleccionar el JAR del instalador
              </div>
            )}
          </div>

          {installerFile && (
            <button
              onClick={uploadInstaller}
              disabled={uploadingInstaller}
              className="btn-neon w-full flex items-center justify-center gap-2 py-2"
            >
              {uploadingInstaller ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploadingInstaller ? "Subiendo..." : "Subir Instalador"}
            </button>
          )}

          {uploadInstallerStatus !== "idle" && (
            <p className={`text-xs text-center ${uploadInstallerStatus === "success" ? "text-green-400" : "text-red-400"}`}>
              {uploadInstallerMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
