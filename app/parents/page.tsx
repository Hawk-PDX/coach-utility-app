'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, type Team } from '@/lib/supabase';

function ParentsContent() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get('team');
  
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamId) {
      loadTeam();
    }
  }, [teamId]);

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
    setLoading(false);
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
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
      <div className="max-w-6xl mx-auto">
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">
            Welcome to the Parent Portal
          </h2>
          <p className="text-blue-800">
            This section will include team roster, schedules, game results, snack signups, and team news. Check back soon for updates!
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">📋</div>
            <h3 className="text-lg font-semibold mb-2">Team Roster</h3>
            <p className="text-gray-600 text-sm">
              View all team members and their jersey numbers
            </p>
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="text-lg font-semibold mb-2">Schedule</h3>
            <p className="text-gray-600 text-sm">
              Upcoming games, practice times, and important dates
            </p>
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="text-lg font-semibold mb-2">Game Results</h3>
            <p className="text-gray-600 text-sm">
              Scores and highlights from previous games
            </p>
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">🍿</div>
            <h3 className="text-lg font-semibold mb-2">Snack Signups</h3>
            <p className="text-gray-600 text-sm">
              Sign up to bring snacks for upcoming games
            </p>
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">📢</div>
            <h3 className="text-lg font-semibold mb-2">Team News</h3>
            <p className="text-gray-600 text-sm">
              Important announcements and program updates
            </p>
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold mb-2">Team Stats</h3>
            <p className="text-gray-600 text-sm">
              Season statistics and player recognition
            </p>
          </div>
        </div>
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
