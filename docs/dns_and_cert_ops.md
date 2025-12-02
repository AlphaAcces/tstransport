# TS24 DNS & Certifikat Ops-Runbook

> **Version:** 1.0
> **Sidst opdateret:** 2025-12-01
> **Ansvarlig:** TS24 Ops Team

---

## 1. Formål

Denne runbook beskriver opsætning og sign-off af domæne og TLS-certifikat for **TS24 Intelligence Dashboard** (`intel24.blackbox.codes`).

Dokumentet bruges som tjekliste inden vi sender **GO** til ALPHA-Interface-GUI-teamet, så SSO-integrationen kan gå i drift.

---

## 2. Domæne & DNS Records

### 2.1 Domæneinfo

| Felt              | Værdi                           |
|-------------------|---------------------------------|
| **Domæne**        | `intel24.blackbox.codes`       |
| **TLD**           | `.codes` (Identity Digital)     |
| **HSTS-krav**     | Ikke tvunget – anbefalet via Cloudflare HSTS |

> ⚠️ **Vigtigt:** Selvom `.codes` ikke er HSTS-preloaded, kræver TS24-setup stadig HTTPS end-to-end (Cloudflare + origin).

### 2.2 Påkrævede DNS Records

| Type   | Hostname                      | Værdi                      | TTL     | Bemærkning                     |
|--------|-------------------------------|----------------------------|---------|--------------------------------|
| A      | `intel24.blackbox.codes`     | `<SERVER_IPV4>`            | 300–3600| Peger på TS24-webserver        |
| AAAA   | `intel24.blackbox.codes`     | `<SERVER_IPV6>` (valgfri)  | 300–3600| IPv6-adresse hvis tilgængelig  |

### 2.3 DNS Verifikation

```bash
# Tjek A-record
dig +short intel24.blackbox.codes A

# Tjek AAAA-record (hvis sat)
dig +short intel24.blackbox.codes AAAA

# Eller via nslookup
nslookup intel24.blackbox.codes
```

**Forventet resultat:** IP-adresse(r) returneres uden fejl.

---

## 3. TLS/Certifikat

### 3.1 Krav

