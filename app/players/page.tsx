'use client';

import { useEffect, useState } from 'react';
import { supabase, type Player } from '@/lib/supabase';

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    jersey_number: '',
    position: '',
  });

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .order('name');
    setPlayers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from('players').insert({
      name: formData.name,
      jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
      position: formData.position || null,
    });

    if (error) {
      alert('Error adding player: ' + error.message);
    } else {
      setFormData({ name: '', jersey_number: '', position: '' });
      setShowForm(false);
      loadPlayers();
    }
  };

  const deletePlayer = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This will remove all their stats and data.`)) {
      return;
    }

    const { error } = await supabase.from('players').delete().eq('id', id);
    
    if (error) {
      alert('Error deleting player: ' + error.message);
    } else {
      loadPlayers();
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Players</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ Add Player'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
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
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
              >
                Add Player
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
              <button
                onClick={() => deletePlayer(player.id, player.name)}
                className="text-red-600 hover:text-red-700 px-4 py-2"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {players.length === 0 && !showForm && (
          <p className="text-center text-gray-500 py-8">No players yet. Add your first player to get started!</p>
        )}

        <div className="mt-8">
          <a href="/" className="text-blue-600 hover:underline">← Back to Home</a>
        </div>
      </div>
    </main>
  );
}
