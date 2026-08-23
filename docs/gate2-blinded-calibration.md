# Gate 2: Blinded Coverage and Detection-Opportunity Calibration

Status: **EXECUTION STAGE**

Gate 1 established that the archived gallery sensor is recoverable. Gate 2 tests whether its *coverage* can be judged reproducibly enough to support object-specific denominators.

## Blinding firewall

Coding packets must not expose sale year, location, title, company, seller description, sale ID, source URL, or temporal ordering. Households receive opaque hash-derived IDs and are sorted by those IDs.

The private rendering manifest exists only inside the CI job and is not uploaded. The uploaded coding artifact contains contact sheets, opaque IDs, picture counts, and blank coding forms.

## Stage 2A: Coverage/opportunity only

Coders must not score VHS, VCR, books, microwave presence, or any other target-object outcome during this stage.

Coder A scores all 20 households for:

- coverage class C0-C3;
- VHS detection opportunity;
- VCR detection opportunity;
- books detection opportunity;
- microwave detection opportunity.

Opportunity values are `YES`, `NO`, or `INDETERMINATE` under Protocol v0.2.

## Reliability subset

Five households (25%) are deterministically selected by a separate hash rank for independent Coder B review. The Coder B form contains only those opaque IDs.

The preregistered inter-coder thresholds remain unchanged:

- opportunity: Cohen kappa >= 0.70 or Gwet AC1 >= 0.75;
- coverage C0-C3: weighted kappa desired >= 0.70;
- hard stop if coverage or opportunity reliability < 0.60.

A repeated judgment by the same model/person is **not** represented as independent inter-coder reliability. If only one coder is available, Stage 2A can produce Coder A measurements but cannot pass the denominator reliability gate.

## Rendering standard

Every gallery image is represented exactly once in numbered contact sheets. Contact sheets contain no source metadata. Image download failures are fatal to packet generation rather than silently omitted.

## Gate 2 decision

Only after the independent reliability requirement passes may target-object presence coding be unlocked. Until then, temporal prevalence, regional effects, and object-disappearance curves remain prohibited.
