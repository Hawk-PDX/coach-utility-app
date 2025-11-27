import { createClient } from '@supabase/supabase-js';
import { cache } from 'react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side Supabase client for RSC
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};

// React cache() dedupes these during render

export const getTeam = cache(async (teamId: string) => {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single();
  
  if (error) throw error;
  return data;
});

export const getPlayers = cache(async (teamId: string) => {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .order('jersey_number', { ascending: true });
  
  if (error) throw error;
  return data || [];
});

export const getGames = cache(async (teamId: string) => {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('team_id', teamId)
    .order('game_date', { ascending: true });
  
  if (error) throw error;
  return data || [];
});

export const getSnackSignups = cache(async (gameId: string) => {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('snack_signups')
    .select('*')
    .eq('game_id', gameId);
  
  if (error) throw error;
  return data || [];
});

export const getTeamNews = cache(async (teamId: string) => {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('team_news')
    .select('*')
    .eq('team_id', teamId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
});

export const getPlayerRecognitions = cache(async (teamId: string) => {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('player_recognition')
    .select('*, players(name)')
    .eq('team_id', teamId)
    .order('recognition_date', { ascending: false })
    .limit(10);
  
  if (error) throw error;
  return data || [];
});

export const getPlayerStats = cache(async (playerId: string) => {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('game_stats')
    .select('*')
    .eq('player_id', playerId);
  
  if (error) throw error;
  return data || [];
});

export const getAllTeams = cache(async () => {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
});
