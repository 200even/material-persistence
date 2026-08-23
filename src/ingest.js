import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fetchSaleData } from './estateSalesClient.js';

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error('Usage: npm run ingest -- data/calibration-sample.tsv out/calibration-ingest.jsonl');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseTsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  if (lines.length < 2) return [];
  const headers = lines[0].split('\t');

  return lines.slice(1).map((line) => {
    const values = line.split('\t');
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, '', 'utf8');

const sample = parseTsv(await readFile(inputPath, 'utf8'));
console.log(`Ingesting ${sample.length} calibration households...`);

for (let index = 0; index < sample.length; index += 1) {
  const row = sample[index];
  const startedAt = new Date().toISOString();

  let record;
  try {
    const sale = await fetchSaleData(row.source_url || row.sale_id);
    record = {
      ...row,
      status: 'ok',
      started_at: startedAt,
      extracted_at: new Date().toISOString(),
      extraction_method: sale.extractionMethod,
      endpoint: sale.endpoint,
      sale_type_name: sale.typeName,
      endpoint_title: sale.title,
      raw_picture_count: sale.rawPictureCount,
      unique_picture_count: sale.uniquePictureCount,
      pictures: sale.pictures,
    };

    console.log(
      `[${index + 1}/${sample.length}] ${row.sample_id} sale ${sale.saleId}: ` +
        `${sale.rawPictureCount} pictures (${sale.uniquePictureCount} unique)`,
    );
  } catch (error) {
    record = {
      ...row,
      status: 'error',
      started_at: startedAt,
      extracted_at: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };

    console.error(`[${index + 1}/${sample.length}] ${row.sample_id}: ${record.error}`);
  }

  await appendFile(outputPath, `${JSON.stringify(record)}\n`, 'utf8');

  // Deliberately conservative during calibration.
  if (index < sample.length - 1) await sleep(750);
}

console.log(`Wrote ingestion audit to ${outputPath}`);
