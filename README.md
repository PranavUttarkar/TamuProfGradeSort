<div align="center">

# ProfSort (TAMU Course Grade Distributions)

Find Texas A&M course grade distributions fast. View GPA summaries, A/B/C/D/F/Q rollups, and live catalog descriptions & prerequisites. Available as an Electron desktop app and a web UI (serverless API).

</div>

## What it is (summary)
- Instant GPA summaries (historic and since 2022)
- Aggregated letter distributions across semesters
- Live course description + prerequisites
- Sortable, filterable table with quick “professor contains” filter
- Web UI backed by a serverless scraping endpoint

## Architecture (brief)
- Frontends
  - `web/` – static web UI (calls `/api/scrape`)
  - `app/` – legacy in-repo web/Electron page and assets
- Serverless API
  - `api/scrape.js` – Vercel function. Uses `puppeteer-core` + `@sparticuz/chromium` in serverless; falls back to full `puppeteer` locally
- Desktop app
  - `electron/` – Electron main/preload (optional desktop-mode)

Data sources are scraped on-demand from public websites. No private data or affiliation with TAMU.

## Run locally (dev)

Prereqs: Node 18+ recommended.

Option A – Web (serverless style, local):
```powershell
npm install
npx vercel dev
# Open http://localhost:3000/web/
```

Option B – Express app (original server route):
```powershell
npm install
npm start
# Open http://localhost:3000/
```

Option C – Desktop (Electron):
```powershell
npm install
npm run dev
```

Notes:
- On local runs, Puppeteer downloads Chromium automatically. If launch fails, reinstall: `npm install`.
- On Vercel deploys, the function uses Lambda-compatible Chromium automatically.

## Folders at a glance
```
api/        # Serverless function for scraping (Vercel)
web/        # Serverless web UI (static)
app/        # Original app page + scraper logic (used by Express/Electron)
electron/   # Electron app scaffolding
docs/       # Landing page (GitHub Pages / general)
```

## License
ISC License. Not affiliated with Texas A&M University. Data is gathered from publicly accessible sources.

