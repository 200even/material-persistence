const BASE_URL = 'https://www.estatesales.net';
const SALE_ENDPOINT = `${BASE_URL}/api/legacy/queries/traditional-sales/traditional-sale`;

export function extractSaleId(input) {
  const text = String(input ?? '').trim();
  if (/^\d+$/.test(text)) return text;

  let url;
  try {
    url = new URL(text);
  } catch {
    throw new Error(`Could not extract numeric sale ID from: ${input}`);
  }

  const segments = url.pathname.split('/').filter(Boolean);
  const [state, city, zip, saleId, ...extra] = segments;

  const isListingPath =
    extra.length === 0 &&
    /^[A-Z]{2}$/i.test(state ?? '') &&
    Boolean(city) &&
    /^\d{5}$/.test(zip ?? '') &&
    /^\d+$/.test(saleId ?? '');

  if (!isListingPath) {
    throw new Error(`Could not extract numeric sale ID from: ${input}`);
  }

  return saleId;
}

export function normalizePictureUrls(pictures = []) {
  const seen = new Set();
  const urls = [];

  for (const picture of pictures) {
    const raw = typeof picture === 'string' ? picture : picture?.url;
    if (!raw || typeof raw !== 'string') continue;

    let normalized;
    try {
      normalized = new URL(raw, BASE_URL).toString();
    } catch {
      continue;
    }

    if (!seen.has(normalized)) {
      seen.add(normalized);
      urls.push(normalized);
    }
  }

  return urls;
}

export async function fetchSaleData(input, { timeoutMs = 30_000, fetchImpl = fetch } = {}) {
  const saleId = extractSaleId(input);
  const query = JSON.stringify({
    saleId: Number.parseInt(saleId, 10),
    userId: null,
    isSuper: false,
  });

  const url = new URL(SALE_ENDPOINT);
  url.searchParams.set('query', query);
  url.searchParams.set('explicitTypes', 'DateTime');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'material-persistence/0.1 research calibration',
      },
    });

    if (!response.ok) {
      throw new Error(`EstateSales.NET returned HTTP ${response.status} for sale ${saleId}`);
    }

    const payload = await response.json();
    const sale = payload?.sale;
    if (!sale) {
      throw new Error(`Legacy endpoint returned no sale object for sale ${saleId}`);
    }

    const rawPictures = Array.isArray(sale.pictures) ? sale.pictures : [];
    const pictures = normalizePictureUrls(rawPictures);

    return {
      saleId,
      typeName: sale.typeName ?? null,
      title: sale.title ?? sale.name ?? null,
      rawPictureCount: rawPictures.length,
      uniquePictureCount: pictures.length,
      pictures,
      extractionMethod: 'legacy-sale-endpoint',
      endpoint: url.toString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}
