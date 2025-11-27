/**
 * Multi-Tenant Types
 *
 * Type definitions for tenant isolation, RBAC, and white-labeling.
 */

// ============================================================================
// Tenant Core Types
// ============================================================================

/**
 * Unique tenant identifier
 */
export type TenantId = string;

/**
 * Tenant status
 */
export type TenantStatus = 'active' | 'suspended' | 'trial' | 'expired';

/**
 * Tenant tier for feature gating
 */
export type TenantTier = 'free' | 'basic' | 'professional' | 'enterprise';

/**
 * Core tenant configuration
 */
export interface TenantConfig {
  id: TenantId;
  name: string;
  slug: string;
  status: TenantStatus;
  tier: TenantTier;
  createdAt: string;
  expiresAt?: string;
  settings: TenantSettings;
  branding: TenantBranding;
  features: TenantFeatures;
  limits: TenantLimits;
  // Optional tenant-scoped AI API key (stored encrypted at rest)
  aiKey?: string | null;
}

/**
 * Tenant-specific settings
 */
export interface TenantSettings {
  defaultLanguage: 'da' | 'en';
  defaultCurrency: string;
  timezone: string;
  dateFormat: string;
  allowExternalIntegrations: boolean;
  dataRetentionDays: number;
  requireMfa: boolean;
  sessionTimeoutMinutes: number;
}

// ============================================================================
// Branding & White-Labeling Types
// ============================================================================

/**
 * Color scheme for tenant branding
 */
export interface TenantColorScheme {
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  danger: string;
  warning: string;
  success: string;
  info: string;
  background: string;
  backgroundDark: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: string;
  textMuted: string;
}

/**
 * Tenant branding configuration
 */
export interface TenantBranding {
  companyName: string;
  logoUrl?: string;
  logoUrlDark?: string;
  faviconUrl?: string;
  colors: TenantColorScheme;
  customCss?: string;
  emailFooter?: string;
  supportEmail?: string;
  supportUrl?: string;
}

// ============================================================================
// Feature Flags & Module Visibility
// ============================================================================

/**
 * Available modules that can be toggled per tenant
 */
export type TenantModule =
  | 'dashboard'
  | 'executive'
  | 'person'
  | 'companies'
  | 'financials'
  | 'risk'
  | 'timeline'
  | 'actions'
  | 'hypotheses'
  | 'scenarios'
  | 'cashflow'
  | 'sector'
  | 'counterparties'
  | 'network'
  | 'settings'
  | 'export'
  | 'ai';

/**
 * Feature flags per tenant
 */
export interface TenantFeatures {
  enabledModules: TenantModule[];
  aiAssistant: boolean;
  pdfExport: boolean;
  apiAccess: boolean;
  advancedAnalytics: boolean;
  customReports: boolean;
  bulkOperations: boolean;
  auditLog: boolean;
  ssoIntegration: boolean;
  webhooks: boolean;
  dataImport: boolean;
  dataExport: boolean;
  multiLanguage: boolean;
  darkMode: boolean;
}

/**
 * Tenant usage limits
 */
export interface TenantLimits {
  maxUsers: number;
  maxCases: number;
  maxStorageMb: number;
  maxApiRequestsPerDay: number;
  maxExportsPerMonth: number;
}

// ============================================================================
// RBAC Types
// ============================================================================

/**
 * User role within a tenant
 */
export type TenantRole = 'owner' | 'admin' | 'analyst' | 'viewer' | 'guest';

/**
 * Available permissions
 */
export type Permission =
  // Case permissions
  | 'case:create'
  | 'case:read'
  | 'case:update'
  | 'case:delete'
  | 'case:export'
  | 'case:share'
  // User permissions
  | 'user:create'
  | 'user:read'
  | 'user:update'
  | 'user:delete'
  | 'user:invite'
  // Settings permissions
  | 'settings:read'
  | 'settings:update'
  | 'branding:update'
  | 'features:update'
  // Data permissions
  | 'data:import'
  | 'data:export'
  | 'data:delete'
  // AI permissions
  | 'ai:use'
  | 'ai:configure'
  // Admin permissions
  | 'admin:audit'
  | 'admin:billing'
  | 'admin:api';

/**
 * Role permission mapping
 */
export interface RolePermissions {
  role: TenantRole;
  permissions: Permission[];
}

/**
 * User within a tenant context
 */
export interface TenantUser {
  id: string;
  tenantId: TenantId;
  email: string;
  name: string;
  role: TenantRole;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  mfaEnabled: boolean;
}

// ============================================================================
// Tenant Context Types
// ============================================================================

/**
 * Current tenant context state
 */
export interface TenantContextState {
  tenant: TenantConfig | null;
  user: TenantUser | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Tenant context actions
 */
export interface TenantContextActions {
  setTenant: (tenant: TenantConfig) => void;
  setUser: (user: TenantUser) => void;
  clearTenant: () => void;
  updateBranding: (branding: Partial<TenantBranding>) => void;
  updateFeatures: (features: Partial<TenantFeatures>) => void;
  updateAiKey: (aiKey?: string | null) => void;
  hasPermission: (permission: Permission) => boolean;
  hasFeature: (feature: keyof TenantFeatures) => boolean;
  hasModule: (module: TenantModule) => boolean;
}

/**
 * Complete tenant context type
 */
export type TenantContextType = TenantContextState & TenantContextActions;

// ============================================================================
// Data Isolation Types
// ============================================================================

/**
 * Base interface for tenant-scoped data
 */
export interface TenantScoped {
  tenantId: TenantId;
}

/**
 * Query filter with tenant isolation
 */
export interface TenantQuery<T = unknown> {
  tenantId: TenantId;
  filters?: T;
}

/**
 * Tenant-scoped API response
 */
export interface TenantApiResponse<T> {
  tenantId: TenantId;
  data: T;
  timestamp: string;
}

// ============================================================================
// Security Types
// ============================================================================

/**
 * Encryption configuration per tenant
 */
export interface TenantEncryption {
  algorithm: 'AES-256-GCM' | 'AES-256-CBC';
  keyRotationDays: number;
  encryptAtRest: boolean;
  encryptInTransit: boolean;
}

/**
 * Audit log entry
 */
export interface TenantAuditEntry {
  id: string;
  tenantId: TenantId;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}
