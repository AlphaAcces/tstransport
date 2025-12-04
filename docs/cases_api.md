# Intel24 Case API

**Last updated:** 30 Nov 2025

## Purpose

The Case API provides HTTP endpoints for listing and retrieving case data. The frontend hydrates via these endpoints, with a fallback to local mock data when the server is unavailable.

---

## Where in the Code

| Component/File | Path | Responsibility |
|----------------|------|----------------|
| API routes | `server/app.ts` (lines ~50-100) | `GET /api/cases`, `GET /api/cases/:id` |
| Case store | `src/domains/cases/caseStore.ts` | In-memory case data (TSL/Ümit datasets) |
| Case metadata | `src/domains/cases/caseMetadata.ts` | `CASE_METADATA` array with `CaseMeta` entries |
| API client | `src/domains/api/client.ts` | `fetchCases()`, `fetchCase(id)` helpers |
| DataContext | `src/context/DataContext.tsx` | Loads case via API → fallback → mock |
| CaseLibraryView | `src/components/Cases/CaseLibraryView.tsx` | UI for browsing/selecting cases |
| useCaseRegistry | `src/hooks/useCaseRegistry.ts` | Hook for case list with loading/error states |
| Types | `src/types/core.ts` | `CaseMeta`, `CaseData` interfaces |

---

## Endpoints

### `GET /api/cases`

Returns an array of `CaseMeta` records. Each entry contains the case identifier, human label, type, default subject, and lightweight descriptive fields.

```json
[
  {
    "id": "tsl",
    "name": "TS Logistik ApS",
    "type": "business",
    "defaultSubject": "tsl",
    "summary": "Flagship Danish transport case involving complex holding structures and capital flight.",
    "region": "DK",
    "updatedAt": "2025-01-05T00:00:00.000Z",
    "tags": ["transport", "aml", "corporate"]
  }
]
```

### `GET /api/cases/:id`

Returns the full `CaseData` object for the requested case. A 404 is returned when the ID is unknown.

```json
{
  "tenantId": "default-tenant",
  "personData": {
    "name": "TS Logistik ApS",
    "title": "Suspicious transport conglomerate",
    "summary": "Case summary omitted for brevity"
  },
  "companiesData": [
    { "id": "company-1", "name": "TS Logistik ApS" }
  ],
  "financialData": [...],
  "hypothesesData": [...],
  "riskHeatmapData": [...],
  "timelineData": [...],
  "actionsData": [...],
  "executiveSummary": { "highlights": [] }
}
```

> **TODO:** Swap the in-memory `caseStore` for a real datastore and enforce auth/authorization before exposing the API outside of mock/dev environments.

## Frontend integration

- A typed API client lives at `src/domains/api/client.ts`.
  - `fetchCases()` returns `CaseMeta[]`
  - `fetchCase(id)` returns `CaseData`
  - Failures throw an `ApiError` that logs to the console with the `[Intel24 API]` prefix.
- The `DataContext` component now loads case data via `fetchCase` on mount/subject changes.
  - While the request is pending, the provider renders a global skeleton loader.
  - On success, `dataSource` inside the context is set to `'api'`.
  - If the API call fails, the provider falls back to `getDataForSubject` (the legacy mock import) and marks `dataSource` as `'mock'`.
  - When both API and fallback fail, the provider shows an empty-state card prompting the user to check the browser console.

## Mock fallback & troubleshooting

- The fallback path keeps local development functional when the Express server is offline or still returning placeholder data.
- Tenant checks are still enforced. Non-matching tenant IDs set `errorKey = 'tenantMismatch'` and skip rendering.
- Because every failure logs to the console, operators can see why the fallback triggered. Use this log together with `dataSource` to confirm whether UI data is coming from the API or mock modules.

## Testing

- Unit tests run with a global Vitest mock defined in `src/test/mocks/apiClientMock.ts` (loaded via `src/test/setup.ts`). The helper mocks `src/domains/api/client` so `fetchCase` returns a valid `CaseData` fixture without hitting `fetch`.
- To tweak behavior inside a test, import `caseApiMock` from `src/test/mocks/apiClientMock.ts` and adjust the mock directly, e.g.:

```ts
caseApiMock.fetchCaseMock.mockRejectedValueOnce(new Error('network fault'));
```

  This pattern powers `DataContext.test.tsx`, which asserts both the API-success path and the mock fallback path.

- Because the mock lives purely in the test harness, browser/runtime behavior keeps calling the real HTTP endpoints unchanged.

---

## URL Routing (`?case=`)

The console supports case selection via query parameter:

- URL format: `/?case=tsl` or `/?case=umit`
- `App.tsx` reads `searchParams.get('case')` and passes it to `DataProvider` as `activeCaseId`.
- `CaseLibraryView.onSelectCase` updates the URL and triggers a re-render with the new case.
- If no `?case=` param is present, the default case (`tsl`) is loaded.
