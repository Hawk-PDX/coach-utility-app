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

interface PlayTime {
  id: string;
  player_id: string;
  game_date: string;
  shifts: number;
}

interface PlayerStats {
  player: Player;
  totalPoints: number;
  totalAssists: number;
  totalRebounds: number;
  totalShifts: number;
  gamesPlayed: number;
}

export default function ReportsPage() {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .order('name');

    const { data: gameStats } = await supabase
      .from('game_stats')
      .select('*');

    const { data: playTime } = await supabase
      .from('play_time')
      .select('*');

    const stats: PlayerStats[] = (players || []).map((player) => {
      const playerGameStats = (gameStats || []).filter((s: GameStat) => s.player_id === player.id);
      const playerPlayTime = (playTime || []).filter((p: PlayTime) => p.player_id === player.id);

      return {
        player,
        totalPoints: playerGameStats.reduce((sum: number, s: GameStat) => sum + (s.points || 0), 0),
        totalAssists: playerGameStats.reduce((sum: number, s: GameStat) => sum + (s.assists || 0), 0),
        totalRebounds: playerGameStats.reduce((sum: number, s: GameStat) => sum + (s.rebounds || 0), 0),
        totalShifts: playerPlayTime.reduce((sum: number, p: PlayTime) => sum + (p.shifts || 0), 0),
        gamesPlayed: new Set(playerGameStats.map((s: GameStat) => s.game_date)).size,
      };
    });

    setPlayerStats(stats);
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
        <h1 className="text-3xl font-bold mb-6">Player Reports</h1>

        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold">Player</th>
                  <th className="text-left p-4 font-semibold">Position</th>
                  <th className="text-center p-4 font-semibold">Games</th>
                  <th className="text-center p-4 font-semibold">Points</th>
                  <th className="text-center p-4 font-semibold">Assists</th>
                  <th className="text-center p-4 font-semibold">Rebounds</th>
                  <th className="text-center p-4 font-semibold">Shifts</th>
                </tr>
              </thead>
              <tbody>
                {playerStats.map((stat) => (
                  <tr key={stat.player.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium">{stat.player.name}</div>
                      {stat.player.jersey_number && (
                        <div className="text-sm text-gray-600">#{stat.player.jersey_number}</div>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">{stat.player.position || '-'}</td>
                    <td className="p-4 text-center">{stat.gamesPlayed}</td>
                    <td className="p-4 text-center font-medium">{stat.totalPoints}</td>
                    <td className="p-4 text-center font-medium">{stat.totalAssists}</td>
                    <td className="p-4 text-center font-medium">{stat.totalRebounds}</td>
                    <td className="p-4 text-center font-medium">{stat.totalShifts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {playerStats.length === 0 && (
          <p className="text-center text-gray-500 py-8">No player data yet. Start tracking stats from the home page!</p>
        )}

        <div className="mt-8">
          <a href="/" className="text-blue-600 hover:underline">← Back to Home</a>
        </div>
      </div>
    </main>
  );
}
