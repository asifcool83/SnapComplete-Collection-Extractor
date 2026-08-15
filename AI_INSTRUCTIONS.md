# Marvel Snap collection data

This repository contains the latest available SnapComplete collection snapshot in `collection.json`.

## Rules for connected AI tools

1. Read `collection.json` before answering ownership-dependent questions.
2. Treat `cards[].owned == true` as owned and `cards[].owned == false` as missing.
3. Check `extracted_at` and report it when freshness matters.
4. Use `counts` and `series_summary` for totals; do not infer ownership from popularity or images.
5. If the snapshot is missing, invalid, stale, or has `counts.unknown > 0`, say so instead of guessing.
6. Do not overwrite the snapshot unless the extractor has completed validation.

The hourly service intentionally keeps only one snapshot and overwrites `collection.json` atomically. The extractor source is `hourly_extract.py`; its schedule is described by `com.snapcomplete.hourly.plist`.

This file is guidance for any AI connected to the repository. It is not a live connection by itself: the AI or connector must have read access to the repository.
