# Launch checklist

## Local build

- [x] Project folder created
- [x] Apify Actor runtime code added
- [x] Input schema added
- [x] Dataset schema added
- [x] Output schema added
- [x] README added
- [x] Store listing copy added
- [x] Example input and output added
- [x] Original icon asset added
- [x] PNG and JPEG icon fallbacks added
- [x] Dependencies installed
- [x] Unit tests passing
- [x] Local smoke run passing
- [x] Git repository initialized
- [x] Initial commit created

## GitHub

- [x] New GitHub repository created: `trivago-hotel-scraper-lead-finder`
- [x] Local repository remote set to GitHub
- [x] Initial commit pushed
- [x] Repository checked for secrets

## Apify

- [x] Actor created in Apify
- [x] Actor source connected to GitHub repository
- [x] GitHub-connected cloud build succeeded
- [ ] Automatic builds from GitHub enabled in Console
- [x] Cloud build succeeded
- [x] Test run succeeded with Amsterdam
- [x] Test run succeeded with London
- [x] Output dataset checked for clean spreadsheet-ready rows
- [ ] Actor icon uploaded
- [x] Store title set
- [x] Short Store description set
- [x] SEO title set
- [x] SEO description set
- [x] Categories set
- [ ] Tags set
- [ ] README rendered correctly
- [x] Public Store page reachable
- [x] Source visibility preference reviewed
- [x] Monetization configured as pay per event
- [x] `apify-default-dataset-item` event enabled
- [x] Result price set to `$0.005` per dataset item
- [x] Store publication live

Monetization note: Apify accepted pay-per-event pricing on 2026-05-30 with a required future `startedAt` of 2026-06-14T17:21:05.933Z.

Icon note: the original SVG plus PNG/JPEG fallbacks are in `.actor/`. Apify rejected raw GitHub, jsDelivr, and key-value-store image URLs for `pictureUrl`; Console upload uses a UI-token-only `/upload/actor-picture/{actorId}` endpoint.

## Maintenance

- [ ] Add weekly scheduled smoke test after publishing
- [ ] Track failed runs and user-reported issues
- [ ] Review cost per 1,000 results after first paid runs
- [ ] Revisit pricing if proxy or compute costs change materially
