/**
 * Tenant Branding Component
 *
 * Provides white-labeling UI support with dynamic branding, logos, and module visibility.
 */

import React from 'react';
import { useBranding, useModule, useTenant, TenantModule } from './index';
import type { TenantBranding, TenantColorScheme } from './types';

// ============================================================================
// Branding Components
// ============================================================================

/**
 * Tenant logo component with fallback
 */
interface TenantLogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  width?: number;
  height?: number;
}

export const TenantLogo: React.FC<TenantLogoProps> = ({
  className = '',
  variant = 'light',
  width = 120,
  height = 40,
}) => {
  const branding = useBranding();
  const logoUrl = variant === 'dark'
    ? branding.logoUrlDark || branding.logoUrl
    : branding.logoUrl;

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={branding.companyName}
        className={className}
        width={width}
        height={height}
        style={{ objectFit: 'contain' }}
      />
    );
  }

  // Fallback: text logo
  return (
    <span
      className={`font-bold text-lg ${className}`}
      style={{ color: branding.colors.primary }}
    >
      {branding.companyName}
    </span>
  );
};

/**
 * Favicon setter hook
 */
export const useTenantFavicon = () => {
  const branding = useBranding();

  React.useEffect(() => {
    if (branding.faviconUrl) {
      const link: HTMLLinkElement =
        document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = branding.faviconUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [branding.faviconUrl]);
};

/**
 * Document title hook with tenant branding
 */
export const useTenantTitle = (pageTitle?: string) => {
  const branding = useBranding();

  React.useEffect(() => {
    document.title = pageTitle
      ? `${pageTitle} | ${branding.companyName}`
      : branding.companyName;
  }, [pageTitle, branding.companyName]);
};

// ============================================================================
// Module Visibility Components
// ============================================================================

interface ModuleGateProps {
  module: TenantModule;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Gate component that only renders children if module is enabled
 */
export const ModuleGate: React.FC<ModuleGateProps> = ({
  module,
  children,
  fallback = null,
}) => {
  const isEnabled = useModule(module);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
};

/**
 * Hook to get list of enabled modules
 */
export const useEnabledModules = (): TenantModule[] => {
  const { tenant } = useTenant();
  return tenant?.features.enabledModules || [];
};

/**
 * Hook to check if any of the given modules are enabled
 */
export const useAnyModule = (modules: TenantModule[]): boolean => {
  const enabledModules = useEnabledModules();
  return modules.some(m => enabledModules.includes(m));
};

/**
 * Hook to check if all of the given modules are enabled
 */
export const useAllModules = (modules: TenantModule[]): boolean => {
  const enabledModules = useEnabledModules();
  return modules.every(m => enabledModules.includes(m));
};

// ============================================================================
// Theme / Color Utilities
// ============================================================================

/**
 * Generates CSS custom properties from tenant colors
 */
export function generateCssVariables(colors: TenantColorScheme): string {
  return `
    :root {
      --tenant-primary: ${colors.primary};
      --tenant-primary-hover: ${colors.primaryHover};
      --tenant-secondary: ${colors.secondary};
      --tenant-accent: ${colors.accent};
      --tenant-danger: ${colors.danger};
      --tenant-warning: ${colors.warning};
      --tenant-success: ${colors.success};
      --tenant-info: ${colors.info};
      --tenant-background: ${colors.background};
      --tenant-background-dark: ${colors.backgroundDark};
      --tenant-surface: ${colors.surface};
      --tenant-surface-hover: ${colors.surfaceHover};
      --tenant-border: ${colors.border};
      --tenant-text: ${colors.text};
      --tenant-text-muted: ${colors.textMuted};
    }
  `;
}

/**
 * Tenant color provider that injects CSS variables
 */
export const TenantColorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const branding = useBranding();

  React.useEffect(() => {
    const styleId = 'tenant-color-vars';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = generateCssVariables(branding.colors);
  }, [branding.colors]);

  return <>{children}</>;
};

/**
 * Hook to get a specific tenant color
 */
export const useTenantColor = (colorKey: keyof TenantColorScheme): string => {
  const branding = useBranding();
  return branding.colors[colorKey];
};

// ============================================================================
// Support / Contact Components
// ============================================================================

interface SupportLinkProps {
  className?: string;
  children?: React.ReactNode;
}

export const SupportLink: React.FC<SupportLinkProps> = ({ className, children }) => {
  const branding = useBranding();

  if (!branding.supportUrl && !branding.supportEmail) {
    return null;
  }

  const href = branding.supportUrl || `mailto:${branding.supportEmail}`;

  return (
    <a
      href={href}
      className={className}
      target={branding.supportUrl ? '_blank' : undefined}
      rel={branding.supportUrl ? 'noopener noreferrer' : undefined}
    >
      {children || 'Support'}
    </a>
  );
};

// ============================================================================
// Branding Provider (combines all branding features)
// ============================================================================

interface TenantBrandingProviderProps {
  children: React.ReactNode;
}

export const TenantBrandingProvider: React.FC<TenantBrandingProviderProps> = ({ children }) => {
  useTenantFavicon();

  return (
    <TenantColorProvider>
      {children}
    </TenantColorProvider>
  );
};

// ============================================================================
// Preset Themes
// ============================================================================

export const PRESET_THEMES: Record<string, TenantColorScheme> = {
  default: {
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
  corporate: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    secondary: '#64748b',
    accent: '#8b5cf6',
    danger: '#dc2626',
    warning: '#ea580c',
    success: '#16a34a',
    info: '#0284c7',
    background: '#0f172a',
    backgroundDark: '#1e293b',
    surface: '#334155',
    surfaceHover: '#475569',
    border: '#475569',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
  },
  light: {
    primary: '#059669',
    primaryHover: '#047857',
    secondary: '#6b7280',
    accent: '#7c3aed',
    danger: '#ef4444',
    warning: '#f97316',
    success: '#22c55e',
    info: '#0ea5e9',
    background: '#ffffff',
    backgroundDark: '#f3f4f6',
    surface: '#ffffff',
    surfaceHover: '#f9fafb',
    border: '#e5e7eb',
    text: '#111827',
    textMuted: '#6b7280',
  },
};

/**
 * Creates a complete branding config from a preset theme
 */
export function createBrandingFromPreset(
  themeName: keyof typeof PRESET_THEMES,
  overrides?: Partial<TenantBranding>
): TenantBranding {
  return {
    companyName: overrides?.companyName || 'TSL Intelligence',
    logoUrl: overrides?.logoUrl,
    logoUrlDark: overrides?.logoUrlDark,
    faviconUrl: overrides?.faviconUrl,
    colors: {
      ...PRESET_THEMES[themeName],
      ...overrides?.colors,
    },
    customCss: overrides?.customCss,
    emailFooter: overrides?.emailFooter,
    supportEmail: overrides?.supportEmail,
    supportUrl: overrides?.supportUrl,
  };
}
