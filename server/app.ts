import express from 'express';
import storage from './storage';
import { encrypt, decrypt } from './crypto';

const app = express();
app.use(express.json());

// Simple RBAC middleware for this example. In real deployments integrate with your auth layer.
function requirePermission(permission: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const header = String(req.header('x-user-permissions') || '');
    const perms = header.split(',').map(s => s.trim()).filter(Boolean);
    if (!perms.includes(permission)) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}

app.get('/api/tenant/:id/aiKey', requirePermission('ai:configure'), async (req, res) => {
  const { id } = req.params;
  const record = await storage.getForTenant(id);
  res.json({ exists: !!record });
});

app.put('/api/tenant/:id/aiKey', requirePermission('ai:configure'), async (req, res) => {
  const { id } = req.params;
  const { aiKey } = req.body as { aiKey?: string | null };
  if (!aiKey) {
    // treat as delete
    await storage.setForTenant(id, null as any);
    return res.json({ ok: true, exists: false });
  }
  const encrypted = encrypt(aiKey);
  await storage.setForTenant(id, encrypted as any);
  res.json({ ok: true, exists: true });
});

export default app;
