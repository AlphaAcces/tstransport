/**
 * Tenant Domain - Barrel Export
 */

// Types
export type {
  TenantId,
  TenantStatus,
  TenantTier,
  TenantConfig,
  TenantSettings,
  TenantColorScheme,
  TenantBranding,
  TenantModule,
  TenantFeatures,
  TenantLimits,
  TenantRole,
  Permission,
  RolePermissions,
  TenantUser,
  TenantContextState,
  TenantContextActions,
  TenantContextType,
  TenantScoped,
  TenantQuery,
  TenantApiResponse,
  TenantEncryption,
  TenantAuditEntry,
} from './types';

// Context and hooks
export {
  TenantProvider,
  useTenant,
  useTenantConfig,
  useTenantUser,
  usePermission,
  usePermissions,
  useFeature,
  useModule,
  useBranding,
  useTenantId,
  WithPermission,
  WithModule,
  DEFAULT_BRANDING,
  DEFAULT_FEATURES,
  DEFAULT_ROLE_PERMISSIONS,
} from './TenantContext';

// Isolation utilities
export {
  scopeToTenant,
  filterByTenant,
  validateTenantAccess,
  createTenantQuery,
  wrapTenantResponse,
  createAuditEntry,
  getAuditLog,
  clearAuditLog,
  encryptTenantData,
  decryptTenantData,
  maskSensitiveData,
  isValidTenantId,
  generateTenantId,
  sanitizeTenantSlug,
  assertSameTenant,
  createTenantDataAccessor,
} from './tenantIsolation';

// Branding components
export {
  TenantLogo,
  useTenantFavicon,
  useTenantTitle,
  ModuleGate,
  useEnabledModules,
  useAnyModule,
  useAllModules,
  generateCssVariables,
  TenantColorProvider,
  useTenantColor,
  SupportLink,
  TenantBrandingProvider,
  PRESET_THEMES,
  createBrandingFromPreset,
} from './TenantBranding';

// API service
export { tenantApi } from './tenantApi';
export type { TenantListItem, TenantSwitchResult } from './tenantApi';

// UI components
export { TenantSwitcher, RoleBadge, RoleIcon } from './TenantSwitcher';
