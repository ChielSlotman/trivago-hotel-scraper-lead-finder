import { gotScraping } from 'got-scraping';

const TRIVAGO_ORIGIN = 'https://www.trivago.com';
const DATE_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const MAX_PUBLIC_SEO_RESULTS = 35;

const DEFAULT_INPUT = {
  adults: 2,
  rooms: 1,
  maxResults: 100,
  includePrices: true,
  includeBookingProviders: true,
  includeImages: true,
  includeRatings: true,
  includeAmenities: true,
  deduplicateResults: true,
  maxRetries: 3,
  requestTimeoutSecs: 45,
  languageCode: 'en-US',
  debugMode: false
};

export function normalizeInput(rawInput = {}) {
  const input = {
    ...DEFAULT_INPUT,
    ...rawInput
  };

  input.destination = String(input.destination ?? '').trim();
  if (!input.destination) {
    throw new Error('Input "destination" is required.');
  }

  input.checkIn = normalizeOptionalDate(input.checkIn, 'checkIn');
  input.checkOut = normalizeOptionalDate(input.checkOut, 'checkOut');
  if (input.checkIn && input.checkOut && input.checkOut <= input.checkIn) {
    throw new Error('Input "checkOut" must be after "checkIn".');
  }

  input.adults = toBoundedInteger(input.adults, 1, 20, DEFAULT_INPUT.adults, 'adults');
  input.rooms = toBoundedInteger(input.rooms, 1, 10, DEFAULT_INPUT.rooms, 'rooms');
  input.maxResults = toBoundedInteger(input.maxResults, 1, 500, DEFAULT_INPUT.maxResults, 'maxResults');
  input.maxRetries = toBoundedInteger(input.maxRetries, 0, 10, DEFAULT_INPUT.maxRetries, 'maxRetries');
  input.requestTimeoutSecs = toBoundedInteger(
    input.requestTimeoutSecs,
    10,
    180,
    DEFAULT_INPUT.requestTimeoutSecs,
    'requestTimeoutSecs'
  );
  input.currency = input.currency ? String(input.currency).trim().toUpperCase() : null;
  input.languageCode = String(input.languageCode || DEFAULT_INPUT.languageCode).trim();

  return input;
}

export async function resolveSearchUrl(input, requestOptions) {
  if (isHttpUrl(input.destination)) {
    const url = new URL(input.destination);
    if (!url.hostname.includes('trivago.')) {
      throw new Error('When using a URL as destination, it must be a public Trivago URL.');
    }
    return url.toString();
  }

  const resolverUrl = new URL(`/${input.languageCode}/osr/`, TRIVAGO_ORIGIN);
  resolverUrl.searchParams.set('query', input.destination);

  const response = await requestText(resolverUrl.toString(), {
    ...requestOptions,
    followRedirect: false
  });

  const location = response.headers?.location;
  if (location) {
    return new URL(location, TRIVAGO_ORIGIN).toString();
  }

  const canonical = response.body.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1];
  if (canonical?.includes('/odr/')) {
    return new URL(canonical, TRIVAGO_ORIGIN).toString();
  }

  throw new Error(`Could not resolve destination "${input.destination}" to a public Trivago destination page.`);
}

export async function requestText(url, options = {}) {
  const {
    proxyConfiguration = null,
    maxRetries = 3,
    requestTimeoutSecs = 45,
    followRedirect = true,
    logger = console
  } = options;

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const proxyUrl = proxyConfiguration ? await proxyConfiguration.newUrl() : undefined;
      const response = await gotScraping({
        url,
        proxyUrl,
        followRedirect,
        throwHttpErrors: false,
        responseType: 'text',
        timeout: { request: requestTimeoutSecs * 1000 },
        retry: { limit: 0 },
        headers: {
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.9',
          'cache-control': 'no-cache',
          referer: TRIVAGO_ORIGIN
        }
      });

      if (response.statusCode >= 200 && response.statusCode < 400) {
        return {
          body: response.body,
          statusCode: response.statusCode,
          url: response.url,
          headers: response.headers
        };
      }

      const blocked = response.statusCode === 403 || /Access Denied/i.test(response.body ?? '');
      const message = blocked
        ? `Trivago returned access denied (${response.statusCode}) for ${url}`
        : `Trivago returned HTTP ${response.statusCode} for ${url}`;
      lastError = new Error(message);
    } catch (error) {
      lastError = error;
    }

    if (attempt < maxRetries) {
      const delayMillis = 750 * (attempt + 1);
      logger.debug?.(`Request failed, retrying in ${delayMillis} ms: ${lastError.message}`);
      await sleep(delayMillis);
    }
  }

  throw lastError;
}

