import { describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../app';

describe('Case Events API', () => {
  it('returns derived events for a known case and keeps order consistent', async () => {
    const listRes = await request(app).get('/api/cases');
    const targetCase = listRes.body[0] as { id: string };

    const res = await request(app).get(`/api/cases/${targetCase.id}/events`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.events.length).toBeGreaterThan(0);

    const sample = res.body.events[0];
    expect(sample).toMatchObject({
      id: expect.any(String),
      caseId: targetCase.id,
      timestamp: expect.any(String),
      title: expect.any(String),
      severity: expect.any(String),
    });

    const timestamps: number[] = res.body.events.map((event: { timestamp: string }) => new Date(event.timestamp).getTime());
    const sorted = [...timestamps].sort((a, b) => b - a);
    expect(timestamps).toEqual(sorted);
  });

  it('returns 404 for unknown case id', async () => {
    const res = await request(app).get('/api/cases/unknown-case/events');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('CASE_NOT_FOUND');
  });
});
