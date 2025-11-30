import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock3,
  Cpu,
  ExternalLink,
  LineChart,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import type { View } from '../../types';
import { ThreatWidget } from '../Dashboard/ThreatWidget';
import { KpiCard } from '../Shared/KpiCard';
import { useExecutiveSummaryController } from '../../domains/executive/hooks';
import {
  BadgeTone,
  ExecutiveSummaryViewData,
  TrendDirection,
  getMockExecutiveSummary,
} from '../../domains/executive/mockExecutiveSummary';

interface ExecutiveSummaryViewProps {
  onNavigate?: (view: View) => void;
  dataOverride?: ExecutiveSummaryViewData;
}

const badgeToneClassMap: Record<BadgeTone, string> = {
  danger: 'ts24-badge ts24-badge--danger',
  warning: 'ts24-badge ts24-badge--warning',
  info: 'ts24-badge ts24-badge--info',
  success: 'ts24-badge ts24-badge--success',
  neutral: 'ts24-badge',
};

const riskStatusLabels: Record<'monitor' | 'escalate' | 'contain', string> = {
  monitor: 'Overvåg',
  escalate: 'Eskaler',
  contain: 'Inddæm',
};

const riskStatusTone: Record<'monitor' | 'escalate' | 'contain', string> = {
  monitor: 'ts24-badge ts24-badge--info',
  escalate: 'ts24-badge ts24-badge--danger',
  contain: 'ts24-badge ts24-badge--warning',
};

const impactToneClass: Record<'low' | 'medium' | 'high', string> = {
  low: 'ts24-badge ts24-badge--success',
  medium: 'ts24-badge ts24-badge--warning',
  high: 'ts24-badge ts24-badge--danger',
};

const likelihoodToneClass: Record<'low' | 'medium' | 'high', string> = {
  low: 'ts24-badge ts24-badge--success',
  medium: 'ts24-badge ts24-badge--warning',
  high: 'ts24-badge ts24-badge--danger',
};

const actionStatusLabels: Record<'onTrack' | 'atRisk' | 'blocked', string> = {
  onTrack: 'På sporet',
  atRisk: 'Risiko',
  blocked: 'Blokeret',
};

const actionStatusTone: Record<'onTrack' | 'atRisk' | 'blocked', string> = {
  onTrack: 'ts24-badge ts24-badge--success',
  atRisk: 'ts24-badge ts24-badge--warning',
  blocked: 'ts24-badge ts24-badge--danger',
};

const trendDirectionIcon: Record<TrendDirection, React.ComponentType<{ className?: string }>> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: ArrowRight,
};

const trendDirectionTone: Record<TrendDirection, string> = {
  up: 'text-green-400',
  down: 'text-red-400',
  flat: 'text-gray-400',
};

const kpiIconMap = {
  revenue: <TrendingUp className="w-4 h-4" />,
  cash: <Banknote className="w-4 h-4" />,
  margin: <LineChart className="w-4 h-4" />,
  ai: <Cpu className="w-4 h-4" />,
  exposure: <ShieldAlert className="w-4 h-4" />,
} as const;

