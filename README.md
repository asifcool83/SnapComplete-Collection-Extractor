# SnapComplete Collection Extractor

Small browser-console extractor for the public SnapComplete collection at:

<https://snapcomplete.com/u/abjcwf/cards>

It reads the rendered card grid and downloads a fresh `collection.json` with card names, owned/unowned state, slugs/IDs, image URLs, release dates where shown, visible popularity, and series totals.

## Use

1. Open the unfiltered profile URL above. Do not use `?owned=Owned`; that view hides missing cards.
2. Wait until the collection grid finishes rendering.
3. Open the browser developer console, paste `extract_collection.js`, and run it.
4. Replace this repository's `collection.json` with the downloaded file and commit it.

The page currently exposes series totals in its header, not a per-card series value. Those totals are saved in `series_summary`; each card's `series` is `null` rather than guessed.

## Current snapshot

The checked-in `collection.json` is a live snapshot from the public profile. Re-run the extractor whenever the collection changes.

## Verification

Three fresh page loads and extractions were run against the live profile. Each passed the card-count, ownership, JSON-parse, and spot-check checks. See `verification.md`.
