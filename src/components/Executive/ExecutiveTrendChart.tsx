import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface ExecutiveTrendChartProps {
  data: Array<{ year: number | string; value: number | null }>;
  lineColor: string;
  valueFormatter: (value: number | null) => string;
  highlightColor?: string;
}

/**
 * Lightweight wrapper around the Recharts line chart so we can lazy load the heavy graph library.
 */
export const ExecutiveTrendChart: React.FC<ExecutiveTrendChartProps> = ({
  data,
  lineColor,
  valueFormatter,
  highlightColor,
}) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
      <Tooltip
        content={({ active, payload }) => {
          if (!active || !payload?.length) {
            return null;
          }

          const point = payload[0];
          const value = typeof point.value === 'number' ? point.value : null;

          return (
            <div className="bg-gray-900 border border-border-dark/60 px-3 py-2 text-xs rounded">
              <p className="text-gray-300">{point.payload?.year}</p>
              <p className="font-semibold" style={{ color: highlightColor ?? lineColor }}>
                {valueFormatter(value)}
              </p>
            </div>
          );
        }}
      />
      <Line type="monotone" dataKey="value" stroke={lineColor} strokeWidth={2} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);
