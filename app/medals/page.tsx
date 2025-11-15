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

interface Award {
  title: string;
  emoji: string;
  player: Player;
  value: number;
  description: string;
}

function MedalsContent() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get('team');
  
  const [team, setTeam] = useState<Team | null>(null);
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamId) {
      loadAwards();
    }
  }, [teamId]);

  const loadAwards = async () => {
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
      .eq('team_id', teamId);

    const { data: gameStats } = await supabase
      .from('game_stats')
      .select('*');

    if (!players || !gameStats || gameStats.length === 0) {
      setLoading(false);
      return;
    }

    const playerTotals = players.map((player) => {
      const stats = gameStats.filter((s: GameStat) => s.player_id === player.id);
      return {
        player,
        totalPoints: stats.reduce((sum: number, s: GameStat) => sum + (s.points || 0), 0),
        totalAssists: stats.reduce((sum: number, s: GameStat) => sum + (s.assists || 0), 0),
        totalRebounds: stats.reduce((sum: number, s: GameStat) => sum + (s.rebounds || 0), 0),
      };
    });

    const newAwards: Award[] = [];

    // Top Scorer
    const topScorer = playerTotals.reduce((max, p) => p.totalPoints > max.totalPoints ? p : max);
    if (topScorer.totalPoints > 0) {
      newAwards.push({
        title: 'Top Scorer',
        emoji: '🏆',
        player: topScorer.player,
        value: topScorer.totalPoints,
        description: 'Most total points',
      });
    }

    // Assist Leader
    const assistLeader = playerTotals.reduce((max, p) => p.totalAssists > max.totalAssists ? p : max);
    if (assistLeader.totalAssists > 0) {
      newAwards.push({
        title: 'Assist Leader',
        emoji: '🎯',
        player: assistLeader.player,
        value: assistLeader.totalAssists,
        description: 'Most total assists',
      });
    }

    // Rebound King/Queen
    const reboundLeader = playerTotals.reduce((max, p) => p.totalRebounds > max.totalRebounds ? p : max);
    if (reboundLeader.totalRebounds > 0) {
      newAwards.push({
        title: 'Rebound Leader',
        emoji: '💪',
        player: reboundLeader.player,
        value: reboundLeader.totalRebounds,
        description: 'Most total rebounds',
      });
    }

    setAwards(newAwards);
    setLoading(false);
  };

  if (!teamId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl mb-4">No team selected</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-2">
          <Link href={`/coach?team=${teamId}`} className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-block">
            ← Back to Coach
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2">Awards & Medals</h1>
        {team && <p className="text-gray-600 mb-6">{team.name}</p>}

        {awards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {awards.map((award, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-6 shadow-lg text-center"
              >
                <div className="text-6xl mb-4">{award.emoji}</div>
                <h2 className="text-xl font-bold mb-2">{award.title}</h2>
                <p className="text-gray-600 text-sm mb-4">{award.description}</p>
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <p className="font-semibold text-lg">{award.player.name}</p>
                  {award.player.jersey_number && (
                    <p className="text-sm text-gray-600">#{award.player.jersey_number}</p>
                  )}
                  <p className="text-2xl font-bold text-blue-600 mt-2">{award.value}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border rounded-lg p-8 text-center">
            <p className="text-xl text-gray-600 mb-2">No awards yet!</p>
            <p className="text-gray-500">Start tracking stats to see who earns the medals.</p>
          </div>
        )}

      </div>
    </main>
  );
}

export default function MedalsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    }>
      <MedalsContent />
    </Suspense>
  );
}
