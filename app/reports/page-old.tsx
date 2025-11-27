'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, type Player, type Team } from '@/lib/supabase';

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

function ReportsContent() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get('team');
  
  const [team, setTeam] = useState<Team | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    if (!teamId) return;
    
    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();
    
    if (teamData) {
      setTeam(teamData);
    }
    
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
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

  useEffect(() => {
    if (teamId) {
      loadReports();
    }
  }, [teamId]);

  if (!teamId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl mb-4">No team selected</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300 font-medium">
            ← Back to Teams
          </Link>
        </div>
      </div>
    );
  }

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
        <div className="mb-2">
          <Link href={`/coach?team=${teamId}`} className="text-blue-400 hover:text-blue-300 font-medium text-sm inline-block">
            ← Back to Coach
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-white">Player Reports</h1>
        {team && <p className="text-gray-400 mb-6">{team.name}</p>}

        <div className="bg-gray-800 border border-gray-600 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700 border-b border-gray-600">
                <tr>
                  <th className="text-left p-4 font-semibold text-white">Player</th>
                  <th className="text-left p-4 font-semibold text-white">Position</th>
                  <th className="text-center p-4 font-semibold text-white">Games</th>
                  <th className="text-center p-4 font-semibold text-white">Points</th>
                  <th className="text-center p-4 font-semibold text-white">Assists</th>
                  <th className="text-center p-4 font-semibold text-white">Rebounds</th>
                  <th className="text-center p-4 font-semibold text-white">Shifts</th>
                </tr>
              </thead>
              <tbody>
                {playerStats.map((stat) => (
                  <tr key={stat.player.id} className="border-b border-gray-600 hover:bg-gray-700">
                    <td className="p-4">
                      <div className="font-medium text-white">{stat.player.name}</div>
                      {stat.player.jersey_number && (
                        <div className="text-sm text-gray-400">#{stat.player.jersey_number}</div>
                      )}
                    </td>
                    <td className="p-4 text-gray-400">{stat.player.position || '-'}</td>
                    <td className="p-4 text-center text-white">{stat.gamesPlayed}</td>
                    <td className="p-4 text-center font-medium text-white">{stat.totalPoints}</td>
                    <td className="p-4 text-center font-medium text-white">{stat.totalAssists}</td>
                    <td className="p-4 text-center font-medium text-white">{stat.totalRebounds}</td>
                    <td className="p-4 text-center font-medium text-white">{stat.totalShifts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {playerStats.length === 0 && (
          <p className="text-center text-gray-400 py-8">No player data yet. Start tracking stats from the coach page!</p>
        )}
      </div>
    </main>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}
