# Scede × Supercell Portfolio Tracker

Live portfolio engagement tracker. Pulls open roles from Scede CID on every page load.

## Setup (one-time, ~10 mins)

### 1. Push to GitHub
Create a new repo at github.com/new, then:
```bash
cd scede-portfolio-tracker
git init
git add .
git commit -m "Initial deploy"
git remote add origin https://github.com/YOUR_USERNAME/scede-portfolio-tracker.git
git push -u origin main
```

### 2. Connect to Vercel
- Go to vercel.com → New Project → Import your GitHub repo
- Vercel will auto-detect the config from vercel.json

### 3. Add environment variables in Vercel
Go to Project Settings → Environment Variables and add:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://nzbmzvdyjsyrjxzybabd.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase anon key (from Supabase dashboard → Settings → API) |

### 4. Deploy
Vercel deploys automatically on every git push.
The `/api/roles` function fetches fresh Scede data on each page load.

## How it works
- `public/index.html` — the tracker UI, calls `/api/roles` on load
- `api/roles.js` — Vercel serverless function, queries Scede Supabase with your credentials
- Roles are matched to portfolio companies by title prefix (e.g. "Anorak - " → Anorak Games)
- Credentials never touch the browser — they live only in Vercel env vars

## Updating portfolio data
Edit the `PORTFOLIO` array in `public/index.html`, commit and push.
Vercel redeploys in ~30 seconds.
