/**
 * ThemeToggle Component
 *
 * Toggle button for switching between light, dark, and system themes.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../../domains/tenant/ThemeContext';
import type { ThemeMode } from '../../domains/tenant/types';

interface ThemeOption {
  value: ThemeMode;
  labelKey: string;
  icon: React.ReactNode;
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', labelKey: 'theme.light', icon: <Sun className="w-4 h-4" /> },
  { value: 'dark', labelKey: 'theme.dark', icon: <Moon className="w-4 h-4" /> },
  { value: 'system', labelKey: 'theme.system', icon: <Monitor className="w-4 h-4" /> },
];

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown';
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'button',
  showLabel = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const { mode, setMode, toggleTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Simple toggle button
  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] ${className}`}
        title={t(isDark ? 'theme.switchToLight' : 'theme.switchToDark')}
        aria-label={t(isDark ? 'theme.switchToLight' : 'theme.switchToDark')}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        {showLabel && (
          <span className="ml-2 text-sm">{t(isDark ? 'theme.light' : 'theme.dark')}</span>
        )}
      </button>
    );
  }

  // Dropdown variant
  const currentOption = THEME_OPTIONS.find((opt) => opt.value === mode) || THEME_OPTIONS[2];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] border border-[var(--color-border)]"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-[var(--color-text-muted)]">{currentOption.icon}</span>
        {showLabel && <span className="text-sm">{t(currentOption.labelKey)}</span>}
        <ChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg z-50">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setMode(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-surface-hover)] ${
                mode === option.value ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
              }`}
              role="option"
              aria-selected={mode === option.value}
            >
              <span className="text-[var(--color-text-muted)]">{option.icon}</span>
              <span className="flex-1">{t(option.labelKey)}</span>
              {mode === option.value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
