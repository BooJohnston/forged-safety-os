# FORGED Safety Intelligence OS v4.0

Construction safety management platform with dual AI analysis, 28 modules, and OSHA Core 58 compliance.

**Stack:** React 18 + Vite + Tailwind + Supabase + Netlify Functions

---

## Deployment Guide (GitHub → Netlify → Supabase)

Follow these steps exactly in order. Do not skip ahead.

---

### STEP 1: Supabase Setup

**1A. Create or open your Supabase project**

Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)

If you already have a project for Safety OS, use it. Otherwise click **New Project**.

**1B. Enable Email Auth**

- Go to **Authentication → Providers**
- Make sure **Email** is enabled
- Under **Authentication → Settings**, set:
  - **Site URL:** `https://forgedpsafety-os.netlify.app`
  - **Redirect URLs:** add `https://forgedpsafety-os.netlify.app/**`

**1C. Run the database migration**

- Go to **SQL Editor** (left sidebar)
- Click **New Query**
- Open `supabase-migration.sql` from this project
- Paste the ENTIRE contents into the editor
- Click **Run**
- You should see "Success. No rows returned" — this is correct

This creates all 16 tables with Row Level Security. It's safe to run multiple times (uses `IF NOT EXISTS`).

**1D. Get your credentials**

Go to **Settings → API** and copy:
- **Project URL** — looks like `https://abcdefgh.supabase.co`
- **anon public key** — the long `eyJ...` key (NOT the service_role key)

You will need both of these in Step 3.

---

### STEP 2: GitHub Setup

**2A. Create the repository** (if not already done)

