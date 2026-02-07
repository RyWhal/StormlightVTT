-- Handouts and folder support

CREATE TABLE IF NOT EXISTS map_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE maps
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES map_folders(id) ON DELETE SET NULL;

ALTER TABLE npc_templates
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES token_folders(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS handouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  kind VARCHAR(20) NOT NULL,
  image_url TEXT,
  body TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_map_folders_session ON map_folders(session_id);
CREATE INDEX IF NOT EXISTS idx_token_folders_session ON token_folders(session_id);
CREATE INDEX IF NOT EXISTS idx_handouts_session ON handouts(session_id);

ALTER TABLE map_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE handouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on map folders" ON map_folders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on token folders" ON token_folders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on handouts" ON handouts FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE map_folders;
ALTER PUBLICATION supabase_realtime ADD TABLE token_folders;
ALTER PUBLICATION supabase_realtime ADD TABLE handouts;
