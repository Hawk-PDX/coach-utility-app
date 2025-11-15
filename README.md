# Coach Utility App

I built this to track my team's stats during games without juggling notebooks and spreadsheets on the sidelines. It's optimized for quick taps on mobile while coaching.

## Why This Exists

Keeping track of who's played how much, who scored what, and making sure everyone gets recognized throughout the season was getting messy. I wanted something I could pull out during a game, tap a few buttons, and have everything logged automatically.

## What It Does

- Manage multiple teams with separate rosters and seasons
- Track shifts to monitor playing time equity
- Log points, assists, and rebounds with one tap
- Manage roster with jersey numbers and positions
- View season stats and game history
- Track awards and recognition throughout the season
- All data persists in PostgreSQL (via Supabase)
- Works well on mobile for sideline use

## Stack

- Next.js 14 with React and TypeScript
- Supabase (PostgreSQL)
- Tailwind CSS
- Deployed on Vercel

## Setup

You'll need Node.js 18+ and a Supabase account (free tier works fine).

```bash
git clone https://github.com/Hawk-PDX/coach-utility-app.git
cd coach-utility-app
npm install
```

Create a Supabase project at [supabase.com](https://supabase.com), then run the SQL from `supabase-schema.sql` in the SQL Editor.

Copy `.env.local.example` to `.env.local` and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Run the dev server:
```bash
npm run dev
```

## Deployment

```bash
npx vercel
```

Add your Supabase environment variables in Vercel's dashboard under Settings → Environment Variables.

## Usage

1. Add a team with name, sport, and season dates
2. Build your roster on the Players page
3. During games, tap buttons to track shifts and stats
4. Check Reports and Medals pages for season data

See `MIGRATION_GUIDE.md` if updating from an earlier version.

Full deployment notes in `DEPLOYMENT.md` if you want to set up custom domains, auth, etc.

## Schema

Five tables: `teams`, `players`, `play_time`, `game_stats`, `medals`. Check `supabase-schema.sql` for details.

## What's Next

- Better reports with play time balance warnings
- CSV export
- Offline mode
- Parent portal features (schedules, rosters, snack signups)

## License

MIT
