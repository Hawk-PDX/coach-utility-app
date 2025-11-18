-- Game Results table (extends games table)
ALTER TABLE games ADD COLUMN our_score INTEGER;
ALTER TABLE games ADD COLUMN opponent_score INTEGER;
ALTER TABLE games ADD COLUMN is_completed BOOLEAN DEFAULT false;
ALTER TABLE games ADD COLUMN value_of_week TEXT;

-- Snack Signups table
CREATE TABLE snack_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  parent_name TEXT NOT NULL,
  parent_email TEXT,
  items_bringing TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team News table
CREATE TABLE team_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  posted_by TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player Recognition table (for coach to highlight players)
CREATE TABLE player_recognition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  recognition_type TEXT NOT NULL, -- 'Player of the Week', 'Most Improved', etc.
  description TEXT,
  recognition_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_snack_signups_game ON snack_signups(game_id);
CREATE INDEX idx_team_news_team ON team_news(team_id);
CREATE INDEX idx_team_news_date ON team_news(created_at DESC);
CREATE INDEX idx_player_recognition_player ON player_recognition(player_id);
CREATE INDEX idx_player_recognition_team ON player_recognition(team_id);

-- Triggers
CREATE TRIGGER update_team_news_updated_at 
BEFORE UPDATE ON team_news 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Permissions
GRANT ALL ON snack_signups TO anon, authenticated;
GRANT ALL ON team_news TO anon, authenticated;
GRANT ALL ON player_recognition TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