Go to [https://github.com/new](https://github.com/new)
- Repository name: `forged-safety-os`
- Private (recommended — your API keys will be in Netlify, not in code, but still)
- Do NOT initialize with README (you already have one)

**2B. Push the code**

Open your terminal in the project folder and run:

```bash
git init
git add .
git commit -m "FORGED Safety OS v4.0 - Enhanced"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/forged-safety-os.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username.

**2C. Verify**

Go to your repo on GitHub. You should see all files including:
- `src/` folder with all components and pages
- `netlify/functions/ai-proxy.js`
- `supabase-migration.sql`
- `netlify.toml`
- `.env.example` (NOT `.env` — that's in .gitignore)

⚠️ **CHECK:** Make sure `.env` is NOT visible in your repo. If it is, you've committed secrets. Delete it from git immediately with:
```bash
git rm --cached .env
git commit -m "Remove .env from tracking"
git push
```

---

### STEP 3: Netlify Setup

**3A. Connect to GitHub**

- Go to [https://app.netlify.com](https://app.netlify.com)
- Click **Add new site → Import an existing project**
- Select **GitHub**
- Authorize Netlify if prompted
- Select your `forged-safety-os` repository

**3B. Configure build settings**

Netlify should auto-detect these from `netlify.toml`, but verify:

| Setting | Value |
|---------|-------|
| Branch to deploy | `main` |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Functions directory | `netlify/functions` |

**3C. Set environment variables**

This is the critical step. Go to **Site settings → Environment variables** and add ALL FOUR:

| Variable | Value | Where it's used |
|----------|-------|-----------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Frontend (Vite injects at build time) |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...your-anon-key` | Frontend (Vite injects at build time) |
| `ANTHROPIC_API_KEY` | `sk-ant-...your-key` | Netlify Function (server-side only) |
| `OPENAI_API_KEY` | `sk-...your-key` | Netlify Function (server-side only) |

⚠️ **IMPORTANT:**
- The `VITE_` prefix is required for the Supabase variables — Vite only exposes env vars that start with `VITE_` to the frontend
- The API keys do NOT have the `VITE_` prefix — they're server-side only (used by `netlify/functions/ai-proxy.js`) and never exposed to the browser
- If you don't have an OpenAI key, the GPT-4o side of dual analysis will silently fail and only Claude results will show (this is fine)

**3D. Deploy**

Click **Deploy site**. Netlify will:
1. Clone your repo
2. Run `npm install`
3. Run `npm run build` (Vite compiles with env vars injected)
4. Publish the `dist/` folder
5. Deploy `netlify/functions/ai-proxy.js` as a serverless function

First deploy takes ~60 seconds. You'll get a URL like `https://random-name.netlify.app`.

**3E. Set your custom domain** (if you have one)

- Go to **Domain settings**
- Click **Add custom domain**
- Enter `forgedpsafety-os.netlify.app` or your custom domain
- Follow the DNS instructions if using a custom domain

---

### STEP 4: Verify Everything Works

Open your deployed site and test each layer:

**Auth:**
- [ ] Sign up with a new email/password
- [ ] Sign out and sign back in
- [ ] Check that you see the Dashboard

**Data:**
- [ ] Create a new Project
- [ ] Create a Hazard (should auto-attach to project)
- [ ] Switch projects in the top bar — hazards should filter
- [ ] Create a Daily Log, Incident, Near Miss

**AI:**
- [ ] Go to Photo Analysis, upload a photo, click Analyze
- [ ] Claude result should appear (purple label)
- [ ] GPT-4o result should appear (blue label) — if you set the OpenAI key
- [ ] Click "Auto-Generate Hazards" — should create records in Hazard Manager

**Print/Export:**
- [ ] Go to Hazard Manager, click 🖨️ Print — should open print dialog
- [ ] Click 📥 Export CSV — should download a .csv file
- [ ] Go to Toolbox Talks, generate one, click Print with Sign-In — should show attendee sheet

---

### STEP 5: Ongoing Workflow

**Making changes:**

```bash
# Edit code locally
npm run dev          # Local dev server at localhost:5173

# When ready to deploy:
git add .
git commit -m "Description of changes"
git push
```

Netlify auto-deploys on every push to `main`. No manual deploy needed.

**Local development:**

Create a `.env` file (never committed):
```bash
cp .env.example .env
# Edit .env with your actual values
```

Then:
```bash
npm install
npm run dev
```

The Netlify Functions (AI proxy) won't work locally unless you use `netlify dev` instead of `npm run dev`:
```bash
npm install -g netlify-cli
netlify login
netlify link           # Link to your site
netlify dev            # Runs dev server WITH functions
```

---

## Architecture

```
forged-safety-os/
├── src/
│   ├── components/
│   │   ├── SharedUI.tsx      ← All shared UI components (16 components)
│   │   ├── AppShell.tsx      ← Main layout + sidebar navigation
│   │   ├── ProjectBar.tsx    ← Project context bar
│   │   └── ProjectFilter.tsx ← Project dropdown filter
│   ├── pages/                ← 28 module pages
│   │   ├── Dashboard.tsx
│   │   ├── PhotoAnalysis.tsx ← Dual AI + persistence + auto-hazard
│   │   ├── HazardManager.tsx
│   │   ├── Incidents.tsx
│   │   ├── NearMisses.tsx
│   │   ├── DailyLog.tsx
│   │   ├── Inspections.tsx
│   │   ├── Permits.tsx
│   │   ├── ToolboxTalks.tsx
│   │   ├── WeeklyReport.tsx
│   │   ├── CrudModules.tsx   ← Training, SDS, Orientation, Audit, Settings
│   │   ├── FinalModules.tsx  ← Crane, EAP, Sub Scorecards, Regulatory, etc.
│   │   └── ...
│   ├── hooks/
│   │   ├── useAuth.ts        ← Supabase auth
│   │   ├── useData.ts        ← Generic CRUD + project filtering
│   │   └── useProject.tsx    ← Project context provider
│   ├── lib/
│   │   ├── supabase.ts       ← Supabase client
│   │   ├── dataService.ts    ← CRUD operations (16 data stores)
│   │   └── ai.ts             ← Claude + GPT-4o API calls
│   ├── data/
│   │   └── standards.ts      ← Core 58 system prompt + categories
│   └── styles/
│       └── globals.css       ← Theme variables + Tailwind
├── netlify/
│   └── functions/
│       └── ai-proxy.js       ← Serverless AI API proxy
├── supabase-migration.sql    ← All 16 tables + RLS
├── netlify.toml              ← Build config + redirects
├── package.json              ← v4.0.0
└── .env.example              ← Template for env vars
```

## Environment Variables Summary

| Variable | Where to set | Used by |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Netlify Env Vars + local `.env` | Frontend (supabase.ts) |
| `VITE_SUPABASE_ANON_KEY` | Netlify Env Vars + local `.env` | Frontend (supabase.ts) |
| `ANTHROPIC_API_KEY` | Netlify Env Vars only | ai-proxy.js function |
| `OPENAI_API_KEY` | Netlify Env Vars only | ai-proxy.js function |

---

FORGED Educational Systems — Richard Johnston
