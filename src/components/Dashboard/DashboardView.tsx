import React, { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Subject } from '../../types';
import { KpiCard } from '../Shared/KpiCard';
import { ShieldAlert, TrendingUp, DollarSign, Banknote, Users } from 'lucide-react';
import { FileWarning } from 'lucide-react';
import { useDashboardKpis } from '../../domains/kpi';

const PriorityActionsCard = lazy(() => import('./PriorityActionsCard').then(module => ({ default: module.PriorityActionsCard })));
const IntelligenceSummaryCard = lazy(() => import('./IntelligenceSummaryCard').then(module => ({ default: module.IntelligenceSummaryCard })));
const RecentEventsCard = lazy(() => import('./RecentEventsCard').then(module => ({ default: module.RecentEventsCard })));

const CardSkeleton: React.FC = () => (
    <div className="h-full min-h-[8rem] rounded-lg border border-border-dark/60 bg-component-dark/40 animate-pulse" />
);

interface DashboardViewProps {
  onNavigate: (view: View, options?: { fromDashboard?: boolean }) => void;
  activeSubject: Subject;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, activeSubject }) => {
    const { t } = useTranslation();

    // Use the new KPI hook - calculates all dashboard KPIs in one place
    const subjectType = activeSubject === 'umit' ? 'personal' : 'corporate';
    const {
        totalRiskDisplay,
        financialSummary,
        riskBreakdown,
    } = useDashboardKpis(subjectType);

    // Personal/UMIT dashboard
    if (activeSubject === 'umit') {
        const [legalRisk, financialRisk, governanceRisk] = riskBreakdown;

        return (
            <div className="space-y-8">
                <div className="bg-component-dark p-2 rounded-lg border border-border-dark text-center">
                    <p className="text-sm font-semibold text-gray-300 tracking-wider">{t('dashboard.personal.caseHeader')}</p>
                </div>
                <section>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <KpiCard
                            title={t('dashboard.personal.cards.totalRisk.title')}
                            value={totalRiskDisplay.value}
                            color="red"
                            icon={<ShieldAlert className="w-4 h-4" />}
                            onClick={() => onNavigate('risk', { fromDashboard: true })}
                        >
                            {t('dashboard.personal.cards.totalRisk.description', {
                                level: totalRiskDisplay.levelLabel,
                                drivers: totalRiskDisplay.primaryDrivers,
                            })}
                        </KpiCard>
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
            </div>
        );
    }

    // Corporate/TSL dashboard
    // All calculations are now done in the KPI module
    const netResultChange = financialSummary?.netResultChange ?? 0;

    return (
        <div className="space-y-8">
            <div className="bg-component-dark p-2 rounded-lg border border-border-dark text-center">
                <p className="text-sm font-semibold text-gray-300 tracking-wider">{t('dashboard.corporate.caseHeader')}</p>
            </div>
            <section>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <KpiCard
                        title={t('dashboard.corporate.cards.totalRisk.title')}
                        value={totalRiskDisplay.value}
                        color="red"
                        icon={<ShieldAlert className="w-4 h-4" />}
                        onClick={() => onNavigate('risk', { fromDashboard: true })}
                    >
                        {t('dashboard.corporate.cards.totalRisk.description', {
                            level: totalRiskDisplay.levelLabel,
                            drivers: totalRiskDisplay.primaryDrivers,
                        })}
                    </KpiCard>
                    <KpiCard
                        title={t('dashboard.corporate.cards.netResult.title', { year: financialSummary?.year ?? new Date().getFullYear() })}
                        value={financialSummary?.netResultFormatted ?? t('common.naShort')}
                        color={netResultChange < 0 ? 'orange' : 'green'}
                        change={netResultChange}
                        changeType="positive"
                        sparklineData={financialSummary?.resultSparkline}
                        icon={<TrendingUp className="w-4 h-4" />}
                        onClick={() => onNavigate('financials', { fromDashboard: true })}
                    />
                    <KpiCard
                        title={t('dashboard.corporate.cards.equity.title')}
                        value={financialSummary?.equityFormatted ?? t('common.naShort')}
                        color="green"
                        sparklineData={financialSummary?.equitySparkline}
                        icon={<DollarSign className="w-4 h-4" />}
                        onClick={() => onNavigate('financials', { fromDashboard: true })}
                    >
                        {t('dashboard.corporate.cards.equity.description', { solidity: financialSummary?.solidityFormatted ?? t('common.naShort') })}
                    </KpiCard>
                    <KpiCard
                        title={t('dashboard.corporate.cards.liquidity.title')}
                        value={financialSummary?.liquidityFormatted ?? t('common.naShort')}
                        color="red"
                        icon={<Banknote className="w-4 h-4" />}
                        onClick={() => onNavigate('cashflow', { fromDashboard: true })}
                    >
                        {t('dashboard.corporate.cards.liquidity.description', { dso: financialSummary?.dsoFormatted ?? t('common.naShort') })}
                    </KpiCard>
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
        </div>
    );
};
