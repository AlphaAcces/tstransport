const fetch = globalThis.fetch || require('node-fetch');
const base = process.env.E2E_API_BASE || 'http://localhost:4001';

async function run() {
  console.log('Running API smoke tests against', base);

  const r1 = await fetch(`${base}/api/tenant/test-1/aiKey`);
  console.log('GET without perms status', r1.status);
  if (r1.status !== 403) throw new Error('expected 403 for unauthenticated GET');

  const put1 = await fetch(`${base}/api/tenant/test-1/aiKey`, {
    method: 'PUT', headers: { 'content-type': 'application/json', 'x-user-permissions': 'ai:configure' },
    body: JSON.stringify({ aiKey: 'secret-e2e' })
  });
  console.log('PUT with perms status', put1.status);
  if (put1.status !== 200) throw new Error('expected 200 for PUT with perms');

  const get2 = await fetch(`${base}/api/tenant/test-1/aiKey`, { headers: { 'x-user-permissions': 'ai:configure' } });
  const body = await get2.json();
  console.log('GET after PUT status', get2.status, 'body', body);
  if (!body.exists) throw new Error('expected exists true after put');

  const del = await fetch(`${base}/api/tenant/test-1/aiKey`, {
    method: 'PUT', headers: { 'content-type': 'application/json', 'x-user-permissions': 'ai:configure' },
    body: JSON.stringify({ aiKey: null })
  });
  const after = await fetch(`${base}/api/tenant/test-1/aiKey`, { headers: { 'x-user-permissions': 'ai:configure' } });
  const afterBody = await after.json();
  console.log('After delete exists:', afterBody.exists);
  if (afterBody.exists) throw new Error('expected exists false after delete');

  console.log('API smoke tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });
