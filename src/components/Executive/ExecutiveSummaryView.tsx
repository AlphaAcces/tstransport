import React, { Suspense, lazy, useCallback, useMemo, useRef, useState } from 'react';
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
import { View } from '../../types';
import { ExecutiveCard } from './ExecutiveCard';

const ExecutiveTrendChart = lazy(() => import('./ExecutiveTrendChart').then(module => ({ default: module.ExecutiveTrendChart })));

const ChartSkeleton: React.FC = () => (
    <div className="h-full w-full rounded bg-gray-900/30 animate-pulse" />
);

interface ExecutiveSummaryViewProps {
    onNavigate?: (view: View) => void;
}

const formatDKK = (value: number) =>
    new Intl.NumberFormat('da-DK', {
        style: 'currency',
        currency: 'DKK',
        maximumFractionDigits: value >= 500 ? 0 : 0,
    }).format(value);

const formatMillions = (value: number) => `${(value / 1_000_000).toFixed(1)} mio. kr.`;

const riskLevelColor: Record<'KRITISK' | 'HØJ' | 'MODERAT' | 'LAV' | 'N/A', 'red' | 'yellow' | 'blue' | 'green' | 'gray'> = {
    KRITISK: 'red',
    HØJ: 'yellow',
    MODERAT: 'blue',
    LAV: 'green',
    'N/A': 'gray',
};

