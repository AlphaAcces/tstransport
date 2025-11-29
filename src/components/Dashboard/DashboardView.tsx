import React, { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Subject } from '../../types';
import { KpiCard } from '../Shared/KpiCard';
import { TrendingUp, DollarSign, Banknote, Users } from 'lucide-react';
import { FileWarning } from 'lucide-react';
import { useDashboardKpis } from '../../domains/kpi';
import { useMonitoring } from '../../domains/monitoring';
import { ThreatWidget, ThreatLevel } from './ThreatWidget';
import { ThreatOverviewCard } from './ThreatOverviewCard';
import { useAiCommand } from '../../domains/ai';

const PriorityActionsCard = lazy(() => import('./PriorityActionsCard').then(module => ({ default: module.PriorityActionsCard })));
const IntelligenceSummaryCard = lazy(() => import('./IntelligenceSummaryCard').then(module => ({ default: module.IntelligenceSummaryCard })));
const RecentEventsCard = lazy(() => import('./RecentEventsCard').then(module => ({ default: module.RecentEventsCard })));
const AiCommandPanel = lazy(() => import('./AiCommandPanel').then(module => ({ default: module.AiCommandPanel })));
const SystemStatusCard = lazy(() => import('./SystemStatusCard').then(module => ({ default: module.SystemStatusCard })));
const NetworkStatsCard = lazy(() => import('./NetworkStatsCard').then(module => ({ default: module.NetworkStatsCard })));

const CardSkeleton: React.FC = () => (
    <div className="h-full min-h-[8rem] rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-surface)]/40 animate-pulse" />
);

// Map risk score to threat level
const getThreatLevel = (score: number): ThreatLevel => {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'elevated';
    if (score >= 20) return 'moderate';
    return 'low';
};

