# Mis.Exp Weekly Publishing Checklist

This is the required publishing checklist for every in-season update. An update is not complete until every applicable item is reviewed.

## Tuesday — Post-MNF / Week Closeout

- Advance the site to the next week and remove stale preview/preseason framing.
- Publish the completed-week recap: five games, Game of the Week, biggest blowout, bad beat, awards, key player performances, meaningful lineup decisions and all-play context.
- Refresh Season Storylines from the completed week.
- Keep **The Story So Far** below **Not Yahoo's Rankings** on the homepage.
- Update standings, PF/PA, streaks and all-play standings.
- Refresh **What Everybody Needs** using current rosters, injuries/statuses, FAAB, available players and the upcoming opponent.
- Recalculate the Race Dashboard, Projected Field, playoff/bye/title/press-conference odds and remaining schedule path.
- Grade the locked ME and Yahoo predictions, preserve the original forecasts, update cumulative winner records and projection error, and post the next week's early Yahoo board without locking ME picks.
- Refresh the full Analytics page: luck/expected wins, lineup efficiency, bench points, front-office activity, season pulse and weekly awards.
- Import and deduplicate completed moves, waiver claims, FAAB and league activity; update the move leaderboard.
- Refresh the Tuesday waiver board and team-specific waiver needs.
- Mark the completed week **W/L + score** on every team's Road to Week 14.
- Recalculate the live Power Rankings with the new result and scoring data.
- Recalculate the Odds page with the completed week fixed in the simulation.
- Add all completed results to Head-to-Head history and rivalry totals.
- Run the Record Book audit: high/low score, biggest/closest margin, combined score, streaks and every existing tracked record.
- Update each franchise page with the latest result, all-play context, current record/power/odds and next roster need.
- Permanently archive the completed week on the 2026 season/history pages.
- QA: five results, ten franchises, prediction receipts preserved, current week correct everywhere, no stale preview copy, links/cache/deploy checked.

## Thursday — Post-Waivers / Week Preview

- Import post-waiver rosters, adds/drops/claims and FAAB.
- Grade waiver winners/losers and refresh team needs.
- Refresh injuries, statuses, projected starters and Week projections.
- Lock the five ME matchup projections and winner picks.
- Preserve the current Yahoo projections alongside the ME forecast.
- Write all five matchup previews and select Game of the Week.
- Refresh Power/Odds if roster movement meaningfully changes team strength.
- Publish the Week preview without overwriting the prior week's permanent recap.
- QA every matchup, roster mapping, prediction lock, current-week labels and deployment.

## Collector dependency

Until the Yahoo API pipeline replaces the browser collector, Tuesday requires a **POST-MNF** JSON and Thursday requires a **POST-WAIVERS** JSON. Once the source file is supplied, the full applicable checklist should be run without needing page-by-page direction.