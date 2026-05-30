# Apify Store listing

## Title

Trivago Hotel Scraper and Lead Finder

## Subtitle

Extract public Trivago hotel listings, prices, ratings, booking provider counts, images, and hotel metadata for travel research and lead generation.

## SEO title

Trivago Hotel Scraper and Lead Finder

## SEO description

Scrape public Trivago hotel listings, prices, ratings, booking providers, images, and hotel metadata. Export hotel data for travel research and lead generation.

## Short marketing description

Extract clean public Trivago hotel listing data for hotel research, price comparison, travel market analysis, and B2B lead workflows.

## Categories

- Travel
- Lead Generation
- Market Research
- Price Monitoring

## Tags

- trivago
- hotel scraper
- hotel leads
- travel data
- hotel research
- price comparison
- market research
- tourism data
- lead generation
- booking providers
- hotel ratings
- hotel images
- csv export
- google sheets
- make
- zapier
- n8n

## Store description

Trivago Hotel Scraper and Lead Finder extracts public hotel listing data from Trivago destination pages and turns it into clean structured records for travel research, hotel market analysis, competitor tracking, price comparison, and B2B lead-generation workflows.

Users enter a destination such as Amsterdam, London, Paris, or Barcelona and receive hotel names, public Trivago URLs, visible prices, ratings, review counts, provider counts, images, public highlights, ranking positions, and source URLs where available.

The Actor is designed for non-technical users and automation builders. Results can be exported to CSV, Excel, JSON, Google Sheets, Make, Zapier, n8n, webhooks, or the Apify API.

## Monetization configuration

Recommended Apify Store setup:

- Pricing model: Pay per event
- Synthetic start event: keep `apify-actor-start` enabled at Apify default pricing
- Primary result event: enable synthetic `apify-default-dataset-item`
- Price per result event: `$0.005`
- Displayed equivalent: `$5.00 per 1,000 hotel listing records`
- Platform usage: include platform usage in event price after validating test-run compute costs
- Major pricing changes: avoid frequent changes because Apify requires notice for major monetization changes
- Current Apify configuration: pay-per-event pricing accepted on 2026-05-30 and scheduled to start on 2026-06-14 because Apify requires a future effective date for this pricing update.

Rationale: The Actor creates one dataset item per hotel listing. Apify can automatically charge `apify-default-dataset-item` for every item written to the default dataset, so billing maps directly to the number of delivered hotel records.

## Icon

Use `.actor/actor_icon.svg` as the listing icon. It is an original hotel/search/price-comparison icon with no Trivago logo, no Trivago text, no watermark, and no protected brand elements.

## Responsible use note

This Actor extracts publicly visible hotel listing data only. It does not log in, bypass paywalls, collect private user data, collect guest or reviewer personal data, or pretend to be affiliated with Trivago.

## Launch checklist

- [x] Working Apify Actor source code
- [x] Input schema
- [x] Output schema
- [x] Dataset schema
- [x] README
- [x] Store title
- [x] Subtitle
- [x] SEO title
- [x] SEO description
- [x] Short marketing description
- [x] Categories and tags
- [x] Example input
- [x] Example output
- [x] Responsible use note
- [x] Monetization plan
- [x] Original non-branded icon asset
- [ ] GitHub repository pushed
- [x] Apify Actor created
- [ ] Automatic builds from GitHub configured
- [x] Apify cloud build succeeded
- [x] Apify test run succeeded
- [x] Monetization configured on Apify
- [x] Actor published on Apify Store

## Suggested first test runs

1. Amsterdam, max 5
2. London, max 5
3. Paris, max 5
4. Barcelona, max 5

Confirm that each run returns hotel names, URLs, ratings where available, visible prices where available, provider counts where available, images, source URL, and timestamps.
