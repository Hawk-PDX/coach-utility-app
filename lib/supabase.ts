import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Player = {
  id: string;
  name: string;
  jersey_number: number | null;
  position: string | null;
  created_at: string;
  updated_at: string;
};

export type PlayTime = {
  id: string;
  player_id: string;
  game_date: string;
  minutes_played: number;
  shifts: number;
  notes: string | null;
  created_at: string;
};

export type GameStats = {
  id: string;
  player_id: string;
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
