'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, type Team } from '@/lib/supabase';

export default function LandingPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sport: 'Basketball',
    season_start: '',
    season_end: ''
  });

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading teams:', error);
    } else {
      setTeams(data || []);
    }
    setLoading(false);
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('teams')
      .insert([formData]);
    
    if (error) {
      console.error('Error adding team:', error);
      alert('Failed to add team');
    } else {
      setFormData({ name: '', sport: 'Basketball', season_start: '', season_end: '' });
      setShowAddForm(false);
      loadTeams();
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Coach Utility App
          </h1>
          <p className="text-xl md:text-2xl text-blue-100">
            Managing your teams, one season at a time
          </p>
        </div>
      </div>

      {/* Teams Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Your Teams</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            {showAddForm ? 'Cancel' : '+ Add Team'}
          </button>
        </div>

        {/* Add Team Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Add New Team</h3>
            <form onSubmit={handleAddTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Hawks U12"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sport
                </label>
                <select
                  value={formData.sport}
                  onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Basketball">Basketball</option>
                  <option value="Soccer">Soccer</option>
                  <option value="Baseball">Baseball</option>
                  <option value="Football">Football</option>
                  <option value="Hockey">Hockey</option>
                  <option value="Volleyball">Volleyball</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Season Start
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.season_start}
                    onChange={(e) => setFormData({ ...formData, season_start: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Season End
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.season_end}
                    onChange={(e) => setFormData({ ...formData, season_end: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Create Team
              </button>
            </form>
          </div>
        )}

        {/* Teams List */}
        {teams.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <p className="text-lg text-gray-700 mb-4">
              No teams yet. Add your first team to get started!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div key={team.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {team.name}
                      </h3>
                      <p className="text-sm text-gray-600">{team.sport}</p>
                    </div>
                    <span className="text-2xl">
                      {team.sport === 'Basketball' && '🏀'}
                      {team.sport === 'Soccer' && '⚽'}
                      {team.sport === 'Baseball' && '⚾'}
                      {team.sport === 'Football' && '🏈'}
                      {team.sport === 'Hockey' && '🏒'}
                      {team.sport === 'Volleyball' && '🏐'}
                      {team.sport === 'Other' && '🏆'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    {formatDateRange(team.season_start, team.season_end)}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href={`/coach?team=${team.id}`}
                      className="bg-blue-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition text-sm"
                    >
                      Coach
                    </Link>
                    <Link
                      href={`/parents?team=${team.id}`}
                      className="bg-green-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition text-sm"
                    >
                      Parents
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
