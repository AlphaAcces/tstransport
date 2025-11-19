import React from 'react';

type BadgeTone = 'neutral' | 'info' | 'warning' | 'danger' | 'success';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  description?: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  badge?: {
    label: string;
    tone?: BadgeTone;
    icon?: React.ReactNode;
  } | null;
  actions?: React.ReactNode;
  action?: React.ReactNode; // backwards compatibility
  align?: 'start' | 'center';
}

const badgeToneStyles: Record<BadgeTone, string> = {
  neutral: 'bg-gray-800 text-gray-200 border border-border-dark/60',
  info: 'bg-blue-900/40 text-blue-300 border border-blue-600/50',
  warning: 'bg-yellow-900/40 text-yellow-300 border border-yellow-500/50',
  danger: 'bg-red-900/40 text-red-300 border border-red-600/60',
  success: 'bg-green-900/30 text-green-300 border border-green-600/50',
};

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  description,
  eyebrow,
  icon,
  badge,
  actions,
  action,
  align = 'start',
}) => {
  const supportingText = subtitle ?? description ?? '';
  const resolvedActions = actions ?? action ?? null;

  return (
    <div className={`flex flex-col gap-4 lg:flex-row lg:items-${align === 'center' ? 'center' : 'start'} lg:justify-between`}>
      <div className="flex items-start gap-3">
        {icon && (
          <span className="rounded-md bg-base-dark/60 p-2 text-gray-400">
            {icon}
          </span>
        )}
        <div className="space-y-2">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              {eyebrow}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-100">{title}</h2>
            {badge && (
              <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full ${badgeToneStyles[badge.tone ?? 'neutral']}`}>
                {badge.icon && <span className="text-current">{badge.icon}</span>}
                {badge.label}
              </span>
            )}
          </div>
          {supportingText && (
            <p className="text-sm text-gray-400 leading-relaxed max-w-4xl">
              {supportingText}
            </p>
          )}
        </div>
      </div>
      {resolvedActions && (
        <div className="flex-shrink-0">
          <div className="flex flex-wrap gap-2 justify-end">{resolvedActions}</div>
        </div>
      )}
    </div>
  );
};
