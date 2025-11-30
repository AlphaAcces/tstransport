import express from 'express';
import { getSsoMetricsSnapshot } from '../shared/ssoMetrics';
import storage, { logAudit, getAuditLog } from './storage';
import { encrypt, decrypt } from './crypto';
import monitoringRoutes from './monitoring';
import { listCases, getCaseById } from '../src/domains/cases/caseStore';

const SSO_EXPECTED_ISS = 'ts24-intel';
const SSO_EXPECTED_AUD = 'ts24-intel';
const SSO_CONFIG_VERSION = 'v1';
const PROTECT_SSO_HEALTH = process.env.NODE_ENV === 'production' || process.env.TS24_SSO_HEALTH_PROTECTED === 'true';

const app = express();
app.use(express.json());

const DEFAULT_PUBLIC_TENANT_ID = process.env.DEFAULT_PUBLIC_TENANT_ID || 'tenant-001';

// Mount monitoring routes
app.use('/api', monitoringRoutes);

app.get('/api/auth/sso-health', (req, res) => {
  if (PROTECT_SSO_HEALTH) {
    const expectedKey = process.env.TS24_SSO_HEALTH_KEY;
    const providedKey = req.header('x-sso-health-key');
    if (!expectedKey || providedKey !== expectedKey) {
      return res.status(403).json({ error: 'forbidden', message: 'SSO health endpoint restricted' });
    }
  }

  const secretConfigured = Boolean(process.env.VITE_SSO_JWT_SECRET || process.env.SSO_JWT_SECRET);

  res.json({
    expectedIss: SSO_EXPECTED_ISS,
    expectedAud: SSO_EXPECTED_AUD,
    secretConfigured,
    usesHS256: true,
    configVersion: SSO_CONFIG_VERSION,
    recentErrors: getSsoMetricsSnapshot(),
  });
  // TODO: Move SSO metrics persistence out of process (Redis/Prometheus) for multi-instance parity.
});

// ============================================================================
// Case API
// ============================================================================

app.get('/api/cases', (_req, res) => {
  res.json(listCases());
  // TODO: Replace caseStore with persistent storage when backend is ready.
});

app.get('/api/cases/:id', (req, res) => {
  const caseData = getCaseById(req.params.id);
  if (!caseData) {
    return res.status(404).json({ error: 'CASE_NOT_FOUND' });
  }

  res.json(caseData);
  // TODO: Add auth/authorization when exposing the case API beyond mocks.
});

// ============================================================================
// Middleware
// ============================================================================

// Extract user info from headers
function getUserInfo(req: express.Request): { userId: string; permissions: string[] } {
  const userId = String(req.header('x-user-id') || 'anonymous');
  const permsHeader = String(req.header('x-user-permissions') || '');
  const permissions = permsHeader.split(',').map(s => s.trim()).filter(Boolean);
  return { userId, permissions };
}

// Simple RBAC middleware for this example. In real deployments integrate with your auth layer.
function requirePermission(permission: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { permissions } = getUserInfo(req);
    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: 'forbidden', message: `Missing permission: ${permission}` });
    }
    next();
  };
}

// ============================================================================
// AI Key Management Endpoints
// ============================================================================

/**
 * GET /api/tenant/:id/aiKey
 * Check if tenant has an AI key configured
 */
app.get('/api/tenant/:id/aiKey', requirePermission('ai:configure'), async (req, res) => {
  const { id } = req.params;
  const { userId } = getUserInfo(req);

  try {
    const record = await storage.getForTenant(id);

    await logAudit({
      timestamp: new Date().toISOString(),
      tenantId: id,
      userId,
      action: 'key:accessed',
    });

    res.json({
      exists: !!record?.key,
      lastRotated: record?.lastRotated || null,
      rotatedBy: record?.rotatedBy || null,
    });
  } catch (err) {
    res.status(500).json({ error: 'internal', message: 'Failed to retrieve key status' });
  }
});

/**
 * PUT /api/tenant/:id/aiKey
 * Set or update tenant AI key (encrypted at rest)
 */
