# Elastic Field Music — elasticfieldmusic.com

Official artist site (GitHub Pages). Static HTML — no build step.

## Deploy

Push to `main` → GitHub Pages serves the repo root. Custom domain via `CNAME`: `www.elasticfieldmusic.com`.

## Key files

| File | Purpose |
|------|---------|
| `index.html` | Main site |
| `album-data.js` | Smoke & Static tracklist |
| `shop-config.js` | Gumroad URLs & shop products |
| `datenschutz.html` | Privacy policy (DE) |
| `album/smoke-and-static/` | Album artwork (PNG) |

## Shop setup

1. Create Gumroad product with 11 WAVs (+ optional MP3 zip).
2. Set `gumroadUrl` in `shop-config.js` for `smoke-and-static`.
3. Buy buttons activate automatically via Gumroad embed.

## Assets not in git

- Master WAV files (~570 MB) — deliver via Gumroad only (see `.gitignore`).

## Open items

See `MUSIC-CHECKLIST.md`.
