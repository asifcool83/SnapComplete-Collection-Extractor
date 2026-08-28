---
name: marvel-snap-collection-advisor
description: Use Asif's live SnapComplete collection snapshot to answer Marvel Snap ownership, shop, token-spending, deck-building, missing-card, and collection-priority questions.
---

# Marvel Snap Collection Advisor

Use this skill whenever a question depends on the user's current Marvel Snap collection.

## Collection source

Repository: `asifcool83/SnapComplete-Collection-Extractor`
Snapshot: `collection.json`

Before every ownership-dependent answer:

1. Fetch `collection.json` fresh from the repository. Never rely on memory or an earlier fetch.
2. Read `extracted_at`. If the snapshot is more than 2 hours old, state that it is stale and refresh/re-run the repository extractor when the available GitHub tools permit it. Do not claim stale data is current.
3. Require `counts.unknown == 0`. If unknown cards exist, report the validation problem instead of guessing.
4. Treat `cards[].owned == true` as owned and `cards[].owned == false` as missing.
5. Use `counts` and `series_summary` for collection totals.

## Recommendation workflow

For questions such as "should I buy this card?", "what should I pin?", "what am I missing?", "build me a deck", or "what should I spend tokens on?":

1. Refresh/read the user's collection first.
2. For meta-sensitive recommendations, research current Marvel Snap balance/meta information from fresh web sources. Prefer recent competitive/statistical sources and corroborate when possible.
3. Exclude cards the user already owns from acquisition recommendations.
4. Check whether recommended decks can actually be built from owned cards; explicitly identify any missing pieces.
5. Optimize scarce resources such as Collector's Tokens rather than recommending a card merely because it is playable.
6. When evaluating a shop screenshot, read the visible card, series and price, then compare it against the user's missing-card priorities.
7. Give a direct verdict: BUY, PIN/WAIT, or SKIP, followed by the shortest useful reason.

## User preference

Keep Marvel Snap recommendations concise and decisive. When useful, rank missing cards in exact acquisition order rather than giving a broad tier list.
