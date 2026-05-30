# Trivago Hotel Scraper and Lead Finder

Extract public Trivago hotel listing data for hotel research, price comparison, travel market analysis, competitor tracking, and B2B lead-generation workflows.

This Actor lets you enter a destination such as `Amsterdam`, `London`, `Paris`, or `Barcelona` and returns clean hotel listing records that can be exported to CSV, Excel, JSON, Google Sheets, Make, Zapier, n8n, or your own systems through the Apify API.

## What this Actor does

The Actor extracts publicly visible hotel listing data from Trivago destination pages, including:

- hotel name
- public Trivago hotel URL
- destination, city, and country
- star rating when visible
- guest rating and review count when visible
- visible listing-card price when available
- visible booking provider count when available
- image URL when visible
- public listing highlights
- ranking position
- source search URL
- scrape timestamp

The Actor does not log in, does not scrape private accounts, does not bypass paywalls, and does not collect guest or reviewer personal data.

## Why use it

Manual hotel research is slow. This Actor turns public Trivago listing pages into a structured dataset that can be filtered, enriched, exported, monitored, or loaded into a CRM.

Use it to:

- collect public hotel listings by destination
- compare visible listing-card prices
- research hotel competition in a city
- collect public ratings and review counts
- build destination-level hotel databases
- feed hotel data into outreach and lead-generation workflows
- monitor public listing changes over time with Apify schedules

## Who it is for

- travel agencies
- hotel marketers
- B2B lead-generation teams
- hotel outreach teams
- market researchers
- price comparison researchers
- tourism data analysts
- automation builders using Apify, Make, Zapier, n8n, or Google Sheets

## Input

| Field | Type | Description |
| --- | --- | --- |
| `destination` | string | City, region, country, landmark, or public Trivago destination URL. |
| `checkIn` | string | Optional `YYYY-MM-DD` check-in date. Returned in output for downstream workflows. |
| `checkOut` | string | Optional `YYYY-MM-DD` check-out date. Must be after check-in. |
| `adults` | integer | Number of adults to record with the run. |
| `rooms` | integer | Number of rooms to record with the run. |
| `currency` | string | Optional preferred currency. Trivago decides what currency is visible on the public page. |
| `maxResults` | integer | Maximum hotel listing records to return. |
| `includePrices` | boolean | Include public visible price fields when available. |
| `includeBookingProviders` | boolean | Include provider count and provider fields when available. |
| `includeImages` | boolean | Include public image URLs when available. |
| `includeRatings` | boolean | Include rating fields when available. |
| `includeAmenities` | boolean | Include public listing highlights when available. |
| `deduplicateResults` | boolean | Remove duplicate hotels using Trivago IDs and URLs. |
| `proxyConfiguration` | object | Apify proxy configuration. Residential proxies are recommended for cloud runs if datacenter traffic is blocked. |
| `maxRetries` | integer | Number of retries for public page requests. |
| `debugMode` | boolean | Save debug HTML and parsing summary to key-value store. |

## Example input

```json
{
  "destination": "Amsterdam",
  "checkIn": "2026-07-01",
  "checkOut": "2026-07-02",
  "adults": 2,
  "rooms": 1,
  "currency": "EUR",
  "maxResults": 100,
  "includePrices": true,
  "includeBookingProviders": true,
  "includeImages": true,
  "includeRatings": true,
  "includeAmenities": true,
  "deduplicateResults": true
}
```

## Output

Each dataset item represents one public Trivago hotel listing.

