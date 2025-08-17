# ProfSort (TamuProfGradeSort)

Desktop & web application to view, sort, and analyze Texas A&M course grade distributions with quick catalog description & prerequisites lookup.

## Features
- Grade distribution scraping (historical & since 2022 GPA calcs)
- Summarized A/B/C/D/F/Q percentages across semesters
- Course description & prerequisites (auto-detected)
- Sortable columns & professor text highlight search
- Dual mode: Electron desktop app (offline UI) & Express web mode

## Run (Web Dev Mode)
```powershell
npm install
npm start   # launches Express server on http://localhost:3000
```

## Run (Desktop Dev Mode)
```powershell
npm install
npm run dev   # launches Electron window
```

## Build Windows Installer (.exe)
Requires: Node 18+, Windows 10/11.
```powershell
npm install
npm run build:app
```
Output artifacts (in `dist/`):
- `ProfSort Setup X.Y.Z.exe` (NSIS one-click installer)
- `ProfSort Portable.exe` (portable build)
---

## Folder Structure

## Distribution Guide

### Which file do users click?
- Recommended: `ProfSort Setup <version>.exe` (one‑click installer creates Start Menu + optional desktop shortcut).
- Alternative (no install): `ProfSort <version>.exe` (portable). Just double‑click to run; delete to remove.

### Clean upgrade process
1. Close the app.
2. Download new `ProfSort Setup <version>.exe` from Releases.
3. Run installer (it will overwrite the old version).

### Creating a new release manually
1. Update version in `package.json` (semantic versioning: MAJOR.MINOR.PATCH).
2. Commit & push.
3. Build locally (unsigned):
	```powershell
	npm run build:app:nosign
	```
4. Go to GitHub → Releases → Draft new release.
5. Tag (e.g. `v1.0.1`) matching `package.json`.
6. Upload the two EXE artifacts from `dist/`.
7. Publish release.

### Automated release (GitHub Actions)
The included workflow (`.github/workflows/release.yml`) builds artifacts when you push a tag starting with `v` (e.g. `v1.0.1`). After it finishes:
1. Go to the run → artifacts → download the EXEs, or
2. Convert the workflow to auto-create a Release (uncomment the release step inside the workflow if added later).

### Serverless download page
Folder `docs/` contains a static landing page (`index.html`). Enable GitHub Pages (Settings → Pages → Source: Deploy from branch → main /docs). Users can then visit:
```
https://pranavutarkar.github.io/TamuProfGradeSort/
```
The Download buttons link to the latest GitHub Releases page (ensures you don’t need a fixed asset name).

### Direct latest asset links (optional)
If you want direct one-click download without visiting the Releases page, set stable artifact names (versionless) and use:
```
https://github.com/PranavUttarkar/TamuProfGradeSort/releases/latest/download/ProfSort-Setup.exe
https://github.com/PranavUttarkar/TamuProfGradeSort/releases/latest/download/ProfSort-Portable.exe
```
To enable that, change `artifactName` in `package.json` to:
```json
"artifactName": "ProfSort-${target}.${ext}"
```
Then rebuild & upload. (Currently artifact names include the target to distinguish installer vs portable.)

### Verifying download integrity (optional)
Generate SHA256 checksums locally:
```powershell
Get-FileHash "dist/ProfSort Setup *.exe" -Algorithm SHA256
```
Publish hash in the Release notes for security-conscious users.

### Code signing (future)
For broader distribution (avoid SmartScreen warnings) acquire a Windows code signing cert and set environment variables `CSC_LINK` & `CSC_KEY_PASSWORD` before build. Re-enable signing by removing `WIN_DISABLE_SIGNING` environment var / no‑sign script.

### Troubleshooting
| Issue | Fix |
|-------|-----|
| SmartScreen warning | Click More Info → Run anyway (unsigned build) or sign future builds. |
| App won’t launch | Check antivirus quarantine; re-download. |
| Scrape timeout | Check network; try again; site structure may have changed. |
| Chromium download slow | First run only; subsequent launches are faster. |

```
app/                # Front-end assets & scraping module
	index.html
	scrapeCourse.js   # Core scraping logic (used by Electron IPC & web route)
electron/           # Electron main & preload scripts
	main.js
	preload.js
```

## Scraping Notes
Uses Puppeteer (bundled Chromium). First run may take longer if Chromium needs to download. Network or selector changes on source sites can break scraping; errors are surfaced in the UI.

## Roadmap / Ideas
- Auto-update via GitHub Releases (electron-updater)
- Reduce bundle size using puppeteer-core + system Chrome detection
- Loading indicator & cancel option during long scrapes
- Optional dark mode

## License
ISC License. Not affiliated with Texas A&M University. Data is gathered from publicly accessible sources.

