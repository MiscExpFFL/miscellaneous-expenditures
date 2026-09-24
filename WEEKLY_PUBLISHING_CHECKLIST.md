# Mis.Exp Wednesday Publishing Checklist

This is the required in-season publishing checklist. The 2026 workflow is one **Wednesday combined update** after waivers process. An update is not complete until completed-week results, current post-waiver state, the upcoming preview, historical ledgers, models and live-site presentation all agree.

## 1. Validate the collector export

- Run the collector in **WEDNESDAY** mode with Upcoming Week set to the week about to be played.
- Require green validation for standings, five completed matchups, ten completed lineups, starter-score reconciliation, ten current rosters, five upcoming matchup projections, FAAB/priority, transactions and the 100-player available pool.
- Keep raw Yahoo captures private. Only sanitized normalized data belongs in the public site.

## 2. Close the completed week

- Import all five final scores and update standings, PF/PA, streaks and seeding.
- Archive all five results permanently in `Y.results`.
- Recalculate all-play, weekly high/low, closest finish, biggest margin and weekly average.
- Run lineup autopsies for all ten teams from validated completed-lineup scoring.
- Grade the locked ME and Yahoo forecasts without changing the original projections.
- Convert the completed week's article from preview to permanent results recap.

## 3. Historical and franchise ledgers

- Update all five H2H series and the Every Receipt archive.
- Recalculate Career Standings and the League Ledger.
- Run the full Record Book audit: single-game high/low, biggest/closest margin, combined score, winning/losing streaks and every tracked record.
- Update franchise pages with current record, PF/PA, power, odds, latest result and upcoming opponent.
- Update schedule pages so every completed game carries its W/L and final score.
- Update current-season receipt counts and archive labels.

## 4. Transactions, waivers and analytics

- Import and deduplicate all completed adds, drops, waiver claims and FAAB transactions.
- Normalize Yahoo wrapper variants so one real move counts once.
- Update Moves, Activity Tape and cumulative transaction leaderboard.
- Update Transaction ROI, Acquisition Receipts, Activity Efficiency and Front-Office Grades.
- Update FAAB remaining, waiver priority and available-player pool.
- Update lineup efficiency, points left, decision-loss flags, luck, expected wins, Manager DNA, Season Timeline and Weekly Pulse.
- Wednesday completed-lineup snapshots are the canonical analytics source.

## 5. Recalculate the current league

- Recalculate Live Power Rankings / Power Index.
- Recalculate playoff, bye, title and press-conference/Toilet probabilities.
- Refresh Race Dashboard, Projected Fields, remaining SOS and War Room needs.
- Reprice the Franchise Stock Market from the same current Power + Odds state.
- Stock Market must show current real record, current price/rank/signal and a **Week N Wednesday close** label.

## 6. Lock the upcoming week

- Freeze the five current Yahoo projections from the Wednesday collector.
- Recalculate and lock five ME projected scores and winner picks.
- Preserve both systems in the Prediction Ledger.
- Write all five matchup previews, Game of the Week and Toilet Watch.
- Use current H2H, roster, injury/status, transaction and playoff context.

## 7. Weekly editorial

- The current weekly article must begin with a separate section titled exactly **Commissioners Write-Up** when commissioner copy is supplied.
- The Commissioner text remains distinct from the assistant-written analysis.
- Follow it with the completed-week recap and upcoming-week preview.
- Cover all five completed games and all five upcoming games.
- Preserve the prior week's recap in the archive.

## 8. Live-site cleanup

Before publishing, verify there are no stale weekly overlays or labels from older workflows.

- Only the Wednesday collector and Wednesday weekly workflow may appear on current pages or in backend instructions.
- No stale early-board, prior-week phase or superseded weekly-overlay sections.
- Homepage hero and Wednesday League Desk show the current week.
- Weekly hub and individual week page render Commissioner copy before assistant copy.
- Power, Odds, War Room, Stock Market, H2H, Records, Schedule, Franchise, Transactions, Waivers, Analytics and Predictions all reflect the same completed-week state.
- H2H archive count is current.
- Record Book latest-week audit is current.
- Schedule finals are visible.
- Cache-busting versions and deployment are checked.

## 9. Publish safety

- Completed validated games may enter standings/history/H2H/records.
- Upcoming projections never become historical results.
- Prediction snapshots are frozen once locked.
- Do not publish passwords, OAuth secrets, signed-in Yahoo raw page text or private raw collector captures.
- Keep the pre-update backup branch until live QA passes.

## Current import architecture

`season-2026.js` → `me-weekly-sync.js` → current Wednesday data/closeout/models/editorial → `me-engine.js` → analytics/render layers.

The site is cumulative: each Wednesday adds the new completed week and current post-waiver state without erasing older results or locked prediction receipts.
