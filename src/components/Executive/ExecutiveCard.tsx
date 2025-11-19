import React from 'react';

interface ExecutiveCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  tone?: 'neutral' | 'warning' | 'critical' | 'positive';
  delay?: 0 | 1 | 2;
  children: React.ReactNode;
  className?: string;
}

const toneContainerClasses: Record<NonNullable<ExecutiveCardProps['tone']>, string> = {
  neutral: 'border-border-dark/60 hover:border-accent-green/40',
  warning: 'border-yellow-500/40 bg-yellow-500/5 hover:border-yellow-400/60',
  critical: 'border-red-500/40 bg-red-500/5 hover:border-red-400/60',
  positive: 'border-accent-green/40 bg-accent-green/5 hover:border-accent-green/60',
};

const toneIconClasses: Record<NonNullable<ExecutiveCardProps['tone']>, string> = {
  neutral: 'bg-gray-900/70 text-gray-300',
  warning: 'bg-yellow-500/15 text-yellow-300',
  critical: 'bg-red-500/15 text-red-300',
  positive: 'bg-accent-green/15 text-accent-green',
};

export const ExecutiveCard: React.FC<ExecutiveCardProps> = ({
  icon,
  title,
  subtitle,
  meta,
  tone = 'neutral',
  delay = 0,
  children,
  className = '',
}) => {
  const baseTone = toneContainerClasses[tone];
  const iconTone = toneIconClasses[tone];
  const delayClass = delay === 0 ? '' : ` executive-card--delay-${delay}`;

  return (
    <div
      className={`surface-card executive-card ${baseTone} transition-transform duration-200 ease-out hover:-translate-y-1 focus-within:-translate-y-1 focus:outline-none ${className}${delayClass}`.trim()}
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border-dark/60 ${iconTone}`}>
            {icon}
          </div>
          <div>
            {subtitle && <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{subtitle}</p>}
            <h3 className="text-base font-semibold text-gray-100 leading-tight">{title}</h3>
          </div>
        </div>
        {meta && <div className="flex-shrink-0">{meta}</div>}
      </div>
      <div className="mt-5 space-y-5 text-sm text-gray-300">{children}</div>
    </div>
  );
};