export const ExecutiveSummaryView: React.FC<ExecutiveSummaryViewProps> = ({ onNavigate, dataOverride }) => {
  const controller = useExecutiveSummaryController(onNavigate);
  const summary = useMemo(() => dataOverride ?? getMockExecutiveSummary(), [dataOverride]);
  const threatLastUpdated = useMemo(() => new Date(summary.threat.lastUpdated), [summary.threat.lastUpdated]);

  const renderEmptyState = (message: string) => (
    <div className="empty-state" role="status" aria-live="polite">
      <AlertTriangle className="empty-state-icon" aria-hidden="true" />
      <h3 className="empty-state-title">Ingen data</h3>
      <p className="empty-state-description">{message}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="case-header text-left">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] text-[var(--color-text-muted)] uppercase">{summary.header.eyebrow}</p>
            <h1 className="text-2xl font-semibold text-[var(--color-text)] mt-2">{summary.header.title}</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{summary.header.subtitle}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-2">{summary.header.updatedAt}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={controller.header.onExport}
              disabled={controller.header.isExporting}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border-gold)]/50 bg-[var(--color-surface-hover)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-gold)] transition hover:border-[var(--color-gold)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]/40 disabled:opacity-60"
            >
              {controller.header.isExporting ? controller.header.exportingLabel : controller.header.exportLabel}
            </button>
            <button
              type="button"
              onClick={controller.header.onTimeline}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-accent)]/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)] transition hover:bg-[var(--color-accent)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40"
            >
              {controller.header.timelineLabel}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3" aria-label="Executive overview">
        <div className="space-y-4">
          <div className="surface-card p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className={badgeToneClassMap[summary.threat.badgeTone]}>{summary.threat.badgeLabel}</span>
              <span className="text-xs text-[var(--color-text-muted)]">{summary.threat.activeAlerts} aktive alarmer</span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{summary.threat.summary}</p>
          </div>
          <ThreatWidget
            level={summary.threat.level}
            score={summary.threat.score}
            previousScore={summary.threat.previousScore}
            lastUpdated={threatLastUpdated}
            activeAlerts={summary.threat.activeAlerts}
            onClick={() => onNavigate?.('risk')}
          />
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {summary.kpis.map(kpi => (
              <KpiCard
                key={kpi.id}
                title={kpi.label}
                value={kpi.value}
                unit={kpi.unit}
                change={kpi.changePct}
                changeType={kpi.changeType}
                color={kpi.color}
                icon={kpiIconMap[kpi.icon]}
                onClick={() => onNavigate?.('financials')}
              >
                {kpi.description}
              </KpiCard>
            ))}
          </div>

          <article className="surface-card p-6" aria-labelledby="executive-note-heading">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{summary.executiveNote.title}</p>
                <h2 id="executive-note-heading" className="text-lg font-semibold text-[var(--color-text)] mt-1">
                  Kritisk briefing
                </h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--color-text-muted)]">{summary.executiveNote.author}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{summary.executiveNote.timestamp}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-[var(--color-text)] leading-relaxed">{summary.executiveNote.summary}</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{summary.executiveNote.detail}</p>
          </article>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-label="Risks and actions">
        <article className="surface-card p-6 space-y-4" aria-labelledby="executive-risks-heading">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Top-risici & hypoteser</p>
              <h2 id="executive-risks-heading" className="text-lg font-semibold text-[var(--color-text)]">
                Hurtig vurdering
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('hypotheses')}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-gold)]/60"
            >
              Hypoteser
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {summary.risks.length === 0 && renderEmptyState('Ingen kritiske risici lige nu.')}
          {summary.risks.length > 0 && (
            <ul className="space-y-4" role="list">
              {summary.risks.map(risk => (
                <li key={risk.id} className="rounded-xl border border-[var(--color-border)] p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold text-[var(--color-text)]">{risk.title}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">{risk.hypothesis}</p>
                    </div>
                    <span className={riskStatusTone[risk.status]}>{riskStatusLabels[risk.status]}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
                    <span className={impactToneClass[risk.impact]} aria-label="Impact badge">
                      Impact: {risk.impact.toUpperCase()}
                    </span>
                    <span className={likelihoodToneClass[risk.likelihood]} aria-label="Likelihood badge">
                      Sandsynlighed: {risk.likelihood.toUpperCase()}
                    </span>
                    <span className="ts24-badge">{risk.owner}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="surface-card p-6 space-y-4" aria-labelledby="executive-actions-heading">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Topprioriterede handlinger</p>
              <h2 id="executive-actions-heading" className="text-lg font-semibold text-[var(--color-text)]">
                Operativ status
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('actions')}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-gold)]/60"
            >
              Gå til Actions
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {summary.actions.length === 0 && renderEmptyState('Ingen prioriterede handlinger planlagt.')}
          {summary.actions.length > 0 && (
            <ul className="space-y-4" role="list">
              {summary.actions.map(action => (
                <li key={action.id} className="rounded-xl border border-[var(--color-border)] p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold text-[var(--color-text)]">{action.title}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">{action.description}</p>
                    </div>
                    <span className={actionStatusTone[action.status]}>{actionStatusLabels[action.status]}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="w-3 h-3" />
                      {action.dueLabel}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {action.owner}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3" aria-label="Trends and navigation">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:col-span-2">
          {summary.trends.map(trend => {
            const TrendIcon = trendDirectionIcon[trend.direction];
            return (
              <div key={trend.id} className="surface-card border border-dashed border-[var(--color-border)]/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{trend.label}</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--color-text)]">{trend.value}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className={`inline-flex items-center gap-1 font-mono ${trendDirectionTone[trend.direction]}`}>
                    <TrendIcon className="w-3 h-3" />
                    {trend.delta}
                  </span>
                  <span className="text-[var(--color-text-muted)]">{trend.helperText}</span>
                </div>
              </div>
            );
          })}
        </div>

        <article className="surface-card p-6 flex flex-col gap-4" aria-labelledby="executive-links-heading">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Videre navigation</p>
            <h2 id="executive-links-heading" className="text-lg font-semibold text-[var(--color-text)]">
              Dyk ned i detaljerne
            </h2>
          </div>
          <ul className="space-y-3">
            {summary.links.map(link => (
              <li key={link.id}>
                <button
                  type="button"
                  onClick={() => onNavigate?.(link.view)}
                  className="w-full rounded-lg border border-[var(--color-border)] px-4 py-3 text-left transition hover:border-[var(--color-gold)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--color-text)]">{link.label}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{link.description}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[var(--color-text-muted)]" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
};
