import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fetchSaleData, extractSaleId } from './estateSalesClient.js';

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error('Usage: npm run audit:completeness -- data/completeness-audit-sample.tsv out/gallery-completeness-audit.jsonl');
  process.exit(1);
}

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36 material-persistence-research-audit/0.1';

function parseTsv(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trimEnd()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split('\t');
  return lines.slice(1).map((line) => {
    const values = line.split('\t');
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function normalizeEscapedHtml(html) {
  return html
    .replaceAll('\\u002F', '/')
    .replaceAll('\\u002f', '/')
    .replaceAll('\\/', '/')
    .replaceAll('&amp;', '&');
}

function pictureKey(urlLike) {
  try {
    const url = new URL(urlLike);
    const match = url.pathname.match(/^\/(\d+)\/(\d+)\/(\d+)\.(jpe?g|png|webp)$/i);
    if (!match) return null;
    return `${match[1]}/${match[2]}/${match[3]}.${match[4].toLowerCase()}`;
  } catch {
    return null;
  }
}

function extractPagePictureKeys(html) {
  const normalized = normalizeEscapedHtml(html);
  const keys = new Set();
  const regex = /https:\/\/picturescdn\.estatesales\.net\/\d+\/\d+\/\d+\.(?:jpe?g|png|webp)(?:\?[^\s"'<>\\]*)?/gi;
  for (const match of normalized.matchAll(regex)) {
    const key = pictureKey(match[0]);
    if (key) keys.add(key);
  }
  return [...keys];
}

function extractPageCountCandidates(html) {
  const normalized = normalizeEscapedHtml(html);
  const candidates = new Set();
  const patterns = [
    /["']?(?:pictureCount|picturesCount|photoCount|photosCount|imageCount|numberOfPictures)["']?\s*[:=]\s*["']?(\d+)/gi,
    /\b(\d{1,4})\s+(?:pictures|photos|images)\b/gi,
  ];
  for (const pattern of patterns) {
    for (const match of normalized.matchAll(pattern)) candidates.add(Number.parseInt(match[1], 10));
  }
  return [...candidates].filter(Number.isFinite).sort((a, b) => a - b);
}

async function fetchListingHtml(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': USER_AGENT,
    },
  });
  const text = await response.text();
  return {
    status: response.status,
    finalUrl: response.url,
    contentType: response.headers.get('content-type'),
    html: text,
  };
}

async function probeImage(url) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        Range: 'bytes=0-1023',
        Accept: 'image/*',
        'User-Agent': USER_AGENT,
      },
    });
    const contentType = response.headers.get('content-type') ?? '';
    const buffer = await response.arrayBuffer();
    return {
      ok: (response.status === 200 || response.status === 206) && contentType.toLowerCase().startsWith('image/'),
      status: response.status,
      content_type: contentType,
      content_length_header: response.headers.get('content-length'),
      bytes_received: buffer.byteLength,
      final_url: response.url,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function compareSets(endpointPictures, pageKeys) {
  const endpointKeys = endpointPictures.map(pictureKey).filter(Boolean);
  const pageSet = new Set(pageKeys);
  const endpointSet = new Set(endpointKeys);
  const endpointMissingFromPage = [...endpointSet].filter((key) => !pageSet.has(key));
  const pageExtra = [...pageSet].filter((key) => !endpointSet.has(key));

  let matchClass;
  if (pageSet.size === 0) matchClass = 'NO_STATIC_PAGE_PICTURES';
  else if (pageSet.size === endpointSet.size && endpointMissingFromPage.length === 0 && pageExtra.length === 0) matchClass = 'EXACT_SET_MATCH';
  else if (endpointMissingFromPage.length === 0) matchClass = 'PAGE_SUPERSET_OR_VARIANTS';
  else if (pageSet.size < Math.max(3, Math.floor(endpointSet.size * 0.25))) matchClass = 'STATIC_PAGE_INSUFFICIENT';
  else matchClass = 'SET_MISMATCH_REVIEW';

  return {
    endpoint_key_count: endpointSet.size,
    page_key_count: pageSet.size,
    endpoint_missing_from_page_count: endpointMissingFromPage.length,
    page_extra_count: pageExtra.length,
    match_class: matchClass,
    endpoint_missing_from_page_sample: endpointMissingFromPage.slice(0, 10),
    page_extra_sample: pageExtra.slice(0, 10),
  };
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, '', 'utf8');
const rows = parseTsv(await readFile(inputPath, 'utf8'));
console.log(`Auditing ${rows.length} stratified listings for gallery completeness...`);

for (let index = 0; index < rows.length; index += 1) {
  const row = rows[index];
  const saleId = extractSaleId(row.source_url || row.sale_id);
  const auditedAt = new Date().toISOString();
  let record;

  try {
    const endpoint = await fetchSaleData(row.source_url || row.sale_id);
    const page = await fetchListingHtml(row.source_url);
    const pageKeys = extractPagePictureKeys(page.html);
    const pageCountCandidates = extractPageCountCandidates(page.html);
    const setComparison = compareSets(endpoint.pictures, pageKeys);

    const count = endpoint.pictures.length;
    const probeIndices = count === 0 ? [] : [...new Set([0, Math.floor((count - 1) / 2), count - 1])];
    const probes = [];
    for (const probeIndex of probeIndices) {
      probes.push({
        index: probeIndex,
        position: probeIndex === 0 ? 'first' : probeIndex === count - 1 ? 'last' : 'middle',
        url: endpoint.pictures[probeIndex],
        ...(await probeImage(endpoint.pictures[probeIndex])),
      });
    }

    const candidateCountMatch = pageCountCandidates.includes(endpoint.rawPictureCount);
    const allProbesLive = probes.length > 0 && probes.every((probe) => probe.ok);

    record = {
      ...row,
      sale_id: saleId,
      audited_at: auditedAt,
      status: 'ok',
      endpoint_picture_count: endpoint.rawPictureCount,
      endpoint_unique_picture_count: endpoint.uniquePictureCount,
      listing_http_status: page.status,
      listing_final_url: page.finalUrl,
      listing_content_type: page.contentType,
      page_picture_key_count: pageKeys.length,
      page_count_candidates: pageCountCandidates,
      page_count_candidate_matches_endpoint: candidateCountMatch,
      ...setComparison,
      image_probes: probes,
      all_sampled_images_live: allProbesLive,
      provisional_completeness_evidence:
        allProbesLive && (setComparison.match_class === 'EXACT_SET_MATCH' || candidateCountMatch)
          ? 'STRONG'
          : allProbesLive && setComparison.match_class === 'STATIC_PAGE_INSUFFICIENT'
            ? 'ENDPOINT_LIVE_PAGE_STATIC_INSUFFICIENT'
            : allProbesLive
              ? 'MIXED_REVIEW'
              : 'FAILED_IMAGE_PROBE',
    };
  } catch (error) {
    record = {
      ...row,
      sale_id: saleId,
      audited_at: auditedAt,
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  await appendFile(outputPath, `${JSON.stringify(record)}\n`, 'utf8');
  console.log(
    `[${index + 1}/${rows.length}] ${row.sample_id} ${row.year} sale ${saleId}: ` +
      `${record.status} endpoint=${record.endpoint_picture_count ?? '-'} page=${record.page_picture_key_count ?? '-'} ` +
      `class=${record.match_class ?? '-'} probes=${record.all_sampled_images_live ?? '-'}`,
  );

  if (index < rows.length - 1) await new Promise((resolve) => setTimeout(resolve, 750));
}

console.log(`Wrote completeness audit to ${outputPath}`);
