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
      --tenant-accent-hover: ${colors.accentHover ?? colors.accent};
      --tenant-accent-muted: ${colors.accentMuted ?? colors.accent};
      --tenant-danger: ${colors.danger};
      --tenant-danger-soft: ${colors.dangerSoft ?? 'rgba(229, 62, 62, 0.15)'};
      --tenant-warning: ${colors.warning};
      --tenant-warning-soft: ${colors.warningSoft ?? 'rgba(221, 107, 32, 0.15)'};
      --tenant-success: ${colors.success};
      --tenant-success-soft: ${colors.successSoft ?? 'rgba(56, 161, 105, 0.15)'};
      --tenant-info: ${colors.info};
      --tenant-info-soft: ${colors.infoSoft ?? 'rgba(49, 130, 206, 0.2)'};
      --tenant-background: ${colors.background};
      --tenant-background-dark: ${colors.backgroundDark};
      --tenant-surface: ${colors.surface};
      --tenant-surface-hover: ${colors.surfaceHover};
      --tenant-surface-elevated: ${colors.surfaceElevated ?? colors.surface};
      --tenant-border: ${colors.border};
      --tenant-border-strong: ${colors.borderStrong ?? colors.border};
      --tenant-border-subtle: ${colors.borderSubtle ?? 'rgba(255, 255, 255, 0.08)'};
      --tenant-text: ${colors.text};
      --tenant-text-muted: ${colors.textMuted};
      --tenant-text-gold: ${colors.textGold ?? colors.accent};
      --tenant-gold: ${colors.gold ?? colors.accent};
      --tenant-gold-hover: ${colors.goldHover ?? colors.accentHover ?? colors.accent};
      --tenant-gold-muted: ${colors.goldMuted ?? colors.accentMuted ?? colors.accent};
      --tenant-copper: ${colors.copper ?? colors.secondary};
      --tenant-copper-hover: ${colors.copperHover ?? colors.secondary};
      --tenant-deep-blue: ${colors.deepBlue ?? colors.primary};
      --tenant-deep-blue-light: ${colors.deepBlueLight ?? colors.primaryHover};
      --tenant-overlay: ${colors.overlay ?? 'rgba(8, 10, 18, 0.85)'};
      --tenant-shadow: ${colors.shadow ?? '0 0 20px rgba(227, 178, 60, 0.15)'};
      --tenant-shadow-strong: ${colors.shadowStrong ?? '0 0 30px rgba(227, 178, 60, 0.25)'};
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
  const fallback = branding.colors.primary ?? '#000000';
  return branding.colors[colorKey] ?? fallback;
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
    primary: '#1E3A5F',
    primaryHover: '#2A4A73',
    secondary: '#B87333',
    accent: '#E3B23C',
    accentHover: '#CCA030',
    accentMuted: '#B8942E',
    danger: '#F87171',
    dangerSoft: 'rgba(248, 113, 113, 0.2)',
    warning: '#F59E0B',
    warningSoft: 'rgba(245, 158, 11, 0.18)',
    success: '#34D399',
    successSoft: 'rgba(52, 211, 153, 0.18)',
    info: '#4F8CC9',
    infoSoft: 'rgba(79, 140, 201, 0.24)',
    background: '#0C0E1A',
    backgroundDark: '#080A12',
    surface: '#141824',
    surfaceHover: '#1C2230',
    surfaceElevated: '#1F2535',
    border: '#2A2E3D',
    borderStrong: '#383D4F',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    text: '#E8E6E3',
    textMuted: '#9CA3AF',
    textGold: '#E3B23C',
    copper: '#B87333',
    copperHover: '#A66429',
    copperMuted: 'rgba(184, 115, 51, 0.4)',
    gold: '#E3B23C',
    goldHover: '#CCA030',
    goldMuted: '#B8942E',
    deepBlue: '#1E3A5F',
    deepBlueLight: '#2A4A73',
    overlay: 'rgba(8, 10, 18, 0.9)',
    shadow: '0 0 20px rgba(227, 178, 60, 0.15)',
    shadowStrong: '0 0 30px rgba(227, 178, 60, 0.25)',
  },
  corporate: {
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    secondary: '#64748B',
    accent: '#8B5CF6',
    accentHover: '#7C3AED',
    accentMuted: '#6D28D9',
    danger: '#F87171',
    dangerSoft: 'rgba(248, 113, 113, 0.2)',
    warning: '#FB923C',
    warningSoft: 'rgba(251, 146, 60, 0.22)',
    success: '#22C55E',
    successSoft: 'rgba(34, 197, 94, 0.2)',
    info: '#0EA5E9',
    infoSoft: 'rgba(14, 165, 233, 0.24)',
    background: '#0F172A',
    backgroundDark: '#020617',
    surface: '#1E293B',
    surfaceHover: '#334155',
    surfaceElevated: '#1E293B',
    border: '#334155',
    borderStrong: '#475569',
    borderSubtle: 'rgba(148, 163, 184, 0.25)',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    textGold: '#FACC15',
    copper: '#FB923C',
    copperHover: '#F97316',
    copperMuted: 'rgba(249, 115, 22, 0.35)',
    gold: '#FACC15',
    goldHover: '#EAB308',
    goldMuted: 'rgba(250, 204, 21, 0.7)',
    deepBlue: '#1D4ED8',
    deepBlueLight: '#3B82F6',
    overlay: 'rgba(2, 6, 23, 0.85)',
    shadow: '0 0 20px rgba(14, 165, 233, 0.12)',
    shadowStrong: '0 0 35px rgba(14, 165, 233, 0.18)',
  },
  light: {
    primary: '#1E3A5F',
    primaryHover: '#2F4E77',
    secondary: '#6B7280',
    accent: '#B8942E',
    accentHover: '#9A7A24',
    accentMuted: '#8A6A1F',
    danger: '#DC2626',
    dangerSoft: 'rgba(220, 38, 38, 0.12)',
    warning: '#EA580C',
    warningSoft: 'rgba(234, 88, 12, 0.12)',
    success: '#16A34A',
    successSoft: 'rgba(22, 163, 74, 0.12)',
    info: '#2563EB',
    infoSoft: 'rgba(37, 99, 235, 0.16)',
    background: '#FFFFFF',
    backgroundDark: '#F3F4F6',
    surface: '#FFFFFF',
    surfaceHover: '#F6F5EF',
    surfaceElevated: '#FFFFFF',
    border: '#E5E7EB',
    borderStrong: '#D4D4CF',
    borderSubtle: 'rgba(15, 23, 42, 0.08)',
    text: '#111827',
    textMuted: '#6B7280',
    textGold: '#8A6A1F',
    copper: '#B87333',
    copperHover: '#A66429',
    copperMuted: 'rgba(184, 115, 51, 0.3)',
    gold: '#B8942E',
    goldHover: '#9A7A24',
    goldMuted: '#8A6A1F',
    deepBlue: '#1E3A5F',
    deepBlueLight: '#2F4E77',
    overlay: 'rgba(15, 23, 42, 0.45)',
    shadow: '0 0 20px rgba(15, 23, 42, 0.08)',
    shadowStrong: '0 0 35px rgba(15, 23, 42, 0.12)',
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
