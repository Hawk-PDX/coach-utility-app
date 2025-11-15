# Database Migration Guide

## Overview
This migration adds team management functionality to your Coach Utility App. You'll need to update your Supabase database to add the new `teams` table and update the `players` table.

## Steps to Update Your Database

### Option 1: Fresh Start (Recommended if no important data)

If you don't have important data in your database yet, the easiest approach is:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Run the SQL to create all tables fresh

### Option 2: Migration (If you have existing data)

If you already have players and data you want to keep:

1. **Create the teams table first:**
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  season_start DATE NOT NULL,
  season_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_players_team ON players(team_id);

CREATE TRIGGER update_teams_updated_at BEFORE
UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

2. **Create your first team:**
```sql
INSERT INTO teams (name, sport, season_start, season_end)
VALUES ('Your Team Name', 'Basketball', '2024-01-01', '2024-12-31')
RETURNING id;
```

Note the `id` returned - you'll need it for the next step.

3. **Add team_id column to players table:**
```sql
ALTER TABLE players 
ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
```

4. **Update existing players to belong to your team:**
```sql
UPDATE players 
SET team_id = 'YOUR_TEAM_ID_FROM_STEP_2'
WHERE team_id IS NULL;
```

5. **Make team_id required (optional but recommended):**
```sql
ALTER TABLE players 
ALTER COLUMN team_id SET NOT NULL;
```

## Verification

After migration, verify everything works:

1. Go to your app's home page - you should see your team(s)
2. Click on "Coach" for a team - you should see the coach dashboard
3. Check that all your existing players are showing up
4. Try adding a new player to make sure it works

## What Changed

- **New `teams` table**: Stores team information including name, sport, and season dates
- **New `games` table**: Stores individual game sessions with opponent and location
- **Updated `players` table**: Now includes a `team_id` column to associate players with teams
- **Updated `play_time` and `game_stats` tables**: Now include `game_id` to link stats to specific games
- **Landing page**: Now shows all teams with the ability to add new ones
- **Coach page**: Live stat tracking with game sessions and quick edit buttons
- **Coach/Parents pages**: Now filter by selected team
- **Players page**: Now adds players to the selected team

## Rollback

If you need to rollback (before Option 2, step 5):

```sql
ALTER TABLE players DROP COLUMN team_id;
DROP TABLE teams;
```

Note: This will delete all team data but preserve your players.