export const ExecutiveSummaryView: React.FC<ExecutiveSummaryViewProps> = ({ onNavigate }) => {
    const { executiveSummary } = useCaseData();
    const { financial, risk, actions } = executiveSummary;
    const subject = useActiveSubject();
    const [isExporting, setIsExporting] = useState(false);
    const grossChartRef = useRef<HTMLDivElement | null>(null);
    const profitChartRef = useRef<HTMLDivElement | null>(null);
    const riskCardRef = useRef<HTMLDivElement | null>(null);

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
                { ref: grossChartRef, title: 'Bruttofortjeneste trend' },
                { ref: profitChartRef, title: 'Resultat efter skat' },
                { ref: riskCardRef, title: 'Risiko & compliance' },
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
    }, [executiveSummary, subject]);

    const grossProfitTrend = useMemo(
        () => financial.trendGrossProfit.map(point => ({
            year: point.year,
            value: Math.round((point.value / 1_000_000) * 10) / 10,
        })),
        [financial.trendGrossProfit]
    );

    const netResultTrend = useMemo(
        () => financial.trendProfitAfterTax.map(point => ({
            year: point.year,
            value: Math.round((point.value / 1_000_000) * 10) / 10,
        })),
        [financial.trendProfitAfterTax]
    );

    const riskScores = useMemo(
        () => risk.riskScores.map(score => ({
            ...score,
            label:
                score.category === 'Legal/Compliance'
                    ? 'Legal & Compliance'
                    : score.category === 'Governance'
                        ? 'Governance'
                        : score.category === 'Sector/Operations'
                            ? 'Sektor & Drift'
                            : score.category === 'Financial'
                                ? 'Finansiel'
                                : 'Reputationsrisiko',
        })),
        [risk.riskScores]
    );

    const latestGross = financial.grossProfit;
    const latestProfit = financial.profitAfterTax;
    const yoyGrossChange = financial.yoyGrossChange;
    const yoyProfitChange = financial.yoyProfitChange;
    const dsoValue = financial.dso;

    const formatMillionsOrDash = (value: number | null) => (typeof value === 'number' ? formatMillions(value) : '—');
    const formatAlertValue = (alertValue: number, unit: 'DKK' | 'days') =>
        unit === 'DKK' ? formatDKK(alertValue) : `${alertValue} dage`;

    return (
        <div className="space-y-8">
            <SectionHeading
                icon={<Briefcase className="w-5 h-5 text-gray-400" />}
                eyebrow="Executive Summary"
                title="Bestyrelsesoverblik"
                subtitle="Kondenseret status på økonomi, risici og handlinger – klar til board briefings."
                actions={[
                    <button
                        key="export"
                        onClick={handleExport}
                        disabled={isExporting}
                        className="px-3 py-1.5 text-xs font-medium rounded-md border border-accent-blue/40 bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        {isExporting ? 'Eksporterer…' : 'Eksporter PDF'}
                    </button>,
                    <button
                        key="timeline"
                        onClick={() => onNavigate?.('timeline')}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-accent-green/20 text-accent-green border border-accent-green/30 hover:bg-accent-green/30 transition-colors"
                    >
                        Åbn tidslinje
                    </button>,
                ]}
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="h-full">
                    <ExecutiveCard
                    icon={<Activity className="w-5 h-5" />}
                    title="Finansielt overblik"
                    subtitle="Centrale KPI'er 2021-2024"
                    tone={financial.alerts.length > 0 ? 'warning' : 'neutral'}
                    meta={typeof dsoValue === 'number' ? <Tag label={`DSO ${dsoValue} dage`} color="yellow" /> : undefined}
                    delay={0}
                >
                    {(latestGross !== null || latestProfit !== null) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-900/40 border border-border-dark/50 rounded-lg p-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Bruttofortjeneste</p>
                                <p className="text-2xl font-semibold text-gray-100 mt-1">{formatMillionsOrDash(latestGross)}</p>
                                {yoyGrossChange !== null && (
                                    <span className={`inline-flex items-center text-xs font-medium mt-2 ${yoyGrossChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {yoyGrossChange >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                                        {`${yoyGrossChange >= 0 ? '+' : ''}${yoyGrossChange.toFixed(1)}% mod sidste år`}
                                    </span>
                                )}
                            </div>
                            <div className="bg-gray-900/40 border border-border-dark/50 rounded-lg p-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Resultat efter skat</p>
                                <p className="text-2xl font-semibold text-gray-100 mt-1">{formatMillionsOrDash(latestProfit)}</p>
                                {yoyProfitChange !== null && (
                                    <span className={`inline-flex items-center text-xs font-medium mt-2 ${yoyProfitChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {yoyProfitChange >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                                        {`${yoyProfitChange >= 0 ? '+' : ''}${yoyProfitChange.toFixed(1)}% mod sidste år`}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div ref={grossChartRef} className="h-32 bg-gray-900/40 border border-border-dark/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 uppercase tracking-[0.18em] mb-2">Bruttofortjeneste trend</p>
                            <Suspense fallback={<ChartSkeleton />}>
                                <ExecutiveTrendChart
                                    data={grossProfitTrend}
                                    lineColor="#00cc66"
                                    highlightColor="#22c55e"
                                    valueFormatter={value => (typeof value === 'number' ? `${value.toFixed(1)} mio. kr.` : '—')}
                                />
                            </Suspense>
                        </div>
                        <div ref={profitChartRef} className="h-32 bg-gray-900/40 border border-border-dark/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 uppercase tracking-[0.18em] mb-2">Resultat efter skat</p>
                            <Suspense fallback={<ChartSkeleton />}>
                                <ExecutiveTrendChart
                                    data={netResultTrend}
                                    lineColor="#38bdf8"
                                    highlightColor="#60a5fa"
                                    valueFormatter={value => (typeof value === 'number' ? `${value.toFixed(1)} mio. kr.` : '—')}
                                />
                            </Suspense>
                        </div>
                    </div>

                    {financial.alerts.length > 0 && (
                        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 text-xs text-red-100">
                            <div className="flex items-center gap-2 font-semibold text-red-200 mb-2">
                                <AlertTriangle className="w-4 h-4" />
                                Kritiske observationer
                            </div>
                            <ul className="space-y-2">
                                {financial.alerts.map(alert => (
                                    <li key={alert.id} className="flex items-start gap-2 leading-relaxed">
                                        <span className="mt-0.5"><ArrowUpRight className="w-3 h-3" /></span>
                                        <span>{`${alert.label}: ${formatAlertValue(alert.value, alert.unit)}`} – {alert.description}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    </ExecutiveCard>
                </div>

                <div ref={riskCardRef} className="h-full">
                    <ExecutiveCard
                    icon={<ShieldAlert className="w-5 h-5" />}
                    title="Risiko & compliance"
                    subtitle="Myndigheder og governance"
                    tone="critical"
                    meta={<Tag label="Red Flags" color="red" />}
                    delay={1}
                >
                    <div className="bg-gray-900/40 border border-border-dark/50 rounded-lg p-4 space-y-3 text-sm text-gray-300">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <div>
                                <p className="font-semibold text-gray-100">Skattesag</p>
                                <p className="text-xs text-gray-400">{risk.taxCaseExposure ? `Eksponering på ${formatDKK(risk.taxCaseExposure)} – overvåg hensættelser.` : 'Ingen aktiv skattesag registreret.'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Landmark className="w-4 h-4 text-yellow-400" />
                            <div>
                                <p className="font-semibold text-gray-100">Compliance-note</p>
                                <p className="text-xs text-gray-400">{risk.complianceIssue}</p>
                            </div>
                        </div>
                        {risk.redFlags.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-[0.18em] mb-1">Red flags</p>
                                <ul className="space-y-1 text-xs text-gray-400 list-disc list-inside">
                                    {risk.redFlags.map(flag => (
                                        <li key={flag}>{flag}</li>
                                    ))}
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
                                        <p className="text-xs text-gray-400 mt-1">{score.justification}</p>
                                    </div>
                                    <Tag label={score.riskLevel} color={riskLevelColor[score.riskLevel]} />
                                </div>
                            ))}
                        </div>
                    )}
                    </ExecutiveCard>
                </div>

                <div className="h-full">
                    <ExecutiveCard
                    icon={<CalendarClock className="w-5 h-5" />}
                    title="Handlinger & tidslinje"
                    subtitle="Næste 30 dage og kritiske hændelser"
                    tone="warning"
                    meta={
                        <button
                            onClick={() => onNavigate?.('actions')}
                            className="text-xs text-accent-green hover:text-accent-green/80 inline-flex items-center gap-1"
                        >
                            Se Actionables <ArrowRight className="w-3 h-3" />
                        </button>
                    }
                    delay={2}
                >
                    <div className="space-y-4 text-sm">
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-2">Kommende deadlines</p>
                            <ul className="space-y-2">
                                {actions.upcomingDeadlines.length === 0 && <li className="text-gray-500 text-xs">Ingen deadlines registreret i de næste 30 dage.</li>}
                                {actions.upcomingDeadlines.map(item => (
                                    <li key={item.id} className="bg-gray-900/40 border border-border-dark/40 rounded-lg p-3 flex flex-col">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-200 font-medium">{item.title}</span>
                                            <Tag label={item.priority} color={item.priority === 'Påkrævet' ? 'red' : 'yellow'} />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Ansvar: {item.ownerRole ?? 'Ikke angivet'} · Horisont: {item.timeHorizon ?? 'N/A'}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-2">Kritiske hændelser</p>
                            <ul className="space-y-2">
                                {actions.criticalEvents.map(event => (
                                    <li key={`${event.title}-${event.date}`} className="bg-gray-900/40 border border-border-dark/40 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-200 font-medium">{event.title}</span>
                                            <span className="text-[11px] font-mono text-red-300">{new Date(event.date).toLocaleDateString('da-DK')}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-2">Board actionables</p>
                            <ul className="space-y-2">
                                {actions.boardActionables.map(action => (
                                    <li key={action.id} className="bg-gray-900/40 border border-border-dark/40 rounded-lg p-3 flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-200">{action.title}</p>
                                            <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Tag label={action.priority} color={action.priority === 'Påkrævet' ? 'red' : 'yellow'} />
                                            {action.timeHorizon && <Tag label={action.timeHorizon} color="blue" />}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {actions.upcomingEvents.length > 0 && (
                        <div className="bg-gray-900/40 border border-border-dark/50 rounded-lg p-3 text-xs text-gray-400">
                            <p className="uppercase tracking-[0.18em] text-gray-500 mb-2">Næste nøglehændelser</p>
                            <ul className="space-y-2">
                                {actions.upcomingEvents.map(event => (
                                    <li key={`upcoming-${event.title}-${event.date}`} className="flex items-center justify-between">
                                        <span className="text-gray-300">{event.title}</span>
                                        <span className="font-mono text-gray-500">{new Date(event.date).toLocaleDateString('da-DK')}</span>
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
