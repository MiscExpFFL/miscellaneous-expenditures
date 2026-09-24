# MEFFL Wednesday Yahoo collector

The MEFFL collector does **not** need the Yahoo Fantasy API. It runs inside your logged-in Yahoo session and now supports one combined weekly collection after Wednesday waivers clear.

## Install once
1. Open Tampermonkey.
2. Install or update `MEFFL_Weekly_Collector.user.js`.
3. Visit the Miscellaneous Expenditures Yahoo league.
4. The first time only, click **USE COLLECTOR ON THIS LEAGUE**.

## Wednesday — one collection, one site update
Set **Upcoming week** to the week that is about to be played. Example: after Week 1 is complete and Week 2 waivers clear, set it to **2**.

1. Wait until Wednesday waivers have processed.
2. Click **WEDNESDAY**.
3. Click **AUTO COLLECT LEAGUE**.
4. Confirm the validation panel is green. If Yahoo fails to expose a page automatically, open that page and use **CAPTURE THIS PAGE**.
5. Click **EXPORT JSON**.
6. Send the resulting `MEFFL_2026_W02_WEDNESDAY.json` file to ChatGPT.

The Wednesday collection is the only weekly collection. It captures:
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

`season-2026.js` → `weekly-import.js` → `me-weekly-sync.js` → `me-engine.js`

The collector keeps the proven full-recap collection path internally for compatibility, but the public workflow is now **Wednesday combined**. Completed results are historical facts; upcoming projections are preview data and never enter standings, H2H or records.

A sanitized replay snapshot should be archived under `weekly-snapshots/<season>/week-XX/`. Raw Yahoo page captures/sourceText from the original export should remain private.

## Safety / privacy
- The script does not contain your Yahoo password, OAuth token or developer secret.
- It runs only in your logged-in Yahoo browser session.
- Pending waiver bids are not intentionally collected.
- Keep the original collector JSON private because Yahoo may expose signed-in page text in raw captures.
- Only completed validated games may enter historical results, records or H2H.
