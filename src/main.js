import { Actor, log } from 'apify';
import {
  normalizeInput,
  parseSearchPage,
  publicResultsLimit,
  requestText,
  resolveSearchUrl,
  toDatasetItems
} from './trivago.js';

await Actor.init();

try {
  const input = normalizeInput(await Actor.getInput() ?? {});
  log.info('Starting Trivago public hotel listing extraction.', {
    destination: input.destination,
    maxResults: input.maxResults,
    checkIn: input.checkIn,
    checkOut: input.checkOut
  });

  const proxyConfiguration = input.proxyConfiguration
    ? await Actor.createProxyConfiguration(input.proxyConfiguration)
    : null;
  const requestOptions = {
    proxyConfiguration,
    maxRetries: input.maxRetries,
    requestTimeoutSecs: input.requestTimeoutSecs,
    logger: log
  };

  await Actor.setStatusMessage(`Resolving Trivago destination: ${input.destination}`);
  const searchUrl = await resolveSearchUrl(input, requestOptions);
  log.info('Resolved Trivago destination URL.', { searchUrl });

  await Actor.setStatusMessage('Downloading public Trivago listing page.');
  const response = await requestText(searchUrl, requestOptions);

  if (input.debugMode) {
    await Actor.setValue('DEBUG_SOURCE_URL', { searchUrl, finalUrl: response.url, statusCode: response.statusCode });
  }

  const parsedPage = parseSearchPage(response.body, {
    input,
    pageUrl: response.url
  });
  const items = toDatasetItems(parsedPage, input, searchUrl);

  if (input.debugMode) {
    await Actor.setValue('DEBUG_LISTING_PAGE.html', response.body, { contentType: 'text/html; charset=utf-8' });
    await Actor.setValue('DEBUG_PARSED_SUMMARY', {
      resolvedSearchUrl: searchUrl,
      finalUrl: response.url,
      availablePublicRows: parsedPage.rows.length,
      emittedRows: items.length,
      destinationContext: parsedPage.destinationContext,
      pageCurrency: parsedPage.currency
    });
  }

  if (!items.length) {
    await Actor.setStatusMessage('No public hotel listing cards were found for this destination.');
    await Actor.setValue('RUN_SUMMARY', {
      destination: input.destination,
      resolvedSearchUrl: searchUrl,
      availablePublicRows: parsedPage.rows.length,
      emittedRows: 0,
      note: 'No public Trivago listing cards were available in the fetched page.'
    });
    log.warning('No public hotel listing cards found.', { searchUrl });
  } else {
    await Actor.pushData(items);

    const resultLimit = publicResultsLimit();
    const limitNote = input.maxResults > resultLimit && parsedPage.rows.length <= resultLimit
      ? `Trivago public SEO destination pages commonly expose up to ${resultLimit} listing cards in the initial public HTML.`
      : null;

    await Actor.setValue('RUN_SUMMARY', {
      destination: input.destination,
      resolvedSearchUrl: searchUrl,
      availablePublicRows: parsedPage.rows.length,
      emittedRows: items.length,
      pageCurrency: parsedPage.currency,
      requestedCurrency: input.currency,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      note: limitNote
    });

    await Actor.setStatusMessage(`Saved ${items.length} Trivago hotel listing records.`);
    log.info('Finished Trivago public listing extraction.', {
      availablePublicRows: parsedPage.rows.length,
      emittedRows: items.length,
      pageCurrency: parsedPage.currency,
      limitNote
    });
  }

  await Actor.exit();
} catch (error) {
  log.exception(error, 'Actor failed.');
  await Actor.setStatusMessage(`Run failed: ${error.message}`);
  await Actor.fail(error.message);
}
