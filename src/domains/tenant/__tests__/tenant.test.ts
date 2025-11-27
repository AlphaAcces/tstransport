/**
 * Multi-Tenant Tests
 *
 * Integration tests for tenant isolation, RBAC, and data security.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  TenantRole,
  TenantScoped,
} from '../types';
import {
  // Isolation utilities
  scopeToTenant,
  filterByTenant,
  validateTenantAccess,
  createTenantQuery,
  wrapTenantResponse,
  assertSameTenant,
  createTenantDataAccessor,
  // Audit
  createAuditEntry,
  getAuditLog,
  clearAuditLog,
  // Encryption
  encryptTenantData,
  decryptTenantData,
  maskSensitiveData,
  // Validation
  isValidTenantId,
  generateTenantId,
  sanitizeTenantSlug,
  // Defaults
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_BRANDING,
  DEFAULT_FEATURES,
  // Branding
  generateCssVariables,
  createBrandingFromPreset,
  PRESET_THEMES,
} from '../index';

describe('Multi-Tenant System', () => {
  // ============================================================================
  // Data Isolation Tests
  // ============================================================================
  describe('Data Isolation', () => {
    const tenantA = 'tenant-a-uuid';
    const tenantB = 'tenant-b-uuid';

    interface TestItem extends TenantScoped {
      id: string;
      name: string;
    }

    const mixedData: TestItem[] = [
      { id: '1', name: 'Item A1', tenantId: tenantA },
      { id: '2', name: 'Item A2', tenantId: tenantA },
      { id: '3', name: 'Item B1', tenantId: tenantB },
      { id: '4', name: 'Item B2', tenantId: tenantB },
    ];

    it('should scope data to specific tenant', () => {
      const data = { id: '1', name: 'Test' };
      const scoped = scopeToTenant(data, tenantA);

      expect(scoped.tenantId).toBe(tenantA);
      expect(scoped.id).toBe('1');
      expect(scoped.name).toBe('Test');
    });

    it('should filter data by tenant', () => {
      const tenantAData = filterByTenant(mixedData, tenantA);
      const tenantBData = filterByTenant(mixedData, tenantB);

      expect(tenantAData).toHaveLength(2);
      expect(tenantBData).toHaveLength(2);
      expect(tenantAData.every(d => d.tenantId === tenantA)).toBe(true);
      expect(tenantBData.every(d => d.tenantId === tenantB)).toBe(true);
    });

    it('should validate tenant access', () => {
      const itemA = mixedData[0];

      expect(validateTenantAccess(itemA, tenantA)).toBe(true);
      expect(validateTenantAccess(itemA, tenantB)).toBe(false);
    });

    it('should throw on cross-tenant access', () => {
      const itemA = mixedData[0];

      expect(() => assertSameTenant(tenantA, itemA.tenantId, 'read'))
        .not.toThrow();

      expect(() => assertSameTenant(tenantB, itemA.tenantId, 'read'))
        .toThrow('Cross-tenant access denied');
    });

    it('should create tenant query with filters', () => {
      const query = createTenantQuery(tenantA, { status: 'active' });

      expect(query.tenantId).toBe(tenantA);
      expect(query.filters).toEqual({ status: 'active' });
    });

    it('should wrap response with tenant context', () => {
      const data = { items: [1, 2, 3] };
      const response = wrapTenantResponse(data, tenantA);

      expect(response.tenantId).toBe(tenantA);
      expect(response.data).toEqual(data);
      expect(response.timestamp).toBeDefined();
    });

    it('should create tenant data accessor', () => {
      const accessor = createTenantDataAccessor<TestItem>(tenantA);

      expect(accessor.filter(mixedData)).toHaveLength(2);
      expect(accessor.validate(mixedData[0])).toBe(true);
      expect(accessor.validate(mixedData[2])).toBe(false);

      const scoped = accessor.scope({ id: 'new', name: 'New Item' });
      expect(scoped.tenantId).toBe(tenantA);
    });
  });

  // ============================================================================
  // RBAC Tests
  // ============================================================================
  describe('Role-Based Access Control', () => {
    it('should define permissions for all roles', () => {
      const roles: TenantRole[] = ['owner', 'admin', 'analyst', 'viewer', 'guest'];

      roles.forEach(role => {
        expect(DEFAULT_ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(DEFAULT_ROLE_PERMISSIONS[role])).toBe(true);
      });
    });

    it('should give owner full permissions', () => {
      const ownerPerms = DEFAULT_ROLE_PERMISSIONS.owner;

      expect(ownerPerms).toContain('case:create');
      expect(ownerPerms).toContain('case:delete');
      expect(ownerPerms).toContain('admin:billing');
      expect(ownerPerms).toContain('admin:api');
    });

    it('should restrict guest to read-only', () => {
      const guestPerms = DEFAULT_ROLE_PERMISSIONS.guest;

      expect(guestPerms).toContain('case:read');
      expect(guestPerms).not.toContain('case:create');
      expect(guestPerms).not.toContain('case:delete');
      expect(guestPerms).not.toContain('admin:billing');
    });

    it('should have hierarchical permission levels', () => {
      const owner = DEFAULT_ROLE_PERMISSIONS.owner.length;
      const admin = DEFAULT_ROLE_PERMISSIONS.admin.length;
      const analyst = DEFAULT_ROLE_PERMISSIONS.analyst.length;
      const viewer = DEFAULT_ROLE_PERMISSIONS.viewer.length;
      const guest = DEFAULT_ROLE_PERMISSIONS.guest.length;

      expect(owner).toBeGreaterThan(admin);
      expect(admin).toBeGreaterThan(analyst);
      expect(analyst).toBeGreaterThan(viewer);
      expect(viewer).toBeGreaterThan(guest);
    });
  });

  // ============================================================================
  // Audit Log Tests
  // ============================================================================
  describe('Audit Logging', () => {
    const testTenantId = 'audit-test-tenant';

    beforeEach(() => {
      clearAuditLog(testTenantId);
    });

    it('should create audit entries', () => {
      const entry = createAuditEntry(
        testTenantId,
        'user-123',
        'create',
        'case',
        'case-456',
        { name: 'Test Case' }
      );

      expect(entry.tenantId).toBe(testTenantId);
      expect(entry.userId).toBe('user-123');
      expect(entry.action).toBe('create');
      expect(entry.resource).toBe('case');
      expect(entry.resourceId).toBe('case-456');
      expect(entry.details).toEqual({ name: 'Test Case' });
      expect(entry.timestamp).toBeDefined();
    });

    it('should retrieve audit log for tenant', () => {
      createAuditEntry(testTenantId, 'user-1', 'read', 'case');
      createAuditEntry(testTenantId, 'user-2', 'update', 'case');
      createAuditEntry('other-tenant', 'user-3', 'delete', 'case');

      const log = getAuditLog(testTenantId);

      expect(log).toHaveLength(2);
      expect(log.every(e => e.tenantId === testTenantId)).toBe(true);
    });

    it('should filter audit log by action', () => {
      createAuditEntry(testTenantId, 'user-1', 'read', 'case');
      createAuditEntry(testTenantId, 'user-1', 'update', 'case');
      createAuditEntry(testTenantId, 'user-1', 'read', 'user');

      const readLogs = getAuditLog(testTenantId, { action: 'read' });

      expect(readLogs).toHaveLength(2);
      expect(readLogs.every(e => e.action === 'read')).toBe(true);
    });

    it('should paginate audit log', () => {
      for (let i = 0; i < 10; i++) {
        createAuditEntry(testTenantId, 'user-1', 'read', 'case', `case-${i}`);
      }

      const page1 = getAuditLog(testTenantId, { limit: 3, offset: 0 });
      const page2 = getAuditLog(testTenantId, { limit: 3, offset: 3 });

      expect(page1).toHaveLength(3);
      expect(page2).toHaveLength(3);
      expect(page1[0].resourceId).not.toBe(page2[0].resourceId);
    });

    it('should clear audit log for specific tenant', () => {
      // Clear all logs first to ensure clean state
      clearAuditLog();

      createAuditEntry(testTenantId, 'user-1', 'read', 'case');
      createAuditEntry('other-tenant', 'user-2', 'read', 'case');

      clearAuditLog(testTenantId);

      expect(getAuditLog(testTenantId)).toHaveLength(0);
      expect(getAuditLog('other-tenant')).toHaveLength(1);
    });
  });

  // ============================================================================
  // Encryption Tests
  // ============================================================================
  describe('Data Encryption', () => {
    const tenantKey = 'tenant-secret-key-12345';
    const sensitiveData = 'CPR: 123456-7890';

    it('should encrypt tenant data', () => {
      const encrypted = encryptTenantData(sensitiveData, tenantKey);

      expect(encrypted).toMatch(/^enc:\d+:/);
      expect(encrypted).not.toContain(sensitiveData);
    });

    it('should decrypt tenant data with correct key', () => {
      const encrypted = encryptTenantData(sensitiveData, tenantKey);
      const decrypted = decryptTenantData(encrypted, tenantKey);

      expect(decrypted).toBe(sensitiveData);
    });

    it('should fail decryption with wrong key', () => {
      const encrypted = encryptTenantData(sensitiveData, tenantKey);
      const decrypted = decryptTenantData(encrypted, 'wrong-key');

      expect(decrypted).toBeNull();
    });

    it('should return original string if not encrypted', () => {
      const plainText = 'Not encrypted';
      const result = decryptTenantData(plainText, tenantKey);

      expect(result).toBe(plainText);
    });

    it('should mask sensitive data for display', () => {
      expect(maskSensitiveData('1234567890', 4)).toBe('******7890');
      expect(maskSensitiveData('ABC', 4)).toBe('****');
      expect(maskSensitiveData('ABCDEFGH', 2)).toBe('******GH');
    });
  });

  // ============================================================================
  // Tenant ID Validation Tests
  // ============================================================================
  describe('Tenant ID Validation', () => {
    it('should validate UUID format', () => {
      expect(isValidTenantId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidTenantId('not-a-uuid')).toBe(true); // Valid as slug
      expect(isValidTenantId('ab')).toBe(false); // Too short
    });

    it('should validate slug format', () => {
      expect(isValidTenantId('my-company')).toBe(true);
      expect(isValidTenantId('company123')).toBe(true);
      expect(isValidTenantId('UPPERCASE')).toBe(false);
      expect(isValidTenantId('has spaces')).toBe(false);
    });

    it('should generate valid tenant IDs', () => {
      const id = generateTenantId();

      expect(isValidTenantId(id)).toBe(true);
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('should sanitize tenant slugs', () => {
      expect(sanitizeTenantSlug('My Company')).toBe('my-company');
      expect(sanitizeTenantSlug('Special@#$Chars!')).toBe('special-chars');
      expect(sanitizeTenantSlug('---multiple---dashes---')).toBe('multiple-dashes');
      expect(sanitizeTenantSlug('A'.repeat(100))).toHaveLength(50);
    });
  });

  // ============================================================================
  // Branding Tests
  // ============================================================================
  describe('White-Labeling', () => {
    it('should provide default branding', () => {
      expect(DEFAULT_BRANDING.companyName).toBe('TSL Intelligence');
      expect(DEFAULT_BRANDING.colors.primary).toBe('#00cc66');
    });

    it('should provide default features', () => {
      expect(DEFAULT_FEATURES.aiAssistant).toBe(true);
      expect(DEFAULT_FEATURES.pdfExport).toBe(true);
      expect(DEFAULT_FEATURES.enabledModules).toContain('dashboard');
    });

    it('should generate CSS variables from colors', () => {
      const css = generateCssVariables(DEFAULT_BRANDING.colors);

      expect(css).toContain('--tenant-primary: #00cc66');
      expect(css).toContain('--tenant-background:');
      expect(css).toContain('--tenant-text:');
    });

    it('should have preset themes', () => {
      expect(PRESET_THEMES.default).toBeDefined();
      expect(PRESET_THEMES.corporate).toBeDefined();
      expect(PRESET_THEMES.light).toBeDefined();
    });

    it('should create branding from preset', () => {
      const branding = createBrandingFromPreset('corporate', {
        companyName: 'My Corp',
        supportEmail: 'support@mycorp.com',
      });

      expect(branding.companyName).toBe('My Corp');
      expect(branding.colors.primary).toBe(PRESET_THEMES.corporate.primary);
      expect(branding.supportEmail).toBe('support@mycorp.com');
    });
  });

  // ============================================================================
  // Cross-Tenant Security Tests
  // ============================================================================
  describe('Cross-Tenant Security', () => {
    it('should prevent data leakage between tenants', () => {
      const tenantA = 'tenant-a';
      const tenantB = 'tenant-b';

      interface SecretData extends TenantScoped {
        secret: string;
      }

      const secrets: SecretData[] = [
        { tenantId: tenantA, secret: 'A secret' },
        { tenantId: tenantB, secret: 'B secret' },
      ];

      const accessorA = createTenantDataAccessor<SecretData>(tenantA);
      const accessorB = createTenantDataAccessor<SecretData>(tenantB);

      const visibleToA = accessorA.filter(secrets);
      const visibleToB = accessorB.filter(secrets);

      expect(visibleToA).toHaveLength(1);
      expect(visibleToA[0].secret).toBe('A secret');
      expect(visibleToB).toHaveLength(1);
      expect(visibleToB[0].secret).toBe('B secret');
    });

    it('should isolate audit logs per tenant', () => {
      const tenantA = 'audit-tenant-a';
      const tenantB = 'audit-tenant-b';

      clearAuditLog();

      createAuditEntry(tenantA, 'user-a', 'login', 'session', undefined, { ip: '1.1.1.1' });
      createAuditEntry(tenantB, 'user-b', 'login', 'session', undefined, { ip: '2.2.2.2' });

      const logsA = getAuditLog(tenantA);
      const logsB = getAuditLog(tenantB);

      expect(logsA).toHaveLength(1);
      expect(logsA[0].details).toEqual({ ip: '1.1.1.1' });
      expect(logsB).toHaveLength(1);
      expect(logsB[0].details).toEqual({ ip: '2.2.2.2' });
    });

    it('should use separate encryption keys per tenant', () => {
      const keyA = 'tenant-a-key';
      const keyB = 'tenant-b-key';
      const data = 'sensitive data';

      const encryptedA = encryptTenantData(data, keyA);
      const encryptedB = encryptTenantData(data, keyB);

      // Different keys should produce different encrypted data
      expect(encryptedA).not.toBe(encryptedB);

      // Cross-decryption should fail
      expect(decryptTenantData(encryptedA, keyB)).toBeNull();
      expect(decryptTenantData(encryptedB, keyA)).toBeNull();
    });
  });
});