| Krav                        | Beskrivelse                                              |
|-----------------------------|----------------------------------------------------------|
| **Subject/CN**              | Skal matche `intel24.blackbox.codes`                    |
| **Udsteder (CA)**           | Trusted CA (Let's Encrypt, DigiCert, Cloudflare, etc.)   |
| **Gyldighed**               | Ikke udløbet, mindst 30 dages margin anbefales           |
| **Automatisk fornyelse**    | Stærkt anbefalet (certbot, Cloudflare, etc.)             |
| **Kæde**                    | Fuld certifikatkæde skal serveres                        |

### 3.2 Certifikat Verifikation

```bash
# Kort check – se certifikatinfo
curl -vI https://intel24.blackbox.codes 2>&1 | grep -E "(SSL|subject|issuer|expire)"

# Detaljeret check via openssl
echo | openssl s_client -servername intel24.blackbox.codes -connect intel24.blackbox.codes:443 2>/dev/null | openssl x509 -noout -dates -subject -issuer
```

**Forventet output:**

- `SSL certificate verify ok`
- Subject matcher domænet
- Udløbsdato er fremtidig

---

## 4. Ops-Test (curl)

Disse tests skal køres **efter** DNS og cert er sat op, inden GO sendes til ALPHA.

### 4.0 Test 0: API Healthcheck

```bash
curl -I https://intel24.blackbox.codes/api/health
```

**Forventet resultat:**

- HTTP 200
- JSON-body med `{ service: "TS24 Intel Console", status: "ok" }`
- Ingen auth headers krævet

### 4.1 Test 1: Rå domæne (root)

```bash
curl -I https://intel24.blackbox.codes
```

**Forventet resultat:**

- HTTP 200 eller 3xx (redirect til `/login` eller `/sso-login`)
- Ingen SSL-fejl
- Ingen `ERR_NAME_NOT_RESOLVED` eller timeout

### 4.2 Test 2: Kanonisk SSO Entry

```bash
curl -I https://intel24.blackbox.codes/sso-login
```

**Forventet resultat:**

- HTTP 200 (SPA loader) eller 302 → `/login` (uden gyldig token)
- Header `content-type` indeholder `text/html`
- Ingen certifikatfejl

### 4.3 Test 3: Manuel Login Fallback

```bash
curl -I https://intel24.blackbox.codes/login
```

**Forventet resultat:**

- HTTP 200
- Login-side serveres korrekt

### 4.4 Test 4: SSO med ugyldig token (negativ test)

```bash
curl -I "https://intel24.blackbox.codes/sso-login?sso=invalid_token_here"
```

**Forventet resultat:**

- HTTP 200 (SPA loader) – klienten håndterer token-validering
- Ingen server-crash eller 500-fejl

---

## 5. GO-Checkliste til TS24-projektleder

Udfyld denne tabel inden du sender GO til ALPHA-Interface-GUI-teamet:

| #  | Punkt                                                      | Status | Dato       | Initialer |
|----|------------------------------------------------------------|--------|------------|-----------|
| 1  | DNS A-record for `intel24.blackbox.codes` sat             | ⬜     |            |           |
| 2  | DNS propageret (dig/nslookup returnerer korrekt IP)        | ⬜     |            |           |
| 3  | TLS-certifikat installeret og gyldigt                      | ⬜     |            |           |
| 4  | `curl -I https://intel24.blackbox.codes` → 200/3xx        | ⬜     |            |           |
| 5  | `curl -I .../api/health` → 200 + JSON                      | ⬜     |            |           |
| 6  | `curl -I .../sso-login` → 200/302 uden SSL-fejl            | ⬜     |            |           |
| 7  | `/login` fallback testet manuelt i browser                 | ⬜     |            |           |
| 8  | SSO end-to-end test fra GDI-staging (efter ALPHA GO)       | ⬜     |            |           |

**Signatur:**

```text
TS24 Ops Sign-off: _______________________  Dato: ___________

GO sendt til ALPHA: ☐ Ja  ☐ Nej
```

---

## 6. Fejlsøgning

### DNS ikke propageret

- Vent op til TTL-værdien (typisk 5 min – 1 time)
- Tjek med flere DNS-resolvere: `dig @8.8.8.8 intel24.blackbox.codes`
- Verificer at record er oprettet korrekt i DNS-provider

### Certifikatfejl

| Fejl                              | Årsag                              | Løsning                                      |
|-----------------------------------|------------------------------------|----------------------------------------------|
| `certificate has expired`         | Cert udløbet                       | Forny certifikat                             |
| `certificate verify failed`       | Manglende intermediate cert        | Server fuld kæde                             |
| `hostname mismatch`               | CN/SAN matcher ikke domæne         | Genudsted cert med korrekt domæne            |
| `self-signed certificate`         | Ikke trusted CA                    | Brug Let's Encrypt eller anden trusted CA    |

### Timeout / Connection refused

- Tjek firewall-regler (port 443 skal være åben)
- Verificer at webserver kører
- Tjek at server lytter på korrekt IP

---

## 7. Relaterede Dokumenter

| Dokument                           | Beskrivelse                                    |
|------------------------------------|------------------------------------------------|
| `docs/ts24_login_flow.md`          | Login- og SSO-flowbeskrivelse                  |
| `docs/sso_v1_signoff_ts24.md`      | SSO v1 implementeringsspecifikation            |
| `docs/system_overview.md`          | Systemarkitektur og overblik                   |

---

## 8. Kontakt

Ved spørgsmål om DNS/cert-setup:

- **TS24 Ops Team** – intern Slack/Teams-kanal
- **ALPHA-Interface-GUI** – for GDI-koordinering

---

*Dette dokument er en del af TS24 Intelligence Console ops-dokumentationen.*
