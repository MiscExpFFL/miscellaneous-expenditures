# Mis.Exp Weekly Publishing Checklist

This is the required publishing checklist for every in-season update. An update is not complete until every applicable item is reviewed and the live site is checked for stale prior-week content.

## Tuesday — Post-MNF / Week Closeout

### Weekly phase and editorial

- Advance the site to the next week and remove stale preview/preseason framing.
- The just-completed week's main content must change from **Week N Preview** to **Week N Results Recap** on Tuesday.
- Publish the completed-week recap: all five games, Game of the Week, biggest blowout, bad beat, awards, key player performances, meaningful lineup decisions and the most useful league-wide context.
- **All-play is a fun supporting receipt, not the organizing device for every matchup.** Use it when it adds something interesting (bad beat, lucky win, weekly high/low context), but do not force an all-play note into every team's recap.
- Refresh Season Storylines from the completed week and keep them above the completed-week receipts on the homepage.
- Keep **The Story So Far** below **Not Yahoo's Rankings** on the homepage.
- Update **Weekly Superlatives** from the completed week.
- Permanently archive the completed recap so Thursday's new preview never overwrites it.

### Results, standings and race models

- Import all five final scores and update standings, PF/PA, streaks and current seeding.
- Update **All-Play Standings** for the completed week and cumulative season.
- Recalculate the **Race Dashboard** after the new results.
- Recalculate **Projected Field** after the new results.
- Recalculate playoff, bye, championship and press-conference/Toilet probabilities with the completed week fixed in the simulation.
- Refresh remaining schedule strength and every team's Road to Week 14.
- Mark the completed week **W/L + score** on every franchise's Road to Week 14.

### Predictions / ME vs Yahoo

- Input the actual completed results into **ME vs Yahoo**.
- Grade every locked ME winner pick and every locked Yahoo winner pick.
- Preserve the original forecast numbers exactly; never rewrite a locked projection after the games.
- Update cumulative ME and Yahoo pick records.
- Update absolute score/projection error.
- Update **Prediction Model Report Card**.
- Update **Prediction Ledger** with actual score, winner result and error for every completed matchup.
- Post the next week's early Yahoo board on Tuesday, but do **not** lock the next ME projections/picks until Thursday.

### Power, odds and franchise market

- Recalculate the live **Power Rankings** with the completed result, scoring and roster evidence.
- Recalculate the **Odds** page with the completed week fixed in the model.
- Reprice the **Franchise Stock Market** every Tuesday from the updated Power + Odds model.
- Franchise Stock Market must show the current real record (never stale 0-0 after games have been played), updated price, market rank, BUY/HOLD/SELL signal, playoff/title/press inputs and weekly-close label.
- Refresh each franchise page with latest result, record, PF/PA, power, odds, roster need and Road to Week 14 result.

### War Room / roster needs

- Refresh **What Everybody Needs** using current rosters, injuries/statuses, FAAB, available players and the upcoming opponent.
- Refresh the Tuesday waiver board and team-specific waiver needs.
- Update waiver priority and remaining FAAB.

### Transactions and front-office analytics

- Import and deduplicate all completed adds, drops, waivers, FAAB claims and other league activity.
- Update **Moves & League Activity** and the cumulative transaction leaderboard.
- Update **Activity Tape**.
- Update **Transaction ROI & Front-Office Grades** using the newly completed week's scoring.
- Update **Acquisition Receipts** so prior adds show their scored-week impact once results exist.
- Update **Activity Efficiency** / historical activity efficiency.
- Make sure duplicate Yahoo wrapper rows are excluded while legitimate structured transactions are preserved.

### Analytics

- Refresh the full Analytics page after the completed week.
- Update luck / expected wins and schedule-luck measures.
- Update lineup efficiency, optimal lineup, bench points, points left on the table and decision-loss flags where validated.
- Update **Season Timeline & Weekly Pulse**.
- Update completed-week league average, weekly high, closest game, biggest margin and transaction count entering the week.
- Update weekly awards / superlative analytics.
- Keep all-play primarily on the Analytics/Predictions pages; use it selectively in editorial copy.

### Historical data

- Add all five new results to **Head-to-Head** history and rivalry totals.
- Run the **Record Book** audit every Tuesday: high/low score, biggest/closest margin, combined score, streaks and every existing tracked record.
- Only replace a record when the new result actually breaks or ties it; otherwise note that the audit was completed.
- Permanently archive the completed week on the 2026 season/history pages.

### Tuesday QA before publishing

- Five finals accounted for and ten franchises accounted for.
- Current records are correct everywhere, including Franchise Stock Market and franchise cards.
- Completed week says **Results Recap**, not Preview.
- Prediction receipts are preserved and graded.
- Race Dashboard and Projected Field use the new results.
- Prediction Model Report Card and Prediction Ledger use the new results.
- All-Play Standings are current.
- Transaction ROI, Acquisition Receipts, Activity Efficiency, Season Timeline, Weekly Pulse and Activity Tape are current.
- Weekly Superlatives are current.
- No stale 0-0 records, preseason copy or prior-week preview labels remain.
- Links, cache versions and GitHub Pages deployment are checked.

## Thursday — Post-Waivers / Week Preview

- Import post-waiver rosters, adds/drops/claims and FAAB.
- Change the current weekly feature from the completed **Week N Results Recap** to the new **Week N+1 Preview** while keeping the prior recap permanently available in the archive.
- Grade waiver winners/losers and refresh team needs.
- Refresh injuries, statuses, projected starters and Week projections.
- Lock the five ME matchup projections and winner picks.
- Preserve the current Yahoo projections alongside the ME forecast.
- Write all five matchup previews and select Game of the Week.
- Refresh Power/Odds and Franchise Stock Market only when post-waiver roster movement meaningfully changes team strength.
- Publish the Week preview without overwriting the prior week's permanent recap.
- QA every matchup, roster mapping, prediction lock, current-week labels and deployment.

## Collector dependency

Until the Yahoo API pipeline replaces the browser collector, Tuesday requires a **POST-MNF** JSON and Thursday requires a **POST-WAIVERS** JSON. Once the source file is supplied, the full applicable checklist should be run without needing page-by-page direction.