app.put('/api/tenant/:id/aiKey', requirePermission('ai:configure'), async (req, res) => {
  const { id } = req.params;
  const { userId } = getUserInfo(req);
  const { aiKey } = req.body as { aiKey?: string | null };

  try {
    if (!aiKey) {
      // Delete key
      const record = await storage.setForTenant(id, null, userId);

      await logAudit({
        timestamp: new Date().toISOString(),
        tenantId: id,
        userId,
        action: 'key:deleted',
      });

      return res.json({
        ok: true,
        exists: false,
        lastRotated: record.lastRotated,
      });
    }

    // Check if this is a new key or rotation
    const existing = await storage.getForTenant(id);
    const action = existing?.key ? 'key:rotated' : 'key:created';

    // Encrypt and store
    const encrypted = encrypt(aiKey);
    const record = await storage.setForTenant(id, encrypted, userId);

    await logAudit({
      timestamp: new Date().toISOString(),
      tenantId: id,
      userId,
      action,
    });

    res.json({
      ok: true,
      exists: true,
      lastRotated: record.lastRotated,
      rotatedBy: record.rotatedBy,
    });
  } catch (err) {
    res.status(500).json({ error: 'internal', message: 'Failed to update key' });
  }
});

/**
 * DELETE /api/tenant/:id/aiKey
 * Remove tenant AI key
 */
app.delete('/api/tenant/:id/aiKey', requirePermission('ai:configure'), async (req, res) => {
  const { id } = req.params;
  const { userId } = getUserInfo(req);

  try {
    await storage.setForTenant(id, null, userId);

    await logAudit({
      timestamp: new Date().toISOString(),
      tenantId: id,
      userId,
      action: 'key:deleted',
    });

    res.json({ ok: true, exists: false });
  } catch (err) {
    res.status(500).json({ error: 'internal', message: 'Failed to delete key' });
  }
});

/**
 * GET /api/tenant/:id/aiKey/audit
 * Get audit log for AI key operations
 */
app.get('/api/tenant/:id/aiKey/audit', requirePermission('admin:audit'), async (req, res) => {
  const { id } = req.params;
  const limit = Math.min(parseInt(String(req.query.limit)) || 50, 200);

  try {
    const entries = await getAuditLog(id, limit);
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ error: 'internal', message: 'Failed to retrieve audit log' });
  }
});

// ============================================================================
// Access Requests Endpoints
// ============================================================================

import * as accessRequestsStorage from './accessRequestsStorage';

/**
 * GET /api/access-requests/:tenantId
 * List all access requests for a tenant (with optional filters)
 */
app.get('/api/access-requests/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const { status, type, requesterId, resourceId, fromDate, toDate } = req.query;

  try {
    const filters: accessRequestsStorage.AccessRequestFilters = {};

    if (status) {
      filters.status = Array.isArray(status)
        ? status as accessRequestsStorage.AccessRequestStatus[]
        : [status as accessRequestsStorage.AccessRequestStatus];
    }
    if (type) {
      filters.type = Array.isArray(type)
        ? type as accessRequestsStorage.AccessRequestType[]
        : [type as accessRequestsStorage.AccessRequestType];
    }
    if (requesterId) filters.requesterId = String(requesterId);
    if (resourceId) filters.resourceId = String(resourceId);
    if (fromDate) filters.fromDate = String(fromDate);
    if (toDate) filters.toDate = String(toDate);

    const requests = await accessRequestsStorage.getAccessRequests(tenantId, filters);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'internal', message: 'Failed to fetch access requests' });
  }
});

/**
 * GET /api/access-requests/:tenantId/stats
 * Get statistics for access requests
 */
