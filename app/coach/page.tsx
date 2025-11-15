'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, type Player, type Team, type Game } from '@/lib/supabase';

interface PlayerStats {
  shifts: number;
  points: number;
  assists: number;
  rebounds: number;
}

function CoachContent() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get('team');
  
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>({});
  const [showGameForm, setShowGameForm] = useState(false);
  const [gameFormData, setGameFormData] = useState({
    opponent: '',
    location: ''
  });

  useEffect(() => {
    if (teamId) {
      loadTeamAndPlayers();
      loadOrCreateTodaysGame();
    }
  }, [teamId]);

  useEffect(() => {
    if (currentGame) {
      loadGameStats();
      
      const pollInterval = setInterval(() => {
        loadGameStats();
      }, 3000);
      
      return () => clearInterval(pollInterval);
    }
  }, [currentGame]);

  const loadTeamAndPlayers = async () => {
    if (!teamId) return;
    
    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();
    
    if (teamData) {
      setTeam(teamData);
    }
    
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .order('name');
    
    if (error) {
      console.error('Error loading players:', error);
    } else {
      setPlayers(data || []);
    }
    setLoading(false);
  };

  const loadOrCreateTodaysGame = async () => {
    if (!teamId) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingGame } = await supabase
      .from('games')
      .select('*')
      .eq('team_id', teamId)
      .eq('game_date', today)
      .single();
    
    if (existingGame) {
      setCurrentGame(existingGame);
    }
  };

  const createNewGame = async () => {
    if (!teamId) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('games')
      .insert({
        team_id: teamId,
        game_date: today,
        opponent: gameFormData.opponent || null,
        location: gameFormData.location || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating game:', error);
    } else {
      setCurrentGame(data);
      setShowGameForm(false);
      setGameFormData({ opponent: '', location: '' });
    }
  };

  const loadGameStats = async () => {
    if (!currentGame) return;
    
    const { data: statsData } = await supabase
      .from('game_stats')
      .select('*')
      .eq('game_id', currentGame.id);
    
    const { data: playTimeData } = await supabase
      .from('play_time')
      .select('*')
      .eq('game_id', currentGame.id);
    
    const stats: Record<string, PlayerStats> = {};
    
    players.forEach(player => {
      const playerGameStats = statsData?.find(s => s.player_id === player.id);
      const playerPlayTime = playTimeData?.find(p => p.player_id === player.id);
      
      stats[player.id] = {
        shifts: playerPlayTime?.shifts || 0,
        points: playerGameStats?.points || 0,
        assists: playerGameStats?.assists || 0,
        rebounds: playerGameStats?.rebounds || 0
      };
    });
    
    setPlayerStats(stats);
  };

  const trackPlayTime = async (playerId: string) => {
    if (!currentGame) return;
    
    const { data: existing } = await supabase
      .from('play_time')
      .select('*')
      .eq('player_id', playerId)
      .eq('game_id', currentGame.id)
      .single();

    if (existing) {
      await supabase
        .from('play_time')
        .update({ shifts: existing.shifts + 1 })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('play_time')
        .insert({ 
          player_id: playerId, 
          game_id: currentGame.id,
          game_date: currentGame.game_date, 
          shifts: 1 
        });
    }
    
    loadGameStats();
  };

  const quickStat = async (playerId: string, statType: 'points' | 'assists' | 'rebounds') => {
    if (!currentGame) return;
    
    const { data: existing } = await supabase
      .from('game_stats')
      .select('*')
      .eq('player_id', playerId)
      .eq('game_id', currentGame.id)
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
        .insert({ 
          player_id: playerId, 
          game_id: currentGame.id,
          game_date: currentGame.game_date, 
          ...increment 
        });
    }
    
    loadGameStats();
  };

  const adjustStat = async (playerId: string, statType: 'shifts' | 'points' | 'assists' | 'rebounds', delta: number) => {
    if (!currentGame) return;
    
    const table = statType === 'shifts' ? 'play_time' : 'game_stats';
    const column = statType === 'shifts' ? 'shifts' : statType;
    
    const { data: existing } = await supabase
      .from(table)
      .select('*')
      .eq('player_id', playerId)
      .eq('game_id', currentGame.id)
      .single();

    if (existing) {
      const newValue = Math.max(0, (existing[column] || 0) + delta);
      await supabase
        .from(table)
        .update({ [column]: newValue })
        .eq('id', existing.id);
      
      loadGameStats();
    }
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
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-2 inline-block">
            ← Back to Teams
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{team?.name || 'Coach Utility'}</h1>
              {team && <p className="text-gray-600">{team.sport} • Coach View</p>}
            </div>
            {!currentGame && (
              <button
                onClick={() => setShowGameForm(!showGameForm)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
              >
                Start Game
              </button>
            )}
          </div>
        </div>
        
        {showGameForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">New Game</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Opponent (optional)"
                value={gameFormData.opponent}
                onChange={(e) => setGameFormData({ ...gameFormData, opponent: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Location (optional)"
                value={gameFormData.location}
                onChange={(e) => setGameFormData({ ...gameFormData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <div className="flex gap-2">
                <button
                  onClick={createNewGame}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700"
                >
                  Start Tracking
                </button>
                <button
                  onClick={() => setShowGameForm(false)}
                  className="px-6 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {currentGame && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Live Game</h3>
                <p className="text-sm text-gray-600">
                  {currentGame.opponent && `vs ${currentGame.opponent}`}
                  {currentGame.opponent && currentGame.location && ' • '}
                  {currentGame.location}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {new Date(currentGame.game_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {!currentGame && !showGameForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-lg mb-4">Start a game to begin tracking stats</p>
          </div>
        )}
        
        {players.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Get Started</h2>
            <p className="mb-4">Add players to your roster to start tracking.</p>
            <a 
              href={`/players?team=${teamId}`}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg inline-block hover:bg-blue-700"
            >
              Add Players
            </a>
          </div>
        ) : currentGame && (
          <div className="space-y-3">
            {players.map((player) => {
              const stats = playerStats[player.id] || { shifts: 0, points: 0, assists: 0, rebounds: 0 };
              return (
                <div key={player.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold">{player.name}</h3>
                      <p className="text-sm text-gray-600">
                        #{player.jersey_number} {player.position && `• ${player.position}`}
                      </p>
                    </div>
                    <div className="flex gap-3 text-center">
                      <div className="min-w-[60px]">
                        <div className="text-2xl font-bold text-green-600">{stats.shifts}</div>
                        <div className="text-xs text-gray-500">Shifts</div>
                      </div>
                      <div className="min-w-[60px]">
                        <div className="text-2xl font-bold text-blue-600">{stats.points}</div>
                        <div className="text-xs text-gray-500">Points</div>
                      </div>
                      <div className="min-w-[60px]">
                        <div className="text-2xl font-bold text-purple-600">{stats.assists}</div>
                        <div className="text-xs text-gray-500">Assists</div>
                      </div>
                      <div className="min-w-[60px]">
                        <div className="text-2xl font-bold text-orange-600">{stats.rebounds}</div>
                        <div className="text-xs text-gray-500">Reb</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <button
                        onClick={() => trackPlayTime(player.id)}
                        className="w-full bg-green-600 text-white py-2 px-2 rounded-lg text-sm font-medium hover:bg-green-700 active:scale-95 transition"
                      >
                        +
                      </button>
                      {stats.shifts > 0 && (
                        <button
                          onClick={() => adjustStat(player.id, 'shifts', -1)}
                          className="w-full bg-green-100 text-green-700 py-1 px-2 rounded text-sm hover:bg-green-200"
                        >
                          −
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={() => quickStat(player.id, 'points')}
                        className="w-full bg-blue-600 text-white py-2 px-2 rounded-lg text-sm font-medium hover:bg-blue-700 active:scale-95 transition"
                      >
                        +
                      </button>
                      {stats.points > 0 && (
                        <button
                          onClick={() => adjustStat(player.id, 'points', -1)}
                          className="w-full bg-blue-100 text-blue-700 py-1 px-2 rounded text-sm hover:bg-blue-200"
                        >
                          −
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={() => quickStat(player.id, 'assists')}
                        className="w-full bg-purple-600 text-white py-2 px-2 rounded-lg text-sm font-medium hover:bg-purple-700 active:scale-95 transition"
                      >
                        +
                      </button>
                      {stats.assists > 0 && (
                        <button
                          onClick={() => adjustStat(player.id, 'assists', -1)}
                          className="w-full bg-purple-100 text-purple-700 py-1 px-2 rounded text-sm hover:bg-purple-200"
                        >
                          −
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={() => quickStat(player.id, 'rebounds')}
                        className="w-full bg-orange-600 text-white py-2 px-2 rounded-lg text-sm font-medium hover:bg-orange-700 active:scale-95 transition"
                      >
                        +
                      </button>
                      {stats.rebounds > 0 && (
                        <button
                          onClick={() => adjustStat(player.id, 'rebounds', -1)}
                          className="w-full bg-orange-100 text-orange-700 py-1 px-2 rounded text-sm hover:bg-orange-200"
                        >
                          −
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <nav className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href={`/players?team=${teamId}`} className="bg-gray-800 text-white p-4 rounded-lg text-center hover:bg-gray-700 font-medium">
            <span className="text-2xl mb-2 block">👥</span>
            Players
          </a>
          <a href={`/reports?team=${teamId}`} className="bg-gray-800 text-white p-4 rounded-lg text-center hover:bg-gray-700 font-medium">
            <span className="text-2xl mb-2 block">📊</span>
            Reports
          </a>
          <a href={`/medals?team=${teamId}`} className="bg-gray-800 text-white p-4 rounded-lg text-center hover:bg-gray-700 font-medium">
            <span className="text-2xl mb-2 block">🏅</span>
            Medals
          </a>
          <a href={`/games?team=${teamId}`} className="bg-gray-800 text-white p-4 rounded-lg text-center hover:bg-gray-700 font-medium">
            <span className="text-2xl mb-2 block">🏀</span>
            Games
          </a>
        </nav>
      </div>
    </main>
  );
}

export default function CoachPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    }>
      <CoachContent />
    </Suspense>
  );
}