```json
{
  "hotelName": "Example Hotel Amsterdam",
  "hotelUrl": "https://www.trivago.com/en-US/oar/example-hotel-amsterdam?search=100-123456",
  "trivagoUrl": "https://www.trivago.com/en-US/oar/example-hotel-amsterdam?search=100-123456",
  "destination": "Amsterdam",
  "city": "Amsterdam",
  "country": "Netherlands",
  "starRating": 4,
  "guestRating": 8.6,
  "reviewCount": 1248,
  "price": 129,
  "currency": "EUR",
  "pricePerNight": 129,
  "checkIn": "2026-07-01",
  "checkOut": "2026-07-02",
  "bookingProvider": null,
  "providerUrl": null,
  "allVisibleProviders": [],
  "providerCount": 18,
  "imageUrl": "https://imgcy.trivago.com/...",
  "visibleHighlights": [
    "Excellent public transport access"
  ],
  "rankingPosition": 1,
  "sourceSearchUrl": "https://www.trivago.com/en-US/odr/hotels-amsterdam-netherlands?search=200-27561",
  "scrapedAt": "2026-05-30T00:00:00.000Z"
}
```

Fields that are not publicly visible on the listing page are returned as `null` or empty arrays.

## How to run

### On Apify

1. Open the Actor.
2. Enter a destination.
3. Optionally enter check-in and check-out dates.
4. Choose the maximum number of results.
5. Run the Actor.
6. Export the dataset as CSV, Excel, JSON, or access it through the Apify API.

### Locally

```bash
npm install
npm start
```

For local testing with Apify storage:

```bash
mkdir storage\key_value_stores\default
copy examples\local-smoke-input.json storage\key_value_stores\default\INPUT.json
npm start
```

## Export and integrations

Because the Actor stores records in the default Apify dataset, results can be used with:

- CSV, Excel, JSON, XML, RSS, and HTML exports
- Apify API dataset endpoints
- Google Sheets integrations
- Make scenarios
- Zapier workflows
- n8n workflows
- webhooks and scheduled runs
- CRM imports and enrichment pipelines

## Responsible use

Use this Actor only for lawful research, market analysis, and lead-generation workflows based on public Trivago listing data.

Do not use it to:

- scrape private user data
- collect guest or reviewer personal data
- bypass logins, paywalls, or access controls
- overload Trivago or booking providers
- misrepresent your relationship with Trivago
- use Trivago logos or protected brand assets in your own marketing

Always review your use case for compliance with applicable laws, platform terms, and data protection rules.

## Limitations

- Trivago public destination pages commonly expose a limited set of listing cards in the initial public HTML.
- Live provider names, exact availability, and exact stay-date pricing may not be visible on every public listing page.
- Check-in, check-out, adults, rooms, and preferred currency are recorded in output for downstream workflows; public SEO listing pages may still show forecasted or general listing-card prices.
- Provider URLs are only returned when publicly visible on the listing card.
- Hotel emails and phone numbers are not collected in version 1.
- If Trivago blocks a request from a datacenter IP, use Apify Residential proxy.

## Pricing

Recommended Apify Store monetization:

- Pricing model: Pay per event
- Primary event: `apify-default-dataset-item`
- Price: `$0.005` per hotel listing result
- Equivalent: `$5.00 per 1,000 hotel listing records`
- Keep the synthetic `apify-actor-start` event enabled at the Apify default.

This maps user cost directly to delivered hotel records and keeps pricing easy to understand.

## FAQ

### Does this scrape private data?

No. It extracts public hotel listing data visible on Trivago destination pages.

### Does it collect hotel emails?

No. Version 1 focuses on public hotel listings, visible prices, ratings, provider counts, image URLs, and metadata. Email discovery can be added later only from public hotel websites and only with a separate responsible-use review.

### Why are some fields null?

Trivago does not expose every field for every listing. The Actor keeps the output schema stable and returns `null` or empty arrays when a field is not publicly visible.

### Can I schedule price monitoring?

Yes. Use Apify schedules to run the Actor repeatedly and compare datasets over time. A future version can add changed-price-only output.

### Can I use the output in Google Sheets?

Yes. Export the Apify dataset to CSV or connect Apify to Google Sheets, Make, Zapier, or n8n.

### Is this affiliated with Trivago?

No. This Actor is an independent tool for extracting public listing data and does not use Trivago branding or logos.
