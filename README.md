# Coach Utility App

I got tired of juggling spreadsheets and notebooks on the sidelines, so I built this to track stats during games. Quick taps on mobile, everything logged automatically.

Basically tracks playing time, stats (points/assists/rebounds), and season awards for youth sports teams. Works with multiple teams and seasons. Built it for basketball but works with other sports too.

## Setup

Needs Node 18+ and a Supabase account.

```bash
npm install
```

Create a Supabase project, run the SQL from `supabase-schema.sql`, then add your credentials to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm run dev
```

Deploys to Vercel pretty easily.

## Tech

Next.js, TypeScript, Supabase (Postgres), Tailwind. Five tables for teams/players/stats/medals.

## License

MIT
