import { describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../app';

describe('Case API', () => {
  it('returns metadata for available cases', async () => {
    const res = await request(app).get('/api/cases');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      type: expect.any(String),
      defaultSubject: expect.any(String),
    });
  });

  it('returns case data for a known id', async () => {
    const listRes = await request(app).get('/api/cases');
    const firstCase = listRes.body[0];
    const detailRes = await request(app).get(`/api/cases/${firstCase.id}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body).toHaveProperty('personData');
    expect(detailRes.body).toHaveProperty('companiesData');
  });

  it('responds with 404 when case is missing', async () => {
    const res = await request(app).get('/api/cases/unknown-case');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('CASE_NOT_FOUND');
  });
});
