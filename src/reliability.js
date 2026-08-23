import { readFile, writeFile } from 'node:fs/promises';

export function parseTsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const header = lines.shift().split('\t');
  return lines.map(line => Object.fromEntries(line.split('\t').map((v,i) => [header[i], v])));
}

function pairedValues(aRows, bRows, field) {
  const b = new Map(bRows.map(r => [r.blind_id, r]));
  return aRows.flatMap(a => {
    const br = b.get(a.blind_id);
    if (!br || !a[field] || !br[field]) return [];
    return [[a[field], br[field]]];
  });
}

export function nominalAgreement(pairs) {
  if (!pairs.length) return { n: 0, raw_agreement: null, cohen_kappa: null, gwet_ac1: null };
  const cats = [...new Set(pairs.flat())].sort();
  const n = pairs.length;
  const pa = pairs.filter(([a,b]) => a === b).length / n;
  const p1 = new Map(cats.map(c => [c, pairs.filter(([a]) => a === c).length / n]));
  const p2 = new Map(cats.map(c => [c, pairs.filter(([,b]) => b === c).length / n]));
  const peKappa = cats.reduce((s,c) => s + p1.get(c) * p2.get(c), 0);
  const kappa = peKappa === 1 ? (pa === 1 ? 1 : null) : (pa - peKappa) / (1 - peKappa);
  const pooled = new Map(cats.map(c => [c, (p1.get(c) + p2.get(c)) / 2]));
  const peAc1 = cats.length <= 1 ? 0 : cats.reduce((s,c) => {
    const p = pooled.get(c);
    return s + p * (1 - p);
  }, 0) / (cats.length - 1);
  const ac1 = peAc1 === 1 ? (pa === 1 ? 1 : null) : (pa - peAc1) / (1 - peAc1);
  return { n, categories: cats, raw_agreement: pa, cohen_kappa: kappa, gwet_ac1: ac1 };
}

export function linearWeightedKappa(pairs, orderedCategories = ['C0','C1','C2','C3']) {
  if (!pairs.length) return { n: 0, linear_weighted_kappa: null };
  const cats = orderedCategories;
  const index = new Map(cats.map((c,i) => [c,i]));
  for (const [a,b] of pairs) if (!index.has(a) || !index.has(b)) throw new Error(`Unknown ordinal category: ${a}/${b}`);
  const n = pairs.length;
  const k = cats.length;
  const weight = (a,b) => 1 - Math.abs(index.get(a) - index.get(b)) / (k - 1);
  const po = pairs.reduce((s,[a,b]) => s + weight(a,b), 0) / n;
  const p1 = new Map(cats.map(c => [c, pairs.filter(([a]) => a === c).length / n]));
  const p2 = new Map(cats.map(c => [c, pairs.filter(([,b]) => b === c).length / n]));
  let pe = 0;
  for (const a of cats) for (const b of cats) pe += weight(a,b) * p1.get(a) * p2.get(b);
  const kw = pe === 1 ? (po === 1 ? 1 : null) : (po - pe) / (1 - pe);
  return { n, weighted_agreement: po, linear_weighted_kappa: kw };
}

export function calculateReliability(aRows, bRows) {
  const coverage = linearWeightedKappa(pairedValues(aRows, bRows, 'coverage_class'));
  const opportunities = Object.fromEntries(['vhs_opportunity','vcr_opportunity','books_opportunity','microwave_opportunity'].map(field => [field, nominalAgreement(pairedValues(aRows,bRows,field))]));
  return { coverage, opportunities };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [aPath='data/gate2-coder-a.tsv', bPath='data/gate2-coder-b.tsv', outPath='out/gate2-reliability.json'] = process.argv.slice(2);
  const [aText,bText] = await Promise.all([readFile(aPath,'utf8'), readFile(bPath,'utf8')]);
  const result = calculateReliability(parseTsv(aText), parseTsv(bText));
  await writeFile(outPath, JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}