app.get('/api/access-requests/:tenantId/stats', async (req, res) => {
  const { tenantId } = req.params;

  try {
    const stats = await accessRequestsStorage.getAccessRequestStats(tenantId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'internal', message: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/access-requests/:tenantId/:requestId
 * Get a single access request by ID
 */
app.get('/api/access-requests/:tenantId/:requestId', async (req, res) => {
  const { tenantId, requestId } = req.params;

  try {
    const request = await accessRequestsStorage.getAccessRequest(tenantId, requestId);
    if (!request) {
      return res.status(404).json({ error: 'not_found', message: 'Access request not found' });
    }
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: 'internal', message: 'Failed to fetch access request' });
  }
});

/**
 * POST /api/access-requests/:tenantId
 * Create a new access request
 */
app.post('/api/access-requests/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const { userId } = getUserInfo(req);
  const body = req.body;

  if (!body.type || !body.resourceId || !body.resourceName || !body.justification) {
    return res.status(400).json({
      error: 'validation',
      message: 'type, resourceId, resourceName, and justification are required'
    });
  }

  try {
    // Get user info (in a real app, this would come from auth)
    const requesterName = body.requesterName || userId;
    const requesterEmail = body.requesterEmail || `${userId}@tenant.local`;

    const request = await accessRequestsStorage.createAccessRequest(tenantId, {
      requesterId: userId,
      requesterName,
      requesterEmail,
      type: body.type,
      resourceId: body.resourceId,
      resourceName: body.resourceName,
      justification: body.justification,
      expiresAt: body.expiresAt,
      metadata: body.metadata,
    });

    await logAudit({
      timestamp: new Date().toISOString(),
      tenantId,
      userId,
      action: 'access_request:created',
      details: { requestId: request.id, type: body.type, resourceId: body.resourceId },
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: 'internal', message: 'Failed to create access request' });
  }
});

/**
 * POST /api/access-requests/public
 * Create an access request from the public login form (pre-auth)
 */
app.post('/api/access-requests/public', async (req, res) => {
  const {
    name,
    email,
    organization,
    role,
    justification,
    locale,
    tenantId,
  } = req.body || {};

  if (!name || !email || !justification) {
    return res.status(400).json({
      error: 'validation',
      message: 'name, email, and justification are required'
    });
  }

  const targetTenantId = tenantId || DEFAULT_PUBLIC_TENANT_ID;

  try {
    const request = await accessRequestsStorage.createAccessRequest(targetTenantId, {
      requesterId: `public-${Date.now()}`,
      requesterName: name,
      requesterEmail: email,
      type: 'api_access',
      resourceId: 'intel24-login',
      resourceName: 'Intel24 Command Deck',
      justification,
      metadata: {
        organization: organization || null,
        role: role || null,
        locale: locale || null,
        channel: 'login_request',
      },
    });

    await logAudit({
      timestamp: new Date().toISOString(),
      tenantId: targetTenantId,
      userId: request.requesterId,
      action: 'access_request:public_created',
      details: { requestId: request.id },
    });

    res.status(201).json({ success: true, requestId: request.id });
  } catch (err) {
    res.status(500).json({ error: 'internal', message: 'Failed to submit access request' });
  }
});

/**
 * PUT /api/access-requests/:tenantId/:requestId/review
 * Review (approve/reject) an access request
 */
app.put('/api/access-requests/:tenantId/:requestId/review', requirePermission('access:review'), async (req, res) => {
  const { tenantId, requestId } = req.params;
  const { userId } = getUserInfo(req);
  const { status, reviewNotes } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      error: 'validation',
      message: 'status must be "approved" or "rejected"'
    });
  }

  try {
    // Get reviewer name (in a real app, this would come from auth)
    const reviewerName = req.body.reviewerName || userId;

    const updated = await accessRequestsStorage.reviewAccessRequest(tenantId, requestId, {
      status,
      reviewNotes,
      reviewedBy: userId,
      reviewedByName: reviewerName,
    });

    if (!updated) {
      return res.status(404).json({ error: 'not_found', message: 'Access request not found' });
    }

    await logAudit({
      timestamp: new Date().toISOString(),
      tenantId,
      userId,
      action: `access_request:${status}`,
      details: { requestId, reviewNotes },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'internal', message: 'Failed to review access request' });
  }
});

/**
 * DELETE /api/access-requests/:tenantId/:requestId
 * Delete an access request (only by requester or admin)
 */
app.delete('/api/access-requests/:tenantId/:requestId', async (req, res) => {
  const { tenantId, requestId } = req.params;
  const { userId, permissions } = getUserInfo(req);

  try {
    const request = await accessRequestsStorage.getAccessRequest(tenantId, requestId);
    if (!request) {
      return res.status(404).json({ error: 'not_found', message: 'Access request not found' });
    }

    // Only the requester or an admin can delete
    const isAdmin = permissions.includes('admin:*') || permissions.includes('access:manage');
    const isOwner = request.requesterId === userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        error: 'forbidden',
        message: 'You can only delete your own requests'
      });
    }

    await accessRequestsStorage.deleteAccessRequest(tenantId, requestId);

    await logAudit({
      timestamp: new Date().toISOString(),
      tenantId,
      userId,
      action: 'access_request:deleted',
      details: { requestId },
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'internal', message: 'Failed to delete access request' });
  }
});

export default app;
