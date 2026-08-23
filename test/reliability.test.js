import test from 'node:test';
import assert from 'node:assert/strict';
import { nominalAgreement, linearWeightedKappa, calculateReliability } from '../src/reliability.js';

test('nominal agreement is perfect for identical ratings', () => {
  const r = nominalAgreement([['YES','YES'],['NO','NO'],['YES','YES'],['NO','NO']]);
  assert.equal(r.raw_agreement, 1);
  assert.equal(r.cohen_kappa, 1);
  assert.equal(r.gwet_ac1, 1);
});

test('linear weighted kappa is perfect for identical ordinal ratings', () => {
  const r = linearWeightedKappa([['C0','C0'],['C1','C1'],['C2','C2'],['C3','C3']]);
  assert.equal(r.linear_weighted_kappa, 1);
});

test('calculateReliability pairs on blind_id only', () => {
  const a = [
    {blind_id:'H-A',coverage_class:'C2',vhs_opportunity:'YES',vcr_opportunity:'NO',books_opportunity:'YES',microwave_opportunity:'NO'},
    {blind_id:'H-B',coverage_class:'C1',vhs_opportunity:'NO',vcr_opportunity:'NO',books_opportunity:'YES',microwave_opportunity:'NO'},
  ];
  const b = [{blind_id:'H-B',coverage_class:'C1',vhs_opportunity:'NO',vcr_opportunity:'NO',books_opportunity:'YES',microwave_opportunity:'NO'}];
  const r = calculateReliability(a,b);
  assert.equal(r.coverage.n, 1);
  assert.equal(r.opportunities.vhs_opportunity.n, 1);
});
