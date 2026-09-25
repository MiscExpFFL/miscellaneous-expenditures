# Miscellaneous Expenditures — League Site

Current cumulative build for the 2026 season.

Included:
- championship banners + Trophy Case
- individual franchise pages
- complete verified 2023–2025 regular-season + postseason archive
- all-time rivalry matrix and current 2026 H2H receipts
- draft history and verified keeper archive
- 2026 standings / Power / playoff engine
- Franchise Stock Market
- Transactions + Waiver Wire
- Record Book + League Ledger
- 2026 schedule, projected brackets and weekly pages
- full weekly write-up hub with Commissioner copy + all-five-matchup recap/preview coverage
- ME vs Yahoo prediction tracker + all-play standings
- one combined Wednesday Yahoo browser-collector workflow

## Wednesday 2026 workflow

API access is optional. `MEFFL_Weekly_Collector.user.js` runs inside the logged-in Yahoo league session. The current collector release is **v1.3.8**.

After Wednesday waivers process:
1. Confirm **Upcoming Week** is the week about to be played. Collector v1.3.8 auto-suggests it from the season calendar (and honors a Yahoo `week=` URL when present).
2. Run **WEDNESDAY → AUTO COLLECT LEAGUE**.
3. Confirm every validation check is green.
4. Export the JSON.
5. The site update closes the completed week and publishes the new preview in one cumulative pass.

The Wednesday export is the factual source for completed scores, standings, completed-lineup scoring, current post-waiver rosters, upcoming Yahoo projections, transactions/FAAB and available players.

See `WEEKLY_COLLECTOR_GUIDE.md` and `WEEKLY_PUBLISHING_CHECKLIST.md`.

## Data import architecture

`season-2026.js` is the stable season base. Earlier collector imports remain cumulative history. `me-weekly-sync.js` loads the current Wednesday data layer, completed-week closeout, locked models and editorial before `me-engine.js` runs.

Completed results update standings, H2H, records, career ledgers, Power, playoff math, stock prices, prediction grading and all-play standings. Wednesday completed-lineup data also feeds lineup autopsies and front-office/acquisition analytics. Upcoming projections remain preview-only and never enter historical results.

## Hosting

The public site is deployed from the existing GitHub Pages repository and custom domain. Do not change DNS, Pages custom-domain or HTTPS settings during a weekly update.

No Yahoo password, OAuth token, client secret or signed-in raw Yahoo page capture belongs in public files.

## Waiver collector pool

The weekly collector targets 100 available players: 15 QB, 25 RB, 25 WR, 15 TE, 10 K and 10 DEF.