export function parseSearchPage(html, context = {}) {
  const nextData = extractNextData(html);
  const state = nextData?.props?.pageProps?.initialState;
  if (!state) {
    throw new Error('Trivago page did not contain expected public listing state.');
  }

  const { entry, args } = findStaticSearchResultsEntry(state);
  const rows = extractStaticRows(entry?.data);
  const destinationContext = extractDestinationContext(state, context.input?.destination ?? null);
  const currency = state.environment?.currencyCode
    ?? args?.variables?.params?.currency
    ?? context.input?.currency
    ?? null;

  return {
    nextData,
    state,
    args,
    rows,
    destinationContext,
    currency,
    pageUrl: context.pageUrl ?? state.environment?.initialUrl ?? null
  };
}

export function toDatasetItems(parsedPage, input, sourceSearchUrl) {
  const scrapedAt = new Date().toISOString();
  const rows = input.deduplicateResults ? deduplicateRows(parsedPage.rows) : parsedPage.rows;
  const limitedRows = rows.slice(0, input.maxResults);

  return limitedRows.map((row, index) => mapRowToDatasetItem({
    row,
    input,
    parsedPage,
    sourceSearchUrl,
    rankingPosition: index + 1,
    scrapedAt
  }));
}

export function publicResultsLimit() {
  return MAX_PUBLIC_SEO_RESULTS;
}

function extractNextData(html) {
  const match = html.match(/<script id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) {
    if (/Access Denied/i.test(html)) {
      throw new Error('Trivago returned an access denied page.');
    }
    throw new Error('Could not find Trivago __NEXT_DATA__ script in the public page.');
  }

  const raw = match[1].trim();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = raw;
  }

  if (typeof parsed === 'string') {
    const text = looksLikeJson(parsed)
      ? parsed
      : Buffer.from(parsed, 'base64').toString('utf8');
    return JSON.parse(text);
  }

  return parsed;
}

function findStaticSearchResultsEntry(state) {
  const queries = state.gqlApi?.queries ?? {};
  const match = Object.entries(queries).find(([, value]) => value?.endpointName === 'staticSearchResults');
  if (!match) {
    throw new Error('Could not find public Trivago static search results in the page state.');
  }

  const [key, entry] = match;
  return {
    entry,
    args: parseQueryCacheKeyArgs(key)
  };
}