interface DashboardViewProps {
  onNavigate: (view: View, options?: { fromDashboard?: boolean }) => void;
  activeSubject: Subject;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, activeSubject }) => {
    const { t } = useTranslation();
    const { state: aiState } = useAiCommand();

    // Use the new KPI hook - calculates all dashboard KPIs in one place
    const subjectType = activeSubject === 'umit' ? 'personal' : 'corporate';
    const {
        totalRiskDisplay,
        financialSummary,
        riskBreakdown,
    } = useDashboardKpis(subjectType);

    // Use monitoring hook for system status and network stats
    const { systemStatus, networkStats, isLoading: isMonitoringLoading, refresh: refreshMonitoring } = useMonitoring({
        refreshInterval: 30000,
    });

    const aiEntries = aiState.entries;
    const aiPending = aiEntries.filter((entry) => entry.status === 'pending').length;
    const aiFailed = aiEntries.filter((entry) => entry.status === 'error').length;
    const aiLastTimestamp = aiEntries.length ? aiEntries[aiEntries.length - 1].timestamp : undefined;

    const sharedThreatProps = {
        systemStatus,
        networkStats,
        aiStats: {
            total: aiEntries.length,
            pending: aiPending,
            failed: aiFailed,
            lastTimestamp: aiLastTimestamp,
        },
    } as const;

    // Personal/UMIT dashboard
    if (activeSubject === 'umit') {
        const [legalRisk, financialRisk, governanceRisk] = riskBreakdown;
        const riskScore = parseInt(totalRiskDisplay.value) || 65;
        const threatLevel = getThreatLevel(riskScore);

        return (
            <div className="space-y-8">
                {/* Case Header */}
                <div className="case-header">
                    <p className="text-sm font-semibold text-[var(--color-text)] tracking-wider">
                        {t('dashboard.personal.caseHeader')}
                    </p>
                </div>

                <ThreatOverviewCard
                    score={riskScore}
                    activeAlerts={systemStatus?.activeAlerts ?? 0}
                    {...sharedThreatProps}
                />

                {/* Top Row: Threat Widget + KPI Cards */}
                <section>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Threat Level Widget - spans 1 column on large screens */}
                        <div className="lg:col-span-1">
                            <ThreatWidget
                                level={threatLevel}
                                score={riskScore}
                                previousScore={riskScore - 3}
                                lastUpdated={new Date()}
                                activeAlerts={systemStatus?.activeAlerts ?? 0}
                                onClick={() => onNavigate('risk', { fromDashboard: true })}
                            />
                        </div>

                        {/* KPI Cards Grid - 3 columns */}
                        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            <KpiCard
                                title={t('dashboard.personal.cards.legalRisk.title')}
                                value={legalRisk.scoreFormatted}
                                unit={legalRisk.unitFormatted}
                                color="orange"
                                icon={<FileWarning className="w-4 h-4" />}
                                onClick={() => onNavigate('risk', { fromDashboard: true })}
                            >
                                {t('dashboard.personal.cards.legalRisk.description')}
                            </KpiCard>
                            <KpiCard
                                title={t('dashboard.personal.cards.financialRisk.title')}
                                value={financialRisk.scoreFormatted}
                                unit={financialRisk.unitFormatted}
                                color="orange"
                                icon={<DollarSign className="w-4 h-4" />}
                                onClick={() => onNavigate('risk', { fromDashboard: true })}
                            >
                                {t('dashboard.personal.cards.financialRisk.description')}
                            </KpiCard>
                            <KpiCard
                                title={t('dashboard.personal.cards.governanceRisk.title')}
                                value={governanceRisk.scoreFormatted}
                                unit={governanceRisk.unitFormatted}
                                color="yellow"
                                icon={<Users className="w-4 h-4" />}
                                onClick={() => onNavigate('risk', { fromDashboard: true })}
                            >
                                {t('dashboard.personal.cards.governanceRisk.description')}
                            </KpiCard>
                        </div>
                    </div>
                </section>
                <section>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <Suspense fallback={<CardSkeleton />}>
                                <IntelligenceSummaryCard activeSubject={activeSubject} />
                            </Suspense>
                        </div>
                        <Suspense fallback={<CardSkeleton />}>
                            <PriorityActionsCard onNavigate={(view) => onNavigate(view, { fromDashboard: true })} />
                        </Suspense>
                    </div>
                </section>
                <section>
                    <Suspense fallback={<CardSkeleton />}>
                        <RecentEventsCard />
                    </Suspense>
                </section>

                {/* AI Command Panel and System Monitoring */}
                <section>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <Suspense fallback={<CardSkeleton />}>
                                <AiCommandPanel context={{ subject: activeSubject, view: 'dashboard' }} />
                            </Suspense>
                        </div>
                        <div className="space-y-6">
                            <Suspense fallback={<CardSkeleton />}>
                                <SystemStatusCard
                                    status={systemStatus}
                                    isLoading={isMonitoringLoading}
                                    onRefresh={refreshMonitoring}
                                />
                            </Suspense>
                            <Suspense fallback={<CardSkeleton />}>
                                <NetworkStatsCard
                                    stats={networkStats}
                                    isLoading={isMonitoringLoading}
                                    onRefresh={refreshMonitoring}
                                />
                            </Suspense>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    // Corporate/TSL dashboard
    // All calculations are now done in the KPI module
    const netResultChange = financialSummary?.netResultChange ?? 0;
    const corpRiskScore = parseInt(totalRiskDisplay.value) || 45;
    const corpThreatLevel = getThreatLevel(corpRiskScore);

    return (
        <div className="space-y-8">
            {/* Case Header */}
            <div className="case-header">
                <p className="text-sm font-semibold text-[var(--color-text)] tracking-wider">
                    {t('dashboard.corporate.caseHeader')}
                </p>
            </div>

            <ThreatOverviewCard
                score={corpRiskScore}
                activeAlerts={systemStatus?.activeAlerts ?? 0}
                {...sharedThreatProps}
            />

            {/* Top Row: Threat Widget + KPI Cards */}
            <section>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Threat Level Widget */}
                    <div className="lg:col-span-1">
                        <ThreatWidget
                            level={corpThreatLevel}
                            score={corpRiskScore}
                            previousScore={corpRiskScore + 2}
                            lastUpdated={new Date()}
                            activeAlerts={systemStatus?.activeAlerts ?? 0}
                            onClick={() => onNavigate('risk', { fromDashboard: true })}
                        />
                    </div>

                    {/* KPI Cards Grid */}
                    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        <KpiCard
                            title={t('dashboard.corporate.cards.netResult.title', { year: financialSummary?.year ?? new Date().getFullYear() })}
                            value={financialSummary?.netResultFormatted ?? t('common.naShort')}
                            color={netResultChange < 0 ? 'orange' : 'gold'}
                            change={netResultChange}
                            changeType="positive"
                            sparklineData={financialSummary?.resultSparkline}
                            icon={<TrendingUp className="w-4 h-4" />}
                            onClick={() => onNavigate('financials', { fromDashboard: true })}
                        />
                        <KpiCard
                            title={t('dashboard.corporate.cards.equity.title')}
                            value={financialSummary?.equityFormatted ?? t('common.naShort')}
                            color="gold"
                            sparklineData={financialSummary?.equitySparkline}
                            icon={<DollarSign className="w-4 h-4" />}
                            onClick={() => onNavigate('financials', { fromDashboard: true })}
                        >
                            {t('dashboard.corporate.cards.equity.description', { solidity: financialSummary?.solidityFormatted ?? t('common.naShort') })}
                        </KpiCard>
                        <KpiCard
                            title={t('dashboard.corporate.cards.liquidity.title')}
                            value={financialSummary?.liquidityFormatted ?? t('common.naShort')}
                            color="orange"
                            icon={<Banknote className="w-4 h-4" />}
                            onClick={() => onNavigate('cashflow', { fromDashboard: true })}
                        >
                            {t('dashboard.corporate.cards.liquidity.description', { dso: financialSummary?.dsoFormatted ?? t('common.naShort') })}
                        </KpiCard>
                    </div>
                </div>
            </section>

            <section>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Suspense fallback={<CardSkeleton />}>
                            <IntelligenceSummaryCard activeSubject={activeSubject} />
                        </Suspense>
                    </div>
                    <Suspense fallback={<CardSkeleton />}>
                        <PriorityActionsCard onNavigate={(view) => onNavigate(view, { fromDashboard: true })} />
                    </Suspense>
                </div>
            </section>

            <section>
                <Suspense fallback={<CardSkeleton />}>
                    <RecentEventsCard />
                </Suspense>
            </section>

            {/* AI Command Panel and System Monitoring */}
            <section>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Suspense fallback={<CardSkeleton />}>
                            <AiCommandPanel context={{ subject: activeSubject, view: 'dashboard' }} />
                        </Suspense>
                    </div>
                    <div className="space-y-6">
                        <Suspense fallback={<CardSkeleton />}>
                            <SystemStatusCard
                                status={systemStatus}
                                isLoading={isMonitoringLoading}
                                onRefresh={refreshMonitoring}
                            />
                        </Suspense>
                        <Suspense fallback={<CardSkeleton />}>
                            <NetworkStatsCard
                                stats={networkStats}
                                isLoading={isMonitoringLoading}
                                onRefresh={refreshMonitoring}
                            />
                        </Suspense>
                    </div>
                </div>
            </section>
        </div>
    );
};
