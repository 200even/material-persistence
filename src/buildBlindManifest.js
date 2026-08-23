import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [input = 'out/calibration-ingest.jsonl', outputDir = 'out/gate2'] = process.argv.slice(2);
const text = await readFile(input, 'utf8');
const sourceRows = text.trim().split(/\n+/).filter(Boolean).map(JSON.parse);

function hash(label, value) {
  return createHash('sha256').update(`${label}:${value}`).digest('hex');
}

function blindId(saleId) {
  return `H-${hash('material-persistence-gate2-v1', saleId).slice(0, 10).toUpperCase()}`;
}

const rows = sourceRows.map((row) => ({
  blind_id: blindId(row.sale_id),
  source_image_urls: row.pictures,
  picture_count: row.unique_picture_count,
  reliability_rank: hash('material-persistence-gate2-reliability-v1', row.sale_id),
})).sort((a, b) => a.blind_id.localeCompare(b.blind_id));

if (new Set(rows.map(r => r.blind_id)).size !== rows.length) throw new Error('Blind ID collision');
await mkdir(outputDir, { recursive: true });
await mkdir(path.join(outputDir, 'private'), { recursive: true });
await mkdir(path.join(outputDir, 'coding-packet'), { recursive: true });

await writeFile(path.join(outputDir, 'private', 'render-manifest.jsonl'), rows.map(r => JSON.stringify(r)).join('\n') + '\n');

const header = ['blind_id','picture_count','coverage_class','vhs_opportunity','vcr_opportunity','books_opportunity','microwave_opportunity','coder_notes'];
const form = [header.join('\t'), ...rows.map(r => [r.blind_id,r.picture_count,'','','','','',''].join('\t'))].join('\n') + '\n';
await writeFile(path.join(outputDir, 'coding-packet', 'coder-a-form.tsv'), form);

const reliability = [...rows].sort((a,b) => a.reliability_rank.localeCompare(b.reliability_rank)).slice(0, 5).sort((a,b) => a.blind_id.localeCompare(b.blind_id));
const formB = [header.join('\t'), ...reliability.map(r => [r.blind_id,r.picture_count,'','','','','',''].join('\t'))].join('\n') + '\n';
await writeFile(path.join(outputDir, 'coding-packet', 'coder-b-form.tsv'), formB);

const readme = `# Gate 2 blinded coding packet\n\nThis packet intentionally contains no sale year, location, title, company, description, sale ID, or source URL.\n\nCoder A reviews all 20 opaque households. Coder B independently reviews the five households listed in coder-b-form.tsv (25%).\n\nAllowed coverage classes: C0, C1, C2, C3.\nOpportunity values: YES, NO, INDETERMINATE.\n\nDo not code target-object presence in this stage. This packet is only for photographic coverage and detection opportunity.\n\nThe frozen operational definitions are in docs/protocol-v0.2.md in the repository.\n`;
await writeFile(path.join(outputDir, 'coding-packet', 'README.md'), readme);

console.log(`Prepared ${rows.length} blinded households; independent reliability subset=${reliability.length}`);
