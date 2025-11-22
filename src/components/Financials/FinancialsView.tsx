import React from 'react';
import { AreaChart, Area, BarChart, Bar, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCaseData } from '../../context/DataContext';
import { useTranslation } from 'react-i18next';
import { useFormatters } from '../../domains/settings/hooks';

const ChartCard: React.FC<{ title: string; children: React.ReactElement; }> = ({ title, children }) => (
    <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
        <h3 className="text-lg font-bold text-gray-200 mb-4">{title}</h3>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                {children}
            </ResponsiveContainer>
        </div>
    </div>
);

export const FinancialsView: React.FC = () => {
  const { financialData } = useCaseData();
  const { t } = useTranslation();
  const { formatCurrency, formatNumber, formatCompactNumber, formatPercent } = useFormatters();

  const thousandAbbrev = t('financials.units.thousandAbbrev');
  const naLabel = t('common.naShort');

  const formatCompactValue = (value: number) => {
    if (!Number.isFinite(value)) return naLabel;
    if (Math.abs(value) >= 1000) {
      return formatCompactNumber(value, { maximumFractionDigits: 1 });
    }
    return formatNumber(Math.round(value), { maximumFractionDigits: 0 });
  };

  const formatCurrencyValue = (value: number) => formatCurrency(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const formatNumberValue = (value: number) => formatNumber(value, { maximumFractionDigits: 0 });
  const formatPercentValue = (value: number) => formatPercent(value / 100, { maximumFractionDigits: 1 });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-200 mb-4">{t('financials.table.title')}</h2>
        <div className="bg-component-dark border border-border-dark rounded-lg overflow-x-auto scrollbar-hidden">
          <table className="min-w-full divide-y divide-border-dark">
            <thead className="bg-gray-800/50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('financials.table.headers.year')}</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{t('financials.table.headers.grossProfit')}</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{t('financials.table.headers.ebit')}</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{t('financials.table.headers.netResult')}</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{t('financials.table.headers.equity')}</th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">{t('financials.table.headers.staff')}</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{t('financials.table.headers.ebitMargin')}</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{t('financials.table.headers.netMargin')}</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{t('financials.table.headers.resultPerEmployee')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark font-mono">
              {financialData.map((d) => (
                <tr key={d.year} className="hover:bg-gray-800/40">
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{d.year}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-gray-300">{formatNumberValue(d.revenueOrGrossProfit)}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-orange-400">{d.ebit ? formatNumberValue(d.ebit) : naLabel}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-green-400">{formatNumberValue(d.profitAfterTax)}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-indigo-400">{formatNumberValue(d.equityEndOfYear)}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-300">{d.staffCount}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-orange-400">{d.ebitMargin ? formatPercentValue(d.ebitMargin) : naLabel}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-green-400">{d.netMargin ? formatPercentValue(d.netMargin) : naLabel}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-gray-300">{d.profitPerEmployee ? formatNumberValue(d.profitPerEmployee) : naLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-200 mb-4">{t('financials.charts.sectionTitle')}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title={t('financials.charts.result.title')}>
            <AreaChart data={financialData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="year" stroke="#a0aec0" />
              <YAxis tickFormatter={formatCompactValue} stroke="#a0aec0" />
              <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #2d3748' }} formatter={(value: number) => formatCurrencyValue(value)} />
              <Legend />
              <Area type="monotone" dataKey="revenueOrGrossProfit" name={t('financials.charts.result.series.grossProfit')} stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="ebit" name={t('financials.charts.result.series.ebit')} stroke="#dd6b20" fill="#dd6b20" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="profitAfterTax" name={t('financials.charts.result.series.netResult')} stroke="#00cc66" fill="#00cc66" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ChartCard>

          <ChartCard title={t('financials.charts.equity.title')}>
            <AreaChart data={financialData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="year" stroke="#a0aec0" />
              <YAxis yAxisId="left" tickFormatter={formatCompactValue} stroke="#a0aec0" />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value: number) => formatPercentValue(value)} stroke="#a0aec0" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #2d3748' }}
                formatter={(value: number, _name: string, entry) => (entry && (entry as { dataKey?: string }).dataKey === 'solidity' ? formatPercentValue(value) : formatCurrencyValue(value))}
              />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="equityEndOfYear" name={t('financials.charts.equity.series.equity')} stroke="#818cf8" fill="#818cf8" fillOpacity={0.1} strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="solidity" name={t('financials.charts.equity.series.solidity')} stroke="#d69e2e" strokeWidth={2} dot={{ r: 4 }} />
            </AreaChart>
          </ChartCard>

          <div className="lg:col-span-2">
            <ChartCard title={t('financials.charts.productivity.title')}>
              <BarChart data={financialData.filter(d => d.staffCount > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis dataKey="year" stroke="#a0aec0" />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1000)} ${thousandAbbrev}`} stroke="#a0aec0" />
                <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #2d3748' }} formatter={(value: number) => formatCurrencyValue(value)} />
                <Legend />
                <Bar dataKey="profitPerEmployee" name={t('financials.charts.productivity.series.profitPerEmployee')} fill="#dd6b20" />
              </BarChart>
            </ChartCard>
          </div>
        </div>
      </div>

      <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
        <h3 className="text-lg font-bold text-gray-200 mb-2">{t('financials.analysis.title')}</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
          <li><span className="font-semibold text-orange-400">{t('financials.analysis.points.marginPressure.title')}</span> {t('financials.analysis.points.marginPressure.body')}</li>
          <li><span className="font-semibold text-red-400">{t('financials.analysis.points.productivityDrop.title')}</span> {t('financials.analysis.points.productivityDrop.body')}</li>
          <li><span className="font-semibold text-green-400">{t('financials.analysis.points.capitalization.title')}</span> {t('financials.analysis.points.capitalization.body')}</li>
          <li><span className="font-semibold text-yellow-500">{t('financials.analysis.points.liquidityRisk.title')}</span> {t('financials.analysis.points.liquidityRisk.body')}</li>
        </ul>
      </div>
    </div>
  );
};
