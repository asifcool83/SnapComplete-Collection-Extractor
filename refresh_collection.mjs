import { chromium } from "playwright";
import fs from "node:fs/promises";

const URL = "https://snapcomplete.com/u/abjcwf/cards";
const OUT = "collection.json";

const clean = (value) => (value || "").replace(/\s+/g, " ").trim();
const slug = (url) => {
  const match = (url || "").match(/\/cards\/([^/?#]+?)(?:\.webp)?(?:[?#]|$)/i);
  return match ? match[1] : null;
};

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator(".card-grid-item[aria-label]").first().waitFor({ state: "attached", timeout: 60000 });
  await page.waitForTimeout(3000);

  const collection = await page.evaluate(() => {
    const clean = (value) => (value || "").replace(/\s+/g, " ").trim();
    const cards = [...document.querySelectorAll(".card-grid-item[aria-label]")].map((card) => {
      const image = card.querySelector("img");
      const imageUrl = image?.currentSrc || image?.src || null;
      const owned = card.classList.contains("owned");
      const unowned = card.classList.contains("unowned");
      return {
        name: card.getAttribute("aria-label") || image?.alt || null,
        id: imageUrl ? (imageUrl.match(/\/cards\/([^/?#]+?)(?:\.webp)?(?:[?#]|$)/i) || [])[1] || null : null,
        owned: owned ? true : unowned ? false : null
      };
    });
    const series_summary = {};
    for (const [, label, owned, total] of document.body.innerText.matchAll(/\b(S1\/2|S3|S4|S5):\s*(\d+)\/(\d+)/g)) {
      series_summary[label] = { owned: Number(owned), total: Number(total) };
    }
    return {
      schema_version: 1,
      source: { profile_url: location.href, extracted_url: location.href, method: "Playwright rendered DOM", card_selector: ".card-grid-item[aria-label]" },
      extracted_at: new Date().toISOString(),
      profile_name: clean(document.querySelector("main h1")?.textContent),
      counts: {
        total: cards.length,
        owned: cards.filter((card) => card.owned === true).length,
        unowned: cards.filter((card) => card.owned === false).length,
        unknown: cards.filter((card) => card.owned === null).length
      },
      series_summary,
      cards
    };
  });

  let previous = null;
  try { previous = JSON.parse(await fs.readFile(OUT, "utf8")); } catch {}
  const counts = collection.counts;
  const valid = counts.total > 0 &&
    (!previous || counts.total >= previous.counts.total) &&
    counts.total === collection.cards.length &&
    counts.unknown === 0 &&
    collection.cards.every((card) => card.name && (card.owned === true || card.owned === false));
  if (!valid) throw new Error("Collection validation failed; existing snapshot was preserved.");

  const temp = `.collection.${process.pid}.json`;
  await fs.writeFile(temp, JSON.stringify(collection, null, 2) + "\n");
  await fs.rename(temp, OUT);
  console.log(JSON.stringify({ extracted_at: collection.extracted_at, counts }));
} finally {
  await browser.close();
}
