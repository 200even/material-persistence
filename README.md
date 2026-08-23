# Material Persistence

A longitudinal study of household material culture using archived estate-sale imagery.

The project asks a narrow empirical question:

> How long do physical objects and associated domestic practices persist inside households after their period of ordinary use has ended?

The initial corpus uses archived EstateSales.NET household liquidations from 2010–2025, with Memphis/Mid-South intentionally oversampled during calibration.

## Methodological status

**Calibration protocol v0.2 is frozen.** The current task is ingestion validation, not historical inference.

The primary observational unit is the **sale-household**. Photographs are treated as a variable-fidelity sensor of household contents, not as independent observations.

Allowed primary outcome states are:

- `OBSERVED`
- `NOT_OBSERVED_GIVEN_OPPORTUNITY`
- `INDETERMINATE`

The project never treats `not pictured` as equivalent to `absent`.

The permitted estimand is:

`P(object retained | liquidation year, archived estate-liquidated household)`

This project does **not** infer contemporaneous ownership in the general U.S. household population without external calibration.

## Current milestone: ingestion gate

Before any VHS, VCR, books, or other prevalence coding, we must establish that the complete ordered photo gallery can be recovered for each sampled sale.

The first ingestion strategy uses EstateSales.NET's public legacy sale-data endpoint keyed by numeric sale ID. It records the returned `sale.pictures[]` array in source order. Browser-based gallery traversal is a later fallback, not the primary path.

For every sale we want an audit record containing:

- sale ID and source URL
- extraction method
- returned picture count
- unique picture count
- ordered image URLs
- extraction timestamp
- error state, if any

No cultural inference is unlocked until gallery ingestion and denominator reliability pass the preregistered gates in [`docs/protocol-v0.2.md`](docs/protocol-v0.2.md).

## Repository layout

```text
data/
  calibration-sample.tsv    Frozen 20-household calibration frame
src/
  estateSalesClient.js      Sale ID + legacy picture-array client
  ingest.js                 Calibration ingestion CLI
test/
  estateSalesClient.test.js Offline unit tests
docs/
  protocol-v0.2.md          Frozen methodological safeguards
out/                         Generated manifests; ignored by git
```

Raw household images should **not** be committed to Git. Derived manifests and anonymized aggregate outputs can be versioned once their provenance and privacy treatment are settled.

## Quick start

Requires Node.js 20+.

```bash
npm test
npm run ingest -- data/calibration-sample.tsv out/calibration-ingest.jsonl
```

The ingestion command is deliberately sequential and rate-limited. A failed listing is written as an error record rather than silently dropped.

## Pilot sequence

1. Freeze sampling frame and codebook. **Done.**
2. Recover full ordered galleries for the 20-household calibration sample.
3. Audit gallery completeness and duplicate images.
4. Blind-code spatial coverage and object-specific detection opportunity.
5. Double-code at least 25% of calibration households.
6. Require preregistered reliability thresholds.
7. Only then inspect target-object outcomes.
8. If calibration passes, scale to the 120-household pilot.

## Ethics / privacy

The research unit is an archival household liquidation, but precise street addresses and household identities are not analytically necessary. Published outputs should favor approximate geography, aggregate statistics, and derived annotations rather than redistributing searchable domestic-interior archives.
