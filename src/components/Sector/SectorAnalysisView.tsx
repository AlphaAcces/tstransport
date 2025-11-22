import React, { useMemo } from 'react';
import { LineChart, Line, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCaseData } from '../../context/DataContext';
import { Tag } from '../Shared/Tag';
import { SectorComparisonMetric } from '../../types';
import { useTranslation } from 'react-i18next';
import { useFormatters } from '../../domains/settings/hooks';

interface ComparisonTableRowProps {
    data: SectorComparisonMetric;
    formatMetricValue: (val: number | undefined, unit: SectorComparisonMetric['unit']) => string;
    metricLabel: string;
}

const ComparisonTableRow: React.FC<ComparisonTableRowProps> = ({ data, formatMetricValue, metricLabel }) => {
    const tslValue = data.tslValue ?? 0;
    const performanceColor = (tslValue > data.sectorValue && data.higherIsBetter) || (tslValue < data.sectorValue && !data.higherIsBetter) ? 'text-green-400' : 'text-red-400';

    return (
        <tr className="border-b border-border-dark/50 last:border-b-0">
            <td className="py-3 px-4 text-sm font-medium text-gray-200">{metricLabel}</td>
            <td className={`py-3 px-4 text-sm text-right font-mono ${performanceColor}`}>{formatMetricValue(tslValue, data.unit)}</td>
            <td className="py-3 px-4 text-sm text-right font-mono text-gray-400">{formatMetricValue(data.sectorValue, data.unit)}</td>
            <td className="py-3 px-4 text-sm text-right font-mono text-blue-400">{formatMetricValue(data.highPerformerValue, data.unit)}</td>
        </tr>
    );
};

