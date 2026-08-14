/*
 * SnapComplete collection extractor
 *
 * Run this in the browser console while viewing the unfiltered profile page:
 * https://snapcomplete.com/u/abjcwf/cards
 *
 * It downloads collection.json. No card names or hand-maintained data are
 * required. The extractor intentionally uses SnapComplete's rendered DOM,
 * which is the stable data surface currently available on the public page.
 */
(async () => {
  const PROFILE_URL = "https://snapcomplete.com/u/abjcwf/cards";
  const CARD_SELECTOR = ".card-grid-item[aria-label]";

  if (location.hostname !== "snapcomplete.com") {
    throw new Error("Open the SnapComplete profile before running this extractor.");
  }

  if (new URL(location.href).searchParams.has("owned")) {
    throw new Error("Use the unfiltered profile URL (remove ?owned=Owned) so owned and unowned cards are both captured.");
  }

  const cards = [...document.querySelectorAll(CARD_SELECTOR)];
  if (!cards.length) {
    throw new Error("No cards found. Wait for SnapComplete to finish rendering, then run the extractor again.");
  }

  const clean = value => (value || "").replace(/\s+/g, " ").trim();
  const getSlug = imageUrl => {
    if (!imageUrl) return null;
    const match = imageUrl.match(/\/cards\/([^/?#]+?)(?:\.webp)?(?:[?#]|$)/i);
    return match ? match[1] : null;
  };
  const readPopularity = text => {
    const match = text.match(/([\d.]+K)\s*\((~?\d+%)\)/i);
    return match ? { owners: match[1], share: match[2] } : null;
  };
  const readSeriesSummary = text => {
    const result = {};
    for (const [label, owned, total] of text.matchAll(/\b(S1\/2|S3|S4|S5):\s*(\d+)\/(\d+)/g)) {
      result[label] = { owned: Number(owned), total: Number(total) };
    }
    return result;
  };

  const extractedCards = cards.map(card => {
    const image = card.querySelector("img");
    const imageUrl = image?.currentSrc || image?.src || null;
    const cardText = clean(card.innerText);
    const owned = card.classList.contains("owned");
    const unowned = card.classList.contains("unowned");
    const releaseMatch = cardText.match(/\b\d{2}\/\d{2}\/\d{2}\b/);
    const slug = getSlug(imageUrl);

    return {
      name: card.getAttribute("aria-label") || image?.alt || null,
      owned: owned ? true : unowned ? false : null,
      status: owned ? "owned" : unowned ? "unowned" : "unknown",
      series: null,
      card_id: slug,
      slug,
      image_url: imageUrl,
      release_date: releaseMatch ? releaseMatch[0] : null,
      popularity: readPopularity(cardText)
    };
  });

  const ownedCount = extractedCards.filter(card => card.owned === true).length;
  const unownedCount = extractedCards.filter(card => card.owned === false).length;
  const collection = {
    schema_version: 1,
    source: {
      profile_url: PROFILE_URL,
      extracted_url: location.href,
      method: "rendered DOM",
      card_selector: CARD_SELECTOR
    },
    extracted_at: new Date().toISOString(),
    profile_name: clean(document.querySelector("main h1")?.textContent),
    counts: {
      total: extractedCards.length,
      owned: ownedCount,
      unowned: unownedCount,
      unknown: extractedCards.length - ownedCount - unownedCount
    },
    series_summary: readSeriesSummary(document.body.innerText),
    cards: extractedCards
  };

  const json = JSON.stringify(collection, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "collection.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);

  console.log(`SnapComplete extraction complete: ${ownedCount} owned / ${unownedCount} unowned / ${extractedCards.length} total`);
  return collection;
})();
