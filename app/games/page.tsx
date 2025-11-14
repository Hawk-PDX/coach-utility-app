'use client';

import { useEffect, useState } from 'react';
import { supabase, type Player } from '@/lib/supabase';

interface GameStat {
  id: string;
  player_id: string;
  game_date: string;
  points: number;
  assists: number;
  rebounds: number;
}

interface GameData {
  date: string;
  players: {
    player: Player;
    stats: GameStat;
  }[];
}

export default function GamesPage() {
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    const { data: players } = await supabase
      .from('players')
      .select('*');

    const { data: gameStats } = await supabase
      .from('game_stats')
      .select('*')
      .order('game_date', { ascending: false });

    // Group stats by game date
    const gamesByDate = new Map<string, GameData>();

    (gameStats || []).forEach((stat: GameStat) => {
      const player = (players || []).find((p: Player) => p.id === stat.player_id);
      if (!player) return;

      if (!gamesByDate.has(stat.game_date)) {
        gamesByDate.set(stat.game_date, {
          date: stat.game_date,
          players: [],
        });
      }

      gamesByDate.get(stat.game_date)?.players.push({
        player,
        stats: stat,
      });
    });

    setGames(Array.from(gamesByDate.values()));
    setLoading(false);
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Game History</h1>

        <div className="space-y-6">
          {games.map((game) => (
            <div key={game.date} className="bg-white border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">
                {new Date(game.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-semibold">Player</th>
                      <th className="text-center p-3 font-semibold">Points</th>
                      <th className="text-center p-3 font-semibold">Assists</th>
                      <th className="text-center p-3 font-semibold">Rebounds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {game.players.map(({ player, stats }) => (
                      <tr key={player.id} className="border-t">
                        <td className="p-3">
                          {player.name}
                          {player.jersey_number && (
                            <span className="text-gray-600 ml-2">#{player.jersey_number}</span>
                          )}
                        </td>
                        <td className="p-3 text-center">{stats.points || 0}</td>
                        <td className="p-3 text-center">{stats.assists || 0}</td>
                        <td className="p-3 text-center">{stats.rebounds || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {games.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No games recorded yet. Start tracking stats from the home page!
          </p>
        )}

        <div className="mt-8">
          <a href="/" className="text-blue-600 hover:underline">← Back to Home</a>
        </div>
      </div>
    </main>
  );
}
