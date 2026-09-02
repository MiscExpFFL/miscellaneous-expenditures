# Miscellaneous Expenditures — League Site

Current cumulative build for the 2026 season.

Included:
- championship banners + Trophy Case
- individual franchise pages
- complete verified 2023–2025 regular-season + postseason archive
- all-time rivalry matrix
- draft history and verified keeper archive
- 2026 standings / power / playoff engine (live-scoreboard UI currently hidden; engine retained)
- Transactions + Waiver Wire
- Record Book + League Ledger
- Wall of Shame + Press Room
- 2026 schedule, projected brackets and weekly pages
- full weekly write-up hub with all-five-matchup recap/preview coverage
- ME vs Yahoo prediction tracker + all-play standings
- twice-weekly Yahoo browser collector workflow

## Twice-weekly 2026 workflow

API access is optional. `MEFFL_Weekly_Collector.user.js` is a Tampermonkey userscript that you bind once to the Miscellaneous Expenditures Yahoo league. It will not collect another league unless you explicitly unbind/rebind it.

**POST-MNF** — run after Monday Night Football is final. The export is the factual source for completed scores, standings, rosters, rankings/odds updates, team-needs analysis and the waiver preview.

**POST-WAIVERS** — run Thursday morning after waivers process. It compares with the Tuesday snapshot and supplies transaction/FAAB/roster changes plus upcoming Yahoo matchup projections for the weekend preview. The site freezes those Yahoo projections against the ME model forecast for the season-long prediction tracker.

See `WEEKLY_COLLECTOR_GUIDE.md` for installation and the exact routine.

## Data import architecture

`season-2026.js` is the stable season base. Collector exports are archived and replayed cumulatively through `weekly-import.js`; `me-weekly-sync.js` overlays them in order before `me-engine.js` runs. Tuesday results therefore remain in the site after the Thursday import, and later weeks never erase earlier completed games. Completed results can update standings, H2H, records, Power, playoff math, prediction accuracy and all-play standings without rewriting the historical engine every week. The live-scoreboard renderer remains in the code but is disabled through `season-2026.js -> features.liveScoring` until reliable live data access exists.

The helper command is:

```bash
python tools/apply-weekly-export.py MEFFL_2026_W02_POST_MNF.json .
```

In the normal ChatGPT workflow, upload the collector JSON and the current full ZIP and the update can be applied here together with the editorial recap/preview.

## Hosting

Upload the contents of the build to the site's GitHub repository / hosting root. No Yahoo password, OAuth token or client secret belongs in these public files.


## Waiver collector pool
The weekly collector targets a compact 100-player free-agent board: 15 QB, 25 RB, 25 WR, 15 TE, 10 K and 10 DEF. The Waiver Wire page renders those players in separate position sections.
