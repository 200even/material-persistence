# Gate 1 Gallery Completeness Audit

Status: **PASS — legacy sale endpoint promoted to primary ingestion path**

Date: 2026-08-23

This audit tests gallery recovery only. It does not inspect or summarize VHS, VCR, books, or any other target-object prevalence.

## Question

Does EstateSales.NET's legacy sale-data endpoint appear to return the complete ordered gallery for archived household-liquidation listings, especially in the oldest years of the proposed corpus?

## Design

A stratified eight-sale subset was selected before inspection:

- two 2010 sales
- two 2013 sales
- two 2019 sales
- two 2025 sales
- Memphis/Mid-South and comparison metros represented within each audited era

For each sale the audit:

1. retrieved `sale.pictures[]` from the legacy sale endpoint;
2. independently fetched the public listing page HTML;
3. extracted EstateSales.NET CDN picture asset identifiers from that page source where present;
4. compared the endpoint and page-source picture sets;
5. looked for page-level picture-count candidates;
6. issued byte-range GET requests to the first, middle, and last endpoint images and required successful image responses.

## Results

| Sample | Year | Endpoint pictures | Page-source picture assets | Set comparison | First/middle/last live |
|---|---:|---:|---:|---|---|
| M01 | 2010 | 60 | 60 | Exact set match | Yes |
| C02 | 2010 | 49 | 49 | Exact set match | Yes |
| M04 | 2013 | 411 | 411 | Exact set match | Yes |
| C04 | 2013 | 17 | 17 | Exact set match | Yes |
| M08 | 2019 | 181 | 181 | Exact set match | Yes |
| C08 | 2019 | 216 | 216 | Exact set match | Yes |
| M10 | 2025 | 34 | 0 in static HTML | Client-rendered page; page count matched 34 | Yes |
| C10 | 2025 | 200 | 0 in static HTML | Client-rendered page; page count matched 200 | Yes |

All 24 sampled CDN image probes returned successful partial image responses (`HTTP 206`) with image content types.

### Historical archive result

For every audited sale from 2010, 2013, and 2019, the page-source CDN asset set and legacy-endpoint picture set were identical in both membership and cardinality.

This directly addresses the principal archival concern: early galleries are not merely represented by a surviving thumbnail or truncated endpoint result. In the audited historical listings, the full page-source picture inventory is reproduced by the endpoint.

### 2025 page architecture

The two 2025 pages did not expose CDN picture URLs in static HTML, consistent with a more client-rendered page architecture. However:

- the page contained a picture-count candidate exactly equal to the endpoint count in both cases;
- first, middle, and last endpoint images were live image assets;
- the endpoint itself returned normal ordered picture arrays.

This is strong count-level corroboration, but it is not an independent full-set equality test for modern client-rendered pages.

## Decision

**Gate 1 passes.**

The legacy sale-data endpoint is promoted from experimental candidate to the project's **primary gallery-ingestion path**.

Browser/gallery traversal is reserved as a fallback or audit mechanism rather than the default ingestion method.

## Frozen ingestion exceptions

A sale must be flagged for fallback/review if any of the following occurs:

1. endpoint request fails;
2. endpoint returns zero pictures while the public listing indicates pictures exist;
3. an independently available page/gallery count disagrees with the endpoint count;
4. sampled endpoint image assets fail to resolve as images;
5. page-source asset comparison, when available, shows endpoint omissions.

No listing will silently pass through one of these conditions.

## Continuing completeness surveillance

Scaling the corpus should retain a periodic independent completeness audit rather than assuming the endpoint remains invariant forever. At minimum, a stratified subset from each temporal bin and source/platform version should be cross-checked using a second observation path.

## What this does not establish

Passing Gate 1 establishes recoverability of the archived photo sensor. It does **not** establish that the seller photographed every relevant household space, nor does it justify treating an unpictured object as absent.

The project therefore remains bound by Calibration Protocol v0.2: coverage class and object-specific detection opportunity must pass reliability gates before any `NOT_OBSERVED_GIVEN_OPPORTUNITY` inference or temporal prevalence analysis is allowed.
