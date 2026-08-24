import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveOpportunity } from '../src/deriveOpportunityV03.js';

function base(overrides = {}) {
  return {
    blind_id: 'H-TEST',
    common_room_envelope_complete: 'NO',
    kitchen_envelope_complete: 'NO',
    dining_envelope_complete: 'NO',
    bedroom_envelope_complete: 'NO',
    office_envelope_complete: 'NO',
    secondary_storage_envelope_complete: 'NO',
    common_room_storage_exposure_complete: 'NO',
    secondary_storage_exposure_complete: 'NO',
    common_room_low_surface_exposure_complete: 'NO',
    kitchen_work_surfaces_complete: 'NO',
    ...overrides,
  };
}

test('derives opportunities only from geometry paths', () => {
  const result = deriveOpportunity(base({
    common_room_envelope_complete: 'YES',
    common_room_storage_exposure_complete: 'YES',
    common_room_low_surface_exposure_complete: 'YES',
    dining_envelope_complete: 'YES',
    kitchen_envelope_complete: 'YES',
    kitchen_work_surfaces_complete: 'YES',
  }));
  assert.equal(result.vhs_opportunity, 'YES');
  assert.equal(result.vcr_opportunity, 'YES');
  assert.equal(result.books_opportunity, 'YES');
  assert.equal(result.microwave_opportunity, 'YES');
});

test('propagates indeterminate when a possible route cannot be resolved', () => {
  const result = deriveOpportunity(base({
    common_room_envelope_complete: 'YES',
    common_room_storage_exposure_complete: 'INDETERMINATE',
  }));
  assert.equal(result.vhs_opportunity, 'INDETERMINATE');
});

test('book opportunity depends on room envelopes, not storage furniture', () => {
  const result = deriveOpportunity(base({
    common_room_envelope_complete: 'YES',
    office_envelope_complete: 'YES',
    common_room_storage_exposure_complete: 'NO',
  }));
  assert.equal(result.books_opportunity, 'YES');
  assert.equal(result.vhs_opportunity, 'NO');
});

test('invalid primitive categories fail loudly', () => {
  assert.throws(
    () => deriveOpportunity(base({ kitchen_envelope_complete: 'MAYBE' })),
    /must be YES, NO, or INDETERMINATE/,
  );
});
