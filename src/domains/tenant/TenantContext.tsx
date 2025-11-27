/**
 * Tenant Context
 *
 * Provides tenant isolation, RBAC, and white-labeling support.
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import type {
  TenantConfig,
  TenantUser,
  TenantBranding,
  TenantFeatures,
  TenantModule,
  TenantContextType,
  Permission,
  TenantRole,
} from './types';

// ============================================================================
// Default Configurations
// ============================================================================

const DEFAULT_ROLE_PERMISSIONS: Record<TenantRole, Permission[]> = {
  owner: [
    'case:create', 'case:read', 'case:update', 'case:delete', 'case:export', 'case:share',
    'user:create', 'user:read', 'user:update', 'user:delete', 'user:invite',
    'settings:read', 'settings:update', 'branding:update', 'features:update',
    'data:import', 'data:export', 'data:delete',
    'ai:use', 'ai:configure',
    'admin:audit', 'admin:billing', 'admin:api',
  ],
  admin: [
    'case:create', 'case:read', 'case:update', 'case:delete', 'case:export', 'case:share',
    'user:create', 'user:read', 'user:update', 'user:invite',
    'settings:read', 'settings:update', 'branding:update',
    'data:import', 'data:export',
    'ai:use', 'ai:configure',
    'admin:audit',
  ],
  analyst: [
    'case:create', 'case:read', 'case:update', 'case:export',
    'user:read',
    'settings:read',
    'data:import', 'data:export',
    'ai:use',
  ],
  viewer: [
    'case:read',
    'user:read',
    'settings:read',
  ],
  guest: [
    'case:read',
  ],
};

const DEFAULT_BRANDING: TenantBranding = {
  companyName: 'TSL Intelligence',
  colors: {
    primary: '#00cc66',
    primaryHover: '#00b359',
    secondary: '#4a5568',
    accent: '#667eea',
    danger: '#e53e3e',
    warning: '#dd6b20',
    success: '#38a169',
    info: '#3182ce',
    background: '#0a0c0e',
    backgroundDark: '#121418',
    surface: '#1a1c20',
    surfaceHover: '#2d3748',
    border: '#2d3748',
    text: '#e2e8f0',
    textMuted: '#a0aec0',
  },
};

const DEFAULT_FEATURES: TenantFeatures = {
  enabledModules: [
    'dashboard', 'executive', 'person', 'companies', 'financials',
    'risk', 'timeline', 'actions', 'hypotheses', 'scenarios',
    'cashflow', 'sector', 'counterparties', 'network', 'settings',
  ],
  aiAssistant: true,
  pdfExport: true,
  apiAccess: false,
  advancedAnalytics: true,
  customReports: false,
  bulkOperations: false,
  auditLog: true,
  ssoIntegration: false,
  webhooks: false,
  dataImport: true,
  dataExport: true,
  multiLanguage: true,
  darkMode: true,
};

// ============================================================================
// Context Creation
// ============================================================================

const TenantContext = createContext<TenantContextType | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface TenantProviderProps {
  children: ReactNode;
  initialTenant?: TenantConfig;
  initialUser?: TenantUser;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({
  children,
  initialTenant,
  initialUser,
}) => {
  const [tenant, setTenantState] = useState<TenantConfig | null>(initialTenant || null);
  const [user, setUserState] = useState<TenantUser | null>(initialUser || null);
  const [isLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply tenant branding as CSS variables
  useEffect(() => {
    if (tenant?.branding?.colors) {
      const root = document.documentElement;
      const colors = tenant.branding.colors;

      root.style.setProperty('--color-primary', colors.primary);
      root.style.setProperty('--color-primary-hover', colors.primaryHover);
      root.style.setProperty('--color-secondary', colors.secondary);
      root.style.setProperty('--color-accent', colors.accent);
      root.style.setProperty('--color-danger', colors.danger);
      root.style.setProperty('--color-warning', colors.warning);
      root.style.setProperty('--color-success', colors.success);
      root.style.setProperty('--color-info', colors.info);
      root.style.setProperty('--color-background', colors.background);
      root.style.setProperty('--color-background-dark', colors.backgroundDark);
      root.style.setProperty('--color-surface', colors.surface);
      root.style.setProperty('--color-surface-hover', colors.surfaceHover);
      root.style.setProperty('--color-border', colors.border);
      root.style.setProperty('--color-text', colors.text);
      root.style.setProperty('--color-text-muted', colors.textMuted);
    }

    // Apply custom CSS if provided
    if (tenant?.branding?.customCss) {
      const styleId = 'tenant-custom-css';
      let styleEl = document.getElementById(styleId) as HTMLStyleElement;

      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }

      styleEl.textContent = tenant.branding.customCss;
    }
  }, [tenant?.branding]);

  // Actions
  const setTenant = useCallback((newTenant: TenantConfig) => {
    setTenantState(newTenant);
    setError(null);
  }, []);

  const setUser = useCallback((newUser: TenantUser) => {
    setUserState(newUser);
    setError(null);
  }, []);

  const clearTenant = useCallback(() => {
    setTenantState(null);
    setUserState(null);
    setError(null);
  }, []);

  const updateBranding = useCallback((brandingUpdate: Partial<TenantBranding>) => {
    if (tenant) {
      setTenantState({
        ...tenant,
        branding: { ...tenant.branding, ...brandingUpdate },
      });
    }
  }, [tenant]);

  const updateFeatures = useCallback((featuresUpdate: Partial<TenantFeatures>) => {
    if (tenant) {
      setTenantState({
        ...tenant,
        features: { ...tenant.features, ...featuresUpdate },
      });
    }
  }, [tenant]);

  const updateAiKey = useCallback((aiKey?: string | null) => {
    if (tenant) {
      setTenantState({
        ...tenant,
        aiKey: aiKey ?? null,
      });
    }
  }, [tenant]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;

    // Check explicit permissions first
    if (user.permissions.includes(permission)) return true;

    // Fall back to role-based permissions
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
    return rolePermissions.includes(permission);
  }, [user]);

  const hasFeature = useCallback((feature: keyof TenantFeatures): boolean => {
    if (!tenant) return false;
    const featureValue = tenant.features[feature];
    return typeof featureValue === 'boolean' ? featureValue : false;
  }, [tenant]);

  const hasModule = useCallback((module: TenantModule): boolean => {
    if (!tenant) return false;
    return tenant.features.enabledModules.includes(module);
  }, [tenant]);

  const contextValue = useMemo<TenantContextType>(() => ({
    tenant,
    user,
    isLoading,
    error,
    setTenant,
    setUser,
    clearTenant,
    updateBranding,
    updateFeatures,
    updateAiKey,
    hasPermission,
    hasFeature,
    hasModule,
  }), [
    tenant, user, isLoading, error,
    setTenant, setUser, clearTenant,
    updateBranding, updateFeatures,
    updateAiKey,
    hasPermission, hasFeature, hasModule,
  ]);

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access tenant context
 */
