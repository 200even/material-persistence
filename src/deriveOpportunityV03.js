const YES = 'YES';
const NO = 'NO';
const INDETERMINATE = 'INDETERMINATE';

export const PRIMITIVE_FIELDS = [
  'common_room_envelope_complete',
  'kitchen_envelope_complete',
  'dining_envelope_complete',
  'bedroom_envelope_complete',
  'office_envelope_complete',
  'secondary_storage_envelope_complete',
  'common_room_storage_exposure_complete',
  'secondary_storage_exposure_complete',
  'common_room_low_surface_exposure_complete',
  'kitchen_work_surfaces_complete',
];

const ROOM_FIELDS = [
  'common_room_envelope_complete',
  'kitchen_envelope_complete',
  'dining_envelope_complete',
  'bedroom_envelope_complete',
  'office_envelope_complete',
  'secondary_storage_envelope_complete',
];

const VALUES = new Set([YES, NO, INDETERMINATE]);

function requireValues(row, fields = PRIMITIVE_FIELDS) {
  for (const field of fields) {
    if (!VALUES.has(row[field])) {
      throw new Error(`${row.blind_id ?? 'row'}: ${field} must be YES, NO, or INDETERMINATE`);
    }
  }
}

function and2(a, b) {
  if (a === NO || b === NO) return NO;
  if (a === YES && b === YES) return YES;
  return INDETERMINATE;
}

function orValues(values) {
  if (values.includes(YES)) return YES;
  if (values.every(v => v === NO)) return NO;
  return INDETERMINATE;
}

function atLeastTwo(values) {
  const yes = values.filter(v => v === YES).length;
  const indeterminate = values.filter(v => v === INDETERMINATE).length;
  if (yes >= 2) return YES;
  if (yes + indeterminate < 2) return NO;
  return INDETERMINATE;
}

export function deriveOpportunity(row) {
  requireValues(row);

  const vhs_common = and2(
    row.common_room_envelope_complete,
    row.common_room_storage_exposure_complete,
  );
  const vhs_secondary = and2(
    row.secondary_storage_envelope_complete,
    row.secondary_storage_exposure_complete,
  );

  const vcr_common = and2(
    row.common_room_envelope_complete,
    row.common_room_low_surface_exposure_complete,
  );
  const vcr_secondary = and2(
    row.secondary_storage_envelope_complete,
    row.secondary_storage_exposure_complete,
  );

  const books_opportunity = atLeastTwo([
    row.common_room_envelope_complete,
    row.dining_envelope_complete,
    row.bedroom_envelope_complete,
    row.office_envelope_complete,
  ]);

  const microwave_opportunity = and2(
    row.kitchen_envelope_complete,
    row.kitchen_work_surfaces_complete,
  );

  return {
    blind_id: row.blind_id,
    room_envelopes_yes: ROOM_FIELDS.filter(field => row[field] === YES).length,
    vhs_opportunity: orValues([vhs_common, vhs_secondary]),
    vcr_opportunity: orValues([vcr_common, vcr_secondary]),
    books_opportunity,
    microwave_opportunity,
  };
}
