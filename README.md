# Intel24 Console

**Intel24 Console** is a multi-tenant React + Vite application for financial investigations, network analysis, and executive reporting. It provides case management, KPI dashboards, event timelines, and branded PDF exports for operators and analysts.

---

## ✨ Main Features (v1)

| Feature | Description | Docs |
|---------|-------------|------|
| **SSO v1 Login** | JWT-based SSO from ALPHA-Interface-GUI + manual login fallback | [login_flow.md](docs/login_flow.md), [sso_v1_signoff.md](docs/sso_v1_signoff.md) |
| **Case Library** | Browse and switch cases via `/api/cases`; URL routing with `?case=` | [cases_api.md](docs/cases_api.md) |
| **Timeline / Events** | Case event engine + `CaseTimeline` UI grouped by day | [events_timeline.md](docs/events_timeline.md) |
| **KPI Dashboard** | Derived KPI metrics displayed in `ExecutiveSummaryView` | [kpi_module.md](docs/kpi_module.md) |
| **Executive PDF Export** | Branded multi-section PDF with header/footer, metadata-driven filename | [export_module.md](docs/export_module.md) |
| **AI Network Overlays** | Optional AI analysis on network graphs (tenant-scoped keys) | See architecture below |

For a high-level flow diagram, see [system_overview.md](docs/system_overview.md).

---

## 🚀 Getting Started

**Prerequisites:** Node.js 18+ and Git.

```pwsh
# 0. Clone repository
git clone https://github.com/blackbox-eye/intel24-console.git
cd intel24-console

# 1. Install dependencies
npm install

# 2. Environment variables (create .env.local)
VITE_SSO_JWT_SECRET=your_shared_secret
AI_KEY_MASTER=<base64-encoded-32-byte-key>

# 3. Start development servers
npm run dev          # Vite frontend (default: http://localhost:5173)
npx tsx server/index.ts  # Express backend (default: http://localhost:4001)

# 4. Build & test
npm run build
npm test -- --run    # Vitest unit/integration tests
npm run test:e2e     # Playwright e2e tests
```

> For production deployment behind `https://intel24.blackbox.codes`, follow [docs/deployment_guide.md](docs/deployment_guide.md) and use the drop-in configs in `deploy/pm2.config.cjs` + `deploy/nginx-intel24.conf`.

---

## 🏗️ Architecture Overview

```text
src/
├── components/       # UI components (Auth, Cases, Dashboard, Executive, etc.)
├── context/          # React contexts (DataContext for case/events/kpis)
├── domains/          # Domain logic (api, cases, events, kpi, export, tenant, etc.)
├── pdf/              # PDF generation (executiveReport, sections, theme)
├── lib/              # Shared utilities (ai adapters, formatting)
└── i18n/             # Translations (en, da)

server/
├── app.ts            # Express routes (/api/cases, /api/auth/sso-health, etc.)
├── storage.ts        # JSON file storage for tenant keys
└── crypto.ts         # AES-256-GCM encryption utilities

docs/                 # Documentation
```

**Key API routes (server/app.ts):**

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/auth/sso-health` | SSO healthcheck (secret/issuer validation) |
| GET | `/api/cases` | List all case metadata |
| GET | `/api/cases/:id` | Full case data by ID |
| GET | `/api/cases/:id/events` | Derived case events |
| GET | `/api/cases/:id/kpis` | Derived KPI summary |
| POST | `/api/cases/:id/export` | Export case payload (JSON) |
| GET/PUT/DELETE | `/api/tenant/:id/aiKey` | Tenant AI key management |

---

## 🧪 Testing

- **Unit tests:** `npm test -- --run` (Vitest)
- **Server tests:** `server/__tests__/*.test.ts`
- **E2E tests:** `npm run test:e2e` (Playwright)
- **SSO smoke test:** `npm run test:sso-smoke`

---

## 📚 Documentation

| Document | Content |
|----------|---------|
| [system_overview.md](docs/system_overview.md) | High-level flow diagrams |
| [login_flow.md](docs/login_flow.md) | Login & SSO implementation details |
| [sso_v1_signoff.md](docs/sso_v1_signoff.md) | SSO v1 sign-off checklist |
| [cases_api.md](docs/cases_api.md) | Case API & DataContext integration |
| [events_timeline.md](docs/events_timeline.md) | Event engine & CaseTimeline UI |
| [kpi_module.md](docs/kpi_module.md) | KPI derivation & dashboard |
| [export_module.md](docs/export_module.md) | Export pipeline & Executive PDF |

---

## 🔧 PR & CI Guidance

1. Ensure `npm run build` and `npm test -- --run` pass before opening a PR.
2. Run `npm run lint` to check for code style issues.
3. For SSO changes, verify with `npm run test:sso-smoke` against the dev server.