export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

/**
 * Optional tenant hook that returns null when no provider is present.
 * Useful for components rendered in tests without a TenantProvider.
 */
export const useOptionalTenant = (): TenantContextType | null => {
  return useContext(TenantContext);
};

/**
 * Hook to access current tenant config
 */
export const useTenantConfig = (): TenantConfig | null => {
  const { tenant } = useTenant();
  return tenant;
};

/**
 * Hook to access current tenant user
 */
export const useTenantUser = (): TenantUser | null => {
  const { user } = useTenant();
  return user;
};

/**
 * Hook to check permissions (RBAC)
 */
export const usePermission = (permission: Permission): boolean => {
  const { hasPermission } = useTenant();
  return hasPermission(permission);
};

/**
 * Hook to check multiple permissions
 */
export const usePermissions = (permissions: Permission[]): Record<Permission, boolean> => {
  const { hasPermission } = useTenant();
  return useMemo(() => {
    const result: Partial<Record<Permission, boolean>> = {};
    permissions.forEach(p => {
      result[p] = hasPermission(p);
    });
    return result as Record<Permission, boolean>;
  }, [permissions, hasPermission]);
};

/**
 * Hook to check feature availability
 */
export const useFeature = (feature: keyof TenantFeatures): boolean => {
  const { hasFeature } = useTenant();
  return hasFeature(feature);
};

/**
 * Hook to check module availability
 */
export const useModule = (module: TenantModule): boolean => {
  const { hasModule } = useTenant();
  return hasModule(module);
};

/**
 * Hook to get tenant branding
 */
export const useBranding = (): TenantBranding => {
  const { tenant } = useTenant();
  return tenant?.branding || DEFAULT_BRANDING;
};

/**
 * Hook to get tenant ID for data queries
 */
export const useTenantId = (): string | null => {
  const { tenant } = useTenant();
  return tenant?.id || null;
};

// ============================================================================
// HOC for Permission Gating
// ============================================================================

interface WithPermissionProps {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const WithPermission: React.FC<WithPermissionProps> = ({
  permission,
  fallback = null,
  children,
}) => {
  const hasAccess = usePermission(permission);
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

interface WithModuleProps {
  module: TenantModule;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const WithModule: React.FC<WithModuleProps> = ({
  module,
  fallback = null,
  children,
}) => {
  const hasAccess = useModule(module);
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// ============================================================================
// Exports
// ============================================================================

export { DEFAULT_BRANDING, DEFAULT_FEATURES, DEFAULT_ROLE_PERMISSIONS };
export default TenantProvider;
