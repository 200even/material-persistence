import { readFile, writeFile } from 'node:fs/promises';
import { nominalAgreement, parseTsv } from './reliability.js';
import { deriveOpportunity, PRIMITIVE_FIELDS } from './deriveOpportunityV03.js';

const DERIVED_FIELDS = [
  'vhs_opportunity',
  'vcr_opportunity',
  'books_opportunity',
  'microwave_opportunity',
];

function pairRows(aRows, bRows) {
  const bMap = new Map(bRows.map(row => [row.blind_id, row]));
  return aRows.map(a => {
    const b = bMap.get(a.blind_id);
    if (!b) throw new Error(`Missing Coder B row for ${a.blind_id}`);
    return [a, b];
  });
}

function frequencies(pairs, field, side) {
  const counts = {};
  for (const pair of pairs) {
    const value = pair[side][field];
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function metricForField(pairs, field) {
  const values = pairs.map(([a, b]) => [a[field], b[field]]);
  const metric = nominalAgreement(values);
  const coderA = frequencies(pairs, field, 0);
  const coderB = frequencies(pairs, field, 1);
  const degenerate = Object.keys(coderA).length < 2 && Object.keys(coderB).length < 2;

  let status;
  if (degenerate) {
    status = 'DEGENERATE_REVIEW';
  } else if ((metric.cohen_kappa ?? -Infinity) >= 0.70 || (metric.gwet_ac1 ?? -Infinity) >= 0.75) {
    status = 'PASS';
  } else if ((metric.cohen_kappa ?? Infinity) < 0.60 && (metric.gwet_ac1 ?? Infinity) < 0.60) {
    status = 'FATAL_FAIL';
  } else {
    status = 'REVISE';
  }

  return {
    ...metric,
    coder_a_frequencies: coderA,
    coder_b_frequencies: coderB,
    status,
  };
}

function validateIds(aRows, bRows) {
  if (aRows.length !== 15 || bRows.length !== 15) {
    throw new Error(`Gate 2b requires exactly 15 rows per coder; got A=${aRows.length}, B=${bRows.length}`);
  }
  const a = [...aRows.map(r => r.blind_id)].sort();
  const b = [...bRows.map(r => r.blind_id)].sort();
  if (a.join('\n') !== b.join('\n')) throw new Error('Coder A/B blind IDs differ');
}

export function calculateGate2bReliability(aRows, bRows) {
  validateIds(aRows, bRows);
  const primitivePairs = pairRows(aRows, bRows);
  const primitives = Object.fromEntries(
    PRIMITIVE_FIELDS.map(field => [field, metricForField(primitivePairs, field)]),
  );

  const derivedA = aRows.map(deriveOpportunity);
  const derivedB = bRows.map(deriveOpportunity);
  const derivedPairs = pairRows(derivedA, derivedB);
  const derived = Object.fromEntries(
    DERIVED_FIELDS.map(field => [field, metricForField(derivedPairs, field)]),
  );

  const primitiveStatuses = Object.values(primitives).map(x => x.status);
  const derivedStatuses = Object.values(derived).map(x => x.status);

  let decision;
  if (primitiveStatuses.includes('FATAL_FAIL')) {
    decision = 'ABANDON_ABSENCE_INFERENCE';
  } else if (primitiveStatuses.every(s => s === 'PASS') && derivedStatuses.every(s => s === 'PASS')) {
    decision = 'PASS_GATE_2B';
  } else {
    decision = 'FAIL_REVISE_WITHOUT_TARGET_OUTCOMES';
  }

  return {
    n: 15,
    primitives,
    derived,
    decision,
    rules: {
      primitive_or_derived_pass: 'Cohen kappa >= 0.70 OR Gwet AC1 >= 0.75',
      fatal: 'Any primary primitive with both Cohen kappa < 0.60 AND Gwet AC1 < 0.60',
      degenerate: 'Constant/degenerate marginals cannot pass automatically',
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [
    aPath = 'data/gate2b-coder-a.tsv',
    bPath = 'data/gate2b-coder-b.tsv',
    outPath = 'out/gate2b-reliability.json',
  ] = process.argv.slice(2);
  const [aText, bText] = await Promise.all([readFile(aPath, 'utf8'), readFile(bPath, 'utf8')]);
  const result = calculateGate2bReliability(parseTsv(aText), parseTsv(bText));
  await writeFile(outPath, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
}
