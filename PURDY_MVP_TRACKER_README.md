# Miscellaneous Expenditures HK Lounge Orgy Fund

Live Brock Purdy NFL MVP market tracker for the Miscellaneous Expenditures site.

## What the site shows

- League Bet: $200 at +1900
- Payout: $3,800
- Live Market: the rounded arithmetic average of the two free-tier prices used by the updater
- Ticket vs. Live Market comparison
- Market-history chart on the Odds page

The public site never displays individual sportsbook names or prices and never contains the API key.

## Update schedule

`.github/workflows/purdy-mvp.yml` runs every 5 minutes and can also be run manually from GitHub Actions.

The updater reads `SHARPAPI_KEY` from a GitHub Actions repository secret, requests the NFL futures board, finds Brock Purdy in the NFL MVP market, requires both free-tier prices to be present, averages them, and writes only the resulting Live Market value to `data/purdy-mvp.json`.

To avoid unnecessary repository commits, the workflow checks every 5 minutes but commits `data/purdy-mvp.json` only when the averaged Live Market changes. The market history therefore records actual price changes rather than duplicate five-minute snapshots.

## Required one-time setup

Create a GitHub Actions repository secret named exactly:

`SHARPAPI_KEY`

The API key must stay in GitHub Actions secrets. Do not add it to JavaScript, JSON, workflow source, or any other public repository file.

## Failure behavior

If the secret is missing, the scheduled workflow exits without changing the public data.

If the feed does not contain both required prices, the updater refuses to publish a partial Live Market and leaves the last valid value in place.
