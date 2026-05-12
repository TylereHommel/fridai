# ScalpBot — CLAUDE.md

Automated Pokemon TCG market intelligence bot. Monitors news, tracks prices, scores sentiment, and posts Discord alerts — all serverless via GitHub Actions. No server required, no laptop needed.

---

## What It Does

| Feature | Description |
|---|---|
| **Weekly Report** | Every Sunday 9am PST — sentiment scores + PriceCharting prices for all tracked products, posted to Discord |
| **News Monitor** | Every 15 minutes — watches RSS feeds for breaking Pokemon TCG news, posts alerts to Discord |
| **Daily Digest** | Every day 6am PST — batches minor news items into a single digest embed |
| **Price Monitor** | Every day 6:30am PST — scrapes PriceCharting for each product, alerts Discord if price changes significantly |

---

## Architecture

**Zero dependencies** — no npm packages. Everything uses Node.js built-in `https`, `fs`, `path`. Runs on Node 20+.

**State is stored in `/state/` as JSON files**, committed back to the repo by GitHub Actions after each run:
- `state/seen-urls.json` — news URLs already posted (dedup)
- `state/minor-queue.json` — minor news items buffered for daily digest
- `state/price-history.json` — historical PriceCharting prices per product
- `state/dynamic-products.json` — auto-detected products added at runtime

---

## Scripts

| File | Purpose |
|---|---|
| `scripts/products.js` | Static product watchlist + `getAllProducts()` merges dynamic products |
| `scripts/weekly-report.js` | Main weekly report — sentiment scoring + pricing + Discord post |
| `scripts/news-monitor.js` | RSS polling, breaking news detection, minor queue management |
| `scripts/daily-digest.js` | Flushes minor queue to a single Discord digest embed |
| `scripts/price-monitor.js` | Daily PriceCharting scrape, compares to history, alerts on change |
| `scripts/pricing.js` | `fetchPricing()` — scrapes PriceCharting HTML for ungraded price |
| `scripts/apify.js` | `search()` via Apify Google Search Scraper, `scrape()` via raw HTTP GET |
| `scripts/discord.js` | `postWebhook()`, all embed builders (weekly, breaking, digest, new product) |
| `scripts/rss.js` | RSS feed fetching and parsing |
| `scripts/classify.js` | Classifies news items as breaking vs minor |
| `scripts/product-detector.js` | Auto-detects new TCG products from news articles |

---

## GitHub Actions Workflows

| Workflow | Schedule | Secrets Needed |
|---|---|---|
| `weekly-report.yml` | Sundays 17:00 UTC (9am PST) | `APIFY_API_TOKEN`, `DISCORD_WEBHOOK_URL` |
| `news-monitor.yml` | Every 15 minutes | `DISCORD_WEBHOOK_URL` |
| `daily-digest.yml` | Daily 14:00 UTC (6am PST) | `DISCORD_WEBHOOK_URL` |
| `price-monitor.yml` | Daily 14:30 UTC (6:30am PST) | `DISCORD_WEBHOOK_URL` |

All workflows can also be triggered manually via **workflow_dispatch** from the GitHub Actions UI.

---

## Secrets (GitHub Repository Secrets)

| Secret | Value |
|---|---|
| `DISCORD_WEBHOOK_URL` | Discord channel webhook URL |
| `APIFY_API_TOKEN` | Apify API token (used only by weekly report for Google search) |

> For local testing, create a `.env` file (not committed) with these two keys and pass them inline:
> `DISCORD_WEBHOOK_URL=... APIFY_API_TOKEN=... node scripts/weekly-report.js`

---

## Product Watchlist

Defined in `scripts/products.js`. Each product has:

```js
{
  name: 'Prismatic Evolutions ETB',
  msrp: 54.99,
  tier: 1,                          // 1 = high priority, 2 = watch list
  ebaySearchTerm: '...',            // used to build eBay sold listings URL
  pricechartingSet: '...',          // URL segment: pricecharting.com/game/{set}/{product}
  pricechartingProduct: '...',
  chaseCard: 'Umbreon ex #161 SIR', // or 'TBD'
  skus: { pokemonCenter, target, walmart, amazon },
}
```

Pokemon Center ETBs are tracked as **separate entries** from standard ETBs — they have different PriceCharting slugs and eBay search terms.

---

## Sentiment Scoring (Weekly Report)

1. Apify runs ~N Google queries (one per set name + positive/negative control queries)
2. Each result is matched against product name tokens
3. Positive keywords (`chase`, `hype`, `hot`, `invest`, etc.) and negative keywords (`sitting`, `avoid`, `dump`, etc.) are counted
4. Score = `positiveCount / (positiveCount + negativeCount) * 100`
5. BiasScore = `mentionRatio * 40 + score * 0.6` (blends coverage with sentiment)
6. Recommendation: `≥70 = CHASE`, `≥40 = HOLD`, `<40 = SKIP`

---

## Pricing

- Source: **PriceCharting** HTML scrape (no API key needed)
- Looks for "Ungraded $X.XX" pattern in page text
- Falls back to regex price extraction if not found
- eBay scraping was removed — blocked by bot detection
- `avg10` (average of last 10 eBay sales) is currently `null` — not implemented

---

## Discord Embeds

All embeds built in `scripts/discord.js`:

| Builder | Color | Used For |
|---|---|---|
| `buildWeeklyReportEmbed()` | Purple | Weekly sentiment + pricing report |
| `buildBreakingEmbed()` | Red | Breaking news alert |
| `buildDigestEmbed()` | Blue | Daily minor news digest |
| `buildNewProductEmbed()` | Green | Auto-detected new product |

**Important:** Discord limits embeds to 6000 chars per message. The weekly report posts as **2 separate webhook calls** — Tier 1 and Tier 2 embeds sent individually.

---

## Known Issues / Notes

- PriceCharting prices for **Pokemon Center ETBs** may return fallback values ($175, $288.69) — the product slugs may not resolve correctly for PC-exclusive variants. Worth auditing the `pricechartingProduct` slug for each.
- `avg10` and `mostRecentSale` are always `null` — eBay sold data was removed due to bot blocking. Future improvement: Apify eBay scraper.
- Dynamic products (`state/dynamic-products.json`) are auto-detected but still use placeholder SKUs.

---

## Running Locally

```bash
# Weekly report (needs both secrets)
DISCORD_WEBHOOK_URL=... APIFY_API_TOKEN=... node scripts/weekly-report.js

# News monitor (no Apify needed)
DISCORD_WEBHOOK_URL=... node scripts/news-monitor.js

# Daily digest
DISCORD_WEBHOOK_URL=... node scripts/daily-digest.js

# Price monitor
DISCORD_WEBHOOK_URL=... node scripts/price-monitor.js

# Test Discord connection only
DISCORD_WEBHOOK_URL=... node scripts/discord.js --test

# Test pricing scrape
node scripts/pricing.js --test
```
