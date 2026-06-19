// ────────────────────────────────────────────────────────────────────────────
//  Nexus Ecosystem — Public Manifest Types
//  Shared between the Web Panel API and the Desktop Launcher
// ────────────────────────────────────────────────────────────────────────────

export interface ManifestMod {
  filename: string;
  url: string;
  md5: string;
  sha256: string;
  size_bytes: number;
  required: boolean;
}

export interface ManifestNewsItem {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  published_at: string;
  excerpt: string;
}

export interface ManifestGameConfig {
  minecraft_version: string;
  mod_loader: "fabric" | "forge" | "quilt" | "neoforge";
  mod_loader_version: string;
  java_args: string;
  /** URL pública del JSON del perfil del mod loader (subido por el admin) */
  mod_loader_profile_url?: string | null;
  /** URL pública del JAR instalador del mod loader (subido por el admin) */
  mod_loader_installer_url?: string | null;
}

export interface NexusManifest {
  version: string;
  generated_at: string;
  game: ManifestGameConfig;
  mods: ManifestMod[];
  news: ManifestNewsItem[];
}
