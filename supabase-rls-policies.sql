-- Disable Row Level Security for public access
-- Run this in your Supabase SQL Editor to fix permission errors

-- Disable RLS on all tables
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE play_time DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE medals DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want RLS enabled with public access policies, use this instead:
/*
-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE medals ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Public read access" ON teams FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON teams FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON teams FOR DELETE USING (true);

CREATE POLICY "Public read access" ON games FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON games FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON games FOR DELETE USING (true);

CREATE POLICY "Public read access" ON players FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON players FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON players FOR DELETE USING (true);

CREATE POLICY "Public read access" ON play_time FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON play_time FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON play_time FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON play_time FOR DELETE USING (true);

CREATE POLICY "Public read access" ON game_stats FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON game_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON game_stats FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON game_stats FOR DELETE USING (true);

CREATE POLICY "Public read access" ON medals FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON medals FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON medals FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON medals FOR DELETE USING (true);
*/
