# Calibration Protocol v0.3 Draft

Status: **PROPOSED AFTER GATE 2 ATTEMPT 1 FAILURE — NO TARGET OUTCOMES CONSULTED**

Protocol v0.2 remains the frozen record of Attempt 1. This document is a proposed calibration revision motivated only by inter-coder denominator disagreements.

## Core change: geometry first, opportunity derived

Coders will no longer directly answer `VHS opportunity?`, `VCR opportunity?`, `books opportunity?`, or `microwave opportunity?` while reviewing galleries.

Instead, each coder records a target-blind **spatial exposure matrix**. Object-specific opportunities are then calculated deterministically by code from those primitive measurements.

This separates measurement of the photographic sensor from interpretation of the target object and reduces the risk that seeing a target or target-adjacent object causes the coder to declare an opportunity.

## 1. Qualifying contextual view

A functional zone counts as contextually documented if at least one photograph exposes either:

- approximately >=50% of the functional room/zone with spatial relationships visible; or
- >=75% of a continuous wall, shelving run, cabinet run, equipment run, or storage run within that zone.

Isolated item close-ups do not qualify, regardless of the objects shown.

## 2. Functional-zone checklist

For each household, code `YES`, `NO`, or `INDETERMINATE` for contextual documentation of:

1. living/family/media room
2. kitchen
3. dining area
4. bedroom area
5. office/study
6. basement/garage/storage area

A zone is coded from geometry and spatial context only. The contents of shelves, cabinets, tables, or equipment stands must not be used to decide whether the zone qualifies.

## 3. Mechanical coverage class

Let `Z` be the number of functional zones coded `YES`.

- `C0`: Z = 0
- `C1`: Z = 1
- `C2`: Z = 2–4
- `C3`: Z >= 5, with living/family/media + kitchen + bedroom all coded YES

If Z >=5 but one of those three core zones is not YES, assign C2.

The coverage class is derived by script; coders do not assign C0-C3 directly.

## 4. Media-storage geometry primitives

Code independently:

### `media_storage_run_full`
YES only if >=75% of a continuous shelving/bookcase/media-cabinet run in a living/family/media zone is visible at resolution sufficient to distinguish VHS-sized cases. Do not use the presence of tapes, discs, books, electronics, or labels in making this judgment.

### `equipment_run_full`
YES only if >=75% of the principal TV/media equipment surface or equipment shelving is visible at resolution sufficient to distinguish component-sized devices. A television screen by itself is insufficient.

### `secondary_storage_run_full`
YES only if >=75% of a continuous storage/shelving run in a den, basement, garage, family room, or comparable secondary storage zone is visible at resolution sufficient to distinguish VHS-sized cases or component devices.

## 5. Shelf-bearing-space geometry primitives

Code:

### `principal_shelving_run_full`
YES only if >=75% of at least one continuous bookcase/shelving run in a principal living space is visible. Ignore whether books are actually present.

### `two_principal_living_zones_context`
Derived YES if two or more of living/family/media, dining, bedroom, or office/study are contextually documented.

### `living_plus_office_context`
Derived YES if living/family/media and office/study are both contextually documented.

## 6. Kitchen geometry primitives

Code:

### `kitchen_counter_75`
YES only if approximately >=75% of the major countertop run(s) visible in the photographed kitchen are exposed.

### `kitchen_appliance_wall_full`
YES only if the principal range/refrigerator/upper-cabinet wall, or the clearly expected built-in microwave location, is substantially visible.

If the kitchen is fragmented such that either criterion cannot be judged, use INDETERMINATE rather than inferring YES.

## 7. Deterministic opportunity derivation

The script derives:

- `VHS_OPPORTUNITY = YES` iff `media_storage_run_full == YES` OR `secondary_storage_run_full == YES`.
- `VCR_OPPORTUNITY = YES` iff `equipment_run_full == YES` OR `secondary_storage_run_full == YES`.
- `BOOKS_OPPORTUNITY = YES` iff `principal_shelving_run_full == YES` OR `two_principal_living_zones_context == YES` OR `living_plus_office_context == YES` OR derived coverage == C3.
- `MICROWAVE_OPPORTUNITY = YES` iff `kitchen_counter_75 == YES` AND `kitchen_appliance_wall_full == YES`.

If a required primitive is INDETERMINATE and no alternate sufficient route is YES, the derived opportunity is INDETERMINATE rather than NO.

## 8. Explicit target firewall

During the geometry pass, coders must not use any of the following as evidence that opportunity exists:

- visible VHS tapes or cases;
- visible VCRs/DVD players/electronics;
- visible books or stacks of books;
- a visible microwave;
- seller captions or descriptions naming any target.

Seeing a target does not convert inadequate geometry into adequate opportunity.

## 9. Attempt 2 validation set

The five Attempt 1 double-coded households become a **development set only** and cannot contribute to the Attempt 2 pass/fail statistic.

A fresh five-household independent reliability subset is selected from the remaining 15 by ascending SHA-256 of `gate2b-v0.3|blind_id`:

- H-0503B3B5A5
- H-2E38F11ADE
- H-458D827CBB
- H-B22123D608
- H-479BF9FDE7

This selection rule is frozen before Attempt 2 coding.

## 10. Reliability gates

For derived opportunity variables, retain Protocol v0.2 thresholds:

- Cohen kappa >=0.70 OR Gwet AC1 >=0.75 for admission;
- hard stop below 0.60.

For derived coverage C0-C3:

- linear-weighted Cohen kappa desired >=0.70;
- hard stop below 0.60.

Primitive geometry variables should also be reported individually. A primitive with raw agreement <0.80 is flagged for rule revision even if downstream derived opportunity happens to pass.

## 11. Firewall remains locked

No target-object presence coding, temporal unblinding, regional comparison, prevalence estimate, change-point analysis, or disappearance curve may be performed until Attempt 2 denominator reliability passes.
