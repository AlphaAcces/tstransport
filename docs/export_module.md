# Case Export Module

**Last updated:** 30 Nov 2025

## Purpose

The export module aggregates case data, events, and KPIs into downloadable formats. The v1 implementation provides JSON export via API and Executive PDF generation via the client-side PDF renderer.

---

## Where in the Code

### JSON Export Pipeline

| Component/File | Path | Responsibility |
|----------------|------|----------------|
| Export types | `src/domains/export/caseExport.ts` | `CaseExportPayload`, `buildCaseExportPayload()` |
| API route | `server/app.ts` (line ~85) | `POST /api/cases/:id/export` |
| API client | `src/domains/api/client.ts` | `requestCaseExport(id)` |
| Download helper | `src/domains/export/download.ts` | `downloadJsonExport(payload)` |
| ExportCaseButton | `src/components/Executive/ExportCaseButton.tsx` | UI action with loading/error states |
| Tests | `server/__tests__/caseExportApi.test.ts` | API endpoint tests |

### Executive PDF Pipeline

| Component/File | Path | Responsibility |
|----------------|------|----------------|
| Main composer | `src/pdf/executiveReport.ts` | `generateExecutiveReportPdf()` orchestrates sections |
| Theme | `src/pdf/reportTheme.ts` | `ReportTheme` interface, Intel24 branding colors |
| Metadata | `src/pdf/reportMetadata.ts` | `buildExecutiveReportMetadata()` |
| Filename | `src/pdf/reportFilename.ts` | `buildReportFilename()` → `<CASE>_ExecutiveSummary_<ver>_<date>.pdf` |
| Header | `src/pdf/reportHeader.ts` | `drawReportHeader()` – per-page header chrome |
| Footer | `src/pdf/reportFooter.ts` | `drawReportFooter()` – per-page footer chrome |
| Elements | `src/pdf/reportElements.ts` | Shared drawing helpers (`drawSectionTitle`, `drawBulletList`, etc.) |
| Formatters | `src/pdf/reportFormatters.ts` | `formatCurrency`, `formatPercent`, `formatDays`, `formatDate` |
| Fonts | `src/pdf/reportFonts.ts` | `registerReportFonts()` with Inter loader + Helvetica fallback |
| Types | `src/pdf/reportTypes.ts` | `SectionRenderer`, `SectionRenderParams`, `ExecutiveReportChart` |
| Export service | `src/domains/executive/services/executiveExportService.ts` | UI-facing export orchestration |
| Controller hook | `src/domains/executive/hooks/useExecutiveSummaryController.ts` | `handleExport` callback |
| Tests | `src/pdf/__tests__/executiveReport.test.ts` | PDF generation + filename tests |

### Section Renderers (`src/pdf/sections/`)

| File | Section |
|------|---------|
| `executiveSummarySection.ts` | Executive Summary / Konklusioner |
| `financialSection.ts` | Finansiel oversigt (incl. charts) |
| `riskSection.ts` | Risiko & compliance |
| `actionsSection.ts` | Action radar / handlinger |
| `timelineSection.ts` | Tidslinje / hændelser |
| `metadataSection.ts` | Metadata / noter |

---

## Flow Overview

1. **API endpoint** – `POST /api/cases/:id/export` (implemented in `server/app.ts`) loads the case from the store, derives case events and KPIs, and runs `buildCaseExportPayload`. The route responds with `{ export: CaseExportPayload }` and logs the export operation.
2. **Domain helper** – `src/domains/export/caseExport.ts` defines `CaseExportPayload` and the `buildCaseExportPayload` helper that stamps metadata such as `caseId`, `generatedAt`, and `format`.
3. **Client call** – `requestCaseExport(caseId)` in `src/domains/api/client.ts` POSTs to the endpoint and returns the payload.
4. **Download helper** – `downloadJsonExport(payload)` in `src/domains/export/download.ts` serializes the payload, creates a blob, and triggers a browser download with a sensible filename.
5. **UI action** – `ExportCaseButton` (rendered in `ExecutiveSummaryView`) wires the client call + download helper to provide an "Export case" action with loading/error states.

---

## Testing

- `server/__tests__/caseExportApi.test.ts` covers the endpoint happy-path + 404.
- `src/domains/export/__tests__/exportService.test.ts` validates the client helper and download utility.
- `src/components/Executive/__tests__/ExportCaseButton.test.tsx` ensures the UI action handles success, loading, and failure states.
- `src/components/Executive/__tests__/ExecutiveSummaryView.test.tsx` now asserts that the export button renders when a case is active.
- `src/pdf/__tests__/executiveReport.test.ts` – PDF generation smoke tests and filename derivation.

---

## Executive PDF Details (v2)

### PDF Structure

Each Executive PDF contains:

1. **Header** (per page) – Intel24 badge, report title, case name, page count, classification
2. **Sections** (6 total) – Each uses `drawSectionTitle` with accent color (#F7B500)
3. **Footer** (per page) – Intel24 Data Intel™, page numbers, export metadata

### Filename Format

```text
<CASE>_ExecutiveSummary_<version>_<YYYY-MM-DD>.pdf
```

Example: `TSL-001_ExecutiveSummary_v1_2025-11-30.pdf`

### Theme (reportTheme.ts)

| Property | Value |
|----------|-------|
| Accent color | `#F7B500` (gold) |
| Background | `#070C18` (dark) |
| Margin | 56pt |
| Typography | heading: 20pt, section: 12pt, body: 10pt |

---

## Known Limitations

| Limitation | Notes |
|------------|-------|
| **Inter font not loaded** | Font loader prepared (`configureInterFontLoader`) but no `.ttf` asset yet; falls back to Helvetica |
| **Client-side only** | PDF is generated in browser; very large cases may be slow |
| **No server-side export** | Future iteration could add `/api/cases/:id/export?format=pdf` |
| **Chart dependency** | `html2canvas` snapshots can fail with CORS issues on external images |

---

## Future Work

- **Add Inter font asset** – Include `Inter-Regular.ttf` as base64 in the build.
- **Server-side PDF** – Generate PDFs on the server for large cases or background processing.
- **Additional formats** – CSV, Excel export from the same payload.
- **Blackbox integration** – Send exports to the Blackbox report engine.
