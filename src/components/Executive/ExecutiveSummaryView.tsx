import React, { Suspense, lazy, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Briefcase,
    Activity,
    ShieldAlert,
    CalendarClock,
    AlertTriangle,
    ArrowUpRight,
    ArrowRight,
    TrendingDown,
    TrendingUp,
    Landmark
} from 'lucide-react';
import { SectionHeading } from '../Shared/SectionHeading';
import { useCaseData, useActiveSubject } from '../../context/DataContext';
import { Tag } from '../Shared/Tag';
import { View, ExecutiveFinancialAlert } from '../../types';
import { ExecutiveCard } from './ExecutiveCard';
import { useFormatters } from '../../domains/settings/hooks';

const ExecutiveTrendChart = lazy(() => import('./ExecutiveTrendChart').then(module => ({ default: module.ExecutiveTrendChart })));

const ChartSkeleton: React.FC = () => (
    <div className="h-full w-full rounded bg-gray-900/30 animate-pulse" />
);

interface ExecutiveSummaryViewProps {
    onNavigate?: (view: View) => void;
}

const riskLevelColor: Record<'KRITISK' | 'HØJ' | 'MODERAT' | 'LAV' | 'N/A', 'red' | 'yellow' | 'blue' | 'green' | 'gray'> = {
    KRITISK: 'red',
    HØJ: 'yellow',
    MODERAT: 'blue',
    LAV: 'green',
    'N/A': 'gray',
};

