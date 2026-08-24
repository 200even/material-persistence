import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PRIMITIVE_FIELDS } from './deriveOpportunityV03.js';

const [
  fullManifestPath = 'out/gate2/private/render-manifest.jsonl',
  validationPath = 'data/gate2b-validation.tsv',
  outputDir = 'out/gate2b',
] = process.argv.slice(2);

function parseTsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const header = lines.shift().split('\t');
  return lines.map(line => Object.fromEntries(line.split('\t').map((v, i) => [header[i], v])));
}

const fullRows = (await readFile(fullManifestPath, 'utf8'))
  .trim().split(/\n+/).filter(Boolean).map(JSON.parse);
const validation = parseTsv(await readFile(validationPath, 'utf8'));
const wanted = new Map(validation.map(row => [row.blind_id, Number(row.picture_count)]));

if (wanted.size !== 15) throw new Error(`Expected 15 Gate 2b validation households, got ${wanted.size}`);

const selected = fullRows
  .filter(row => wanted.has(row.blind_id))
  .map(row => {
    const expected = wanted.get(row.blind_id);
    if (row.picture_count !== expected) {
      throw new Error(`${row.blind_id}: picture count changed ${row.picture_count} != frozen ${expected}`);
    }
    return row;
  })
  .sort((a, b) => a.blind_id.localeCompare(b.blind_id));

if (selected.length !== wanted.size) {
  const found = new Set(selected.map(row => row.blind_id));
  const missing = [...wanted.keys()].filter(id => !found.has(id));
  throw new Error(`Missing frozen validation households: ${missing.join(', ')}`);
}

await mkdir(path.join(outputDir, 'private'), { recursive: true });
await mkdir(path.join(outputDir, 'coding-packet'), { recursive: true });

await writeFile(
  path.join(outputDir, 'private', 'render-manifest.jsonl'),
  selected.map(row => JSON.stringify(row)).join('\n') + '\n',
);

const header = ['blind_id', 'picture_count', ...PRIMITIVE_FIELDS, 'coder_notes'];
const blankRows = selected.map(row => [
  row.blind_id,
  row.picture_count,
  ...PRIMITIVE_FIELDS.map(() => ''),
  '',
].join('\t'));
const form = [header.join('\t'), ...blankRows].join('\n') + '\n';

await writeFile(path.join(outputDir, 'coding-packet', 'coder-a-geometry.tsv'), form);
await writeFile(path.join(outputDir, 'coding-packet', 'coder-b-geometry.tsv'), form);

const readme = `# Gate 2b blinded spatial-geometry packet\n\nThis packet is for independent measurement of photographic spatial geometry only. It intentionally contains no sale year, location, title, company, description, sale ID, source URL, temporal ordering, research targets, or Coder A results.\n\nBoth coders independently score all 15 households. Allowed values for every field are YES, NO, or INDETERMINATE.\n\n## Room-envelope anchor\n\nA room/zone envelope is YES only when its horizontal boundary can be reconstructed from visible terminal limits across the image set. In an enclosed room, every wall junction/corner must be visible somewhere. In an open-plan zone, every terminal wall junction plus the architectural transitions bounding the zone must be visible. A cropped continuation off-frame is not a terminal edge.\n\n## Storage exposure anchor\n\nStorage exposure is YES only after the corresponding room envelope is complete and every storage-bearing furniture/cabinet element capable of concealing an object about 15 x 20 x 3 cm is absent or has its relevant interior/open shelves fully exposed between terminal boundaries. Closed or cropped storage makes the field NO.\n\n## Low-surface exposure anchor\n\nLow-surface exposure is YES only after the common-room envelope is complete and every low horizontal furniture/built-in surface and open compartment capable of holding an object about 45 x 35 x 10 cm is fully visible between terminal boundaries. Closed compartments of that capacity make the field NO. If the completely documented room contains no such surface or compartment, code YES.\n\n## Kitchen work-surface anchor\n\nKitchen work surfaces are YES only after the kitchen envelope is complete and every countertop run is visible end-to-end, every island/peninsula is fully bounded, and all upper-cabinet/built-in-appliance fronts are visible without cropped continuation.\n\nDo not infer unseen geometry. Use INDETERMINATE when perspective, cropping, irregular architecture, occlusion, or inconsistent photographs prevent a defensible judgment.\n`;
await writeFile(path.join(outputDir, 'coding-packet', 'README.md'), readme);

console.log(`Prepared target-neutral Gate 2b packet for ${selected.length} frozen households`);
