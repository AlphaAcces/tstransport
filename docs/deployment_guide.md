# TS24 Deployment Guide

## Formål

Guiden dækker, hvordan **TS24 Intel Console** deployes i produktion bag `https://intel24.blackbox.codes`, inklusive krav til origin-serveren, Node/Express-processen og nginx-proxyen foran.

## Forudsætninger

- **Node.js ≥16** (18 LTS anbefales jf. `package.json`) plus den medfølgende **npm**.
- **Git** installeret på værten.
- DNS-record for `intel24.blackbox.codes` peger allerede på origin, og Cloudflare kører i proxied-tilstand.
- Origin-serveren har outbound internetadgang, sudo-rettigheder til nginx/systemctl og nødvendige miljøvariabler (`VITE_SSO_JWT_SECRET`, `AI_KEY_MASTER`, evt. `PORT` og `NODE_ENV=production`).

## Serverdeploy (Node/Express)

```bash
git clone https://github.com/AlphaAcces/ts24-intel-console.git
cd ts24-intel-console

npm install
npm run build
npm start
```

- `npm run build` bygger Vite-klienten og køres som en del af release-pipelinen.
- `npm start` kører `tsx server/index.ts` og eksponerer `/api/health`, `/login`, `/sso-login` og SPA-entry `/` (standardport 4001, men du kan sætte `PORT=3001` som i eksemplerne).

### Process manager (pm2)

```bash
npm install -g pm2
pm2 start dist/server/index.js --name ts24-intel-console
pm2 save
```

> Hvis du ikke transpilerer serverkoden til `dist`, så brug `pm2 start npm --name ts24-intel-console -- start` eller lav en systemd-unit. Målet er blot at holde processen kørende efter logout.

## nginx reverse proxy (eksempel)

```nginx
server {
    server_name intel24.blackbox.codes;

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /sso-login {
        proxy_pass http://127.0.0.1:3001/sso-login;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /login {
        proxy_pass http://127.0.0.1:3001/login;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://127.0.0.1:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Test og genindlæs:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Tilpas selv `listen 80`/`listen 443 ssl`, Cloudflare real-IP-opsætning og eventuelle cache-regler – ovenstående fokuserer på routingdelen.

## Health & verifikation

Kør følgende (fra operatørmaskine eller bastion). `Invoke-WebRequest` kan anvendes som PowerShell-alternativ til `curl`.

```bash
curl -I https://intel24.blackbox.codes
curl -I https://intel24.blackbox.codes/api/health
curl -I https://intel24.blackbox.codes/sso-login
curl -I https://intel24.blackbox.codes/login
```

- `https://intel24.blackbox.codes/` → 200 (SPA) eller 302 afhængigt af cache.
- `/api/health` → 200 OK med JSON (uptime, build info).
- `/sso-login` → 302 til `/login`, når brugeren ikke har gyldigt token.
- `/login` → 200 OK med GreyEYE-login.

## SSO & GO-kriterier

Når ovenstående kontroller er grønne (ingen TLS-fejl, 4xx eller 5xx) og `/api/auth/sso-health` svarer 200 med det delte SSO-secret, kan ALPHA sætte:

```text
TS24_CONSOLE_URL = https://intel24.blackbox.codes/sso-login
```

npm start
pm2 start npm --name ts24-intel-console -- start
Derefter kører de end-to-end SSO-tests. Når de passerer, gives "GO" og platformen anses som klar til produktionsdrift.
