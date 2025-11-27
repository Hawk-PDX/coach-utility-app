import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Team = {
  id: string;
  name: string;
  sport: string;
  season_start: string;
  season_end: string;
  created_at: string;
  updated_at: string;
};

export type Game = {
  id: string;
  team_id: string;
  game_date: string;
  opponent: string | null;
  location: string | null;
  notes: string | null;
  our_score: number | null;
  opponent_score: number | null;
  is_completed: boolean;
  value_of_week: string | null;
  created_at: string;
};

export type Player = {
  id: string;
  team_id: string;
  name: string;
  jersey_number: number | null;
  position: string | null;
  created_at: string;
  updated_at: string;
};

export type PlayTime = {
  id: string;
  player_id: string;
  game_id: string;
  game_date: string;
  minutes_played: number;
  shifts: number;
  notes: string | null;
  created_at: string;
};

export type GameStats = {
  id: string;
  player_id: string;
  game_id: string;
  game_date: string;
  points: number;
  assists: number;
  rebounds: number;
  created_at: string;
};

export type Medal = {
  id: string;
  player_id: string;
  week_number: number;
  medal_type: string;
  season_year: number;
  awarded_date: string;
  notes: string | null;
  created_at: string;
};

export type SnackSignup = {
  id: string;
  game_id: string;
  parent_name: string;
  parent_email: string | null;
  items_bringing: string | null;
  created_at: string;
};

export type TeamNews = {
  id: string;
  team_id: string;
  title: string;
  content: string;
  posted_by: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type PlayerRecognition = {
  id: string;
  player_id: string;
  team_id: string;
  recognition_type: string;
  description: string | null;
  recognition_date: string;
  created_at: string;
};
