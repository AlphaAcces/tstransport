# Intel24 Race Condition Checklist (Stage 2)

1. **Token issuance source**
   - Bekræft at ALPHA JWT udstedes én gang pr. login (ingen retries i pipelines).
2. **Cookie write timing**
   - Tjek om `set-cookie` + redirect sker i samme response; noter hvis tredjepart headere nulstiller.
3. **Parallel verify calls**
   - Observer `qa-monitor` log for overlappende verify requests der kunne udløse throttling.
4. **Dashboard boot**
   - Sikr at `/` ikke mountes før session-cookie er synlig i `document.cookie` (kun test, ingen kodeændring).
5. **Network jitter**
   - Mål om >200ms spikes sker samtidig med cookie writes → potentiel race.
6. **NGINX cache status**
   - `curl -I` og kontroller `X-Cache` headers for uventet HIT/MISS mix.
7. **Client-side redirects**
   - Bevis at SPA router ikke dobbelt-router efter `history.replaceState`.
8. **Background fetchers**
   - Pause eventuelle polling features for at se om races forsvinder.
