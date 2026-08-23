# Calibration Protocol v0.3

Status: **FROZEN BEFORE GATE 2b SCORING**

Protocol v0.2 and Gate 2 Attempt 1 remain the permanent record of the failed direct-opportunity instrument. This revision incorporates the referee's mandatory follow-up revisions before any Gate 2b validation scoring.

## 1. Core architecture: geometry first

Coders do not answer whether a photograph provides "VHS opportunity", "VCR opportunity", "books opportunity", or "microwave opportunity".

Coders record only target-neutral spatial geometry. Object-specific opportunity is then derived deterministically by code.

Target-object presence must never be used as evidence that a spatial primitive is satisfied.

## 2. Validation design

The five households double-coded in Gate 2 Attempt 1 are development data only and are permanently excluded from Gate 2b pass/fail statistics:

- H-74CAA99A1C
- H-48983795F5
- H-BAF87E34E8
- H-C600F59E3C
- H-DC85C7D2C0

Gate 2b uses **all 15 untouched holdout households** as the independent validation set. This exceeds the referee's minimum n=10 and preferred n=15.

Coder A must complete and freeze all 15 geometry forms before Coder B results are inspected. Coder B receives the same blinded imagery and neutral geometry form but no Coder A results.

## 3. Allowed primitive values

Every primitive is coded as:

- `YES`
- `NO`
- `INDETERMINATE`

`INDETERMINATE` is required when perspective, cropping, irregular geometry, occlusion, or inconsistent images prevent a defensible geometric judgment.

## 4. Anchored room-envelope primitives

Percentage estimates are prohibited.

A room/zone envelope is `YES` only when the image set allows its horizontal boundary to be reconstructed from visually anchored limits. For an ordinary enclosed room, this normally means every wall junction/corner is visible somewhere in the set. For an open-plan zone, every terminal wall junction plus the architectural transitions that bound the zone must be visible.

A cropped continuation off-frame is not a terminal edge.

Code the following:

- `common_room_envelope_complete`: at least one living/family/den/common room satisfies the envelope rule.
- `kitchen_envelope_complete`: the kitchen perimeter is reconstructible; all wall/cabinet runs and any island/peninsula boundaries are visible.
- `dining_envelope_complete`: at least one dining zone/room satisfies the envelope rule.
- `bedroom_envelope_complete`: at least one bedroom satisfies the envelope rule.
- `office_envelope_complete`: at least one office/study satisfies the envelope rule.
- `secondary_storage_envelope_complete`: at least one basement/garage/storage room satisfies the envelope rule.

The function of a room may be inferred from ordinary architectural context and furniture layout, but no target object may be used to establish that function.

## 5. Anchored storage/surface primitives

These primitives are defined by physical boundaries, not assumed media function.

### `common_room_storage_exposure_complete`

Applicable to the common room used for `common_room_envelope_complete`.

`YES` only if the room envelope is complete and every storage-bearing furniture/cabinet element in that room that could conceal a small household object approximately 15 x 20 x 3 cm is either:

- absent; or
- shown with its relevant interior/open shelves fully exposed from terminal edge to terminal edge.

Any closed drawer/door, cropped storage continuation, or unresolved storage volume large enough to conceal such an object makes this `NO`. Use `INDETERMINATE` if the geometry cannot be resolved.

### `secondary_storage_exposure_complete`

Same rule as above, applied to the secondary-storage room used for `secondary_storage_envelope_complete`.

### `common_room_low_surface_exposure_complete`

Applicable to the common room used for `common_room_envelope_complete`.

`YES` only if the room envelope is complete and every low horizontal furniture/built-in surface and open compartment capable of holding a component-sized object approximately 45 x 35 x 10 cm is fully visible between its terminal boundaries. If no such surface/compartment exists in the completely documented room, code `YES`.

Closed compartments large enough to conceal such an object make this `NO` unless their interiors are exposed.

### `kitchen_work_surfaces_complete`

Applicable only when `kitchen_envelope_complete=YES`.

`YES` only if:

