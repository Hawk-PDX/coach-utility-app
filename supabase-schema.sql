-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  jersey_number INTEGER,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE play_time (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  game_date DATE NOT NULL,
  minutes_played INTEGER DEFAULT 0,
  shifts INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  game_date DATE NOT NULL,
  points INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  rebounds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE medals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  medal_type TEXT NOT NULL,
  season_year INTEGER NOT NULL,
  awarded_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_play_time_player ON play_time(player_id);
CREATE INDEX idx_play_time_date ON play_time(game_date);
CREATE INDEX idx_game_stats_player ON game_stats(player_id);
CREATE INDEX idx_game_stats_date ON game_stats(game_date);
CREATE INDEX idx_medals_player ON medals(player_id);
CREATE INDEX idx_medals_week ON medals(season_year, week_number);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
