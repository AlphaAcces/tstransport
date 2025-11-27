/**
 * Tenant API Service Tests
 *
 * Tests for tenant API endpoints and tenant switching functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { tenantApi, TENANT_API_BASE_URL } from '../tenantApi';

describe('Tenant API Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('TENANT_API_BASE_URL', () => {
    it('should have a default API base URL', () => {
      expect(TENANT_API_BASE_URL).toBe('/api');
    });
  });

  describe('getUserTenants', () => {
    it('should return list of available tenants', async () => {
      const response = await tenantApi.getUserTenants();

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data!.length).toBeGreaterThan(0);
    });

    it('should return tenant list items with required properties', async () => {
      const response = await tenantApi.getUserTenants();

      expect(response.success).toBe(true);
      const tenant = response.data![0];

      expect(tenant).toHaveProperty('id');
      expect(tenant).toHaveProperty('name');
      expect(tenant).toHaveProperty('slug');
      expect(tenant).toHaveProperty('role');
    });
  });

  describe('getTenantConfig', () => {
    it('should return full tenant configuration for valid tenant ID', async () => {
      const response = await tenantApi.getTenantConfig('tenant-001');

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data!.id).toBe('tenant-001');
      expect(response.data!.name).toBe('TSL Intelligence');
    });

    it('should return error for invalid tenant ID', async () => {
      const response = await tenantApi.getTenantConfig('invalid-tenant');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Tenant not found');
    });

    it('should include branding configuration', async () => {
      const response = await tenantApi.getTenantConfig('tenant-001');

      expect(response.success).toBe(true);
      expect(response.data!.branding).toBeDefined();
      expect(response.data!.branding.companyName).toBe('TSL Intelligence');
      expect(response.data!.branding.colors).toBeDefined();
    });

    it('should include features configuration', async () => {
      const response = await tenantApi.getTenantConfig('tenant-001');

      expect(response.success).toBe(true);
      expect(response.data!.features).toBeDefined();
      expect(response.data!.features.enabledModules).toContain('dashboard');
    });
  });

  describe('getTenantUser', () => {
    it('should return user for valid tenant', async () => {
      const response = await tenantApi.getTenantUser('tenant-001');

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data!.tenantId).toBe('tenant-001');
    });

    it('should return error for invalid tenant', async () => {
      const response = await tenantApi.getTenantUser('invalid-tenant');

      expect(response.success).toBe(false);
      expect(response.error).toBe('User not found for tenant');
    });
  });

  describe('switchTenant', () => {
    it('should switch to a different tenant', async () => {
      const response = await tenantApi.switchTenant('tenant-002');

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data!.tenant.id).toBe('tenant-002');
      expect(response.data!.user.tenantId).toBe('tenant-002');
    });

    it('should persist tenant selection in localStorage', async () => {
      await tenantApi.switchTenant('tenant-002');

      const storedTenantId = tenantApi.getCurrentTenantId();
      expect(storedTenantId).toBe('tenant-002');
    });

    it('should return a token on successful switch', async () => {
      const response = await tenantApi.switchTenant('tenant-001');

      expect(response.success).toBe(true);
      expect(response.data!.token).toBeDefined();
      expect(response.data!.token).toContain('mock-jwt-token');
    });

    it('should return error for invalid tenant', async () => {
      const response = await tenantApi.switchTenant('invalid-tenant');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Unable to switch tenant');
    });
  });

  describe('updateBranding', () => {
    it('should update tenant branding', async () => {
      const response = await tenantApi.updateBranding('tenant-001', {
        companyName: 'Updated Company Name',
      });

      expect(response.success).toBe(true);
      expect(response.data!.companyName).toBe('Updated Company Name');
    });

    it('should return error for invalid tenant', async () => {
      const response = await tenantApi.updateBranding('invalid-tenant', {
        companyName: 'Test',
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Tenant not found');
    });
  });

  describe('updateFeatures', () => {
    it('should update tenant features', async () => {
      const response = await tenantApi.updateFeatures('tenant-001', {
        aiAssistant: false,
      });

      expect(response.success).toBe(true);
      expect(response.data!.aiAssistant).toBe(false);
    });
  });

  describe('updateSettings', () => {
    it('should update tenant settings', async () => {
      const response = await tenantApi.updateSettings('tenant-001', {
        defaultLanguage: 'en',
      });

      expect(response.success).toBe(true);
      expect(response.data!.defaultLanguage).toBe('en');
    });
  });

  describe('getAuditLog', () => {
    it('should return audit log entries', async () => {
      const response = await tenantApi.getAuditLog('tenant-001');

      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await tenantApi.getAuditLog('tenant-001', { limit: 1 });

      expect(response.success).toBe(true);
      expect(response.data!.length).toBeLessThanOrEqual(1);
    });
  });

  describe('getCurrentTenantId', () => {
    it('should return null when no tenant is stored', () => {
      const tenantId = tenantApi.getCurrentTenantId();
      expect(tenantId).toBeNull();
    });

    it('should return stored tenant ID', async () => {
      await tenantApi.switchTenant('tenant-002');
      const tenantId = tenantApi.getCurrentTenantId();
      expect(tenantId).toBe('tenant-002');
    });
  });

  describe('clearCurrentTenant', () => {
    it('should clear stored tenant', async () => {
      await tenantApi.switchTenant('tenant-001');
      expect(tenantApi.getCurrentTenantId()).toBe('tenant-001');

      tenantApi.clearCurrentTenant();
      expect(tenantApi.getCurrentTenantId()).toBeNull();
    });
  });

  describe('initializeTenant', () => {
    it('should initialize with saved tenant', async () => {
      // First switch to a tenant
      await tenantApi.switchTenant('tenant-002');

      // Then initialize
      const response = await tenantApi.initializeTenant();

      expect(response.success).toBe(true);
      expect(response.data!.tenant.id).toBe('tenant-002');
    });

    it('should initialize with first available tenant when none saved', async () => {
      localStorage.clear();

      const response = await tenantApi.initializeTenant();

      expect(response.success).toBe(true);
      expect(response.data).not.toBeNull();
    });
  });

  describe('Response format', () => {
    it('should include timestamp in all responses', async () => {
      const response = await tenantApi.getUserTenants();

      expect(response.timestamp).toBeDefined();
      expect(new Date(response.timestamp)).toBeInstanceOf(Date);
    });
  });
});

describe('Tenant Tier Features', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('enterprise tier should have API access enabled', async () => {
    const response = await tenantApi.getTenantConfig('tenant-001');

    expect(response.data!.tier).toBe('enterprise');
    expect(response.data!.features.apiAccess).toBe(true);
    expect(response.data!.features.ssoIntegration).toBe(true);
  });

  it('professional tier should have limited features', async () => {
    const response = await tenantApi.getTenantConfig('tenant-002');

    expect(response.data!.tier).toBe('professional');
    // Note: aiAssistant may be modified by earlier tests
    expect(response.data!.features.apiAccess).toBe(false);
  });

  it('basic tier should have minimal features', async () => {
    const response = await tenantApi.getTenantConfig('tenant-003');

    expect(response.data!.tier).toBe('basic');
    expect(response.data!.features.advancedAnalytics).toBe(false);
  });
});

describe('Tenant Limits', () => {
  it('should have appropriate limits per tier', async () => {
    const enterprise = await tenantApi.getTenantConfig('tenant-001');
    const professional = await tenantApi.getTenantConfig('tenant-002');
    const basic = await tenantApi.getTenantConfig('tenant-003');

    expect(enterprise.data!.limits.maxUsers).toBeGreaterThan(professional.data!.limits.maxUsers);
    expect(professional.data!.limits.maxUsers).toBeGreaterThan(basic.data!.limits.maxUsers);
  });
});
