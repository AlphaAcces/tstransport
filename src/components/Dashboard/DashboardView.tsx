import React, { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Subject } from '../../types';
import { useCaseData } from '../../context/DataContext';
import { KpiCard } from '../Shared/KpiCard';
import { ShieldAlert, TrendingUp, DollarSign, Banknote, Users } from 'lucide-react';
import { FileWarning } from 'lucide-react';
import { useFormatters } from '../../domains/settings/hooks';

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
    const { totalRiskScore, riskHeatmapData, financialData } = useCaseData();
    const { formatCurrency, formatPercent } = useFormatters();

    const riskLevelLabels = React.useMemo(() => ({
        KRITISK: t('common.riskLevel.critical'),
        HØJ: t('common.riskLevel.high'),
        MODERAT: t('common.riskLevel.medium'),
        LAV: t('common.riskLevel.low'),
        'N/A': t('common.riskLevel.na'),
    }), [t]);

    const driverLabels = React.useMemo(() => ({
        'Legal/Compliance': t('dashboard.common.drivers.legalCompliance'),
        Governance: t('dashboard.common.drivers.governance'),
        Financial: t('dashboard.common.drivers.financial'),
        'Sector/Operations': t('dashboard.common.drivers.sector'),
        'SOCMINT/Reputation': t('dashboard.common.drivers.reputation'),
    }), [t]);

    const joiner = t('common.delimiters.and');
    const primaryDrivers = React.useMemo(
        () => [...riskHeatmapData]
            .sort((a, b) => b.assignedScore - a.assignedScore)
            .slice(0, 2)
            .map(r => driverLabels[r.category] ?? r.category)
            .join(joiner),
        [riskHeatmapData, driverLabels, joiner],
    );
    const resolvedPrimaryDrivers = primaryDrivers || t('dashboard.common.noDrivers');
    const riskLevelLabel = riskLevelLabels[totalRiskScore.level] ?? totalRiskScore.level;

    const formatCurrencyCompact = React.useCallback((value?: number | null) => {
        if (typeof value !== 'number') {
            return t('common.naShort');
        }
        return formatCurrency(value, {
            notation: 'compact',
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
        });
    }, [formatCurrency, t]);

    const formatCurrencyValue = React.useCallback((value?: number | null) => {
        if (typeof value !== 'number') {
            return t('common.naShort');
        }
        return formatCurrency(value, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    }, [formatCurrency, t]);

    if (activeSubject === 'umit') {
        const legalRisk = riskHeatmapData.find(r => r.category === 'Legal/Compliance');
        const financialRisk = riskHeatmapData.find(r => r.category === 'Financial');
        const governanceRisk = riskHeatmapData.find(r => r.category === 'Governance');
        const totalRiskValue = `${totalRiskScore.score}/${totalRiskScore.maxScore}`;
        const formatScoreValue = (risk?: typeof legalRisk) => (risk ? risk.assignedScore.toString() : t('common.naShort'));
        const formatScoreUnit = (risk?: typeof legalRisk) => (risk ? `/ ${risk.maxScore ?? t('common.naShort')}` : undefined);

        return (
            <div className="space-y-8">
                <div className="bg-component-dark p-2 rounded-lg border border-border-dark text-center">
                    <p className="text-sm font-semibold text-gray-300 tracking-wider">{t('dashboard.personal.caseHeader')}</p>
                </div>
                <section>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <KpiCard
                            title={t('dashboard.personal.cards.totalRisk.title')}
                            value={totalRiskValue}
                            color="red"
                            icon={<ShieldAlert className="w-4 h-4" />}
                            onClick={() => onNavigate('risk', { fromDashboard: true })}
                        >
                            {t('dashboard.personal.cards.totalRisk.description', {
                                level: riskLevelLabel,
                                drivers: resolvedPrimaryDrivers,
                            })}
                        </KpiCard>
                        <KpiCard
                            title={t('dashboard.personal.cards.legalRisk.title')}
                            value={formatScoreValue(legalRisk)}
                            unit={formatScoreUnit(legalRisk)}
                            color="orange"
                            icon={<FileWarning className="w-4 h-4" />}
                            onClick={() => onNavigate('risk', { fromDashboard: true })}
                        >
                            {t('dashboard.personal.cards.legalRisk.description')}
                        </KpiCard>
                        <KpiCard
                            title={t('dashboard.personal.cards.financialRisk.title')}
                            value={formatScoreValue(financialRisk)}
                            unit={formatScoreUnit(financialRisk)}
                            color="orange"
                            icon={<DollarSign className="w-4 h-4" />}
                            onClick={() => onNavigate('risk', { fromDashboard: true })}
                        >
                            {t('dashboard.personal.cards.financialRisk.description')}
                        </KpiCard>
                        <KpiCard
                            title={t('dashboard.personal.cards.governanceRisk.title')}
                            value={formatScoreValue(governanceRisk)}
                            unit={formatScoreUnit(governanceRisk)}
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

    const latestFinancials = financialData[financialData.length - 1];
    const prevFinancials = financialData.length > 1 ? financialData[financialData.length - 2] : null;

    const netResultChange = latestFinancials && prevFinancials && prevFinancials.profitAfterTax !== 0
        ? ((latestFinancials.profitAfterTax - prevFinancials.profitAfterTax) / Math.abs(prevFinancials.profitAfterTax)) * 100
        : 0;

    const equitySparkline = financialData.map(d => ({ year: d.year, value: d.equityEndOfYear }));
    const resultSparkline = financialData.map(d => ({ year: d.year, value: d.profitAfterTax }));

    const totalRiskValue = `${totalRiskScore.score}/${totalRiskScore.maxScore}`;
    const netResultYear = latestFinancials?.year ?? new Date().getFullYear();
    const netResultValue = formatCurrencyCompact(latestFinancials?.profitAfterTax ?? null);
    const equityValue = formatCurrencyCompact(latestFinancials?.equityEndOfYear ?? null);
    const liquidityValue = formatCurrencyValue(latestFinancials?.cash ?? null);
    const solidityValue = typeof latestFinancials?.solidity === 'number'
        ? formatPercent((latestFinancials.solidity ?? 0) / 100, { maximumFractionDigits: 0 })
        : t('common.naShort');
    const dsoValue = typeof latestFinancials?.dso === 'number'
        ? t('common.units.days', { count: Math.round(latestFinancials.dso) })
        : t('common.naShort');

    return (
        <div className="space-y-8">
            <div className="bg-component-dark p-2 rounded-lg border border-border-dark text-center">
                <p className="text-sm font-semibold text-gray-300 tracking-wider">{t('dashboard.corporate.caseHeader')}</p>
            </div>
            <section>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <KpiCard
                        title={t('dashboard.corporate.cards.totalRisk.title')}
                        value={totalRiskValue}
                        color="red"
                        icon={<ShieldAlert className="w-4 h-4" />}
                        onClick={() => onNavigate('risk', { fromDashboard: true })}
                    >
                        {t('dashboard.corporate.cards.totalRisk.description', {
                            level: riskLevelLabel,
                            drivers: resolvedPrimaryDrivers,
                        })}
                    </KpiCard>
                    <KpiCard
                        title={t('dashboard.corporate.cards.netResult.title', { year: netResultYear })}
                        value={netResultValue}
                        color={netResultChange < 0 ? 'orange' : 'green'}
                        change={netResultChange}
                        changeType="positive"
                        sparklineData={resultSparkline}
                        icon={<TrendingUp className="w-4 h-4" />}
                        onClick={() => onNavigate('financials', { fromDashboard: true })}
                    />
                    <KpiCard
                        title={t('dashboard.corporate.cards.equity.title')}
                        value={equityValue}
                        color="green"
                        sparklineData={equitySparkline}
                        icon={<DollarSign className="w-4 h-4" />}
                        onClick={() => onNavigate('financials', { fromDashboard: true })}
                    >
                        {t('dashboard.corporate.cards.equity.description', { solidity: solidityValue })}
                    </KpiCard>
                    <KpiCard
                        title={t('dashboard.corporate.cards.liquidity.title')}
                        value={liquidityValue}
                        color="red"
                        icon={<Banknote className="w-4 h-4" />}
                        onClick={() => onNavigate('cashflow', { fromDashboard: true })}
                    >
                        {t('dashboard.corporate.cards.liquidity.description', { dso: dsoValue })}
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
