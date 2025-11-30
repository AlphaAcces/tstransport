# Case Event Engine & Timeline

This note documents the v1 implementation of case events for the TS24 Intel Console.

## CaseEvent model

```ts
export type CaseEventSeverity = 'low' | 'medium' | 'high' | 'critical';

export type CaseEvent = {
  id: string;
  caseId: string;
  timestamp: string; // ISO-8601 (UTC)
  type: string;      // functional bucket, e.g. payment contact, risk_flag
  severity: CaseEventSeverity;
  title: string;
  description?: string;
  source?: string;   // bank, osint, internal_note …
  tags?: string[];
  linkUrl?: string;
};
```

`deriveEventsFromCaseData(caseData, { caseId })` lives in `src/domains/events/caseEvents.ts` and produces a sorted array by combining:

- Timeline entries (`caseData.timelineData`).
- Priority actions (`caseData.actionsData`) promoted to `high` severity.
- Risk spikes derived from `caseData.riskHeatmapData` when a category hits `Critical`.

The helper always returns events in descending timestamp order.

## API: `GET /api/cases/:id/events`

Implemented in `server/app.ts`.

- Resolves the case via the same store as `GET /api/cases/:id`.
- Runs `deriveEventsFromCaseData` to keep the response side-effect free.
- Success payload: `{ events: CaseEvent[] }`.
- `404` is returned when the `caseId` is unknown (same error envelope as the case detail route).

`server/__tests__/caseEventsApi.test.ts` exercises both the happy path and the 404 branch.

## DataContext wiring

`DataProvider` now exposes:

- `events: CaseEvent[] | null` – null before the first load completes.
- `eventsLoading: boolean` – `true` while the API/derivation is running.
- `eventsError: Error | null` – populated when the API fails (we still render derived events).
- `eventsSource: 'api' | 'derived'` – lets the UI show whether we are on live data or a local snapshot.

Loading strategy:

1. Try `fetchCaseEvents(caseId)`.
2. On success → `eventsSource = 'api'`.
3. On failure → log the error, fallback to `deriveEventsFromCaseData`, set `eventsSource = 'derived'` but keep the error for observability.
4. When the case API is offline entirely we skip step 1 and go straight to derived data.

See `src/context/__tests__/DataContext.test.tsx` for mocks that cover both the API and fallback flows.

## CaseTimeline UI

`src/components/Cases/CaseTimeline.tsx` renders the grouped timeline:

- Skeleton/loader state while `eventsLoading` is true.
- Empty state when no events are available.
- Groups events per calendar day and shows severity, type, time, description, tags and optional source link.
- Displays a badge communicating whether data comes from the live API or the derived snapshot.

The component is embedded in `ExecutiveSummaryView` so that every case dashboard shows the timeline panel alongside the existing KPIs.

Translations live under `cases.timeline.*` (English + Danish locales updated).