function parseQueryCacheKeyArgs(key) {
  const match = key.match(/^[^(]+\(([\s\S]*)\)$/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function extractStaticRows(data) {
  const values = Array.isArray(data) ? data : Object.values(data ?? {});
  return values
    .map((value) => {
      if (Array.isArray(value) && value.length >= 2) return value[1];
      return value;
    })
    .filter((value) => value && typeof value === 'object' && value.name);
}

function extractDestinationContext(state, requestedDestination) {
  const queries = state.gqlApi?.queries ?? {};
  const destinationEntry = Object.values(queries).find((query) => query?.endpointName === 'destinationDetails');
  const destinationRows = Array.isArray(destinationEntry?.data)
    ? destinationEntry.data
    : Object.values(destinationEntry?.data ?? {});
  const destination = Array.isArray(destinationRows[0]) ? destinationRows[0][1] : destinationRows[0];
  const hierarchy = destination?.hierarchy ?? [];
  const country = [...hierarchy].reverse().find((item) => item?.type?.name === 'Country')?.name
    ?? parseCountry(destination?.locationLabel)
    ?? null;

  return {
    requestedDestination,
    destinationName: destination?.name ?? requestedDestination,
    city: destination?.type?.name === 'City' ? destination.name : null,
    country,
    locationLabel: destination?.locationLabel ?? null,
    accommodationCount: destination?.accommodationCount ?? null,
    coordinates: destination?.coordinates ?? null
  };
}

function mapRowToDatasetItem({ row, input, parsedPage, sourceSearchUrl, rankingPosition, scrapedAt }) {
  const context = parsedPage.destinationContext;
  const hotelUrl = absoluteTrivagoUrl(row.url);
  const highlights = input.includeAmenities ? extractHighlights(row) : [];
  const locationParts = parseLocationLabel(row.location?.label);
  const city = locationParts.city ?? context.city ?? context.destinationName ?? null;
  const country = locationParts.country ?? context.country ?? null;
  const providerCount = input.includeBookingProviders
    ? toNullableInteger(row.advertisersWithEligiblePrices ?? row.forecastedPrice?.advertiserCount)
    : null;

  const price = input.includePrices ? toNullableNumber(row.forecastedPrice?.amount) : null;
  const currency = input.includePrices ? parsedPage.currency : null;

  return {
    hotelName: row.name ?? null,
    hotelUrl,
    trivagoUrl: hotelUrl,
    destination: input.destination,
    city,
    country,
    address: null,
    latitude: null,
    longitude: null,
    starRating: input.includeRatings ? toNullableNumber(row.category?.stars) : null,
    guestRating: input.includeRatings ? toNullableNumber(row.rating?.rating) : null,
    reviewCount: input.includeRatings ? toNullableInteger(row.rating?.ratingsCount) : null,
    price,
    currency,
    pricePerNight: price,
    priceSource: price == null ? null : 'trivago_public_listing_card',
    priceMonth: input.includePrices ? row.forecastedPrice?.dates ?? null : null,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults: input.adults,
    rooms: input.rooms,
    bookingProvider: null,
    providerUrl: null,
    allVisibleProviders: [],
    providerCount,
    imageUrl: input.includeImages ? formatTrivagoImageUrl(row.image) : null,
    amenities: [],
    visibleHighlights: highlights,
    hotelDescription: highlights.length ? highlights.join('; ') : null,
    rankingPosition,
    sourceSearchUrl,
    source: 'trivago_public_listing_page',
    sourceHotelId: row.nsid?.id ?? null,
    sourceHotelNamespace: row.nsid?.ns ?? null,
    propertyType: row.category?.label ?? null,
    imageCount: input.includeImages ? toNullableInteger(row.imageCount) : null,
    scrapedAt
  };
}

function deduplicateRows(rows) {
  const seen = new Set();
  const output = [];
  for (const row of rows) {
    const key = row.nsid?.id && row.nsid?.ns
      ? `${row.nsid.ns}-${row.nsid.id}`
      : `${row.name ?? ''}|${row.url ?? ''}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(row);
  }
  return output;
}

function extractHighlights(row) {
  const values = [];
  for (const highlight of row.featuredHighlights ?? []) {
    if (highlight?.title) values.push(cleanText(highlight.title));
    if (highlight?.description) values.push(cleanText(highlight.description));
  }
  for (const highlight of row.fullHighlights ?? []) {
    if (highlight?.title) values.push(cleanText(highlight.title));
    if (highlight?.description) values.push(cleanText(highlight.description));
  }
  return [...new Set(values.filter(Boolean))];
}

function formatTrivagoImageUrl(imagePath) {
  if (!imagePath) return null;
  if (isHttpUrl(imagePath)) return imagePath;

  const cleanPath = imagePath.replace(/^\/+/, '');
  const withExtension = /\.[a-z0-9]+$/i.test(cleanPath) ? cleanPath : `${cleanPath}.jpeg`;
  return `https://imgcy.trivago.com/c_fill,d_dummy.jpeg,e_sharpen:60,f_auto,h_267,q_60,w_400/${withExtension}`;
}

function absoluteTrivagoUrl(path) {
  if (!path) return null;
  return new URL(path, TRIVAGO_ORIGIN).toString();
}

function parseLocationLabel(label) {
  if (!label) return {};
  const parts = String(label).split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      city: parts[0],
      country: parts.at(-1)
    };
  }
  return {
    city: parts[0] ?? null,
    country: null
  };
}

function parseCountry(locationLabel) {
  if (!locationLabel) return null;
  const parts = String(locationLabel).split(',').map((part) => part.trim()).filter(Boolean);
  return parts.at(-1) ?? null;
}

function normalizeOptionalDate(value, fieldName) {
  if (value == null || value === '') return null;
  const date = String(value).trim();
  if (!DATE_PATTERN.test(date)) {
    throw new Error(`Input "${fieldName}" must use YYYY-MM-DD format.`);
  }
  return date;
}

function toBoundedInteger(value, min, max, fallback, fieldName) {
  const number = Number.parseInt(value ?? fallback, 10);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`Input "${fieldName}" must be an integer between ${min} and ${max}.`);
  }
  return number;
}

function toNullableNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toNullableInteger(value) {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) ? number : null;
}

function looksLikeJson(value) {
  return typeof value === 'string' && /^[\s\r\n]*[{[]/.test(value);
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value ?? ''));
}

function cleanText(value) {
  return String(value).replace(/\s+/g, ' ').trim();
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
