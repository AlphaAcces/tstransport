/**
 * Intel24 Logo Component
 *
 * Intel24 branded logo with gold accent styling
 * Replaces the old TslLogo component
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

type LogoVariant = 'header' | 'inline' | 'compact';

interface Ts24LogoProps {
  variant?: LogoVariant;
  className?: string;
}

export const Ts24Logo: React.FC<Ts24LogoProps> = ({ variant = 'inline', className = '' }) => {
  const { t } = useTranslation();

  // Header variant - gold text with subtle glow
  if (variant === 'header') {
    return (
      <div
        className={`flex items-center gap-2 select-none ${className}`}
        aria-label={t('common.logo.alt', { defaultValue: 'Intel24' })}
      >
        <div className="relative">
          {/* Logo mark - stylized I with gold gradient */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-copper)] shadow-lg">
            <span className="text-lg font-black text-[var(--color-background)] tracking-tighter">i</span>
          </div>
          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-lg bg-[var(--color-gold)] opacity-20 blur-md -z-10" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-base font-bold text-[var(--color-text)] tracking-tight">Intel24</span>
          <span className="text-[10px] font-medium text-[var(--color-gold)] uppercase tracking-widest">Intel</span>
        </div>
      </div>
    );
  }

  // Compact variant - just the icon
  if (variant === 'compact') {
    return (
      <div
        className={`relative ${className}`}
        aria-label={t('common.logo.alt', { defaultValue: 'Intel24' })}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-copper)] shadow-md">
          <span className="text-sm font-black text-[var(--color-background)] tracking-tighter">i</span>
        </div>
      </div>
    );
  }

  // Inline variant - horizontal with full text
  return (
    <div
      className={`flex items-center gap-2 select-none ${className}`}
      aria-label={t('common.logo.alt', { defaultValue: 'Intel24' })}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-copper)] shadow-lg">
        <span className="text-xl font-black text-[var(--color-background)] tracking-tighter">i</span>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-lg font-bold text-[var(--color-text)] tracking-tight">Intel24</span>
        <span className="text-[11px] font-medium text-[var(--color-gold)] uppercase tracking-[0.15em]">Intelligence</span>
      </div>
    </div>
  );
};
