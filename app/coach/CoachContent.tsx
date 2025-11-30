'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type Player, type Team, type Game } from '@/lib/supabase';

interface PlayerStats {
  shifts: number;
  points: number;
  assists: number;
  rebounds: number;
}

interface CoachContentProps {
  team: Team;
  players: Player[];
  initialGame: Game | null;
  teamId: string;
}

// This component handles all the interactive stuff for the coach page
// Server fetches the initial data, then we handle real-time updates here
export function CoachContent({ team, players, initialGame, teamId }: CoachContentProps) {
  const router = useRouter();
  const [currentGame, setCurrentGame] = useState<Game | null>(initialGame);
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>({});
  const [showGameForm, setShowGameForm] = useState(false);
  const [gameFormData, setGameFormData] = useState({
    opponent: '',
    location: ''
  });

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
    
    if (!error && data) {
      setCurrentGame(data);
      setShowGameForm(false);
      setGameFormData({ opponent: '', location: '' });
    }
  };

  // Poll for stat updates every 3 seconds while a game is active
  // This keeps everyone's view in sync during live games
  useEffect(() => {
    if (!currentGame || players.length === 0) return;
    
    const loadStats = async () => {
      const { data: statsData } = await supabase
        .from('game_stats')
        .select('*')
        .eq('game_id', currentGame.id);
      
      const { data: playTimeData } = await supabase
        .from('play_time')
        .select('*')
        .eq('game_id', currentGame.id);
      
      const stats: Record<string, PlayerStats> = {};
      
      // Build up the stats object for each player
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
    
    loadStats();
    
    const pollInterval = setInterval(() => {
      loadStats();
    }, 3000);
    
    return () => clearInterval(pollInterval);
  }, [currentGame, players]);

  // Track when a player goes in for a shift
  const trackPlayTime = async (playerId: string) => {
    if (!currentGame) return;
    
    const { data: existing } = await supabase
      .from('play_time')
      .select('*')
      .eq('player_id', playerId)
      .eq('game_id', currentGame.id)
      .single();

    if (existing) {
      // Player already has shifts, just increment
      await supabase
        .from('play_time')
        .update({ shifts: existing.shifts + 1 })
        .eq('id', existing.id);
    } else {
      // First shift for this player
      await supabase
        .from('play_time')
        .insert({ 
          player_id: playerId, 
          game_id: currentGame.id,
          game_date: currentGame.game_date, 
          shifts: 1 
        });
    }
  };

  // Quick add for points, assists, rebounds
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
      // First stat for this player in this game
      await supabase
        .from('game_stats')
        .insert({ 
          player_id: playerId, 
          game_id: currentGame.id,
          game_date: currentGame.game_date, 
          ...increment 
        });
    }
  };

  // For the minus buttons - adjust a stat up or down
  const adjustStat = async (playerId: string, statType: 'shifts' | 'points' | 'assists' | 'rebounds', delta: number) => {
    if (!currentGame) return;
    
    // Shifts live in play_time table, everything else in game_stats
    const table = statType === 'shifts' ? 'play_time' : 'game_stats';
    const column = statType === 'shifts' ? 'shifts' : statType;
    
    const { data: existing } = await supabase
      .from(table)
      .select('*')
      .eq('player_id', playerId)
      .eq('game_id', currentGame.id)
      .single();

    if (existing) {
      // Don't let stats go below zero
      const newValue = Math.max(0, (existing[column] || 0) + delta);
      await supabase
        .from(table)
        .update({ [column]: newValue })
        .eq('id', existing.id);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <Link href="/" className="text-blue-400 hover:text-blue-300 font-medium text-sm inline-block">
              ← Back to Teams
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Logout
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{team?.name || 'Coach Utility'}</h1>
              {team && <p className="text-gray-400 text-sm md:text-base">{team.sport} • Coach View</p>}
            </div>
            {!currentGame && (
              <button
                type="button"
                onClick={() => setShowGameForm(!showGameForm)}
                className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 active:scale-95 transition"
              >
                Start Game
              </button>
            )}
          </div>
        </div>
        
        {showGameForm && (
          <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-white">New Game</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Opponent (optional)"
                value={gameFormData.opponent}
                onChange={(e) => setGameFormData({ ...gameFormData, opponent: e.target.value })}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-red-500"
              />
              <input
                type="text"
                placeholder="Location (optional)"
                value={gameFormData.location}
                onChange={(e) => setGameFormData({ ...gameFormData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={createNewGame}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 active:scale-95 transition"
                >
                  Start Tracking
                </button>
                <button
                  type="button"
                  onClick={() => setShowGameForm(false)}
                  className="px-6 bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-500 active:scale-95 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {currentGame && (
          <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-white">Live Game</h3>
                <p className="text-sm text-gray-400">
                  {currentGame.opponent && `vs ${currentGame.opponent}`}
                  {currentGame.opponent && currentGame.location && ' • '}
                  {currentGame.location}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">
                  {new Date(currentGame.game_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {!currentGame && !showGameForm && (
          <div className="bg-gray-800 border border-blue-600 rounded-lg p-6 text-center">
            <p className="text-lg mb-4 text-gray-300">Start a game to begin tracking stats</p>
          </div>
        )}
        
        {players.length === 0 ? (
          <div className="bg-gray-800 border border-yellow-600 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2 text-white">Get Started</h2>
            <p className="mb-4 text-gray-300">Add players to your roster to start tracking.</p>
            <a 
              href={`/players?team=${teamId}`}
              className="bg-red-600 text-white px-6 py-3 rounded-lg inline-block hover:bg-red-700"
            >
              Add Players
            </a>
          </div>
        ) : currentGame && (
          <div className="space-y-3">
            {players.map((player) => {
              const stats = playerStats[player.id] || { shifts: 0, points: 0, assists: 0, rebounds: 0 };
              return (
                <div key={player.id} className="bg-gray-800 border border-gray-600 rounded-lg p-3 md:p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-white">{player.name}</h3>
                      <p className="text-xs md:text-sm text-gray-400">
                        #{player.jersey_number} {player.position && `• ${player.position}`}
                      </p>
                    </div>
                    <div className="flex gap-2 sm:gap-3 text-center w-full sm:w-auto justify-between sm:justify-start">
                      <div className="min-w-[50px] sm:min-w-[60px]">
                        <div className="text-xl sm:text-2xl font-bold text-green-400">{stats.shifts}</div>
                        <div className="text-xs text-gray-400">Shifts</div>
                      </div>
                      <div className="min-w-[50px] sm:min-w-[60px]">
                        <div className="text-xl sm:text-2xl font-bold text-blue-400">{stats.points}</div>
                        <div className="text-xs text-gray-400">Points</div>
                      </div>
                      <div className="min-w-[50px] sm:min-w-[60px]">
                        <div className="text-xl sm:text-2xl font-bold text-purple-400">{stats.assists}</div>
                        <div className="text-xs text-gray-400">Assists</div>
                      </div>
                      <div className="min-w-[50px] sm:min-w-[60px]">
                        <div className="text-xl sm:text-2xl font-bold text-orange-400">{stats.rebounds}</div>
                        <div className="text-xs text-gray-400">Reb</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-1 sm:gap-2">
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => trackPlayTime(player.id)}
                        className="w-full bg-green-600 text-white py-2 px-1 sm:px-2 rounded-lg text-sm font-medium hover:bg-green-700 active:scale-95 transition"
                      >
                        +
                      </button>
                      {stats.shifts > 0 && (
                        <button
                          type="button"
                          onClick={() => adjustStat(player.id, 'shifts', -1)}
                          className="w-full bg-green-100 text-green-700 py-1 px-1 sm:px-2 rounded text-xs sm:text-sm hover:bg-green-200 active:scale-95 transition"
                        >
                          −
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => quickStat(player.id, 'points')}
                        className="w-full bg-blue-600 text-white py-2 px-1 sm:px-2 rounded-lg text-sm font-medium hover:bg-blue-700 active:scale-95 transition"
                      >
                        +
                      </button>
                      {stats.points > 0 && (
                        <button
                          type="button"
                          onClick={() => adjustStat(player.id, 'points', -1)}
                          className="w-full bg-blue-100 text-blue-700 py-1 px-1 sm:px-2 rounded text-xs sm:text-sm hover:bg-blue-200 active:scale-95 transition"
                        >
                          −
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => quickStat(player.id, 'assists')}
                        className="w-full bg-purple-600 text-white py-2 px-1 sm:px-2 rounded-lg text-sm font-medium hover:bg-purple-700 active:scale-95 transition"
                      >
                        +
                      </button>
                      {stats.assists > 0 && (
                        <button
                          type="button"
                          onClick={() => adjustStat(player.id, 'assists', -1)}
                          className="w-full bg-purple-100 text-purple-700 py-1 px-1 sm:px-2 rounded text-xs sm:text-sm hover:bg-purple-200 active:scale-95 transition"
                        >
                          −
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => quickStat(player.id, 'rebounds')}
                        className="w-full bg-orange-600 text-white py-2 px-1 sm:px-2 rounded-lg text-sm font-medium hover:bg-orange-700 active:scale-95 transition"
                      >
                        +
                      </button>
                      {stats.rebounds > 0 && (
                        <button
                          type="button"
                          onClick={() => adjustStat(player.id, 'rebounds', -1)}
                          className="w-full bg-orange-100 text-orange-700 py-1 px-1 sm:px-2 rounded text-xs sm:text-sm hover:bg-orange-200 active:scale-95 transition"
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

        <nav className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <a href={`/players?team=${teamId}`} className="bg-gray-800 text-white p-3 md:p-4 rounded-lg text-center hover:bg-red-600 font-medium transition">
            <span className="text-xl md:text-2xl mb-1 md:mb-2 block">👥</span>
            <span className="text-sm md:text-base">Players</span>
          </a>
          <a href={`/reports?team=${teamId}`} className="bg-gray-800 text-white p-3 md:p-4 rounded-lg text-center hover:bg-red-600 font-medium transition">
            <span className="text-xl md:text-2xl mb-1 md:mb-2 block">📊</span>
            <span className="text-sm md:text-base">Reports</span>
          </a>
          <a href={`/medals?team=${teamId}`} className="bg-gray-800 text-white p-3 md:p-4 rounded-lg text-center hover:bg-red-600 font-medium transition">
            <span className="text-xl md:text-2xl mb-1 md:mb-2 block">🏅</span>
            <span className="text-sm md:text-base">Medals</span>
          </a>
          <a href={`/games?team=${teamId}`} className="bg-gray-800 text-white p-3 md:p-4 rounded-lg text-center hover:bg-red-600 font-medium transition">
            <span className="text-xl md:text-2xl mb-1 md:mb-2 block">🏀</span>
            <span className="text-sm md:text-base">Games</span>
          </a>
        </nav>
      </div>
    </main>
  );
}
