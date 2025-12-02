import { describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../app';

describe('Case Export API', () => {
  it('builds an export payload for a known case', async () => {
    const listRes = await request(app).get('/api/cases');
    const targetCase = listRes.body[0] as { id: string };

    const res = await request(app).post(`/api/cases/${targetCase.id}/export`);
    expect(res.status).toBe(200);

    const payload = res.body.export;
    expect(payload).toBeTruthy();
    expect(payload.caseId).toBe(targetCase.id);
    expect(payload.format).toBe('json');
    expect(typeof payload.generatedAt).toBe('string');
    expect(Array.isArray(payload.events)).toBe(true);
    expect(payload.events.length).toBeGreaterThan(0);
    expect(payload.case?.tenantId).toBeDefined();
    expect(payload.kpis).toBeTruthy();
  });

  it('returns 404 for unknown case id', async () => {
    const res = await request(app).post('/api/cases/unknown/export');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('CASE_NOT_FOUND');
  });
});
