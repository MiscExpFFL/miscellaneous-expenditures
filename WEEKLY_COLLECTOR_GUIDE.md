# MEFFL Wednesday Yahoo collector

The MEFFL collector does **not** need the Yahoo Fantasy API. It runs inside your logged-in Yahoo session and now supports one combined weekly collection after Wednesday waivers clear.

## Install once
1. Open Tampermonkey.
2. Install or update `MEFFL_Weekly_Collector.user.js`.
3. Visit the Miscellaneous Expenditures Yahoo league.
4. The first time only, click **USE COLLECTOR ON THIS LEAGUE**.

## Wednesday — one collection, one site update
Set **Upcoming week** to the week that is about to be played. The collector now auto-suggests the upcoming week from the season calendar (and honors a Yahoo `week=` URL when present), but confirm the number before collecting. Example: after Week 1 is complete and Week 2 waivers clear, use **2**.

1. Wait until Wednesday waivers have processed.
2. Click **WEDNESDAY**.
3. Click **AUTO COLLECT LEAGUE**.
4. Confirm the validation panel is green. If Yahoo fails to expose a page automatically, open that page and use **CAPTURE THIS PAGE**.
5. Click **EXPORT JSON**.
6. Send the resulting `MEFFL_<season>_W<upcoming-week>_WEDNESDAY.json` file to ChatGPT.

The Wednesday collection is the league's only weekly collection. It captures:
- 10/10 current standings with W-L, PF/PA, streak, FAAB and waiver priority where Yahoo exposes them;
- all 5 final matchups from the completed week;
- all 10 completed-week lineups with starters, bench and actual player scoring;
- starter-score reconciliation against Yahoo final team scores;
- all 10 current **post-waiver** rosters with player projections;
- all 5 upcoming matchups and current Yahoo projections;
- the 100-player available pool: 15 QB, 25 RB, 25 WR, 15 TE, 10 K and 10 DEF;
- structured transactions, adds, drops and FAAB/waiver information.

## What the Wednesday site update includes
The single weekly update publishes the backward-looking recap and forward-looking preview together.

### Previous-week recap
- final results and standings;
- full five-game recap;
- Game of the Week, biggest blowout, closest finish, high/low score and bad beat;
- all-play standings and lineup-efficiency receipts;
- prediction grading and season prediction ledger;
- H2H, franchise, Record Book and League Ledger updates;
- completed-week storylines and awards.

### Waivers and current state
- waiver/transaction breakdown;
- FAAB and priority changes;
- who addressed last week's roster needs;
- remaining free-agent opportunities;
- updated rosters, injuries/statuses and team needs.

### Upcoming-week preview
- all five matchup previews;
- locked ME winner pick and projected score for every matchup;
- Yahoo winner/projection snapshot for comparison;
- Game of the Week and Toilet Watch;
- matchup history/H2H context where useful;
- lineup, injury, roster and playoff implications.

### Weekly model refresh
- Power Rankings / Live Power Index;
- playoff odds, bye odds, title equity and Toilet/punishment risk;
- projected playoff field and race tiers;
- Franchise Stock Market;
- weekly storylines and season timeline/pulse.

## Site import architecture
The public site continues to load:

`season-2026.js` → `me-weekly-sync.js` (historical/current weekly overlays) → `me-engine.js`

The collector uses a single **Wednesday combined** path. Completed results are historical facts; upcoming projections are preview data and never enter standings, H2H or records.

A sanitized replay snapshot should be archived under `weekly-snapshots/<season>/week-XX/`. Raw Yahoo page captures/sourceText from the original export should remain private.

## Safety / privacy
- The script does not contain your Yahoo password, OAuth token or developer secret.
- It runs only in your logged-in Yahoo browser session.
- Pending waiver bids are not intentionally collected.
- Keep the original collector JSON private because Yahoo may expose signed-in page text in raw captures.
- Only completed validated games may enter historical results, records or H2H.


## v1.3.8 audit hardening
- Fresh installs no longer default to Upcoming Week 2.
- The collector auto-suggests the upcoming week from the season calendar and uses a Yahoo `week=` URL when present.
- Manual Upcoming week selection remains available and should be confirmed before collecting.

## v1.3.10 renamed-team fix (October 14, 2026)
- Yahoo now displays Christopher's franchise as **The Pleasure Machine**. The site continues to use its canonical historical name **Rise of the Pleasure Machines**.
- The collector recognizes either name and normalizes both to the canonical site name; this addresses that team's missing standings row and its Week 5/Week 6 matchup discovery.
- Update the Tampermonkey userscript to v1.3.10, clear the collector workspace, confirm **Upcoming week = 6**, and run **AUTO COLLECT LEAGUE** again. Verify 10/10 standings, 5/5 finals, 10/10 score reconciliation, and 5/5 Week 6 matchups before exporting.
- The GitHub workflow and collector source part are kept in sync with the release to prevent an automatic rebuild from reverting the correction.

## v1.3.11 Yahoo activation / missing panel repair (November 11, 2026)
The installed userscript is `MEFFL_Weekly_Collector.user.js`, version **1.3.11**. Install/update using its raw GitHub URL:
`https://raw.githubusercontent.com/MiscExpFFL/miscellaneous-expenditures/main/MEFFL_Weekly_Collector.user.js`

If the **MEFFL WEEKLY COLLECTOR** panel does not appear:
1. Open the numeric 2026 Yahoo league URL: `https://football.fantasysports.yahoo.com/f1/94870`. Sign in first, then hard-refresh the page (Ctrl+Shift+R on Windows).
2. Open Tampermonkey **Dashboard** and ensure **MEFFL Weekly Collector — Wednesday** is **enabled** and reports **v1.3.11**. Ensure the browser allows Tampermonkey to run on `football.fantasysports.yahoo.com` (site access). Chrome users should also check that Tampermonkey has the permissions required by their extension version.
3. A first-time installation shows **USE COLLECTOR ON THIS LEAGUE**; click once to bind. A bound 2026 league shows **AUTO COLLECT LEAGUE** and the Wednesday validation panel.
4. Yahoo custom URLs such as `/league/<custom-name>` and legacy `/f1/show?lid=94870` are recognized. If a custom URL does not yet expose the numeric league ID, a visible message links you to the safe numeric league URL; the collector does **not** collect other leagues.
5. Panel mounting is deferred until a page body exists, and the script restores the panel if a Yahoo client-side navigation removes it.
6. An update from v1.3.10 preserves existing collected records and the selected week; it does **not** silently clear the capture workspace. Confirm **Upcoming week** manually for the intended collection (e.g., Week 10 after Week 9 games finalize).
7. If the panel appears but rows or validations remain empty after **AUTO COLLECT LEAGUE**, inspect the validation category and Chrome DevTools Console for `MEFFL` errors. This is a distinct issue from panel activation; report the failing category and page URL. Never send a Yahoo session cookie.

Source of truth: `.github/collector_parts/part01.txt`. CI reconstructs `MEFFL_Weekly_Collector.user.js`, preserves `MEFFL_Weekly_Collector_v1.3.11.txt`, performs a JavaScript syntax check, and runs an activation smoke-test suite. The published site update and the Yahoo userscript are separate workflows.
