/**
 * Theme Context
 *
 * Provides theme switching (light/dark/system) with tenant branding support.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import type { ThemeMode, TenantColorScheme } from './types';

// ============================================================================
// Default Color Schemes
// ============================================================================

/** Intel24 Dark Theme - Blackbox DNA with Deep Blue/Copper accents */
export const DEFAULT_DARK_SCHEME: TenantColorScheme = {
  primary: '#00cc66',
  primaryHover: '#00b359',
  secondary: '#4a5568',
  accent: '#E3B23C', // Gold
  danger: '#e53e3e',
  warning: '#dd6b20',
  success: '#38a169',
  info: '#3182ce',
  background: '#0C0E1A',
  backgroundDark: '#080A12',
  surface: '#1A1E2D',
  surfaceHover: '#242838',
  border: '#2A2E3D',
  text: '#E8E6E3',
  textMuted: '#9CA3AF',
};

/** Intel24 Light Theme */
export const DEFAULT_LIGHT_SCHEME: TenantColorScheme = {
  primary: '#059669',
  primaryHover: '#047857',
  secondary: '#64748b',
  accent: '#B8942E', // Muted Gold
  danger: '#dc2626',
  warning: '#ea580c',
  success: '#16a34a',
  info: '#2563eb',
  background: '#F5F5F0',
  backgroundDark: '#E8E8E3',
  surface: '#FFFFFF',
  surfaceHover: '#F0F0EB',
  border: '#D4D4CF',
  text: '#1A1A1A',
  textMuted: '#6B7280',
};

// ============================================================================
// Theme Context Types
// ============================================================================

interface ThemeContextType {
  mode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  colors: TenantColorScheme;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// ============================================================================
// CSS Custom Properties Helper
// ============================================================================

function applyThemeColors(colors: TenantColorScheme, isDark: boolean): void {
  const root = document.documentElement;

  // Set color scheme
  root.style.setProperty('color-scheme', isDark ? 'dark' : 'light');

  // Set CSS custom properties
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

  // Toggle body class for Tailwind dark mode
  if (isDark) {
    document.body.classList.add('dark');
    document.body.classList.remove('light');
  } else {
    document.body.classList.add('light');
    document.body.classList.remove('dark');
  }
}

// ============================================================================
// Storage Helper
// ============================================================================

const STORAGE_KEY = 'theme-mode';

function getStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage might be unavailable
  }
  return 'system';
}

function setStoredMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Provider Component
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode;
  darkScheme?: TenantColorScheme;
  lightScheme?: TenantColorScheme;
  defaultMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  darkScheme = DEFAULT_DARK_SCHEME,
  lightScheme = DEFAULT_LIGHT_SCHEME,
  defaultMode,
}) => {
  const [mode, setModeState] = useState<ThemeMode>(() => defaultMode ?? getStoredMode());
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Listen to system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Resolve the actual theme
  const resolvedTheme = useMemo((): 'light' | 'dark' => {
    if (mode === 'system') {
      return systemPrefersDark ? 'dark' : 'light';
    }
    return mode;
  }, [mode, systemPrefersDark]);

  const isDark = resolvedTheme === 'dark';
  const colors = isDark ? darkScheme : lightScheme;

  // Apply theme colors when they change
  useEffect(() => {
    applyThemeColors(colors, isDark);
  }, [colors, isDark]);

  // Set mode and persist
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    setStoredMode(newMode);
  }, []);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const newMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setMode(newMode);
  }, [resolvedTheme, setMode]);

  const value = useMemo((): ThemeContextType => ({
    mode,
    resolvedTheme,
    colors,
    setMode,
    toggleTheme,
    isDark,
  }), [mode, resolvedTheme, colors, setMode, toggleTheme, isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
