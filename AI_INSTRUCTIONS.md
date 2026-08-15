# Marvel Snap collection data

This repository contains the latest available SnapComplete collection snapshot in `collection.json`.

## Rules for connected AI tools

1. Read `collection.json` before answering ownership-dependent questions.
2. Treat `cards[].owned == true` as owned and `cards[].owned == false` as missing.
3. Check `extracted_at` and report it when freshness matters.
4. Use `counts` and `series_summary` for totals; do not infer ownership from popularity or images.
5. If the snapshot is missing, invalid, stale, or has `counts.unknown > 0`, say so instead of guessing.
6. For a question asking what is owned now, treat a snapshot older than two hours as stale and do not present it as current.
7. Do not overwrite the snapshot unless the extractor has completed validation.

`.github/workflows/refresh-collection.yml` runs the rendered SnapComplete extractor hourly and commits `collection.json` only when the validated snapshot changes. `refresh_collection.mjs` uses a temporary browser runner on GitHub's runner; it is not stored in the repository dependencies.

The service intentionally keeps only one snapshot and overwrites `collection.json` atomically. This file is guidance for any AI connected to the repository; it is not a live connection by itself. The AI or connector must have read access to the repository.
