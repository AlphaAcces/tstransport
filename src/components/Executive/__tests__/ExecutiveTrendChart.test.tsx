import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ExecutiveTrendChart } from '../ExecutiveTrendChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Tooltip: ({ content }: { content: (args: any) => React.ReactNode }) => (
    <div data-testid="tooltip">
      {content({ active: true, payload: [{ value: 12.3, payload: { year: 2024 } }] })}
    </div>
  ),
  Line: ({ stroke }: { stroke: string }) => <div data-testid="line" data-stroke={stroke} />,
}));

describe('ExecutiveTrendChart', () => {
  it('renders tooltip content with formatted values and highlight color', () => {
    render(
      <ExecutiveTrendChart
        data={[{ year: 2024, value: 12.3 }]}
        lineColor="#00cc66"
        highlightColor="#22c55e"
        valueFormatter={value => (typeof value === 'number' ? `${value.toFixed(1)} mio. kr.` : '—')}
      />,
    );

    expect(screen.getByTestId('responsive')).toBeInTheDocument();
    expect(screen.getByTestId('line')).toHaveAttribute('data-stroke', '#00cc66');
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('12.3 mio. kr.')).toBeInTheDocument();
  });
});
