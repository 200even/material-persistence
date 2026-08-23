# Gate 2 Reliability Attempt 1

Status: **HARD STOP — DENOMINATOR RELIABILITY FAILED**

This report freezes the first independent Coder B result before any codebook revision or target-object coding.

## Inputs

- Coder A: 20 blinded households, completed before Coder B.
- Coder B: independently coded frozen 5-household subset (25%).
- No sale year, geography, title, company, description, sale ID, source URL, or temporal ordering was used in the reliability comparison.
- No temporal target-object prevalence analysis has been performed.

## Reliability results

| Variable | Raw/weighted agreement | Cohen/weighted kappa | Gwet AC1 | Gate result |
|---|---:|---:|---:|---|
| Coverage C0-C3 | 0.800 weighted | 0.211 weighted | — | FAIL / hard stop |
| VHS opportunity | 0.400 | -0.364 | -0.034 | FAIL / hard stop |
| VCR opportunity | 0.800 | 0.545 | 0.655 | FAIL |
| Books opportunity | 0.600 | -0.250 | 0.412 | FAIL / hard stop |
| Microwave opportunity | 0.400 | ~0.000 | 0.178 | FAIL / hard stop |

Protocol v0.2 required opportunity Cohen kappa >=0.70 or Gwet AC1 >=0.75, with a hard stop if coverage or detection-opportunity reliability fell below 0.60. The denominator therefore fails preregistration.

## Pairwise disagreements

| Blind ID | A coverage | B coverage | A VHS | B VHS | A VCR | B VCR | A books | B books | A microwave | B microwave |
|---|---|---|---|---|---|---|---|---|---|---|
| H-74CAA99A1C | C2 | C1 | YES | NO | NO | NO | YES | YES | NO | NO |
| H-48983795F5 | C3 | C2 | NO | YES | NO | YES | YES | YES | YES | NO |
| H-BAF87E34E8 | C1 | C1 | NO | NO | NO | NO | NO | YES | NO | NO |
| H-C600F59E3C | C2 | C2 | NO | YES | YES | YES | YES | NO | INDETERMINATE | YES |
| H-DC85C7D2C0 | C2 | C1 | NO | NO | NO | NO | YES | YES | YES | NO |

## Post-hoc diagnostic observations

These observations are diagnostic only and do not alter the frozen ratings above.

1. **Opportunity remains too holistic and interpretive.** Coders can agree that a room is photographed yet disagree about whether enough of the relevant storage/use zone is exposed.
2. **The books rule is vulnerable to target-triggered opportunity.** One Coder B note explicitly justified opportunity using close-up stacks of books. Protocol v0.2 requires opportunity to arise from spatial coverage, not target presence.
3. **The VHS/VCR distinction is not operational enough.** One Coder B note treated a television stand as strong opportunity for both VHS and VCR. Protocol v0.2 explicitly says a television alone does not create VHS opportunity; the difference between exposed equipment shelves and media-storage shelves needs a more mechanical rule.
4. **Microwave opportunity is unstable.** Coders disagreed about whether partial kitchen-wall/counter coverage met the >=75% threshold.
5. **Coverage class itself is under-specified.** The C1/C2 boundary differed on two of five households even though weighted agreement remained 0.80.

## Decision

Target-object coding remains **LOCKED**. No prevalence curve, temporal comparison, regional comparison, change point, or disappearance estimate may be calculated.

The next calibration attempt must revise the denominator operationalization without consulting target-object temporal outcomes, then use a fresh independent reliability subset that was not used to tune the revised rules.
