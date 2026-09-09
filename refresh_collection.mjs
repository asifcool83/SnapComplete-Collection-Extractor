import { chromium } from "playwright";
import fs from "node:fs/promises";

const PROFILE_URL = "https://snapcomplete.com/u/abjcwf/cards";
const MISSING_URL = `${PROFILE_URL}?owned=Missing`;
const CARD_SELECTOR = ".card-grid-item[aria-label]";
const OUT = "collection.json";

const clean = (value) => (value || "").replace(/\s+/g, " ").trim();

const cardIdFromImage = (url) => {
  const match = (url || "").match(/\/cards\/([^/?#]+?)(?:\.webp)?(?:[?#]|$)/i);
  return match ? match[1] : null;
};

const cardKey = (card) => card.id
  ? `id:${card.id}`
  : `name:${clean(card.name).toLowerCase()}`;

const readView = async (page, url, owned) => {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator(CARD_SELECTOR).first().waitFor({ state: "attached", timeout: 60000 });
  await page.waitForTimeout(3000);

  return page.evaluate(({ owned, selector }) => {
    const clean = (value) => (value || "").replace(/\s+/g, " ").trim();
    const cardIdFromImage = (url) => {
      const match = (url || "").match(/\/cards\/([^/?#]+?)(?:\.webp)?(?:[?#]|$)/i);
      return match ? match[1] : null;
    };
    const cards = [...document.querySelectorAll(selector)].map((card) => {
      const image = card.querySelector("img");
      const imageUrl = image?.currentSrc || image?.src || null;
      const id = cardIdFromImage(imageUrl);
      return {
        name: card.getAttribute("aria-label") || image?.alt || null,
        id,
        owned
      };
    });
    const series_summary = {};
    for (const [, label, ownedCount, total] of document.body.innerText.matchAll(/\b(S1\/2|S3|S4|S5):\s*(\d+)\/(\d+)/g)) {
      series_summary[label] = { owned: Number(ownedCount), total: Number(total) };
    }
    return {
      profile_name: clean(document.querySelector("main h1")?.textContent),
      series_summary,
      cards
    };
  }, { owned, selector: CARD_SELECTOR });
};

const mergeViews = (ownedView, missingView) => {
  const byKey = new Map();
  for (const card of [...ownedView.cards, ...missingView.cards]) {
    const key = cardKey(card);
    const existing = byKey.get(key);
    if (existing) {
      if (existing.owned !== card.owned) {
        throw new Error(`Card appeared in both ownership views: ${card.name || key}`);
      }
      throw new Error(`Card appeared more than once: ${card.name || key}`);
    }
    byKey.set(key, card);
  }
  return [...missingView.cards, ...ownedView.cards].map((card) => byKey.get(cardKey(card)));
};

const validate = (collection, previous) => {
  const errors = [];
  const { counts, cards, series_summary } = collection;
  const expectedTotal = Object.values(series_summary)
    .reduce((sum, entry) => sum + (Number.isInteger(entry.total) ? entry.total : 0), 0);
  if (counts.total <= 0) errors.push("no cards were found");
  if (counts.total !== cards.length) errors.push(`counts.total=${counts.total} but cards.length=${cards.length}`);
  if (counts.unknown !== 0) errors.push(`unknown ownership count is ${counts.unknown}`);
  if (!cards.every((card) => card.name && typeof card.owned === "boolean")) {
    errors.push("one or more cards has no name or boolean ownership");
  }
  if (expectedTotal > 0 && expectedTotal !== counts.total) {
    errors.push(`series total=${expectedTotal} but card total=${counts.total}`);
  }
  if (previous?.counts?.total && counts.total < previous.counts.total) {
    errors.push(`card total dropped from ${previous.counts.total} to ${counts.total}`);
  }
  if (errors.length) {
    throw new Error(`Collection validation failed: ${errors.join("; ")}; existing snapshot was preserved.`);
  }
};

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const ownedView = await readView(page, PROFILE_URL, true);
  const missingView = await readView(page, MISSING_URL, false);
  const cards = mergeViews(ownedView, missingView);
  const collection = {
    schema_version: 1,
    source: {
      profile_url: PROFILE_URL,
      extracted_url: PROFILE_URL,
      view_urls: [PROFILE_URL, MISSING_URL],
      method: "Playwright rendered DOM from owned and missing views",
      card_selector: CARD_SELECTOR
    },
    extracted_at: new Date().toISOString(),
    profile_name: ownedView.profile_name,
    counts: {
      total: cards.length,
      owned: cards.filter((card) => card.owned === true).length,
      unowned: cards.filter((card) => card.owned === false).length,
      unknown: cards.filter((card) => typeof card.owned !== "boolean").length
    },
    series_summary: ownedView.series_summary,
    cards
  };

  let previous = null;
  try { previous = JSON.parse(await fs.readFile(OUT, "utf8")); } catch {}
  validate(collection, previous);

  const temp = `.collection.${process.pid}.json`;
  await fs.writeFile(temp, JSON.stringify(collection, null, 2) + "\n");
  await fs.rename(temp, OUT);
  console.log(JSON.stringify({ extracted_at: collection.extracted_at, counts: collection.counts }));
} finally {
  await browser.close();
}
