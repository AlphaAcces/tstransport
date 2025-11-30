import { test, expect, request } from '@playwright/test';

test.describe('Case KPI API', () => {
  const apiBase = process.env.E2E_API_BASE || 'http://localhost:4001';

  test('returns KPI summary for a known case', async () => {
    const api = await request.newContext();
    const casesResp = await api.get(`${apiBase}/api/cases`);
    expect(casesResp.ok()).toBeTruthy();
    const cases = await casesResp.json();
    expect(Array.isArray(cases)).toBe(true);
    const targetCase = cases[0];
    expect(targetCase?.id).toBeTruthy();

    const resp = await api.get(`${apiBase}/api/cases/${targetCase.id}/kpis`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.summary.caseId).toBe(targetCase.id);
    expect(Array.isArray(body.summary.metrics)).toBe(true);
    expect(body.summary.metrics.length).toBeGreaterThan(0);
  });

  test('returns 404 for unknown cases', async () => {
    const api = await request.newContext();
    const resp = await api.get(`${apiBase}/api/cases/unknown-case/kpis`);
    expect(resp.status()).toBe(404);
  });
});
