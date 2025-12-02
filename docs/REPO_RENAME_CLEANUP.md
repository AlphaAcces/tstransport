# Intel24 Repo Rename Cleanup Report

**Dato:** 2. december 2025  
**Udført af:** Copilot (Claude Opus 4.5)  
**Branch:** `feature/qa-release-prep`

---

## 📋 Overblik

Dette dokument dokumenterer den systematiske omdøbning fra **TS24** til **Intel24** på tværs af codebasen.

### Navnekonvention

| Tidligere | Nyt | Kontekst |
|-----------|-----|----------|
| `TS24` | `Intel24` | UI branding, docs, kommentarer |
| `ts24-intel-console` | `intel24-console` | PM2 process, package name |
| `tsl-intelligence-console` | `intel24-console` | NPM package name |
| `TS24 Development Team` | `Intel24 Development Team` | Docs, scripts |
| `ts24-badge` | `i24-badge` | CSS klasser |
| `#ts24-war-room` | `#intel24-war-room` | Slack kanaler |
| `#ts24-deploy` | `#intel24-deploy` | Slack kanaler |

---

## ⚠️ BEVARET UÆNDRET (SSO-kontrakt)

Følgende er **IKKE** ændret, da de er del af SSO-protokollen med ALPHA Team:

| Værdi | Fil | Grund |
|-------|-----|-------|
| `ts24-intel` | `server/ssoAuth.ts` | SSO JWT issuer claim |
| `ts24-intel` | `server/ssoAuth.ts` | SSO JWT audience claim |
| `ts24_sso_session` | Multiple | Cookie navn (SSO-protokol) |
| `TS24_JWT` | War-room scripts | Environment variable for test-tokens |

---

## 📁 Opdaterede Filer

### Package & Config

| Fil | Ændring |
|-----|---------|
| `package.json` | `name: "intel24-console"`, `version: "1.0.0"` |
| `deploy/pm2.config.cjs` | `name: 'intel24-console'` |
| `scripts/deploy-production.ps1` | Kommentarer og output tekst |

### Documentation

| Fil | Ændring |
|-----|---------|
| `README.md` | Titel, beskrivelse, doc-links |
| `docs/SSO_PRODUCTION_DEPLOY_GUIDE.md` | PM2 navne, team navne |
| `docs/ts24_login_flow.md` → `docs/login_flow.md` | Filnavn + indhold |
| `docs/sso_v1_signoff_ts24.md` → `docs/sso_v1_signoff.md` | Filnavn + indhold |
| `docs/ts24_dns_and_cert_ops.md` → `docs/dns_and_cert_ops.md` | Filnavn |
| `ENVIRONMENT.md` | Opdateret |
| `WAR_ROOM_STAGE2.md` | Team navne, Slack kanaler |
| `WAR_ROOM_STAGE3.md` | Team navne, Slack kanaler |
| `STAGE3_READINESS_REPORT.md` | Team navne |

### Frontend UI

| Fil | Ændring |
|-----|---------|
| `src/components/Shared/Ts24Logo.tsx` | Kommentar, alt-text, "i" logo mark, "Intel24" tekst |
| `src/components/Auth/LoginPage.tsx` | Logo comment, display name, "i" logo mark |
| `src/components/Auth/SsoLoginPage.tsx` | "Intel24 SSO" badge tekst |
| `src/components/Layout/TopBar.tsx` | Importerer Ts24Logo (navn uændret for bagudkompatibilitet) |
| `src/components/Executive/ExecutiveSummaryView.tsx` | CSS klasser `ts24-badge` → `i24-badge` |

### i18n / Translations

| Fil | Ændring |
|-----|---------|
| `src/i18n/locales/en.json` | `logo.alt: "Intel24"` |
| `src/i18n/locales/da.json` | `logo.alt: "Intel24"` |

### PDF Export

| Fil | Ændring |
|-----|---------|
| `src/pdf/reportTheme.ts` | `brand.name: 'Intel24 Data Intel™'` |
| `src/pdf/reportMetadata.ts` | `exportedBy: 'Intel24 Operator'` |
| `src/pdf/reportHeader.ts` | Header tekst "Intel24" |
| `src/pdf/reportFooter.ts` | Footer tekst "Intel24 Data Intel™" |
| `src/pdf/executiveReport.ts` | PDF creator, keywords |
| `src/pdf/sections/metadataSection.ts` | Disclaimer tekst |

### Server

| Fil | Ændring |
|-----|---------|
| `server/app.ts` | `/api/health` service name: "Intel24 Console" |

### CSS

| Fil | Ændring |
|-----|---------|
| `index.css` | Alle `.ts24-badge*` → `.i24-badge*` klasser |

### War Room

| Fil | Ændring |
|-----|---------|
| `war-room/*.md` | Team navne, Slack kanaler, PM2 kommandoer |
| `war-room/*.ts` | Kommentarer, PM2 kommandoer |
| `war-room/active/*.md` | Team navne, PM2 kommandoer |

---

## ✅ Verifikation

### Builds
```bash
npm run build  # Verificér at frontend bygger
npm test       # Kør unit tests
```

### Søgning efter resterende referencer
```bash
# Skal kun returnere SSO-relaterede (ts24-intel, ts24_sso_session, TS24_JWT)
grep -r "TS24\|ts24" --include="*.ts" --include="*.tsx" --include="*.json" .
```

### CI/CD
- GitHub Actions skal køre grønt efter push

---

## 📝 Manuelle Steps

1. **GitHub Repo Rename** (admin): `ts24-intel-console` → `intel24-console`
2. **Branch Protection**: Aktiver på `main` branch
3. **Update Git Remotes** (lokalt):
   ```bash
   git remote set-url origin https://github.com/AlphaAcces/intel24-console.git
   ```

---

## 🔗 Referencer

- Commit: Se git log for alle ændringer
- Original request: Cmd's ACTION REQUIRED besked
- SSO kontrakt: Bevaret `ts24-intel` claims per aftale med ALPHA Team

---

**Status:** ✅ Cleanup Complete  
**Næste:** Push til remote + aktivér branch protection
