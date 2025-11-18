'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, type Team, type Player, type TeamNews, type PlayerRecognition, type Game } from '@/lib/supabase';

function ManageContent() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get('team');
  
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [teamNews, setTeamNews] = useState<TeamNews[]>([]);
  const [recognitions, setRecognitions] = useState<PlayerRecognition[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'news' | 'recognition' | 'results' | 'values'>('news');
  
  // Forms
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    postedBy: '',
    isPinned: false
  });
  const [showNewsForm, setShowNewsForm] = useState(false);
  
  const [recognitionForm, setRecognitionForm] = useState({
    playerId: '',
    recognitionType: 'Player of the Week',
    description: ''
  });
  const [showRecognitionForm, setShowRecognitionForm] = useState(false);

  const [gameResultForm, setGameResultForm] = useState({
    gameId: '',
    ourScore: '',
    opponentScore: ''
  });

  const [valueOfWeekForm, setValueOfWeekForm] = useState<{[key: string]: string}>({});

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

    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .order('name');

    if (data) {
      setPlayers(data);
    }
  };

  const loadGames = async () => {
    if (!teamId) return;

    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('team_id', teamId)
      .order('game_date', { ascending: false });

    if (data) {
      setGames(data);
    }
  };

  const loadTeamNews = async () => {
    if (!teamId) return;

    const { data } = await supabase
      .from('team_news')
      .select('*')
      .eq('team_id', teamId)
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
      .order('recognition_date', { ascending: false });

    if (data) {
      setRecognitions(data as any);
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('team_news')
      .insert([{
        team_id: teamId,
        title: newsForm.title,
        content: newsForm.content,
        posted_by: newsForm.postedBy || null,
        is_pinned: newsForm.isPinned
      }]);

    if (!error) {
      setNewsForm({ title: '', content: '', postedBy: '', isPinned: false });
      setShowNewsForm(false);
      await loadTeamNews();
      alert('News posted successfully!');
    } else {
      alert('Error posting news. Please try again.');
    }
  };

  const handleDeleteNews = async (newsId: string) => {
    if (!confirm('Are you sure you want to delete this news item?')) return;

    const { error } = await supabase
      .from('team_news')
      .delete()
      .eq('id', newsId);

    if (!error) {
      await loadTeamNews();
    }
  };

  const handleTogglePin = async (newsId: string, currentPinned: boolean) => {
    // First unpin all news items
    await supabase
      .from('team_news')
      .update({ is_pinned: false })
      .eq('team_id', teamId);

    // Then pin the selected one if it wasn't pinned
    if (!currentPinned) {
      await supabase
        .from('team_news')
        .update({ is_pinned: true })
        .eq('id', newsId);
    }

    await loadTeamNews();
  };

  const handleAddRecognition = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('player_recognition')
      .insert([{
        team_id: teamId,
        player_id: recognitionForm.playerId,
        recognition_type: recognitionForm.recognitionType,
        description: recognitionForm.description || null
      }]);

    if (!error) {
      setRecognitionForm({ playerId: '', recognitionType: 'Player of the Week', description: '' });
      setShowRecognitionForm(false);
      await loadRecognitions();
      alert('Player recognition added successfully!');
    } else {
      alert('Error adding recognition. Please try again.');
    }
  };

  const handleDeleteRecognition = async (recognitionId: string) => {
    if (!confirm('Are you sure you want to delete this recognition?')) return;

    const { error } = await supabase
      .from('player_recognition')
      .delete()
      .eq('id', recognitionId);

    if (!error) {
      await loadRecognitions();
    }
  };

  const handleUpdateGameResult = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('games')
      .update({
        our_score: parseInt(gameResultForm.ourScore),
        opponent_score: parseInt(gameResultForm.opponentScore),
        is_completed: true
      })
      .eq('id', gameResultForm.gameId);

    if (!error) {
      setGameResultForm({ gameId: '', ourScore: '', opponentScore: '' });
      await loadGames();
      alert('Game result updated successfully!');
    } else {
      alert('Error updating game result. Please try again.');
    }
  };

  const handleUpdateValueOfWeek = async (gameId: string, value: string) => {
    const { error } = await supabase
      .from('games')
      .update({ value_of_week: value })
      .eq('id', gameId);

    if (!error) {
      await loadGames();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    <main className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/coach?team=${teamId}`}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-2 inline-block"
          >
            ← Back to Coach Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">{team?.name}</p>
        </div>

        {/* Section Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveSection('news')}
              className={`flex-1 px-6 py-3 font-medium transition ${
                activeSection === 'news'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Team News
            </button>
            <button
              onClick={() => setActiveSection('recognition')}
              className={`flex-1 px-6 py-3 font-medium transition ${
                activeSection === 'recognition'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Player Recognition
            </button>
            <button
              onClick={() => setActiveSection('results')}
              className={`flex-1 px-6 py-3 font-medium transition ${
                activeSection === 'results'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Game Results
            </button>
            <button
              onClick={() => setActiveSection('values')}
              className={`flex-1 px-6 py-3 font-medium transition ${
                activeSection === 'values'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Values of Week
            </button>
          </div>
        </div>

        {/* Team News Section */}
        {activeSection === 'news' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Team News</h2>
              <button
                onClick={() => setShowNewsForm(!showNewsForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {showNewsForm ? 'Cancel' : '+ Add News'}
              </button>
            </div>

            {showNewsForm && (
              <form onSubmit={handleAddNews} className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={newsForm.title}
                    onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Content *</label>
                  <textarea
                    required
                    rows={4}
                    value={newsForm.content}
                    onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Posted By (optional)</label>
                  <input
                    type="text"
                    value={newsForm.postedBy}
                    onChange={(e) => setNewsForm({ ...newsForm, postedBy: e.target.value })}
                    placeholder="Coach Name"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="pinned"
                    checked={newsForm.isPinned}
                    onChange={(e) => setNewsForm({ ...newsForm, isPinned: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="pinned" className="text-sm font-medium">
                    Pin to top of parent portal
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Post News
                </button>
              </form>
            )}

            {teamNews.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No news items yet.</p>
            ) : (
              <div className="space-y-4">
                {teamNews.map((news) => (
                  <div key={news.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">
                        {news.is_pinned && '📌 '}{news.title}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTogglePin(news.id, news.is_pinned)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          {news.is_pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                          onClick={() => handleDeleteNews(news.id)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap mb-2">{news.content}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{news.posted_by && `Posted by ${news.posted_by}`}</span>
                      <span>{formatDate(news.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Player Recognition Section */}
        {activeSection === 'recognition' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Player Recognition</h2>
              <button
                onClick={() => setShowRecognitionForm(!showRecognitionForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {showRecognitionForm ? 'Cancel' : '+ Add Recognition'}
              </button>
            </div>

            {showRecognitionForm && (
              <form onSubmit={handleAddRecognition} className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Player *</label>
                  <select
                    required
                    value={recognitionForm.playerId}
                    onChange={(e) => setRecognitionForm({ ...recognitionForm, playerId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a player</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Recognition Type *</label>
                  <select
                    value={recognitionForm.recognitionType}
                    onChange={(e) => setRecognitionForm({ ...recognitionForm, recognitionType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Player of the Week">Player of the Week</option>
                    <option value="Most Improved">Most Improved</option>
                    <option value="Team Spirit Award">Team Spirit Award</option>
                    <option value="MVP">MVP</option>
                    <option value="Best Defense">Best Defense</option>
                    <option value="Best Offense">Best Offense</option>
                    <option value="Hustle Award">Hustle Award</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (optional)</label>
                  <textarea
                    rows={3}
                    value={recognitionForm.description}
                    onChange={(e) => setRecognitionForm({ ...recognitionForm, description: e.target.value })}
                    placeholder="Why this player earned this recognition..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Add Recognition
                </button>
              </form>
            )}

            {recognitions.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No player recognitions yet.</p>
            ) : (
              <div className="space-y-3">
                {recognitions.map((recognition: any) => (
                  <div key={recognition.id} className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
                    <div className="flex justify-between items-start">
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
                            {formatDate(recognition.recognition_date)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRecognition(recognition.id)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Game Results Section */}
        {activeSection === 'results' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-6">Update Game Results</h2>
            
            {games.filter(g => !g.is_completed).length === 0 ? (
              <p className="text-gray-600 text-center py-8">No games to update. All games have results.</p>
            ) : (
              <div className="space-y-4">
                {games.filter(g => !g.is_completed).map((game) => (
                  <div key={game.id} className="border rounded-lg p-4">
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">{formatDate(game.game_date)}</p>
                      <h3 className="font-semibold text-lg">vs {game.opponent || 'TBD'}</h3>
                      {game.location && (
                        <p className="text-sm text-gray-600">📍 {game.location}</p>
                      )}
                    </div>
                    
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        gameResultForm.gameId = game.id;
                        handleUpdateGameResult(e);
                      }}
                      className="flex gap-3 items-end"
                    >
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1">Our Score</label>
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="0"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          onChange={(e) => setGameResultForm({ ...gameResultForm, ourScore: e.target.value })}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1">Opponent Score</label>
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="0"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          onChange={(e) => setGameResultForm({ ...gameResultForm, opponentScore: e.target.value })}
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Save Result
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}

            {/* Completed Games */}
            {games.filter(g => g.is_completed).length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">Completed Games</h3>
                <div className="space-y-2">
                  {games.filter(g => g.is_completed).map((game) => (
                    <div key={game.id} className="border rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">{formatDate(game.game_date)}</p>
                        <p className="font-medium">vs {game.opponent || 'TBD'}</p>
                      </div>
                      <div className={`text-lg font-bold ${
                        (game.our_score || 0) > (game.opponent_score || 0)
                          ? 'text-green-600'
                          : (game.our_score || 0) < (game.opponent_score || 0)
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}>
                        {game.our_score} - {game.opponent_score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Values of Week Section */}
        {activeSection === 'values' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-6">Set Value of the Week</h2>
            <p className="text-gray-600 mb-6">
              Assign a core value to each upcoming game. This will be displayed to parents in the schedule.
            </p>
            
            {games.filter(g => !g.is_completed).length === 0 ? (
              <p className="text-gray-600 text-center py-8">No upcoming games to set values for.</p>
            ) : (
              <div className="space-y-4">
                {games.filter(g => !g.is_completed).map((game) => (
                  <div key={game.id} className="border rounded-lg p-4">
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">{formatDate(game.game_date)}</p>
                      <h3 className="font-semibold text-lg">vs {game.opponent || 'TBD'}</h3>
                      {game.location && (
                        <p className="text-sm text-gray-600">📍 {game.location}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1">Value of the Week</label>
                        <select
                          value={valueOfWeekForm[game.id] || game.value_of_week || ''}
                          onChange={(e) => {
                            setValueOfWeekForm({ ...valueOfWeekForm, [game.id]: e.target.value });
                            handleUpdateValueOfWeek(game.id, e.target.value);
                          }}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a value...</option>
                          <option value="Teamwork">Teamwork</option>
                          <option value="Sportsmanship">Sportsmanship</option>
                          <option value="Respect">Respect</option>
                          <option value="Perseverance">Perseverance</option>
                          <option value="Leadership">Leadership</option>
                          <option value="Integrity">Integrity</option>
                          <option value="Discipline">Discipline</option>
                          <option value="Courage">Courage</option>
                          <option value="Commitment">Commitment</option>
                          <option value="Excellence">Excellence</option>
                        </select>
                      </div>
                    </div>
                    
                    {game.value_of_week && (
                      <div className="mt-3 flex items-center text-sm text-green-600">
                        <span className="mr-2">✓</span>
                        <span>Value set: <strong>{game.value_of_week}</strong></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ManagePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    }>
      <ManageContent />
    </Suspense>
  );
}
