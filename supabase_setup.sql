-- ═══════════════════════════════════════════════════
--  DrishtiAI — Supabase Database Setup
--  Run this in Supabase SQL Editor (one click)
-- ═══════════════════════════════════════════════════

-- 1. MEDICINES TABLE
CREATE TABLE IF NOT EXISTS medicines (
  id              BIGSERIAL PRIMARY KEY,
  brand_name      TEXT,
  generic_name    TEXT,
  composition     TEXT,
  uses            TEXT,
  uses_hindi      TEXT,
  side_effects    TEXT,
  side_effects_hindi TEXT,
  warnings        TEXT,
  warnings_hindi  TEXT,
  dosage          TEXT,
  dosage_hindi    TEXT,
  manufacturer    TEXT,
  price_inr       DECIMAL,
  drug_type       TEXT,
  prescription_required BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search index (brand + generic + composition)
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS
  search_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(brand_name,'') || ' ' ||
      COALESCE(generic_name,'') || ' ' ||
      COALESCE(composition,'')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS medicines_search_idx  ON medicines USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS medicines_brand_idx   ON medicines(LOWER(brand_name));
CREATE INDEX IF NOT EXISTS medicines_generic_idx ON medicines(LOWER(generic_name));

-- 2. DOCUMENT GUIDES TABLE
CREATE TABLE IF NOT EXISTS document_guides (
  id          BIGSERIAL PRIMARY KEY,
  doc_type    TEXT,
  title       TEXT,
  title_hindi TEXT,
  description TEXT,
  description_hindi TEXT,
  key_fields  JSONB,
  action_required TEXT,
  action_hindi    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SCAN HISTORY TABLE
CREATE TABLE IF NOT EXISTS scan_history (
  id            BIGSERIAL PRIMARY KEY,
  scan_type     TEXT,
  ocr_text      TEXT,
  ai_response   TEXT,
  medicine_id   BIGINT REFERENCES medicines(id),
  language      TEXT DEFAULT 'hi',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. GAME SCORES TABLE
CREATE TABLE IF NOT EXISTS game_scores (
  id               BIGSERIAL PRIMARY KEY,
  game_type        TEXT,
  score            INTEGER,
  moves            INTEGER,
  duration_seconds INTEGER,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REMINDERS TABLE
CREATE TABLE IF NOT EXISTS reminders (
  id            BIGSERIAL PRIMARY KEY,
  title         TEXT,
  time_of_day   TEXT,
  medicine_name TEXT,
  dosage        TEXT,
  is_done       BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MOOD LOGS TABLE
CREATE TABLE IF NOT EXISTS mood_logs (
  id         BIGSERIAL PRIMARY KEY,
  mood       TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
--  ROW LEVEL SECURITY — open for demo (anon access)
-- ═══════════════════════════════════════════════════
ALTER TABLE medicines        ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_guides  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read medicines"      ON medicines        FOR SELECT USING (true);
CREATE POLICY "Public read doc_guides"     ON document_guides  FOR SELECT USING (true);
CREATE POLICY "Public insert scan_history" ON scan_history     FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select scan_history" ON scan_history     FOR SELECT USING (true);
CREATE POLICY "Public all game_scores"     ON game_scores      FOR ALL    USING (true) WITH CHECK (true);
CREATE POLICY "Public all reminders"       ON reminders        FOR ALL    USING (true) WITH CHECK (true);
CREATE POLICY "Public all mood_logs"       ON mood_logs        FOR ALL    USING (true) WITH CHECK (true);
