import { test, expect, request } from '@playwright/test';

test.describe('AI key API RBAC (API-level)', () => {
  const base = process.env.E2E_API_BASE || 'http://localhost:4001';

  test('denies access without ai:configure', async () => {
    const api = await request.newContext();
    const resp = await api.get(`${base}/api/tenant/test-1/aiKey`);
    expect(resp.status()).toBe(403);
  });

  test('allows PUT/GET when header includes ai:configure', async () => {
    const api = await request.newContext({ extraHTTPHeaders: { 'x-user-permissions': 'ai:configure' } });
    const put = await api.put(`${base}/api/tenant/test-1/aiKey`, { data: { aiKey: 'secret-e2e' } });
    expect(put.status()).toBe(200);
    const get = await api.get(`${base}/api/tenant/test-1/aiKey`);
    expect(get.status()).toBe(200);
    const body = await get.json();
    expect(body.exists).toBe(true);
  });

  test('deletes when aiKey is null', async () => {
    const api = await request.newContext({ extraHTTPHeaders: { 'x-user-permissions': 'ai:configure' } });
    await api.put(`${base}/api/tenant/test-2/aiKey`, { data: { aiKey: 'x' } });
    const del = await api.put(`${base}/api/tenant/test-2/aiKey`, { data: { aiKey: null } });
    expect(del.status()).toBe(200);
    const get = await api.get(`${base}/api/tenant/test-2/aiKey`);
    const body = await get.json();
    expect(body.exists).toBe(false);
  });
});