export const ExecutiveSummaryView: React.FC<ExecutiveSummaryViewProps> = ({ onNavigate }) => {
    const { t } = useTranslation();
    const { formatCurrency, formatNumber, formatDate, formatPercent } = useFormatters();
    const millionFormatter = useCallback((value: number | null) => {
        if (typeof value !== 'number') {
            return t('executive.placeholder.unavailable');
        }
        const millions = value / 1_000_000;
        return t('executive.units.million', {
            value: formatNumber(millions, { maximumFractionDigits: 1, minimumFractionDigits: 1 }),
        });
    }, [formatNumber, t]);

    const formatTrendValue = useCallback(
        (value: number | null) => (typeof value === 'number'
            ? t('executive.units.million', {
                value: formatNumber(value, { maximumFractionDigits: 1, minimumFractionDigits: 1 }),
            })
            : t('executive.placeholder.unavailable')),
        [formatNumber, t],
    );

    const formatAlertValue = useCallback(
        (alertValue: number, unit: 'DKK' | 'days') => (
            unit === 'DKK'
                ? formatCurrency(alertValue, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                })
                : t('executive.units.days', { count: alertValue })
        ),
        [formatCurrency, t],
    );

    const formatDateValue = useCallback((iso: string) => formatDate(iso), [formatDate]);

    const formatCurrencyValue = useCallback((value: number) => formatCurrency(value, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }), [formatCurrency]);

    const translateFinancialAlert = useCallback((alert: ExecutiveFinancialAlert) => ({
        label: t(`executive.alert.${alert.id}.label`, { defaultValue: alert.label }),
        description: t(`executive.alert.${alert.id}.description`, { defaultValue: alert.description }),
    }), [t]);
    const { executiveSummary } = useCaseData();
    const { financial, risk, actions } = executiveSummary;
    const subject = useActiveSubject();
    const [isExporting, setIsExporting] = useState(false);
    const grossChartRef = useRef<HTMLDivElement | null>(null);
    const profitChartRef = useRef<HTMLDivElement | null>(null);
    const riskCardRef = useRef<HTMLDivElement | null>(null);

    const formatRedFlagValue = useCallback((value: number | null, unit: 'DKK' | 'days') => {
        if (value === null) {
            return t('executive.placeholder.unavailable');
        }
        return unit === 'DKK'
            ? formatCurrencyValue(value)
            : t('executive.units.days', { count: value });
    }, [formatCurrencyValue, t]);

    const handleExport = useCallback(async () => {
        try {
            setIsExporting(true);
            const [{ generateExecutiveReportPdf }, html2canvasModule, executiveModule] = await Promise.all([
                import('../../pdf/executiveReport.ts'),
                import('html2canvas'),
                import('../../data/executive'),
            ]);
            const html2canvas = html2canvasModule.default;
            const exportPayload = executiveModule.createExecutiveExportPayload(subject, executiveSummary);
            const chartNodes = [
                { ref: grossChartRef, title: t('executive.chart.grossTrend') },
                { ref: profitChartRef, title: t('executive.chart.profitTrend') },
                { ref: riskCardRef, title: t('executive.risk.title') },
            ];

            const charts = await Promise.all(
                chartNodes.map(async ({ ref, title }) => {
                    const element = ref.current;
                    if (!element) {
                        return null;
                    }

                    const canvas = await html2canvas(element, {
                        backgroundColor: '#0F172A',
                        scale: Math.max(3, window.devicePixelRatio || 1),
                    });
                    return {
                        title,
                        dataUrl: canvas.toDataURL('image/png'),
                        width: canvas.width,
                        height: canvas.height,
                    };
                }),
            );

            await generateExecutiveReportPdf(exportPayload, {
                charts: charts.filter((chart): chart is { title: string; dataUrl: string; width: number; height: number } => Boolean(chart)),
            });
        } catch (error) {
            console.error('Executive export failed', error);
        } finally {
            setIsExporting(false);
        }
    }, [executiveSummary, subject, t]);

    const grossProfitTrend = useMemo(
        () => financial.trendGrossProfit.map(point => ({
            year: point.year,
            value: Number((point.value / 1_000_000).toFixed(1)),
        })),
        [financial.trendGrossProfit],
    );

    const netResultTrend = useMemo(
        () => financial.trendProfitAfterTax.map(point => ({
            year: point.year,
            value: Number((point.value / 1_000_000).toFixed(1)),
        })),
        [financial.trendProfitAfterTax],
    );

    const riskCategoryLabels = useMemo(() => ({
        'Legal/Compliance': t('executive.risk.category.legalCompliance'),
        Governance: t('executive.risk.category.governance'),
        'Sector/Operations': t('executive.risk.category.sectorOperations'),
        Financial: t('executive.risk.category.financial'),
        'SOCMINT/Reputation': t('executive.risk.category.reputation'),
    }), [t]);

    const riskLevelLabels = useMemo(() => ({
        KRITISK: t('executive.risk.level.critical'),
        HØJ: t('executive.risk.level.high'),
        MODERAT: t('executive.risk.level.medium'),
        LAV: t('executive.risk.level.low'),
        'N/A': t('executive.risk.level.na'),
    }), [t]);

    const priorityLabels = useMemo(() => ({
        Påkrævet: t('executive.priority.required'),
        Høj: t('executive.priority.high'),
        Middel: t('executive.priority.medium'),
    }), [t]);

    const horizonLabels = useMemo(() => ({
        '0-30 dage': t('executive.horizon.0_30'),
        '1-3 mdr': t('executive.horizon.1_3'),
        '3-12 mdr': t('executive.horizon.3_12'),
    }), [t]);

    const riskScores = useMemo(
        () => risk.riskScores.map(score => ({
            ...score,
            label: riskCategoryLabels[score.category] ?? score.category,
            justificationLabel: score.justification.startsWith('risk.') ? t(score.justification) : score.justification,
        })),
        [risk.riskScores, riskCategoryLabels, t]
    );

    const latestGross = financial.grossProfit;
    const latestProfit = financial.profitAfterTax;
    const yoyGrossChange = financial.yoyGrossChange;
    const yoyProfitChange = financial.yoyProfitChange;
    const dsoValue = financial.dso;

    const formatMillionsOrDash = (value: number | null) => millionFormatter(value);

    const formatChangeLabel = useCallback((value: number) => {
        const formattedPercent = formatPercent(value / 100, {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1,
            signDisplay: 'exceptZero',
        });
        return `${formattedPercent} ${t('executive.vsLastYear')}`;
    }, [formatPercent, t]);

    return (
        <div className="space-y-8">
            <SectionHeading
                icon={<Briefcase className="w-5 h-5 text-gray-400" />}
                eyebrow={t('executive.eyebrow')}
                title={t('executive.title')}
                subtitle={t('executive.subtitle')}
                actions={[
                    <button
                        key="export"
                        onClick={handleExport}
                        disabled={isExporting}
                        className="px-3 py-1.5 text-xs font-medium rounded-md border border-accent-blue/40 bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        {isExporting ? t('executive.exporting') : t('executive.export')}
                    </button>,
                    <button
                        key="timeline"
                        onClick={() => onNavigate?.('timeline')}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-accent-green/20 text-accent-green border border-accent-green/30 hover:bg-accent-green/30 transition-colors"
                    >
                        {t('executive.openTimeline')}
                    </button>,
                ]}
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="h-full">
                    <ExecutiveCard
                    icon={<Activity className="w-5 h-5" />}
                    title={t('executive.card.financial.title')}
                    subtitle={t('executive.card.financial.subtitle')}
                    tone={financial.alerts.length > 0 ? 'warning' : 'neutral'}
                    meta={typeof dsoValue === 'number' ? <Tag label={t('executive.metric.dsoTag', { value: dsoValue, days: t('executive.units.days', { count: dsoValue }) })} color="yellow" /> : undefined}
                    delay={0}
                >
                    {(latestGross !== null || latestProfit !== null) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-900/40 border border-border-dark/50 rounded-lg p-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{t('executive.metric.grossProfit')}</p>
                                <p className="text-2xl font-semibold text-gray-100 mt-1">{formatMillionsOrDash(latestGross)}</p>
                                {yoyGrossChange !== null && (
                                    <span className={`inline-flex items-center text-xs font-medium mt-2 ${yoyGrossChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {yoyGrossChange >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                                        {formatChangeLabel(yoyGrossChange)}
                                    </span>
                                )}
                            </div>
                            <div className="bg-gray-900/40 border border-border-dark/50 rounded-lg p-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{t('executive.metric.profitAfterTax')}</p>
                                <p className="text-2xl font-semibold text-gray-100 mt-1">{formatMillionsOrDash(latestProfit)}</p>
                                {yoyProfitChange !== null && (
                                    <span className={`inline-flex items-center text-xs font-medium mt-2 ${yoyProfitChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {yoyProfitChange >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                                        {formatChangeLabel(yoyProfitChange)}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div ref={grossChartRef} className="h-32 bg-gray-900/40 border border-border-dark/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 uppercase tracking-[0.18em] mb-2">{t('executive.chart.grossTrend')}</p>
                            <Suspense fallback={<ChartSkeleton />}>
                                    <ExecutiveTrendChart
                                    data={grossProfitTrend}
                                    lineColor="#00cc66"
                                    highlightColor="#22c55e"
                                    valueFormatter={formatTrendValue}
                                />
                            </Suspense>
                        </div>
                        <div ref={profitChartRef} className="h-32 bg-gray-900/40 border border-border-dark/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 uppercase tracking-[0.18em] mb-2">{t('executive.chart.profitTrend')}</p>
                            <Suspense fallback={<ChartSkeleton />}>
                                    <ExecutiveTrendChart
                                    data={netResultTrend}
                                    lineColor="#38bdf8"
                                    highlightColor="#60a5fa"
                                    valueFormatter={formatTrendValue}
                                />
                            </Suspense>
                        </div>
                    </div>

                    {financial.alerts.length > 0 && (
                        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 text-xs text-red-100">
                            <div className="flex items-center gap-2 font-semibold text-red-200 mb-2">
                                <AlertTriangle className="w-4 h-4" />
                                {t('executive.criticalObservations')}
                            </div>
                            <ul className="space-y-2">
                                {financial.alerts.map(alert => {
                                    const localized = translateFinancialAlert(alert);
                                    return (
                                        <li key={alert.id} className="flex items-start gap-2 leading-relaxed">
                                            <span className="mt-0.5"><ArrowUpRight className="w-3 h-3" /></span>
                                            <span>{`${localized.label}: ${formatAlertValue(alert.value, alert.unit)}`} – {localized.description}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                    </ExecutiveCard>
                </div>

                <div ref={riskCardRef} className="h-full">
                    <ExecutiveCard
                    icon={<ShieldAlert className="w-5 h-5" />}
                    title={t('executive.risk.title')}
                    subtitle={t('executive.risk.subtitle')}
                    tone="critical"
                    meta={<Tag label={t('executive.tag.redFlags')} color="red" />}
                    delay={1}
                >
                    <div className="bg-gray-900/40 border border-border-dark/50 rounded-lg p-4 space-y-3 text-sm text-gray-300">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <div>
                                <p className="font-semibold text-gray-100">{t('executive.risk.taxCase')}</p>
                                <p className="text-xs text-gray-400">{risk.taxCaseExposure ? `${t('executive.risk.exposure')} ${formatCurrencyValue(risk.taxCaseExposure)} – ${t('executive.risk.monitor')}` : t('executive.risk.noActiveCase')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Landmark className="w-4 h-4 text-yellow-400" />
                            <div>
                                <p className="font-semibold text-gray-100">{t('executive.risk.complianceNote')}</p>
                                <p className="text-xs text-gray-400">{risk.complianceIssue}</p>
                            </div>
                        </div>
                        {risk.redFlags.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-[0.18em] mb-1">{t('executive.redFlags')}</p>
                                <ul className="space-y-2 text-xs text-gray-400 list-disc list-inside">
                                    {risk.redFlags.map(flag => {
                                        const label = t(`executive.alert.${flag.id}.label`, { defaultValue: flag.id });
                                        const description = t(`executive.alert.${flag.id}.description`, { defaultValue: '' });
                                        return (
                                            <li key={flag.id} className="space-y-1">
                                                <span className="text-gray-200">{label}: {formatRedFlagValue(flag.value, flag.unit)}</span>
                                                {description && <span className="block text-[11px] text-gray-500">{description}</span>}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>

                    {riskScores.length > 0 && (
                        <div className="grid grid-cols-1 gap-3">
                            {riskScores.map(score => (
                                <div key={score.category} className="flex items-start justify-between bg-gray-900/40 border border-border-dark/50 rounded-lg p-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-100">{score.label}</p>
                                        <p className="text-xs text-gray-400 mt-1">{score.justificationLabel ?? score.justification}</p>
                                    </div>
                                    <Tag label={riskLevelLabels[score.riskLevel] ?? score.riskLevel} color={riskLevelColor[score.riskLevel]} />
                                </div>
                            ))}
                        </div>
                    )}
                    </ExecutiveCard>
                </div>

                <div className="h-full">
                    <ExecutiveCard
                    icon={<CalendarClock className="w-5 h-5" />}
                    title={t('executive.card.actions.title')}
                    subtitle={t('executive.card.actions.subtitle')}
                    tone="warning"
                    meta={
                        <button
                            onClick={() => onNavigate?.('actions')}
                            className="text-xs text-accent-green hover:text-accent-green/80 inline-flex items-center gap-1"
                        >
                            {t('executive.actions.viewActionables')} <ArrowRight className="w-3 h-3" />
                        </button>
                    }
                    delay={2}
                >
                    <div className="space-y-4 text-sm">
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-2">{t('executive.upcomingDeadlines')}</p>
                            <ul className="space-y-2">
                                {actions.upcomingDeadlines.length === 0 && <li className="text-gray-500 text-xs">{t('executive.noUpcomingDeadlines')}</li>}
                                {actions.upcomingDeadlines.map(item => (
                                    <li key={item.id} className="bg-gray-900/40 border border-border-dark/40 rounded-lg p-3 flex flex-col">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-200 font-medium">{item.title}</span>
                                            <Tag label={priorityLabels[item.priority] ?? item.priority} color={item.priority === 'Påkrævet' ? 'red' : 'yellow'} />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{t('executive.action.responsibility')}: {item.ownerRole ?? t('executive.notSpecified')} · {t('executive.action.horizon')}: {item.timeHorizon ? horizonLabels[item.timeHorizon] ?? item.timeHorizon : t('executive.notApplicable')}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-2">{t('executive.criticalEvents')}</p>
                            <ul className="space-y-2">
                                {actions.criticalEvents.map(event => (
                                    <li key={`${event.title}-${event.date}`} className="bg-gray-900/40 border border-border-dark/40 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-200 font-medium">{event.title}</span>
                                            <span className="text-[11px] font-mono text-red-300">{formatDateValue(event.date)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-2">{t('executive.boardActionables')}</p>
                            <ul className="space-y-2">
                                {actions.boardActionables.map(action => (
                                    <li key={action.id} className="bg-gray-900/40 border border-border-dark/40 rounded-lg p-3 flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-200">{action.title}</p>
                                            <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Tag label={priorityLabels[action.priority] ?? action.priority} color={action.priority === 'Påkrævet' ? 'red' : 'yellow'} />
                                            {action.timeHorizon && <Tag label={horizonLabels[action.timeHorizon] ?? action.timeHorizon} color="blue" />}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {actions.upcomingEvents.length > 0 && (
                        <div className="bg-gray-900/40 border border-border-dark/50 rounded-lg p-3 text-xs text-gray-400">
                            <p className="uppercase tracking-[0.18em] text-gray-500 mb-2">{t('executive.nextKeyEvents')}</p>
                            <ul className="space-y-2">
                                {actions.upcomingEvents.map(event => (
                                    <li key={`upcoming-${event.title}-${event.date}`} className="flex items-center justify-between">
                                        <span className="text-gray-300">{event.title}</span>
                                        <span className="font-mono text-gray-500">{formatDateValue(event.date)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    </ExecutiveCard>
                </div>
            </div>
        </div>
    );
};
