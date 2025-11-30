import type { CaseData, ActionItem, TimelineEvent } from '../../types';

export type CaseEventSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface CaseEvent {
  id: string;
  caseId: string;
  timestamp: string;
  type: string;
  severity: CaseEventSeverity;
  title: string;
  description?: string;
  source?: string;
  tags?: string[];
  linkUrl?: string;
}

const ACTION_PRIORITY_SEVERITY: Record<ActionItem['priority'], CaseEventSeverity> = {
  'Påkrævet': 'critical',
  'Høj': 'high',
  'Middel': 'medium',
};

const DEFAULT_ACTION_TYPE = 'action';
const DEFAULT_TIMELINE_TYPE = 'timeline';

const toIsoTimestamp = (value: string, fallbackHour = 12): string => {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  const fallback = new Date();
  fallback.setUTCHours(fallbackHour, 0, 0, 0);
  return fallback.toISOString();
};

const resolveSeverityFromTimeline = (event: TimelineEvent): CaseEventSeverity => {
  if (event.isCritical) {
    return 'high';
  }
  return 'medium';
};

const resolveSeverityFromAction = (action: ActionItem): CaseEventSeverity => {
  return ACTION_PRIORITY_SEVERITY[action.priority] ?? 'medium';
};

const sortEventsDesc = (a: CaseEvent, b: CaseEvent) => {
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
};

interface DeriveOptions {
  caseId?: string;
}

export function deriveEventsFromCaseData(caseData: CaseData, options: DeriveOptions = {}): CaseEvent[] {
  const caseId = options.caseId ?? caseData.tenantId ?? 'unknown';

  const timelineEvents: CaseEvent[] = (caseData.timelineData ?? []).map((event, index) => ({
    id: `timeline-${caseId}-${index}`,
    caseId,
    timestamp: toIsoTimestamp(event.date),
    type: event.type || DEFAULT_TIMELINE_TYPE,
    severity: resolveSeverityFromTimeline(event),
    title: event.title,
    description: event.description,
    source: event.source,
    tags: event.linkedViews,
    linkUrl: event.sourceUrl,
  }));

  const latestTimelineTimestamp = timelineEvents.reduce((max, event) => {
    const ts = new Date(event.timestamp).getTime();
    return ts > max ? ts : max;
  }, 0);

  const actionEvents: CaseEvent[] = (caseData.actionsData ?? []).map((action, index) => {
    const syntheticTimestamp = latestTimelineTimestamp
      ? new Date(latestTimelineTimestamp + (index + 1) * 60 * 60 * 1000).toISOString()
      : new Date(Date.UTC(2025, 0, 1, index % 24, 0, 0)).toISOString();

    return {
      id: `action-${caseId}-${action.id}`,
      caseId,
      timestamp: syntheticTimestamp,
      type: DEFAULT_ACTION_TYPE,
      severity: resolveSeverityFromAction(action),
      title: action.title,
      description: action.description,
      source: action.sourceId,
      tags: [action.category, ...(action.linkedRisks ?? [])],
      linkUrl: action.sourceUrl,
    };
  });

  return [...timelineEvents, ...actionEvents].sort(sortEventsDesc);
}
