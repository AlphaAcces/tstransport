import { describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../app';

describe('Case KPIs API', () => {
  it('returns derived KPI summary for a known case', async () => {
    const listRes = await request(app).get('/api/cases');
    const targetCase = listRes.body[0] as { id: string };

    const res = await request(app).get(`/api/cases/${targetCase.id}/kpis`);
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeTruthy();
    expect(res.body.summary.caseId).toBe(targetCase.id);
    expect(Array.isArray(res.body.summary.metrics)).toBe(true);
    expect(res.body.summary.metrics.length).toBeGreaterThan(0);

    const sample = res.body.summary.metrics[0];
    expect(sample).toMatchObject({
      id: expect.any(String),
      label: expect.any(String),
      value: expect.any(Number),
    });
  });

  it('returns 404 for unknown case id', async () => {
    const res = await request(app).get('/api/cases/unknown-case/kpis');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('CASE_NOT_FOUND');
  });
});
