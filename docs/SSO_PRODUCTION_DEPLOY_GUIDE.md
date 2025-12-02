# Intel24 SSO Production Deployment Guide

**Dato:** 2. december 2025
**Version:** 1.0
**Formål:** Aktivere SSO-integration med ALPHA/GDI på `intel24.blackbox.codes`

---

## 📋 Forudsætninger

| Krav | Status |
|------|--------|
| SSH adgang til production server | ⏳ Påkrævet |
| Sudo/root rettigheder | ⏳ Påkrævet |
| Git credentials til repo | ⏳ Påkrævet |
| Node.js 18+ installeret | ⏳ Verificér |
| PM2 installeret globalt | ⏳ Verificér |

---

## 🔐 SSO Shared Secret

**VIGTIGT:** Dette secret er udvekslet med ALPHA Team og skal sættes identisk på begge sider.

```
SSO_JWT_SECRET=1032f8045ad9aa4df34ccadece81b63692dd6e61f82ddcb4990160bf716e5c13
```

---

## 📝 Deployment Steps

### Step 1: SSH til Production Server

```bash
ssh user@intel24.blackbox.codes
# eller via din SSH config
ssh intel24-prod
```

### Step 2: Navigér til Projekt Directory

```bash
cd /var/www/intel24-console
# eller hvor projektet ligger
cd /home/deploy/intel24-console
```

### Step 3: Pull Nyeste Kode

```bash
# Sikr at du er på korrekt branch
git fetch origin
git checkout feature/qa-release-prep
git pull origin feature/qa-release-prep

# Eller hvis merged til main:
git checkout main
git pull origin main
```

### Step 4: Installer Dependencies

```bash
npm ci
# eller
npm install --production=false
```

### Step 5: Build Frontend

```bash
npm run build
```

### Step 6: Konfigurér SSO Secret

**Option A: Environment fil (anbefalet)**

```bash
# Opret/opdatér .env fil
cat >> .env << 'EOF'
SSO_JWT_SECRET=1032f8045ad9aa4df34ccadece81b63692dd6e61f82ddcb4990160bf716e5c13
EOF
```

**Option B: PM2 ecosystem fil**

```bash
# Opdatér PM2 config med secret
nano deploy/pm2.config.cjs

# Tilføj under env:
#   SSO_JWT_SECRET: '1032f8045ad9aa4df34ccadece81b63692dd6e61f82ddcb4990160bf716e5c13',
```

**Option C: Systemd environment**

```bash
sudo nano /etc/systemd/system/intel24.service

# Tilføj under [Service]:
# Environment="SSO_JWT_SECRET=1032f8045ad9aa4df34ccadece81b63692dd6e61f82ddcb4990160bf716e5c13"

sudo systemctl daemon-reload
```

### Step 7: Genstart Server

**Med PM2:**

```bash
pm2 restart intel24-console
# eller
pm2 startOrRestart deploy/pm2.config.cjs

# Verificér status
pm2 status
pm2 logs intel24-console --lines 20
```

**Med Systemd:**

```bash
sudo systemctl restart intel24
sudo systemctl status intel24
```

### Step 8: Verificér Deployment

```bash
# Test health endpoint
curl -s http://localhost:3001/api/health | jq .

# Test SSO health endpoint
curl -s http://localhost:3001/api/auth/sso-health | jq .

# Forventet output:
# {
#   "expectedIss": "ts24-intel",
#   "expectedAud": "ts24-intel",
#   "secretConfigured": true,    <-- SKAL VÆRE true
#   "usesHS256": true,
#   "configVersion": "v1"
# }
```

### Step 9: Test Ekstern Adgang

```bash
# Fra en anden maskine eller via curl
curl -s https://intel24.blackbox.codes/api/health
curl -s https://intel24.blackbox.codes/api/auth/sso-health
```

---

## ✅ Verifikations Checklist

Efter deployment, bekræft følgende:

| Check | Kommando | Forventet |
|-------|----------|-----------|
| Server kører | `pm2 status` | `online` |
| Health OK | `curl .../api/health` | `{"status":"ok"}` |
| SSO Secret sat | `curl .../api/auth/sso-health` | `secretConfigured: true` |
| HTTPS virker | Browser test | Grøn lås |
| Login side | `https://intel24.blackbox.codes/login` | Login form vises |

---

## 🔥 Rollback Procedure

Hvis noget går galt:

```bash
# 1. Rollback til forrige version
git checkout HEAD~1
npm ci
npm run build

# 2. Genstart
pm2 restart intel24-console

# 3. Fjern SSO secret midlertidigt (hvis nødvendigt)
unset SSO_JWT_SECRET
pm2 restart intel24-console
```

---

## 📞 Efter Deployment

Når deployment er verificeret, send besked til ALPHA Team:

```
Til: ALPHA Development Team (GDI)
Fra: Intel24 Development Team
Emne: SSO Production Deployment Complete

Hej ALPHA Team,

Intel24 production er nu deployet med SSO-konfiguration.

✅ Status:
- https://intel24.blackbox.codes/api/health → OK
- https://intel24.blackbox.codes/api/auth/sso-health → secretConfigured: true
- SSO_JWT_SECRET konfigureret

Vi er klar til E2E test!

Venlig hilsen,
Intel24 Team
```

---

## 🐛 Troubleshooting

### Problem: `secretConfigured: false`

```bash
# Tjek at environment variable er sat
pm2 env intel24-console | grep SSO

# Hvis tom, genindlæs config
pm2 delete intel24-console
pm2 start deploy/pm2.config.cjs
```

### Problem: 404 på /api/auth/sso-health

```bash
# Tjek at nyeste kode er deployet
git log --oneline -5

# Tjek at server/app.ts har SSO health route
grep -n "sso-health" server/app.ts
```

### Problem: 502 Bad Gateway

```bash
# Tjek at Node server kører
pm2 status

# Tjek logs for fejl
pm2 logs intel24-console --err --lines 50

# Tjek nginx config
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📎 Vigtige Filer

| Fil | Formål |
|-----|--------|
| `deploy/pm2.config.cjs` | PM2 process konfiguration |
| `deploy/nginx-intel24.conf` | Nginx reverse proxy config |
| `server/app.ts` | Express server med SSO routes |
| `server/ssoAuth.ts` | SSO token verification |
| `.env` | Environment variabler (IKKE i git) |

---

**Sidst opdateret:** 2. december 2025
**Ansvarlig:** Intel24 Development Team
