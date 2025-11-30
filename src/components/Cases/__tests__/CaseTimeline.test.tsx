import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CaseTimeline } from '../CaseTimeline';
import type { CaseEvent } from '../../../domains/events/caseEvents';
import i18n from '../../../i18n';

const buildEvent = (overrides: Partial<CaseEvent>): CaseEvent => ({
  id: overrides.id ?? 'evt-1',
  caseId: overrides.caseId ?? 'tsl',
  timestamp: overrides.timestamp ?? '2025-01-01T10:00:00.000Z',
  type: overrides.type ?? 'timeline',
  severity: overrides.severity ?? 'medium',
  title: overrides.title ?? 'Mocked event',
  description: overrides.description ?? 'Mocked description',
  source: overrides.source ?? 'unit-test',
  tags: overrides.tags ?? ['mock'],
  linkUrl: overrides.linkUrl,
});

describe('CaseTimeline', () => {
  it('renders loader state', () => {
    render(<CaseTimeline events={null} loading source="api" />);

    expect(
      screen.getByText(
        i18n.t('cases.timeline.loading', { defaultValue: 'Loading timeline…' }),
      ),
    ).toBeInTheDocument();
  });

  it('renders empty state when no events', () => {
    render(<CaseTimeline events={[]} loading={false} source="api" />);

    expect(screen.getByTestId('case-timeline-empty')).toBeInTheDocument();
    expect(
      screen.getByText(
        i18n.t('cases.timeline.noEvents', {
          defaultValue: 'No events recorded for this case yet.',
        }),
      ),
    ).toBeInTheDocument();
  });

  it('orders events descending by timestamp', () => {
    const events: CaseEvent[] = [
      buildEvent({ id: 'older', title: 'Older event', timestamp: '2025-01-01T09:00:00.000Z' }),
      buildEvent({ id: 'newer', title: 'Newer event', timestamp: '2025-01-02T10:00:00.000Z' }),
    ];

    render(<CaseTimeline events={events} loading={false} source="api" />);

    const titles = screen.getAllByTestId('case-timeline-event-title').map(node => node.textContent);
    expect(titles[0]).toBe('Newer event');
    expect(titles[1]).toBe('Older event');
  });
});