export const SectorAnalysisView: React.FC = () => {
    const { sectorBenchmarkYearlyData, sectorComparisonData, sectorDriversData, macroRiskData } = useCaseData();
    const { t } = useTranslation();
    const { formatNumber } = useFormatters();

    const metricLabels = useMemo<Record<string, string>>(() => ({
        'EBIT-margin': t('sector.comparison.metrics.ebitMargin'),
        'Soliditet': t('sector.comparison.metrics.equityRatio'),
        'Resultat pr. medarbejder': t('sector.comparison.metrics.profitPerEmployee'),
    }), [t]);

    const driverLabels = useMemo<Record<string, { title: string; industry: string; impact: string }>>(() => ({
        'Chaufførmangel & Lønpres': {
            title: t('sector.drivers.items.driver1.title'),
            industry: t('sector.drivers.items.driver1.industry'),
            impact: t('sector.drivers.items.driver1.impact'),
        },
        'Stigende Omkostninger': {
            title: t('sector.drivers.items.driver2.title'),
            industry: t('sector.drivers.items.driver2.industry'),
            impact: t('sector.drivers.items.driver2.impact'),
        },
        'Overkapacitet & Prispres': {
            title: t('sector.drivers.items.driver3.title'),
            industry: t('sector.drivers.items.driver3.industry'),
            impact: t('sector.drivers.items.driver3.impact'),
        },
        'Digitalisering': {
            title: t('sector.drivers.items.driver4.title'),
            industry: t('sector.drivers.items.driver4.industry'),
            impact: t('sector.drivers.items.driver4.impact'),
        },
        'Bæredygtighed': {
            title: t('sector.drivers.items.driver5.title'),
            industry: t('sector.drivers.items.driver5.industry'),
            impact: t('sector.drivers.items.driver5.impact'),
        },
    }), [t]);

    const macroRiskLabels = useMemo<Record<string, { title: string; description: string }>>(() => ({
        'Markeds- & prispres': {
            title: t('sector.macroRisks.items.risk1.title'),
            description: t('sector.macroRisks.items.risk1.description'),
        },
        'Regulatoriske ændringer': {
            title: t('sector.macroRisks.items.risk2.title'),
            description: t('sector.macroRisks.items.risk2.description'),
        },
        'Makroøkonomisk klima': {
            title: t('sector.macroRisks.items.risk3.title'),
            description: t('sector.macroRisks.items.risk3.description'),
        },
        'Teknologisk disruption': {
            title: t('sector.macroRisks.items.risk4.title'),
            description: t('sector.macroRisks.items.risk4.description'),
        },
    }), [t]);

    const riskLevelLabels = useMemo(() => ({
        Høj: t('common.riskLevel.high'),
        Middel: t('common.riskLevel.medium'),
        Lav: t('common.riskLevel.low'),
    }), [t]);

    const formatMetricValue = (val: number | undefined, unit: SectorComparisonMetric['unit']) => {
        if (val === undefined) {
            return t('common.naShort');
        }
        if (unit === '%') {
            return `${formatNumber(val, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
        }
        return `${formatNumber(val / 1000, { maximumFractionDigits: 0 })} ${t('sector.comparison.valueSuffix.thousand')}`;
    };

    const analysisPoints = useMemo(() => ([
        {
            color: 'text-green-400',
            title: t('sector.analysis.points.overperformance.title'),
            body: t('sector.analysis.points.overperformance.body'),
        },
        {
            color: 'text-red-400',
            title: t('sector.analysis.points.productivity.title'),
            body: t('sector.analysis.points.productivity.body'),
        },
        {
            color: 'text-blue-400',
            title: t('sector.analysis.points.balance.title'),
            body: t('sector.analysis.points.balance.body'),
        },
        {
            color: 'text-yellow-500',
            title: t('sector.analysis.points.model.title'),
            body: t('sector.analysis.points.model.body'),
        },
    ]), [t]);

    const tslLabel = t('sector.comparison.columns.company');
    const sectorLabel = t('sector.comparison.columns.sector');
    const highPerformerLabel = t('sector.comparison.columns.highPerformer');

    return (
        <div className="space-y-8">
            <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
                <h2 className="text-xl font-bold text-gray-200 mb-4">{t('sector.comparison.heading')}</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-border-dark">
                                <th scope="col" className="py-2 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('sector.comparison.columns.metric')}</th>
                                <th scope="col" className="py-2 px-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{tslLabel}</th>
                                <th scope="col" className="py-2 px-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{sectorLabel}</th>
                                <th scope="col" className="py-2 px-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{highPerformerLabel}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sectorComparisonData.map(metric => (
                                <ComparisonTableRow
                                    key={metric.metric}
                                    data={metric}
                                    formatMetricValue={formatMetricValue}
                                    metricLabel={metricLabels[metric.metric] ?? metric.metric}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
                <h3 className="text-lg font-bold text-gray-200 mb-4">{t('sector.chart.heading')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={sectorBenchmarkYearlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                        <XAxis dataKey="year" stroke="#a0aec0" />
                        <YAxis tickFormatter={(v) => `${formatNumber(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`} stroke="#a0aec0" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #2d3748' }}
                            formatter={(value: number, name: string) => [`${formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`, name]}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="ebitMarginTSL" name={t('sector.chart.series.company')} stroke="#00cc66" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="ebitMarginSector" name={t('sector.chart.series.sector')} stroke="#718096" strokeWidth={2} strokeDasharray="5 5" dot={false}/>
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
                <h2 className="text-xl font-bold text-gray-200 mb-4">{t('sector.drivers.heading')}</h2>
                <div className="space-y-4">
                    {sectorDriversData.map((driver) => {
                        const labels = driverLabels[driver.driver] ?? {
                            title: driver.driver,
                            industry: driver.industrySituation,
                            impact: driver.impactOnTSL,
                        };
                        const translatedRisk = riskLevelLabels[driver.risk as keyof typeof riskLevelLabels] ?? driver.risk;
                        return (
                            <div key={driver.driver} className="border-b border-border-dark/50 pb-4 last:border-b-0 last:pb-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-md font-semibold text-gray-200">{labels.title}</h3>
                                    <Tag label={`${t('sector.drivers.riskLabel')}: ${translatedRisk}`} color={driver.risk === 'Høj' ? 'red' : driver.risk === 'Middel' ? 'yellow' : 'blue'} />
                                </div>
                                <p className="text-sm text-gray-400 mt-1">{labels.industry}</p>
                                <p className="text-sm text-yellow-400/80 mt-2 italic">{t('sector.drivers.impactPrefix', { company: t('common.companies.tsl.short') })} {labels.impact}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
                <h2 className="text-xl font-bold text-gray-200 mb-4">{t('sector.macroRisks.heading')}</h2>
                <div className="space-y-4">
                    {macroRiskData.map((risk) => {
                        const labels = macroRiskLabels[risk.title] ?? { title: risk.title, description: risk.description };
                        const translatedRisk = riskLevelLabels[risk.level as keyof typeof riskLevelLabels] ?? risk.level;
                        return (
                            <div key={risk.id} className="border-b border-border-dark/50 pb-4 last:border-b-0 last:pb-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-md font-semibold text-gray-200">{labels.title}</h3>
                                    <Tag label={`${t('sector.macroRisks.riskLabel')}: ${translatedRisk}`} color={risk.level === 'Høj' ? 'red' : risk.level === 'Middel' ? 'yellow' : 'blue'} />
                                </div>
                                <p className="text-sm text-gray-400 mt-1">{labels.description}</p>
                            </div>
                        );
                    })}
                    {macroRiskData.length === 0 && <p className="text-sm text-gray-500">{t('sector.macroRisks.emptyState')}</p>}
                </div>
            </div>

            <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
                <h3 className="text-lg font-bold text-gray-200 mb-2">{t('sector.analysis.heading')}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    {analysisPoints.map(point => (
                        <li key={point.title}>
                            <span className={`font-semibold ${point.color}`}>{point.title}</span> {point.body}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
