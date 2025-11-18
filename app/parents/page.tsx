'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, type Team, type Player, type Game, type SnackSignup, type TeamNews, type GameStats, type PlayerRecognition } from '@/lib/supabase';

type GameWithSignups = Game & {
  snack_signups?: SnackSignup[];
};

type PlayerWithStats = Player & {
  total_points?: number;
  total_assists?: number;
  total_rebounds?: number;
  games_played?: number;
};

function ParentsContent() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get('team');
  
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [games, setGames] = useState<GameWithSignups[]>([]);
  const [teamNews, setTeamNews] = useState<TeamNews[]>([]);
  const [recognitions, setRecognitions] = useState<PlayerRecognition[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roster' | 'schedule' | 'news' | 'stats'>('roster');
  const [snackSignupForm, setSnackSignupForm] = useState({
    gameId: '',
    parentName: '',
    parentEmail: '',
    itemsBringing: ''
  });
  const [showSnackForm, setShowSnackForm] = useState(false);

  useEffect(() => {
    if (teamId) {
      loadAllData();
    }
  }, [teamId]);

  const loadAllData = async () => {
    if (!teamId) return;
    await Promise.all([
      loadTeam(),
      loadPlayers(),
      loadGames(),
      loadTeamNews(),
      loadRecognitions()
    ]);
    setLoading(false);
  };

  const loadTeam = async () => {
    if (!teamId) return;
    
    const { data } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();
    
    if (data) {
      setTeam(data);
    }
  };

  const loadPlayers = async () => {
    if (!teamId) return;

    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .order('jersey_number', { ascending: true });

    if (playersData) {
      // Load stats for each player
      const playersWithStats = await Promise.all(
        playersData.map(async (player) => {
          const { data: statsData } = await supabase
            .from('game_stats')
            .select('*')
            .eq('player_id', player.id);

          const total_points = statsData?.reduce((sum, s) => sum + (s.points || 0), 0) || 0;
          const total_assists = statsData?.reduce((sum, s) => sum + (s.assists || 0), 0) || 0;
          const total_rebounds = statsData?.reduce((sum, s) => sum + (s.rebounds || 0), 0) || 0;
          const games_played = statsData?.length || 0;

          return {
            ...player,
            total_points,
            total_assists,
            total_rebounds,
            games_played
          };
        })
      );
      setPlayers(playersWithStats);
    }
  };

  const loadGames = async () => {
    if (!teamId) return;

    const { data: gamesData } = await supabase
      .from('games')
      .select('*')
      .eq('team_id', teamId)
      .order('game_date', { ascending: true });

    if (gamesData) {
      // Load snack signups for each game
      const gamesWithSignups = await Promise.all(
        gamesData.map(async (game) => {
          const { data: signups } = await supabase
            .from('snack_signups')
            .select('*')
            .eq('game_id', game.id);

          return {
            ...game,
            snack_signups: signups || []
          };
        })
      );
      setGames(gamesWithSignups);
    }
  };

  const loadTeamNews = async () => {
    if (!teamId) return;

    const { data } = await supabase
      .from('team_news')
      .select('*')
      .eq('team_id', teamId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) {
      setTeamNews(data);
    }
  };

  const loadRecognitions = async () => {
    if (!teamId) return;

    const { data } = await supabase
      .from('player_recognition')
      .select('*, players(name)')
      .eq('team_id', teamId)
      .order('recognition_date', { ascending: false })
      .limit(10);

    if (data) {
      setRecognitions(data as any);
    }
  };

  const handleSnackSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('snack_signups')
      .insert([{
        game_id: snackSignupForm.gameId,
        parent_name: snackSignupForm.parentName,
        parent_email: snackSignupForm.parentEmail,
        items_bringing: snackSignupForm.itemsBringing
      }]);

    if (!error) {
      setSnackSignupForm({ gameId: '', parentName: '', parentEmail: '', itemsBringing: '' });
      setShowSnackForm(false);
      await loadGames();
      alert('Thank you for signing up!');
    } else {
      alert('Error signing up. Please try again.');
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  const formatGameDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatNewsDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const upcomingGames = games.filter(g => !g.is_completed);
  const pastGames = games.filter(g => g.is_completed).reverse();

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
    <main className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-2 inline-block"
          >
            ← Back to Teams
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">{team?.name || 'Parent Portal'}</h1>
          {team && (
            <p className="text-gray-600 mt-1">
              {team.sport} • {formatDateRange(team.season_start, team.season_end)}
            </p>
          )}
        </div>

        {/* Team News Banner */}
        {teamNews.filter(n => n.is_pinned).length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">📌</span>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-yellow-900">
                  {teamNews.find(n => n.is_pinned)?.title}
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  {teamNews.find(n => n.is_pinned)?.content}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('roster')}
              className={`flex-1 px-6 py-3 font-medium transition ${
                activeTab === 'roster'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Roster
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 px-6 py-3 font-medium transition ${
                activeTab === 'schedule'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Schedule
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={`flex-1 px-6 py-3 font-medium transition ${
                activeTab === 'news'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              News
              <p>Hey all, we played a solid game this past week. Especially around half-time... our kids decided to start passing which opened up a lot of scoring opportunities! Our main focus, as coaches, is to manifest a passion for which ever sport we are currently taking part in.
                Play time and inclusion is a major focus as well as making the most out of our practice time, prior to game start.
                Each week, we will provide all teammates, 'Value of the Week', these values are important to the the progession of our kids and seek to establish a baseline and passion for the sport, as well as an environment where each player feels as if they 'bring something to the table'.
                As we sit now, we are only a few games in to the season and us coaches have noticed a significant jump in skill levels across the board. 
                Not all activities come natural and our goal is to provide EVERY player a solid footing from which to grow upon. Illiciting a passion for the sport and generating a player's drive to continue to work on fundamentals. 
                We understand that not all of our boys have equivalent amount of practice and we will do our best to find and perpetuate anyhing they may need, individually.
                Thank you all for allowing us to work with your kids! This is not a job for us coaches, it's a love for the kids and assisting them in staying active.

                If we are missing anything, we'd love to hear from you! We will go out of our way to heed suggestions. :)
              </p>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 px-6 py-3 font-medium transition ${
                activeTab === 'stats'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Stats
            </button>
          </div>
        </div>

        {/* Roster Tab */}
        {activeTab === 'roster' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-4">Team Roster</h2>
            {players.length === 0 ? (
              <p className="text-gray-600">No players on the roster yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map((player) => (
                  <div key={player.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{player.name}</h3>
                        {player.position && (
                          <p className="text-sm text-gray-600">{player.position}</p>
                        )}
                      </div>
                      {player.jersey_number && (
                        <div className="bg-blue-100 text-blue-800 font-bold rounded-full w-10 h-10 flex items-center justify-center">
                          #{player.jersey_number}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {/* Upcoming Games */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">Upcoming Games</h2>
              {upcomingGames.length === 0 ? (
                <p className="text-gray-600">No upcoming games scheduled.</p>
              ) : (
                <div className="space-y-4">
                  {upcomingGames.map((game) => (
                    <div key={game.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm text-gray-600">{formatGameDate(game.game_date)}</p>
                          <h3 className="font-semibold text-lg">vs {game.opponent || 'TBD'}</h3>
                          {game.location && (
                            <p className="text-sm text-gray-600">📍 {game.location}</p>
                          )}
                          {game.value_of_week && (
                            <div className="mt-2 inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                              ⭐ Value of the Week: {game.value_of_week}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Snack Signups */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-sm">Game Snacks</h4>
                          {game.snack_signups && game.snack_signups.length < 2 && (
                            <button
                              onClick={() => {
                                setSnackSignupForm({ ...snackSignupForm, gameId: game.id });
                                setShowSnackForm(true);
                              }}
                              className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                            >
                              Sign Up
                            </button>
                          )}
                        </div>
                        {game.snack_signups && game.snack_signups.length > 0 ? (
                          <div className="space-y-1">
                            {game.snack_signups.map((signup) => (
                              <p key={signup.id} className="text-sm text-gray-700">
                                ✓ {signup.parent_name}
                                {signup.items_bringing && ` - ${signup.items_bringing}`}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No signups yet</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Games */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">Past Games</h2>
              {pastGames.length === 0 ? (
                <p className="text-gray-600">No games played yet.</p>
              ) : (
                <div className="space-y-3">
                  {pastGames.map((game) => (
                    <div key={game.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">{formatGameDate(game.game_date)}</p>
                          <h3 className="font-semibold">vs {game.opponent || 'TBD'}</h3>
                        </div>
                        {game.our_score !== null && game.opponent_score !== null && (
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              game.our_score > game.opponent_score
                                ? 'text-green-600'
                                : game.our_score < game.opponent_score
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }`}>
                              {game.our_score} - {game.opponent_score}
                            </div>
                            <p className="text-xs text-gray-600">
                              {game.our_score > game.opponent_score
                                ? 'Win'
                                : game.our_score < game.opponent_score
                                ? 'Loss'
                                : 'Tie'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-4">Team News</h2>
            {teamNews.length === 0 ? (
              <p className="text-gray-600">No news updates yet.</p>
            ) : (
              <div className="space-y-4">
                {teamNews.map((news) => (
                  <div key={news.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">
                        {news.is_pinned && '📌 '}{news.title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatNewsDate(news.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{news.content}</p>
                    {news.posted_by && (
                      <p className="text-xs text-gray-500 mt-2">Posted by {news.posted_by}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Player Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">Season Statistics</h2>
              {players.length === 0 ? (
                <p className="text-gray-600">No player statistics available yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold">#</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Player</th>
                        <th className="px-4 py-2 text-center text-sm font-semibold">GP</th>
                        <th className="px-4 py-2 text-center text-sm font-semibold">PTS</th>
                        <th className="px-4 py-2 text-center text-sm font-semibold">AST</th>
                        <th className="px-4 py-2 text-center text-sm font-semibold">REB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((player) => (
                        <tr key={player.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{player.jersey_number || '-'}</td>
                          <td className="px-4 py-3 font-medium">{player.name}</td>
                          <td className="px-4 py-3 text-center text-sm">{player.games_played || 0}</td>
                          <td className="px-4 py-3 text-center text-sm">{player.total_points || 0}</td>
                          <td className="px-4 py-3 text-center text-sm">{player.total_assists || 0}</td>
                          <td className="px-4 py-3 text-center text-sm">{player.total_rebounds || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Player Recognition */}
            {recognitions.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-4">Player Recognition</h2>
                <div className="space-y-3">
                  {recognitions.map((recognition: any) => (
                    <div key={recognition.id} className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">🏆</span>
                        <div>
                          <h4 className="font-semibold">
                            {recognition.players?.name} - {recognition.recognition_type}
                          </h4>
                          {recognition.description && (
                            <p className="text-sm text-gray-700 mt-1">{recognition.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {formatNewsDate(recognition.recognition_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Snack Signup Modal */}
        {showSnackForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Sign Up for Game Snacks</h3>
              <form onSubmit={handleSnackSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={snackSignupForm.parentName}
                    onChange={(e) => setSnackSignupForm({ ...snackSignupForm, parentName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email (optional)</label>
                  <input
                    type="email"
                    value={snackSignupForm.parentEmail}
                    onChange={(e) => setSnackSignupForm({ ...snackSignupForm, parentEmail: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">What will you bring?</label>
                  <input
                    type="text"
                    placeholder="e.g., Orange slices, Granola bars"
                    value={snackSignupForm.itemsBringing}
                    onChange={(e) => setSnackSignupForm({ ...snackSignupForm, itemsBringing: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Sign Up
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSnackForm(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ParentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    }>
      <ParentsContent />
    </Suspense>
  );
}
