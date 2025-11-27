'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function AddTeamForm() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sport: 'Basketball',
    season_start: '',
    season_end: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([formData])
        .select();
      
      if (error) {
        alert(`Failed to add team: ${error.message}`);
      } else {
        setFormData({ name: '', sport: 'Basketball', season_start: '', season_end: '' });
        setShowForm(false);
        router.refresh();
      }
    } catch (err) {
      alert('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowForm(!showForm)}
        className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition active:scale-95"
      >
        {showForm ? 'Cancel' : '+ Add Team'}
      </button>

      {showForm && (
        <div className="bg-gray-800 rounded-lg shadow-md p-6 mt-8">
          <h3 className="text-xl font-semibold mb-4 text-white">Add New Team</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Team Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white"
                placeholder="e.g., Hawks U12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Sport
              </label>
              <select
                value={formData.sport}
                onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Season Start
                </label>
                <input
                  type="date"
                  required
                  value={formData.season_start}
                  onChange={(e) => setFormData({ ...formData, season_start: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Season End
                </label>
                <input
                  type="date"
                  required
                  value={formData.season_end}
                  onChange={(e) => setFormData({ ...formData, season_end: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {submitting ? 'Creating...' : 'Create Team'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
