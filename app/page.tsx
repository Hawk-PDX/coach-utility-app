'use client';

import { useEffect, useState } from 'react';
import { supabase, type Player } from '@/lib/supabase';

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  useEffect(() => {
    loadPlayers();
    
    // Poll for updates every 5 seconds (free tier alternative to realtime)
    const pollInterval = setInterval(() => {
      loadPlayers();
    }, 5000);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const loadPlayers = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error loading players:', error);
    } else {
      setPlayers(data || []);
    }
    setLoading(false);
  };

  const trackPlayTime = async (playerId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if entry exists for today
    const { data: existing } = await supabase
      .from('play_time')
      .select('*')
      .eq('player_id', playerId)
      .eq('game_date', today)
      .single();

    if (existing) {
      // Increment shifts
      await supabase
        .from('play_time')
        .update({ shifts: existing.shifts + 1 })
        .eq('id', existing.id);
    } else {
      // Create new entry
      await supabase
        .from('play_time')
        .insert({ player_id: playerId, game_date: today, shifts: 1 });
    }
    
    alert('Play time tracked!');
  };

  const quickStat = async (playerId: string, statType: 'points' | 'assists' | 'rebounds') => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existing } = await supabase
      .from('game_stats')
      .select('*')
      .eq('player_id', playerId)
      .eq('game_date', today)
      .single();

    const increment = { [statType]: (existing?.[statType] || 0) + 1 };

    if (existing) {
      await supabase
        .from('game_stats')
        .update(increment)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('game_stats')
        .insert({ player_id: playerId, game_date: today, ...increment });
    }
    
    alert(`${statType} tracked!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Coach Utility</h1>
        
        {players.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Get Started</h2>
            <p className="mb-4">Add players to your roster to start tracking.</p>
            <a 
              href="/players" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg inline-block hover:bg-blue-700"
            >
              Add Players
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {players.map((player) => (
              <div key={player.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-xl font-semibold">{player.name}</h3>
                    <p className="text-gray-600">
                      #{player.jersey_number} {player.position && `• ${player.position}`}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    onClick={() => trackPlayTime(player.id)}
                    className="bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 active:scale-95 transition"
                  >
                    + Shift
                  </button>
                  <button
                    onClick={() => quickStat(player.id, 'points')}
                    className="bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 active:scale-95 transition"
                  >
                    + Point
                  </button>
                  <button
                    onClick={() => quickStat(player.id, 'assists')}
                    className="bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 active:scale-95 transition"
                  >
                    + Assist
                  </button>
                  <button
                    onClick={() => quickStat(player.id, 'rebounds')}
                    className="bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 active:scale-95 transition"
                  >
                    + Rebound
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <nav className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/players" className="bg-gray-800 text-white p-4 rounded-lg text-center hover:bg-gray-700 font-medium">
            <span className="text-2xl mb-2 block">👥</span>
            Players
          </a>
          <a href="/reports" className="bg-gray-800 text-white p-4 rounded-lg text-center hover:bg-gray-700 font-medium">
            <span className="text-2xl mb-2 block">📊</span>
            Reports
          </a>
          <a href="/medals" className="bg-gray-800 text-white p-4 rounded-lg text-center hover:bg-gray-700 font-medium">
            <span className="text-2xl mb-2 block">🏅</span>
            Medals
          </a>
          <a href="/games" className="bg-gray-800 text-white p-4 rounded-lg text-center hover:bg-gray-700 font-medium">
            <span className="text-2xl mb-2 block">🏀</span>
            Games
          </a>
        </nav>
      </div>
    </main>
  );
}
