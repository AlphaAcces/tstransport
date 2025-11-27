/**
 * Tenant Data Isolation Service
 *
 * Provides utilities for tenant-scoped data access with row-level isolation.
 */

import type { TenantId, TenantQuery, TenantScoped, TenantApiResponse, TenantAuditEntry } from './types';

// ============================================================================
// Data Isolation Utilities
// ============================================================================

/**
 * Ensures data is tenant-scoped
 */
export function scopeToTenant<T>(data: T, tenantId: TenantId): T & TenantScoped {
  return { ...data, tenantId };
}

/**
 * Filters array to only include items for the specified tenant
 */
export function filterByTenant<T extends TenantScoped>(
  items: T[],
  tenantId: TenantId
): T[] {
  return items.filter(item => item.tenantId === tenantId);
}

/**
 * Validates that data belongs to the specified tenant
 */
export function validateTenantAccess<T extends TenantScoped>(
  data: T,
  tenantId: TenantId
): boolean {
  return data.tenantId === tenantId;
}

/**
 * Creates a tenant-scoped query
 */
export function createTenantQuery<T>(
  tenantId: TenantId,
  filters?: T
): TenantQuery<T> {
  return { tenantId, filters };
}

/**
 * Wraps data in a tenant API response
 */
export function wrapTenantResponse<T>(
  data: T,
  tenantId: TenantId
): TenantApiResponse<T> {
  return {
    tenantId,
    data,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Audit Logging
// ============================================================================

const auditLog: TenantAuditEntry[] = [];

/**
 * Creates an audit log entry
 */
export function createAuditEntry(
  tenantId: TenantId,
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, unknown>
): TenantAuditEntry {
  const entry: TenantAuditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tenantId,
    userId,
    action,
    resource,
    resourceId,
    details,
    timestamp: new Date().toISOString(),
  };

  auditLog.push(entry);
  return entry;
}

/**
 * Gets audit log entries for a tenant
 */
export function getAuditLog(
  tenantId: TenantId,
  options?: {
    limit?: number;
    offset?: number;
    action?: string;
    resource?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }
): TenantAuditEntry[] {
  let entries = filterByTenant(auditLog, tenantId);

  if (options?.action) {
    entries = entries.filter(e => e.action === options.action);
  }
  if (options?.resource) {
    entries = entries.filter(e => e.resource === options.resource);
  }
  if (options?.userId) {
    entries = entries.filter(e => e.userId === options.userId);
  }
  if (options?.startDate) {
    entries = entries.filter(e => e.timestamp >= options.startDate!);
  }
  if (options?.endDate) {
    entries = entries.filter(e => e.timestamp <= options.endDate!);
  }

  // Sort by timestamp descending
  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Apply pagination
  const offset = options?.offset || 0;
  const limit = options?.limit || 100;

  return entries.slice(offset, offset + limit);
}

/**
 * Clears audit log for a tenant (for testing)
 */
export function clearAuditLog(tenantId?: TenantId): void {
  if (tenantId) {
    const indices: number[] = [];
    auditLog.forEach((entry, i) => {
      if (entry.tenantId === tenantId) indices.push(i);
    });
    indices.reverse().forEach(i => auditLog.splice(i, 1));
  } else {
    auditLog.length = 0;
  }
}

// ============================================================================
// Data Encryption Utilities
// ============================================================================

/**
 * Simple encryption for sensitive tenant data (placeholder for real implementation)
 * In production, use proper encryption libraries like crypto-js or Web Crypto API
 */
export function encryptTenantData(data: string, tenantKey: string): string {
  // Placeholder: In production, use AES-256-GCM encryption
  const encoded = btoa(data);
  const keyHash = tenantKey.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 256;
  return `enc:${keyHash}:${encoded}`;
}

/**
 * Decrypts tenant data
 */
export function decryptTenantData(encrypted: string, tenantKey: string): string | null {
  if (!encrypted.startsWith('enc:')) return encrypted;

  try {
    const parts = encrypted.split(':');
    if (parts.length !== 3) return null;

    const storedKeyHash = parseInt(parts[1], 10);
    const keyHash = tenantKey.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 256;

    if (storedKeyHash !== keyHash) return null;

    return atob(parts[2]);
  } catch {
    return null;
  }
}

/**
 * Masks sensitive data for display
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) return '****';
  return '*'.repeat(data.length - visibleChars) + data.slice(-visibleChars);
}

// ============================================================================
// Tenant Data Validation
// ============================================================================

/**
 * Validates tenant ID format
 */
export function isValidTenantId(tenantId: string): boolean {
  // UUID v4 format or slug format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const slugRegex = /^[a-z0-9-]{3,50}$/;
  return uuidRegex.test(tenantId) || slugRegex.test(tenantId);
}

/**
 * Generates a unique tenant ID
 */
export function generateTenantId(): TenantId {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Sanitizes tenant slug
 */
export function sanitizeTenantSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

// ============================================================================
// Cross-Tenant Protection
// ============================================================================

/**
 * Throws error if attempting cross-tenant access
 */
export function assertSameTenant(
  contextTenantId: TenantId,
  dataTenantId: TenantId,
  operation: string
): void {
  if (contextTenantId !== dataTenantId) {
    throw new Error(
      `Cross-tenant access denied: Cannot ${operation} data from tenant ${dataTenantId} ` +
      `while authenticated as tenant ${contextTenantId}`
    );
  }
}

/**
 * Creates a tenant-aware data accessor
 */
export function createTenantDataAccessor<T extends TenantScoped>(
  tenantId: TenantId
) {
  return {
    filter: (items: T[]) => filterByTenant(items, tenantId),
    validate: (item: T) => validateTenantAccess(item, tenantId),
    scope: <D>(data: D) => scopeToTenant(data, tenantId),
    assert: (item: T, operation: string) =>
      assertSameTenant(tenantId, item.tenantId, operation),
  };
}
