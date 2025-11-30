import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Clock3, Loader2 } from 'lucide-react';
import type { CaseEvent } from '../../domains/events/caseEvents';

export type CaseTimelineProps = {
  events: CaseEvent[] | null;
  loading: boolean;
  source?: 'api' | 'derived';
};

type TimelineGroup = {
  dateKey: string;
  label: string;
  items: CaseEvent[];
};

const severityStyles: Record<CaseEvent['severity'], string> = {
  low: 'text-emerald-200 border-emerald-400/20 bg-emerald-500/10',
  medium: 'text-amber-100 border-amber-400/20 bg-amber-500/10',
  high: 'text-red-100 border-red-400/30 bg-red-500/10',
  critical: 'text-red-50 border-red-500/50 bg-red-600/15',
};

const sourceBadgeStyles: Record<'api' | 'derived', string> = {
  api: 'text-emerald-200 border-emerald-400/50 bg-emerald-500/10',
  derived: 'text-amber-200 border-amber-400/40 bg-amber-500/10',
};

const startOfDayUtc = (date: Date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const formatDateHeading = (date: Date, translate: (key: string, options?: Record<string, unknown>) => string, locale: string) => {
  const today = new Date();
  const diffDays = Math.floor((startOfDayUtc(today) - startOfDayUtc(date)) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    return translate('cases.timeline.section.today', { defaultValue: 'Today' });
  }
  if (diffDays === 1) {
    return translate('cases.timeline.section.yesterday', { defaultValue: 'Yesterday' });
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const formatTimeLabel = (timestamp: string, locale: string) => {
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return timestamp;
  }
};

export const CaseTimeline: React.FC<CaseTimelineProps> = ({ events, loading, source = 'api' }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';

  const groupedEvents = useMemo<TimelineGroup[]>(() => {
    if (!events || events.length === 0) {
      return [];
    }

    const sorted = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const groups = new Map<string, TimelineGroup>();

    sorted.forEach((event) => {
      const eventDate = new Date(event.timestamp);
      const key = eventDate.toISOString().slice(0, 10);
      if (!groups.has(key)) {
        groups.set(key, {
          dateKey: key,
          label: formatDateHeading(eventDate, t, locale),
          items: [],
        });
      }
      groups.get(key)!.items.push(event);
    });

    return Array.from(groups.values());
  }, [events, locale, t]);

  const sourceBadge = sourceBadgeStyles[source] || sourceBadgeStyles.api;

  return (
    <section className="surface-card p-6 space-y-4" aria-live="polite" aria-busy={loading}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
            {t('cases.timeline.title', { defaultValue: 'Case timeline' })}
          </p>
          <h2 className="text-lg font-semibold text-[var(--color-text)] flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
            {t('cases.timeline.subtitle', { defaultValue: 'Latest activity' })}
          </h2>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${sourceBadge}`}>
          {source === 'api'
            ? t('cases.timeline.source.live', { defaultValue: 'Live feed' })
            : t('cases.timeline.source.derived', { defaultValue: 'Offline snapshot' })}
        </span>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[var(--color-text-muted)]" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t('cases.timeline.loading', { defaultValue: 'Loading timeline…' })}
        </div>
      )}

      {!loading && groupedEvents.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 bg-black/30 p-6 text-center text-sm text-[var(--color-text-muted)]" data-testid="case-timeline-empty">
          {t('cases.timeline.noEvents', { defaultValue: 'No events recorded for this case yet.' })}
        </div>
      )}

      {!loading && groupedEvents.length > 0 && (
        <div className="space-y-6">
          {groupedEvents.map(group => (
            <div key={group.dateKey} className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <span className="h-[1px] flex-1 bg-white/10" aria-hidden="true" />
                <span>{group.label}</span>
                <span className="h-[1px] flex-1 bg-white/10" aria-hidden="true" />
              </div>
              <ul className="space-y-4" role="list">
                {group.items.map(event => (
                  <li key={event.id} className="flex gap-4" data-testid="case-timeline-event">
                    <div className="flex flex-col items-center">
                      <span className="h-3 w-3 rounded-full bg-[var(--color-gold)]" aria-hidden="true" />
                      <span className="block w-px flex-1 bg-gradient-to-b from-[var(--color-gold)]/60 to-transparent" aria-hidden="true" />
                    </div>
                    <article className="flex-1 rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${severityStyles[event.severity]}`}>
                          {t(`cases.timeline.severity.${event.severity}`, { defaultValue: event.severity })}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                          <Clock3 className="h-3 w-3" aria-hidden="true" />
                          {formatTimeLabel(event.timestamp, locale)}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-semibold text-[var(--color-text)]" data-testid="case-timeline-event-title">
                          {event.title}
                        </p>
                        {event.description && (
                          <p className="text-sm text-[var(--color-text-muted)]">{event.description}</p>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        {event.type && <span className="ts24-badge ts24-badge--neutral">{event.type}</span>}
                        {event.source && <span className="ts24-badge">{event.source}</span>}
                        {event.tags?.map(tag => (
                          <span key={tag} className="rounded-full border border-white/10 px-2 py-0.5">
                            {tag}
                          </span>
                        ))}
                        {event.linkUrl && (
                          <a
                            href={event.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--color-gold)] underline decoration-dotted underline-offset-4"
                          >
                            {t('cases.timeline.openLink', { defaultValue: 'Open source' })}
                          </a>
                        )}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default CaseTimeline;
