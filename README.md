# TSL Intelligence Console

![Executive console banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: [https://ai.studio/apps/drive/16vIahFq1nG7S_oXIMVsen0gKYBOU0e-0](https://ai.studio/apps/drive/16vIahFq1nG7S_oXIMVsen0gKYBOU0e-0)

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `VITE_GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Build & Bundle Strategy

- Vite 7 builds now rely on explicit manual chunks (`pdf-jspdf`, `pdf-html2canvas`, `charts-core`, `charts-cartesian`, `charts-wrappers`, `charts-polar`, `charts-shapes`, `charts-components`, `charts-utils`, `ai-gemini`, `ai-client`, `icons`, `case-data`, `pdf-executive`, `shared-kpi`).
- The chunk naming mirrors the major feature areas; keep `vite.config.ts` and this section in sync when introducing or removing chunks.
- Heavy chart libraries (`recharts`) and AI tooling (`@google/generative-ai`) are isolated so that dashboard navigation keeps a lean initial bundle while async views pull their weights on demand.
- Shared KPI components have their own chunk to avoid re-hydrating UI chrome when navigating between analytics-heavy views.

## PDF Executive Export

- The export now renders a light, board-ready grid of cards (Financials, Risks, Action Radar) with consistent padding and typography.
- Charts are rasterised with `html2canvas` at a minimum scale of 3× to keep vector-style sharpness in jsPDF v3.0.4.
- Risk scores appear as high-contrast badges, while deadlines, board items, and critical events are grouped with icon bullets; footer metadata adds date and pagination automatically.
- When testing locally: trigger the export from the Executive summary view and verify that cards, charts, and badges align with the current subject data.

## Tooling Notes

- TypeScript is pinned to `~5.5.x` to remain compatible with the current ESLint plugin ecosystem; update both when bumping ESLint.
- `npm run lint`, `npm run build`, and `npm audit` must stay green before committing. The PDF export depends on dynamic imports, so always exercise the executive view after dependency changes.

## Test Roadmap

- **Export payload builder:** unit-test that `createExecutiveExportPayload` derives financial metrics, risk highlights, and action timelines consistently for both TSL and Ümit cases.
- **Lazy-loaded views:** add render smoke tests to confirm the Suspense fallbacks mount and resolve for dashboard helpers and chart-centric screens.
- **PDF rendering hooks:** cover the `generateExecutiveReportPdf` flow with mocks for `jspdf`/`html2canvas` to assert card ordering, badge colours, and footer metadata.

## Visual preview & Playwright

To generate deterministic screenshots locally (TopBar, nested breadcrumbs, saved-views):

1. Install Playwright and browsers:

```pwsh
npm install --save-dev playwright
npx playwright install --with-deps
```

2. Run the composite script which starts the dev server, waits for `http://localhost:5173` and runs the screenshot flow:

```pwsh
npm run preview-shots
```

Screenshots will be written to the `screenshots/` directory: `screenshot-topbar.png`, `screenshot-nested-breadcrumbs.png`, `screenshot-saved-views.png`.

The app exposes a dev-only helper `window.__navigateTo` for deterministic navigation during screenshotting. Do not rely on this API in production code.
