import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeInput,
  parseSearchPage,
  toDatasetItems
} from '../src/trivago.js';

test('normalizeInput validates required destination and dates', () => {
  assert.throws(() => normalizeInput({}), /destination/);
  assert.throws(
    () => normalizeInput({ destination: 'Amsterdam', checkIn: '2026-07-02', checkOut: '2026-07-01' }),
    /checkOut/
  );

  const input = normalizeInput({
    destination: ' Amsterdam ',
    checkIn: '2026-07-01',
    checkOut: '2026-07-02',
    maxResults: 5
  });

  assert.equal(input.destination, 'Amsterdam');
  assert.equal(input.adults, 2);
  assert.equal(input.rooms, 1);
  assert.equal(input.maxResults, 5);
});

test('parseSearchPage extracts obfuscated Trivago public listing state', () => {
  const input = normalizeInput({
    destination: 'Amsterdam',
    checkIn: '2026-07-01',
    checkOut: '2026-07-02',
    currency: 'EUR',
    maxResults: 10
  });
  const html = buildFixtureHtml();
  const parsed = parseSearchPage(html, {
    input,
    pageUrl: 'https://www.trivago.com/en-US/odr/hotels-amsterdam-netherlands?search=200-27561'
  });

  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.destinationContext.destinationName, 'Amsterdam');
  assert.equal(parsed.destinationContext.country, 'Netherlands');
  assert.equal(parsed.currency, 'EUR');

  const items = toDatasetItems(parsed, input, 'https://www.trivago.com/en-US/odr/hotels-amsterdam-netherlands?search=200-27561');
  assert.equal(items.length, 2);
  assert.equal(items[0].hotelName, 'Example Hotel Amsterdam');
  assert.equal(items[0].city, 'Amsterdam');
  assert.equal(items[0].country, 'Netherlands');
  assert.equal(items[0].price, 129);
  assert.equal(items[0].currency, 'EUR');
  assert.equal(items[0].providerCount, 18);
  assert.equal(items[0].rankingPosition, 1);
  assert.match(items[0].imageUrl, /^https:\/\/imgcy\.trivago\.com\//);
  assert.deepEqual(items[0].visibleHighlights, ['Canal views', 'Near public transit']);
});

test('toDatasetItems deduplicates by Trivago namespace ID', () => {
  const input = normalizeInput({ destination: 'Amsterdam', maxResults: 10, deduplicateResults: true });
  const parsed = parseSearchPage(buildFixtureHtml({ includeDuplicate: true }), { input });
  const items = toDatasetItems(parsed, input, 'https://www.trivago.com/en-US/odr/hotels-amsterdam-netherlands?search=200-27561');

  assert.equal(items.length, 2);
});

function buildFixtureHtml(options = {}) {
  const rows = [
    [
      { id: 123456, ns: 100 },
      {
        nsid: { id: 123456, ns: 100 },
        name: 'Example Hotel Amsterdam',
        url: '/en-US/oar/example-hotel-amsterdam?search=100-123456',
        image: '/hotelier-images/example',
        imageCount: 12,
        location: { label: 'Amsterdam, Netherlands', nearby: '1 km to City center' },
        category: { stars: 4, label: 'Hotel' },
        rating: { ratingsCount: 1248, rating: 8.6, label: 'Excellent' },
        forecastedPrice: { dates: 'Jul 2026', amount: 129, eurocents: 12900, advertiserCount: 18 },
        featuredHighlights: [{ title: 'Canal views' }, { title: 'Near public transit' }],
        advertisersWithEligiblePrices: 18
      }
    ],
    [
      { id: 987654, ns: 100 },
      {
        nsid: { id: 987654, ns: 100 },
        name: 'Second Hotel Amsterdam',
        url: '/en-US/oar/second-hotel-amsterdam?search=100-987654',
        image: '/hotelier-images/example-two',
        imageCount: 8,
        location: { label: 'Amsterdam, Netherlands' },
        category: { stars: 3, label: 'Hotel' },
        rating: { ratingsCount: 500, rating: 7.9, label: 'Good' },
        forecastedPrice: { dates: 'Jul 2026', amount: 99, eurocents: 9900, advertiserCount: 6 },
        featuredHighlights: [],
        advertisersWithEligiblePrices: 6
      }
    ]
  ];

  if (options.includeDuplicate) rows.push(rows[0]);

  const nextData = {
    props: {
      pageProps: {
        initialState: {
          environment: {
            initialUrl: 'http://www.trivago.com/en-US/odr/hotels-amsterdam-netherlands?search=200-27561',
            currencyCode: 'EUR',
            languageCode: 'en-US'
          },
          gqlApi: {
            queries: {
              [`staticSearchResults(${JSON.stringify({
                variables: {
                  params: {
                    currency: 'EUR',
                    stayPeriod: {
                      arrival: '2026-07-01',
                      departure: '2026-07-02'
                    }
                  }
                }
              })})`]: {
                status: 'fulfilled',
                endpointName: 'staticSearchResults',
                data: Object.fromEntries(rows.map((row, index) => [String(index), row]))
              },
              'destinationDetails({"nsids":[{"id":27561,"ns":200}]})': {
                status: 'fulfilled',
                endpointName: 'destinationDetails',
                data: [
                  [
                    { id: 27561, ns: 200 },
                    {
                      nsid: { id: 27561, ns: 200 },
                      name: 'Amsterdam',
                      type: { name: 'City' },
                      locationLabel: 'North Holland, Netherlands',
                      accommodationCount: 3252,
                      coordinates: { latitude: 52.37, longitude: 4.89 },
                      hierarchy: [
                        { name: 'Europe', type: { name: 'Continent' } },
                        { name: 'Netherlands', type: { name: 'Country' } },
                        { name: 'North Holland', type: { name: 'Region' } },
                        { name: 'Amsterdam', type: { name: 'City' } }
                      ]
                    }
                  ]
                ]
              }
            }
          }
        }
      }
    }
  };

  const encoded = Buffer.from(JSON.stringify(nextData), 'utf8').toString('base64');
  return `<!doctype html><html><body><script id="__NEXT_DATA__" type="application/json">"${encoded}"</script></body></html>`;
}
