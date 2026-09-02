# MEFFL twice-weekly Yahoo collector

This build does **not** need the Yahoo Fantasy API. The Tampermonkey collector runs while you are logged into Yahoo and exports one JSON snapshot.

## Install once
1. Open Tampermonkey.
2. Create a new userscript.
3. Replace the template with `MEFFL_Weekly_Collector.user.js` from this package and save it.
4. Visit the Miscellaneous Expenditures Yahoo league. A **MEFFL WEEKLY COLLECTOR** panel appears at bottom-right.
5. The first time only, click **USE COLLECTOR ON THIS LEAGUE**. The script remembers that Yahoo league and will not collect a different league unless you explicitly unbind it.

## Tuesday / after MNF — POST-MNF
Set **Upcoming week** to the week that is about to be played. Example: after Week 1 MNF, set it to **2**.

1. Click **POST-MNF**.
2. Click **AUTO COLLECT LEAGUE**.
3. Green checks are ideal. If a Yahoo page is too dynamic for the automatic fetch, open that page normally and click **CAPTURE THIS PAGE**. The export always keeps raw page text as a recovery source.
4. Click **EXPORT JSON**.
5. Send the resulting `MEFFL_2026_W02_POST_MNF.json` file to ChatGPT with the current site ZIP.

This update is intended to drive:
- final five-game recap;
- standings, PF/PA and streaks;
- Live Power Index;
- playoff / bye / title / Toilet odds;
- H2H, franchises, Record Book and League Ledger;
- what each team needs to improve;
- waiver-wire preview and team-specific targets;
- first look at the next week.

## Thursday morning — POST-WAIVERS
Keep **Upcoming week** on the same upcoming week used Tuesday.

1. Click **POST-WAIVERS**. This starts a clean Thursday workspace but preserves Tuesday's saved snapshot.
2. Click **AUTO COLLECT LEAGUE** after waivers have processed.
3. Capture any page manually if a checklist item is missing.
4. Click **EXPORT JSON**.
5. Send `MEFFL_2026_W02_POST_WAIVERS.json` to ChatGPT.

The Thursday export automatically compares itself with Tuesday's saved snapshot and includes:
- roster additions/removals by team;
- FAAB changes;
- newly observed transactions;
- updated rosters;
- position-specific available-player pool: top 15 QB, 25 RB, 25 WR, 15 TE, 10 K and 10 DEF;
- upcoming Yahoo matchup projections where visible.

That update is intended to drive:
- transaction and waiver breakdown;
- who actually addressed Tuesday's needs;
- best/worst waiver decisions and remaining opportunities;
- all five weekend matchup previews;
- Game of the Week / Toilet Watch;
- lineup, injury, roster and playoff implications.

## Site import architecture
The public site now loads these files in order:

`season-2026.js` → `weekly-import.js` → `me-weekly-sync.js` → `me-engine.js`

`season-2026.js` stays the stable season source. Each collector export becomes `weekly-import.js`; `me-weekly-sync.js` overlays only the new factual Yahoo data before the calculations run.

The importer updates standings, completed results, upcoming projections, live rosters, transactions, FAAB and the 100-player position-specific waiver pool. A **sanitized replay snapshot** is archived under `weekly-snapshots/<season>/week-XX/`. The public build does not include the raw Yahoo page captures/sourceText from the original export.

For local use:

```bash
python tools/apply-weekly-export.py MEFFL_2026_W02_POST_MNF.json .
```

In our normal workflow, just upload the JSON here and I can perform this step while also writing the recap/preview editorial content.

## Power / odds behavior
The Live Power engine remains heavily results-driven but can now use an imported Yahoo matchup projection as a modest **current roster-strength** input. Recent form is also included. This means a major Thursday injury, waiver addition or lineup change can move Power and remaining-game simulation probabilities without overpowering actual wins and scoring.

No collector data is treated as historical truth unless it is a completed result. Preview projections never enter H2H, career records, standings or the Record Book.

## Safety / privacy
- The script does **not** contain your Yahoo password, OAuth token or developer secret.
- It runs only in your logged-in Yahoo browser session.
- Pending waiver bids are not intentionally collected or exported.
- Raw collector exports can contain whatever Yahoo visibly showed on a captured league page. Keep those originals private. The site importer strips raw page captures/sourceText before writing the deployable snapshot.
