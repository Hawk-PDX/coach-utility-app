'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, type Player, type Team } from '@/lib/supabase';

function PlayersContent() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get('team');
  
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    jersey_number: '',
    position: '',
  });

  useEffect(() => {
    if (teamId) {
      loadTeamAndPlayers();
    }
  }, [teamId]);

  const loadTeamAndPlayers = async () => {
    if (!teamId) return;
    
    // Load team info
    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();
    
    if (teamData) {
      setTeam(teamData);
    }
    
    // Load players for this team
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .order('name');
    setPlayers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!teamId) return;
    
    if (editingPlayer) {
      // Update existing player
      const { error } = await supabase
        .from('players')
        .update({
          name: formData.name,
          jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
          position: formData.position || null,
        })
        .eq('id', editingPlayer.id);

      if (error) {
        console.error('Error updating player:', error);
        alert('Error updating player: ' + error.message);
      } else {
        setFormData({ name: '', jersey_number: '', position: '' });
        setShowForm(false);
        setEditingPlayer(null);
        loadTeamAndPlayers();
      }
    } else {
      // Insert new player
      const { error } = await supabase.from('players').insert({
        team_id: teamId,
        name: formData.name,
        jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
        position: formData.position || null,
      });

      if (error) {
        console.error('Error adding player:', error);
        alert('Error adding player: ' + error.message);
      } else {
        setFormData({ name: '', jersey_number: '', position: '' });
        setShowForm(false);
        loadTeamAndPlayers();
      }
    }
  };

  const editPlayer = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      jersey_number: player.jersey_number?.toString() || '',
      position: player.position || '',
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingPlayer(null);
    setFormData({ name: '', jersey_number: '', position: '' });
    setShowForm(false);
  };

  const deletePlayer = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This will remove all their stats and data.`)) {
      return;
    }

    const { error } = await supabase.from('players').delete().eq('id', id);
    
    if (error) {
      alert('Error deleting player: ' + error.message);
    } else {
      loadTeamAndPlayers();
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

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-2">
          <Link href={`/coach?team=${teamId}`} className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-block">
            ← Back to Coach
          </Link>
        </div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Players</h1>
            {team && <p className="text-gray-600">{team.name}</p>}
          </div>
          <button
            type="button"
            onClick={() => {
              if (showForm) {
                cancelEdit();
              } else {
                setShowForm(true);
              }
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 active:scale-95 transition"
          >
            {showForm ? 'Cancel' : '+ Add Player'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">
              {editingPlayer ? 'Edit Player' : 'Add New Player'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Player name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Jersey Number</label>
                <input
                  type="number"
                  value={formData.jersey_number}
                  onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="e.g., Forward, Guard"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 active:scale-95 transition"
              >
                {editingPlayer ? 'Update Player' : 'Add Player'}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {players.map((player) => (
            <div key={player.id} className="bg-white border rounded-lg p-4 shadow-sm flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{player.name}</h3>
                <p className="text-gray-600">
                  {player.jersey_number && `#${player.jersey_number}`}
                  {player.position && ` • ${player.position}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => editPlayer(player)}
                  className="text-blue-600 hover:text-blue-700 px-4 py-2 active:scale-95 transition"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deletePlayer(player.id, player.name)}
                  className="text-red-600 hover:text-red-700 px-4 py-2 active:scale-95 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {players.length === 0 && !showForm && (
          <p className="text-center text-gray-500 py-8">No players yet. Add your first player to get started!</p>
        )}
      </div>
    </main>
  );
}

export default function PlayersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    }>
      <PlayersContent />
    </Suspense>
  );
}
