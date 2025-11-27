import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';

process.env.AI_KEY_MASTER = Buffer.from('01234567890123456789012345678901').toString('base64');

import app from '../app';

const DATA_PATH = path.resolve(__dirname, '../data/aiKeys.json');

async function resetData() {
  await fs.writeFile(DATA_PATH, '{}', 'utf8');
}

describe('AI Key API', () => {
  beforeEach(async () => { await resetData(); });
  afterEach(async () => { await resetData(); });

  it('denies access without permission', async () => {
    const res = await request(app).get('/api/tenant/foo/aiKey');
    expect(res.status).toBe(403);
  });

  it('allows storing and retrieving presence with ai:configure', async () => {
    const put = await request(app)
      .put('/api/tenant/foo/aiKey')
      .set('x-user-permissions', 'ai:configure')
      .send({ aiKey: 'super-secret' });
    expect(put.status).toBe(200);
    expect(put.body.ok).toBe(true);

    const get = await request(app)
      .get('/api/tenant/foo/aiKey')
      .set('x-user-permissions', 'ai:configure');
    expect(get.status).toBe(200);
    expect(get.body.exists).toBe(true);
  });

  it('delete when aiKey null', async () => {
    await request(app)
      .put('/api/tenant/bar/aiKey')
      .set('x-user-permissions', 'ai:configure')
      .send({ aiKey: 'x' });

    const del = await request(app)
      .put('/api/tenant/bar/aiKey')
      .set('x-user-permissions', 'ai:configure')
      .send({ aiKey: null });
    expect(del.status).toBe(200);
    expect(del.body.exists).toBe(false);
  });
});
