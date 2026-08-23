const YES = 'YES';
const NO = 'NO';

const ZONE_FIELDS = [
  'living_context',
  'kitchen_context',
  'dining_context',
  'bedroom_context',
  'office_context',
  'storage_context',
];

function requireBinary(row, fields) {
  for (const field of fields) {
    if (![YES, NO].includes(row[field])) {
      throw new Error(`${row.blind_id ?? 'row'}: ${field} must be YES or NO`);
    }
  }
}

export function deriveCoverage(row) {
  requireBinary(row, ZONE_FIELDS);
  const z = ZONE_FIELDS.filter(f => row[f] === YES).length;
  if (z === 0) return 'C0';
  if (z === 1) return 'C1';
  if (z <= 4) return 'C2';
  const core = ['living_context', 'kitchen_context', 'bedroom_context'];
  return core.every(f => row[f] === YES) ? 'C3' : 'C2';
}

export function deriveOpportunity(row) {
  const primitiveFields = [
    ...ZONE_FIELDS,
    'principal_shelving_run_full',
    'equipment_run_full',
    'secondary_storage_run_full',
    'kitchen_counter_75',
    'kitchen_appliance_wall_full',
  ];
  requireBinary(row, primitiveFields);

  const coverage_class = deriveCoverage(row);
  const principalLivingYes = [
    'living_context',
    'dining_context',
    'bedroom_context',
    'office_context',
  ].filter(f => row[f] === YES).length;

  const two_principal_living_zones_context = principalLivingYes >= 2 ? YES : NO;
  const living_plus_office_context =
    row.living_context === YES && row.office_context === YES ? YES : NO;

  const vhs_opportunity =
    row.principal_shelving_run_full === YES || row.secondary_storage_run_full === YES ? YES : NO;

  const vcr_opportunity =
    row.equipment_run_full === YES || row.secondary_storage_run_full === YES ? YES : NO;

  const books_opportunity =
    row.principal_shelving_run_full === YES ||
    two_principal_living_zones_context === YES ||
    living_plus_office_context === YES ||
    coverage_class === 'C3'
      ? YES
      : NO;

  const microwave_opportunity =
    row.kitchen_counter_75 === YES && row.kitchen_appliance_wall_full === YES ? YES : NO;

  return {
    blind_id: row.blind_id,
    coverage_class,
    two_principal_living_zones_context,
    living_plus_office_context,
    vhs_opportunity,
    vcr_opportunity,
    books_opportunity,
    microwave_opportunity,
  };
}
