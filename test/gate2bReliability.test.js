import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateGate2bReliability } from '../src/gate2bReliability.js';
import { PRIMITIVE_FIELDS } from '../src/deriveOpportunityV03.js';

function syntheticRows() {
  return Array.from({ length: 15 }, (_, i) => {
    const row = { blind_id: `H-${String(i + 1).padStart(2, '0')}` };
    const value = i % 2 === 0 ? 'YES' : 'NO';
    for (const field of PRIMITIVE_FIELDS) row[field] = value;
    return row;
  });
}

test('identical non-degenerate geometry ratings pass Gate 2b', () => {
  const a = syntheticRows();
  const b = structuredClone(a);
  const result = calculateGate2bReliability(a, b);
  assert.equal(result.decision, 'PASS_GATE_2B');
  for (const metric of Object.values(result.primitives)) {
    assert.equal(metric.status, 'PASS');
  }
  for (const metric of Object.values(result.derived)) {
    assert.equal(metric.status, 'PASS');
  }
});

test('constant primitives cannot pass automatically', () => {
  const a = Array.from({ length: 15 }, (_, i) => Object.fromEntries([
    ['blind_id', `H-${String(i + 1).padStart(2, '0')}`],
    ...PRIMITIVE_FIELDS.map(field => [field, 'NO']),
  ]));
  const b = structuredClone(a);
  const result = calculateGate2bReliability(a, b);
  assert.equal(result.decision, 'FAIL_REVISE_WITHOUT_TARGET_OUTCOMES');
  assert.equal(result.primitives[PRIMITIVE_FIELDS[0]].status, 'DEGENERATE_REVIEW');
});
