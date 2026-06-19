-- ============================================================
--  Nexus Ecosystem — Supabase Database Schema
--  Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ──────────────────────────────────────────────────────────
--  MODS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mods (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  filename    TEXT NOT NULL UNIQUE,
  version     TEXT,
  description TEXT,
  md5         TEXT NOT NULL,
  sha256      TEXT NOT NULL,
  size_bytes  BIGINT NOT NULL,
  r2_url      TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_enabled  BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mods_updated_at ON mods;
CREATE TRIGGER mods_updated_at
  BEFORE UPDATE ON mods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────────────────────────
--  NEWS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  content      TEXT NOT NULL DEFAULT '',
  cover_url    TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS news_updated_at ON news;
CREATE TRIGGER news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-set published_at when published
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_published = true AND OLD.is_published = false THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS news_published_at ON news;
CREATE TRIGGER news_published_at
  BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION set_published_at();

-- ──────────────────────────────────────────────────────────
--  SERVER CONFIG
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS server_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default configuration values (Fabric 1.20.4)
INSERT INTO server_config (key, value) VALUES
  ('minecraft_version',  '1.20.4'),
  ('mod_loader',         'fabric'),
  ('mod_loader_version', '0.15.7'),
  ('java_args',          '-Xmx4G -Xms1G -XX:+UseG1GC')
ON CONFLICT (key) DO NOTHING;

-- ──────────────────────────────────────────────────────────
--  STORAGE BUCKET (run after creating the bucket in dashboard)
--  Policy: public read, authenticated write
-- ──────────────────────────────────────────────────────────
-- CREATE POLICY "Public read" ON storage.objects
--   FOR SELECT USING (bucket_id = 'nexus-mods');

-- CREATE POLICY "Admin upload" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'nexus-mods' AND auth.role() = 'authenticated');

-- CREATE POLICY "Admin delete" ON storage.objects
--   FOR DELETE USING (bucket_id = 'nexus-mods' AND auth.role() = 'authenticated');