- every countertop run is visible from one terminal end to the other;
- every island or peninsula is fully bounded in the image set; and
- all upper-cabinet and built-in-appliance fronts are visible without cropped continuation.

No percentage estimate is permitted.

## 6. Deterministic opportunity derivation

The software derives opportunity only from the primitives above.

### VHS

`VHS_OPPORTUNITY=YES` if either:

- `common_room_envelope_complete=YES` AND `common_room_storage_exposure_complete=YES`; or
- `secondary_storage_envelope_complete=YES` AND `secondary_storage_exposure_complete=YES`.

### VCR

`VCR_OPPORTUNITY=YES` if either:

- `common_room_envelope_complete=YES` AND `common_room_low_surface_exposure_complete=YES`; or
- `secondary_storage_envelope_complete=YES` AND `secondary_storage_exposure_complete=YES`.

### Books

The primary book outcome remains **substantial household book presence**, not possession of a single book.

`BOOKS_OPPORTUNITY=YES` if at least two of the following room envelopes are `YES`:

- common room
- dining
- bedroom
- office/study

This rule deliberately does not condition opportunity on the presence of a bookcase or visible books.

### Microwave

`MICROWAVE_OPPORTUNITY=YES` only if:

- `kitchen_envelope_complete=YES`; and
- `kitchen_work_surfaces_complete=YES`.

### Indeterminate propagation

If no sufficient `YES` route exists and one or more primitives required by a possible route are `INDETERMINATE`, the derived opportunity is `INDETERMINATE`, not `NO`.

## 7. Global C0-C3 coverage

C0-C3 is removed from the primary inferential architecture.

The system may retain descriptive sale-level metadata such as:

- number of room envelopes coded `YES`;
- picture count;
- room/zone types documented.

No global coverage class may be used to admit a household to an object-specific absence denominator.

## 8. Primitive reliability gate

Every primitive that feeds a derived denominator must independently pass chance-corrected reliability.

For each primitive report:

- n
- category frequencies by coder
- raw agreement
- Cohen's kappa
- Gwet's AC1

### Admission

A primitive passes if:

- Cohen's kappa >= 0.70, **or**
- Gwet's AC1 >= 0.75.

Derived opportunity variables must meet the same admission rule.

### Revision band

If a primitive does not meet admission but at least one supported chance-corrected statistic is >=0.60, Gate 2b does not pass; revise the rule without examining target outcomes and validate again on fresh data.

### Fatal denominator failure

If any primary primitive has both Cohen's kappa <0.60 and Gwet's AC1 <0.60, photographic absence inference is abandoned for the project and the study is restricted to positive-observation/abundance modeling unless an entirely new independent measurement architecture is preregistered.

If a statistic is mathematically undefined because of a degenerate marginal distribution, the primitive cannot pass automatically. Report the degeneracy and expand or redesign validation before making a pass decision.

## 9. Derived-output reliability

After primitive reliability is calculated, derive VHS/VCR/books/microwave opportunity separately for Coder A and Coder B and calculate Cohen's kappa and Gwet's AC1 on the derived variables.

Primitive reliability has logical priority: a derived variable cannot rescue a failed primitive merely because downstream agreement happens to be high.

## 10. Explicit target firewall

During Gate 2b geometry coding, coders must not use any of the following as evidence that a primitive is satisfied:

- VHS tapes/cases;
- VCR/DVD/electronic components;
- books or book stacks;
- microwave ovens;
- captions/descriptions naming a target;
- the apparent resale value or collectibility of any target-adjacent object.

A target can be plainly visible and the corresponding opportunity can still derive as `NO` or `INDETERMINATE` if the geometry criterion is not satisfied.

## 11. Interpretive limit

Even after Gate 2b passes, `NOT_OBSERVED_GIVEN_OPPORTUNITY` means only that the target was not observed within the preregistered exposed spatial domain. It does not prove that no hidden instance existed in boxes, inaccessible closets, removed family possessions, or other unphotographed storage.

## 12. Firewall remains locked

Until Gate 2b passes:

- no target-object presence coding;
- no temporal unblinding;
- no prevalence estimates;
- no regional comparisons;
- no change-point/disappearance curves.
