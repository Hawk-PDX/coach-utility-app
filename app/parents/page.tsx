import Link from 'next/link';
import { getTeam, getPlayers, getGames, getSnackSignups, getTeamNews, getPlayerRecognitions, getPlayerStats } from '@/lib/supabase-server';
import { TabContent } from './TabContent';
import type { Player, Game, SnackSignup } from '@/lib/supabase';

type GameWithSignups = Game & {
  snack_signups?: SnackSignup[];
};

type PlayerWithStats = Player & {
  total_points?: number;
  total_assists?: number;
  total_rebounds?: number;
  games_played?: number;
};

type SearchParams = {
  team?: string;
};

type ParentsPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ParentsPage({ searchParams }: ParentsPageProps) {
  const params = await searchParams;
  const teamId = params.team;

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

  // Fetch all data in parallel on the server
  const [team, players, games, teamNews, recognitions] = await Promise.all([
    getTeam(teamId),
    getPlayers(teamId),
    getGames(teamId),
    getTeamNews(teamId),
    getPlayerRecognitions(teamId)
  ]);

  // Load stats for each player
  const playersWithStats: PlayerWithStats[] = await Promise.all(
    players.map(async (player) => {
      const statsData = await getPlayerStats(player.id);

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

  // Load snack signups for each game
  const gamesWithSignups: GameWithSignups[] = await Promise.all(
    games.map(async (game) => {
      const signups = await getSnackSignups(game.id);
      return {
        ...game,
        snack_signups: signups
      };
    })
  );

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <Link
            href="/"
            className="text-red-400 hover:text-red-300 font-medium text-sm mb-2 inline-block"
          >
            ← Back to Teams
          </Link>
          <h1 className="text-2xl md:text-4xl font-bold text-white">{team?.name || 'Parent Portal'}</h1>
          {team && (
            <p className="text-sm md:text-base text-gray-400 mt-1">
              {team.sport} • {formatDateRange(team.season_start, team.season_end)}
            </p>
          )}
        </div>

        {/* Tab Content (Client Component) */}
        <TabContent
          team={team}
          players={playersWithStats}
          games={gamesWithSignups}
          teamNews={teamNews}
          recognitions={recognitions}
        />
      </div>
    </main>
  );
}
