# Deployment Notes

## What You Need
- Supabase project
- GitHub account
- Vercel account (free tier)

## Supabase Setup

### Data Syncing
The app polls every 5 seconds for updates. Works fine on the free tier without any special setup. If you want instant updates, you could add Supabase's broadcast channels later, but polling has been reliable enough for sideline use.

### Security
Row Level Security is optional for now if you're just using it with your team. When you're ready to add auth, run this SQL:

```sql
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE medals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON players FOR ALL USING (true);
CREATE POLICY "Allow all" ON play_time FOR ALL USING (true);
CREATE POLICY "Allow all" ON game_stats FOR ALL USING (true);
CREATE POLICY "Allow all" ON medals FOR ALL USING (true);
```

Note: Without auth, anyone with the URL can access it.

## Vercel Deployment

```bash
npm i -g vercel
vercel login
vercel --prod
```

Add your environment variables when prompted:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Or deploy via the Vercel dashboard by importing from GitHub and adding the env vars there.

## Authentication (Optional)

If you want to lock it down:
```bash
npm install @supabase/auth-helpers-nextjs
```

Invite users through Supabase Dashboard → Authentication → Users. Then update the RLS policies to restrict by email or user ID.

## Custom Domain

If you have a domain (e.g., from Namecheap), add it in Vercel's project settings under Domains. Vercel gives you the DNS records to add. For root domains use A records, for subdomains use CNAME. DNS usually propagates in 5-60 minutes.

## Usage

Once it's live, everyone can access it at once. Changes sync every 5 seconds.

To update:
```bash
git push
```
Vercel auto-deploys from your main branch.

## Troubleshooting

- **Slow updates**: Polling is every 5 seconds, so there's a slight delay
- **Connection issues**: Check your env vars in Vercel
- **Performance**: Supabase free tier handles this fine. Check usage in their dashboard if worried.
