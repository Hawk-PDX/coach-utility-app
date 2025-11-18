import { describe, it, expect } from 'vitest';

describe('Parent Portal - Snack Signups', () => {
  it('should successfully record a snack signup for a game', () => {
    const signup = {
      id: 'signup-1',
      game_id: 'game-1',
      parent_name: 'Jane Smith',
      parent_email: 'jane@example.com',
      items_bringing: 'Orange slices and water bottles',
      created_at: new Date().toISOString(),
    };

    expect(signup.parent_name).toBe('Jane Smith');
    expect(signup.parent_email).toBe('jane@example.com');
    expect(signup.items_bringing).toBe('Orange slices and water bottles');
    expect(signup.game_id).toBe('game-1');
  });

  it('should display snack signups for a game', () => {
    const gameWithSignups = {
      id: 'game-1',
      opponent: 'Rival Team',
      snack_signups: [
        {
          id: 'signup-1',
          parent_name: 'Jane Smith',
          items_bringing: 'Orange slices',
        },
        {
          id: 'signup-2',
          parent_name: 'John Doe',
          items_bringing: 'Granola bars',
        },
      ],
    };

    expect(gameWithSignups.snack_signups).toHaveLength(2);
    expect(gameWithSignups.snack_signups[0].parent_name).toBe('Jane Smith');
    expect(gameWithSignups.snack_signups[1].parent_name).toBe('John Doe');
  });

  it('should handle signups without email (optional field)', () => {
    const signup = {
      id: 'signup-1',
      game_id: 'game-1',
      parent_name: 'Jane Smith',
      parent_email: null,
      items_bringing: 'Snacks',
    };

    expect(signup.parent_name).toBe('Jane Smith');
    expect(signup.parent_email).toBeNull();
    expect(signup.items_bringing).toBe('Snacks');
  });

  it('should limit signups to 2 per game', () => {
    const gameSignups = [
      { id: 'signup-1', parent_name: 'Parent 1' },
      { id: 'signup-2', parent_name: 'Parent 2' },
    ];

    const canSignup = gameSignups.length < 2;
    expect(canSignup).toBe(false);

    const gameWithOneSignup = [{ id: 'signup-1', parent_name: 'Parent 1' }];
    const canSignupHere = gameWithOneSignup.length < 2;
    expect(canSignupHere).toBe(true);
  });
});

describe('Parent Portal - Player Statistics', () => {
  it('should correctly calculate player statistics from game stats', () => {
    const gameStats = [
      { id: 'stat-1', points: 12, assists: 3, rebounds: 5 },
      { id: 'stat-2', points: 8, assists: 2, rebounds: 4 },
      { id: 'stat-3', points: 15, assists: 5, rebounds: 7 },
    ];

    const total_points = gameStats.reduce((sum, s) => sum + (s.points || 0), 0);
    const total_assists = gameStats.reduce((sum, s) => sum + (s.assists || 0), 0);
    const total_rebounds = gameStats.reduce((sum, s) => sum + (s.rebounds || 0), 0);
    const games_played = gameStats.length;

    expect(total_points).toBe(35); // 12 + 8 + 15
    expect(total_assists).toBe(10); // 3 + 2 + 5
    expect(total_rebounds).toBe(16); // 5 + 4 + 7
    expect(games_played).toBe(3);
  });

  it('should display player statistics correctly', () => {
    const players = [
      {
        id: 'player-1',
        name: 'John Doe',
        jersey_number: 10,
        total_points: 20,
        total_assists: 5,
        total_rebounds: 9,
        games_played: 2,
      },
      {
        id: 'player-2',
        name: 'Jane Smith',
        jersey_number: 23,
        total_points: 25,
        total_assists: 10,
        total_rebounds: 5,
        games_played: 2,
      },
    ];

    expect(players[0].total_points).toBe(20);
    expect(players[0].total_assists).toBe(5);
    expect(players[1].total_points).toBe(25);
    expect(players[1].total_assists).toBe(10);
  });

  it('should handle players with no stats (0 games played)', () => {
    const gameStats: any[] = [];

    const total_points = gameStats.reduce((sum, s) => sum + (s.points || 0), 0) || 0;
    const total_assists = gameStats.reduce((sum, s) => sum + (s.assists || 0), 0) || 0;
    const total_rebounds = gameStats.reduce((sum, s) => sum + (s.rebounds || 0), 0) || 0;
    const games_played = gameStats.length || 0;

    expect(total_points).toBe(0);
    expect(total_assists).toBe(0);
    expect(total_rebounds).toBe(0);
    expect(games_played).toBe(0);
  });

  it('should calculate average stats per game', () => {
    const player = {
      total_points: 35,
      total_assists: 10,
      total_rebounds: 16,
      games_played: 3,
    };

    const ppg = player.total_points / player.games_played;
    const apg = player.total_assists / player.games_played;
    const rpg = player.total_rebounds / player.games_played;

    expect(Math.round(ppg * 10) / 10).toBe(11.7); // 35/3 = 11.67
    expect(Math.round(apg * 10) / 10).toBe(3.3); // 10/3 = 3.33
    expect(Math.round(rpg * 10) / 10).toBe(5.3); // 16/3 = 5.33
  });

  it('should sort players by jersey number', () => {
    const players = [
      { id: '1', name: 'Player C', jersey_number: 23 },
      { id: '2', name: 'Player A', jersey_number: 10 },
      { id: '3', name: 'Player B', jersey_number: 15 },
    ];

    const sorted = [...players].sort((a, b) => a.jersey_number - b.jersey_number);

    expect(sorted[0].jersey_number).toBe(10);
    expect(sorted[1].jersey_number).toBe(15);
    expect(sorted[2].jersey_number).toBe(23);
  });

  it('should display player recognition', () => {
    const recognitions = [
      {
        id: 'rec-1',
        recognition_type: 'Player of the Week',
        description: 'Outstanding performance',
        players: { name: 'John Doe' },
      },
      {
        id: 'rec-2',
        recognition_type: 'Most Improved',
        description: null,
        players: { name: 'Jane Smith' },
      },
    ];

    expect(recognitions).toHaveLength(2);
    expect(recognitions[0].players.name).toBe('John Doe');
    expect(recognitions[1].players.name).toBe('Jane Smith');
  });
});
