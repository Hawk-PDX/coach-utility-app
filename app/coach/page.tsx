import Link from 'next/link';
import { getTeam, getPlayers, getTodaysGame } from '@/lib/supabase-server';
import { CoachContent } from './CoachContent';

// Don't cache this page - we always want fresh data for live games
export const dynamic = 'force-dynamic';

type SearchParams = {
  team?: string;
};

type CoachPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function CoachPage({ searchParams }: CoachPageProps) {
  const params = await searchParams;
  const teamId = params.team;

  if (!teamId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl mb-4">No team selected</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300 font-medium">
            ← Back to Teams
          </Link>
        </div>
      </div>
    );
  }

  // Load everything we need from the server before rendering
  // This fixes the mobile data loading issue we had with client-side fetching
  const [team, players, todaysGame] = await Promise.all([
    getTeam(teamId),
    getPlayers(teamId),
    getTodaysGame(teamId)
  ]);

  return (
    <CoachContent
      team={team}
      players={players}
      initialGame={todaysGame}
      teamId={teamId}
    />
  );
}
