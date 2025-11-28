/**
 * Threat Level Widget Component
 *
 * Displays the overall threat level with a prominent number,
 * status indicator, and trend information using Intel24 design.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

export type ThreatLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'critical';

interface ThreatWidgetProps {
  level: ThreatLevel;
  score: number; // 0-100
  previousScore?: number;
  lastUpdated?: Date;
  activeAlerts?: number;
  onClick?: () => void;
}

const threatConfig: Record<ThreatLevel, {
  label: string;
  labelDa: string;
  color: string;
  bgGradient: string;
  borderColor: string;
}> = {
  low: {
    label: 'Low',
    labelDa: 'Lav',
    color: 'text-green-400',
    bgGradient: 'from-green-500/20 to-green-600/10',
    borderColor: 'border-green-500/30',
  },
  moderate: {
    label: 'Moderate',
    labelDa: 'Moderat',
    color: 'text-yellow-400',
    bgGradient: 'from-yellow-500/20 to-yellow-600/10',
    borderColor: 'border-yellow-500/30',
  },
  elevated: {
    label: 'Elevated',
    labelDa: 'Forhøjet',
    color: 'text-orange-400',
    bgGradient: 'from-orange-500/20 to-orange-600/10',
    borderColor: 'border-orange-500/30',
  },
  high: {
    label: 'High',
    labelDa: 'Høj',
    color: 'text-red-400',
    bgGradient: 'from-red-500/20 to-red-600/10',
    borderColor: 'border-red-500/30',
  },
  critical: {
    label: 'Critical',
    labelDa: 'Kritisk',
    color: 'text-red-500',
    bgGradient: 'from-red-600/30 to-red-700/20',
    borderColor: 'border-red-500/50',
  },
};

export const ThreatWidget: React.FC<ThreatWidgetProps> = ({
  level,
  score,
  previousScore,
  lastUpdated,
  activeAlerts = 0,
  onClick,
}) => {
  const { t, i18n } = useTranslation();
  const config = threatConfig[level];
  const isDA = i18n.language === 'da';

  // Calculate trend
  const trend = previousScore !== undefined ? score - previousScore : 0;
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-red-400' : trend < 0 ? 'text-green-400' : 'text-gray-400';

  return (
    <div
      className={`threat-widget animate-fade-in-up ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => onClick && e.key === 'Enter' && onClick()}
    >
      {/* Gold/Copper accent bar at top */}
      <div className="threat-widget__bar" />

      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-0">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[var(--color-gold)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wider">
            {t('dashboard.threat.title', { defaultValue: 'Threat Level' })}
          </h3>
        </div>
        {activeAlerts > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-danger)]/20 border border-[var(--color-danger)]/30">
            <AlertTriangle className="w-3 h-3 text-[var(--color-danger)]" />
            <span className="text-xs font-medium text-[var(--color-danger)]">
              {activeAlerts}
            </span>
          </div>
        )}
      </div>

      {/* Main Score Display */}
      <div className="p-4 pt-2">
        <div className={`flex items-center justify-center py-6 px-4 rounded-lg bg-gradient-to-br ${config.bgGradient} border ${config.borderColor}`}>
          <div className="text-center">
            <p className={`text-6xl font-bold ${config.color} tabular-nums`}>
              {score}
            </p>
            <p className={`text-sm font-medium mt-1 ${config.color}`}>
              {isDA ? config.labelDa : config.label}
            </p>
          </div>
        </div>

        {/* Trend & Last Updated */}
        <div className="flex items-center justify-between mt-3">
          {previousScore !== undefined && (
            <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span>
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}
                {' '}
                {t('dashboard.threat.fromPrevious', { defaultValue: 'from previous' })}
              </span>
            </div>
          )}
          {lastUpdated && (
            <p className="text-xs text-[var(--color-text-muted)]">
              {t('common.updated', { defaultValue: 'Updated' })}: {' '}
              {lastUpdated.toLocaleTimeString(i18n.language, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-3 border-t border-[var(--color-border)] divide-x divide-[var(--color-border)]">
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-[var(--color-gold)]">
            {activeAlerts}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {t('dashboard.threat.activeAlerts', { defaultValue: 'Alerts' })}
          </p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-[var(--color-copper)]">
            {Math.round(score / 20)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {t('dashboard.threat.riskFactors', { defaultValue: 'Factors' })}
          </p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-[var(--color-deep-blue)]">
            {100 - score}%
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {t('dashboard.threat.confidence', { defaultValue: 'Confidence' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThreatWidget;
