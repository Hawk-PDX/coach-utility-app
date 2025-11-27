import Link from 'next/link';
import { getAllTeams } from '@/lib/supabase-server';
import { AddTeamForm } from './AddTeamForm';

export default async function LandingPage() {
  const teams = await getAllTeams();

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-red-800 text-white py-8 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
            Coach Utility App
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-300">
            Managing your teams, one season at a time
          </p>
        </div>
      </div>

      {/* Teams Section */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Your Teams</h2>
          <AddTeamForm />
        </div>

        {/* Teams List */}
        {teams.length === 0 ? (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 text-center">
            <p className="text-lg text-gray-300 mb-4">
              No teams yet. Add your first team to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {teams.map((team) => (
              <div key={team.id} className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="p-4 md:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {team.name}
                      </h3>
                      <p className="text-sm text-gray-400">{team.sport}</p>
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
                  <p className="text-sm text-gray-400 mb-4">
                    {formatDateRange(team.season_start, team.season_end)}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href={`/coach?team=${team.id}`}
                      className="bg-red-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition text-sm"
                    >
                      Coach
                    </Link>
                    <Link
                      href={`/parents?team=${team.id}`}
                      className="bg-gray-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition text-sm"
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
