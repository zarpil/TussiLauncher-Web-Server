-- ──────────────────────────────────────────────────────────
--  SHADERS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shaders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  filename    TEXT NOT NULL UNIQUE,
  md5         TEXT NOT NULL,
  sha256      TEXT NOT NULL,
  size_bytes  BIGINT NOT NULL,
  r2_url      TEXT NOT NULL,
  is_enabled  BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar disparador para autocompletar updated_at
DROP TRIGGER IF EXISTS shaders_updated_at ON shaders;
CREATE TRIGGER shaders_updated_at
  BEFORE UPDATE ON shaders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
