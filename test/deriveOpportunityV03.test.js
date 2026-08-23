import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveCoverage, deriveOpportunity } from '../src/deriveOpportunityV03.js';

function row(overrides = {}) {
  return {
    blind_id: 'H-TEST',
    living_context: 'NO',
    kitchen_context: 'NO',
    dining_context: 'NO',
    bedroom_context: 'NO',
    office_context: 'NO',
    storage_context: 'NO',
    principal_shelving_run_full: 'NO',
    equipment_run_full: 'NO',
    secondary_storage_run_full: 'NO',
    kitchen_counter_75: 'NO',
    kitchen_appliance_wall_full: 'NO',
    ...overrides,
  };
}

test('coverage is derived mechanically from zone count and core zones', () => {
  assert.equal(deriveCoverage(row()), 'C0');
  assert.equal(deriveCoverage(row({ living_context: 'YES' })), 'C1');
  assert.equal(deriveCoverage(row({ living_context: 'YES', dining_context: 'YES' })), 'C2');
  assert.equal(deriveCoverage(row({ living_context: 'YES', kitchen_context: 'YES', dining_context: 'YES', bedroom_context: 'YES', office_context: 'YES' })), 'C3');
  assert.equal(deriveCoverage(row({ living_context: 'YES', dining_context: 'YES', bedroom_context: 'YES', office_context: 'YES', storage_context: 'YES' })), 'C2');
});

test('target opportunities are deterministic functions of geometry primitives', () => {
  const result = deriveOpportunity(row({
    living_context: 'YES',
    office_context: 'YES',
    principal_shelving_run_full: 'YES',
    equipment_run_full: 'NO',
    secondary_storage_run_full: 'NO',
    kitchen_context: 'YES',
    kitchen_counter_75: 'YES',
    kitchen_appliance_wall_full: 'YES',
  }));
  assert.equal(result.vhs_opportunity, 'YES');
  assert.equal(result.vcr_opportunity, 'NO');
  assert.equal(result.books_opportunity, 'YES');
  assert.equal(result.microwave_opportunity, 'YES');
});

test('a TV-equipment surface can create VCR but not VHS opportunity', () => {
  const result = deriveOpportunity(row({ equipment_run_full: 'YES' }));
  assert.equal(result.vcr_opportunity, 'YES');
  assert.equal(result.vhs_opportunity, 'NO');
});

test('invalid primitive categories fail loudly', () => {
  assert.throws(() => deriveOpportunity(row({ kitchen_context: 'INDETERMINATE' })), /must be YES or NO/);
});
