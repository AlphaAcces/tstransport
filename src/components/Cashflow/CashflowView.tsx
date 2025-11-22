import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCaseData } from '../../context/DataContext';
import { Banknote, FileWarning, Clock, Users, ArrowDown, ArrowUp, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFormatters } from '../../domains/settings/hooks';

const KpiCard: React.FC<{ title: string; value: string; note: string; icon: React.ReactNode }> = ({ title, value, note, icon }) => (
    <div className="bg-component-dark p-4 rounded-lg border border-red-800/80 flex">
        <div className="flex-shrink-0 mr-4 text-red-500">{icon}</div>
        <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h3>
            <p className="text-2xl font-bold text-red-400 mt-1">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{note}</p>
        </div>
    </div>
);

const ScenarioKpiCard: React.FC<{ title: string; value: string; change: number; icon: React.ReactNode; formatChange: (value: number) => string }> = ({ title, value, change, icon, formatChange }) => {
    const isNegative = change < 0;
    const colorClass = isNegative ? 'text-red-400' : 'text-green-400';
    const ChangeIcon = isNegative ? ArrowDown : ArrowUp;

    return (
        <div className="bg-base-dark/50 p-4 rounded-lg border border-border-dark flex">
            <div className="flex-shrink-0 mr-4 text-gray-400">{icon}</div>
            <div>
                <h3 className="text-sm font-medium text-gray-400">{title}</h3>
                <p className="text-xl font-bold text-gray-200 mt-1">{value}</p>
                <div className={`flex items-center text-xs font-mono mt-1 ${colorClass}`}>
                    <ChangeIcon className="w-3 h-3 mr-1" />
                    <span>{formatChange(change)}</span>
                </div>
            </div>
        </div>
    );
};

interface ReceivablesTableProps {
    formatNumber: (value: number) => string;
    headings: {
        item: string;
        yearLabel: (year: number) => string;
    };
    rowLabels: {
        internal: string;
        external: string;
        total: string;
    };
    noDataLabel: string;
}

const ReceivablesTable: React.FC<ReceivablesTableProps> = ({ formatNumber, headings, rowLabels, noDataLabel }) => {
    const { cashflowYearlyData } = useCaseData();
    const relevantData = cashflowYearlyData.filter(d => d.year >= 2023);

    if (relevantData.length < 2) {
        return <p className="text-sm text-gray-500">{noDataLabel}</p>;
    }

    const sortedByYear = [...relevantData].sort((a, b) => a.year - b.year);
    const latest = sortedByYear[sortedByYear.length - 1];
    const previous = sortedByYear[sortedByYear.length - 2];

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-dark font-mono">
                <thead className="bg-gray-800/50">
                    <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{headings.item}</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{headings.yearLabel(latest.year)}</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{headings.yearLabel(previous.year)}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                    <tr>
                        <td className="px-4 py-3 text-sm text-gray-300">{rowLabels.internal}</td>
                        <td className="px-4 py-3 text-sm text-right text-yellow-400">{formatNumber(latest.receivablesRelated)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-400">{formatNumber(previous.receivablesRelated)}</td>
                    </tr>
                    <tr>
                        <td className="px-4 py-3 text-sm text-gray-300">{rowLabels.external}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-400">{formatNumber(latest.receivablesExternal)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-400">{formatNumber(previous.receivablesExternal)}</td>
                    </tr>
                    <tr className="bg-gray-800/30">
                        <td className="px-4 py-3 text-sm font-bold text-gray-200">{rowLabels.total}</td>
                        <td className="px-4 py-3 text-sm font-bold text-right text-gray-200">{formatNumber(latest.receivablesTotal)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-right text-gray-200">{formatNumber(previous.receivablesTotal)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export const CashflowView: React.FC = () => {
    const { cashflowYearlyData, cashflowSummary, financialData } = useCaseData();
    const [activeScenario, setActiveScenario] = useState<'base' | 'taxClaim' | 'repayment'>('base');
    const { t } = useTranslation();
    const { formatCurrency, formatNumber, currency } = useFormatters();

    const daysFormatter = (value: number) => t('common.units.days', { count: Math.round(value) });
    const formatCurrencyValue = (value: number) => formatCurrency(value, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    const formatNumberValue = (value: number) => formatNumber(value, { maximumFractionDigits: 0 });
    const formatShortAmount = (value: number) => formatCurrency(value, {
        notation: 'compact',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
    });
    const currencyLabel = currency;

    const baseData = useMemo(() => {
        const latestFinancials = financialData.find(d => d.year === 2024);
        const latestCashflow = cashflowYearlyData.find(d => d.year === 2024);
        return {
            equity: latestFinancials?.equityEndOfYear ?? 0,
            cash: latestCashflow?.cashAndBank ?? 0,
            dso: latestCashflow?.dsoDays ?? 0,
            grossProfit: latestCashflow?.grossProfit ?? 0,
            internalReceivables: latestCashflow?.receivablesRelated ?? 0,
            totalReceivables: latestCashflow?.receivablesTotal ?? 0,
            taxClaim: cashflowSummary.potentialTaxClaim,
        };
    }, [financialData, cashflowYearlyData, cashflowSummary]);

    const scenarioSummaries = useMemo(() => ({
        base: {
            title: t('cashflow.scenarios.summary.base.title'),
            description: t('cashflow.scenarios.summary.base.description'),
        },
        taxClaim: {
            title: t('cashflow.scenarios.summary.taxClaim.title'),
            description: t('cashflow.scenarios.summary.taxClaim.description'),
        },
        repayment: {
            title: t('cashflow.scenarios.summary.repayment.title'),
            description: t('cashflow.scenarios.summary.repayment.description'),
        }
    }), [t]);

    const scenarioTabs = useMemo(() => ({
        base: t('cashflow.scenarios.tabs.base'),
        taxClaim: t('cashflow.scenarios.tabs.taxClaim'),
        repayment: t('cashflow.scenarios.tabs.repayment'),
    }), [t]);

    const scenarioOutput = useMemo(() => {
        const { equity, cash, dso, taxClaim, internalReceivables, totalReceivables, grossProfit } = baseData;

        switch (activeScenario) {
            case 'taxClaim': {
                const newEquity = equity - taxClaim;
                const newCash = cash - taxClaim;
                return {
                    title: scenarioSummaries.taxClaim.title,
                    description: scenarioSummaries.taxClaim.description,
                    equity: { value: newEquity, change: -taxClaim },
                    cash: { value: newCash, change: -taxClaim },
                    dso: { value: dso, change: 0 },
                };
            }
            case 'repayment': {
                const repaymentAmount = internalReceivables * 0.5;
                const newCash = cash + repaymentAmount;
                const newTotalReceivables = totalReceivables - repaymentAmount;
                const newDso = grossProfit > 0 ? (newTotalReceivables / grossProfit) * 365 : 0;
                return {
                    title: scenarioSummaries.repayment.title,
                    description: scenarioSummaries.repayment.description,
                    equity: { value: equity, change: 0 },
                    cash: { value: newCash, change: repaymentAmount },
                    dso: { value: newDso, change: newDso - dso },
                };
            }
            default: // base case
                return {
                    title: scenarioSummaries.base.title,
                    description: scenarioSummaries.base.description,
                    equity: { value: equity, change: 0 },
                    cash: { value: cash, change: 0 },
                    dso: { value: dso, change: 0 },
                };
        }
    }, [activeScenario, baseData, scenarioSummaries]);

    const dsoData = cashflowYearlyData.map(d => ({ year: d.year, DSO: d.dsoDays }));

    const analysisPoints = [
        {
            colorClass: 'text-red-400',
            title: t('cashflow.analysis.points.acuteRisk.title'),
            body: t('cashflow.analysis.points.acuteRisk.body'),
        },
        {
            colorClass: 'text-yellow-400',
            title: t('cashflow.analysis.points.capitalDrain.title'),
            body: t('cashflow.analysis.points.capitalDrain.body'),
        },
        {
            colorClass: 'text-orange-400',
            title: t('cashflow.analysis.points.extremeDso.title'),
            body: t('cashflow.analysis.points.extremeDso.body'),
        },
        {
            colorClass: 'text-red-500',
            title: t('cashflow.analysis.points.combinedRisk.title'),
            body: t('cashflow.analysis.points.combinedRisk.body'),
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold text-gray-200 mb-4">{t('cashflow.heading.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard
                        title={t('cashflow.kpiCards.cashOnHand.title')}
                        value={formatCurrencyValue(cashflowSummary.cashOnHand)}
                        note={t('cashflow.kpiCards.cashOnHand.note')}
                        icon={<Banknote className="w-8 h-8"/>}
                    />
                    <KpiCard
                        title={t('cashflow.kpiCards.internalReceivables.title')}
                        value={formatShortAmount(cashflowSummary.internalReceivables)}
                        note={t('cashflow.kpiCards.internalReceivables.note')}
                        icon={<Users className="w-8 h-8"/>}
                    />
                    <KpiCard
                        title={t('cashflow.kpiCards.dso.title')}
                        value={daysFormatter(cashflowSummary.dsoDays2024)}
                        note={t('cashflow.kpiCards.dso.note')}
                        icon={<Clock className="w-8 h-8"/>}
                    />
                    <KpiCard
                        title={t('cashflow.kpiCards.taxClaim.title')}
                        value={formatShortAmount(cashflowSummary.potentialTaxClaim)}
                        note={t('cashflow.kpiCards.taxClaim.note')}
                        icon={<FileWarning className="w-8 h-8"/>}
                    />
                </div>
            </div>

            <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
                 <h2 className="text-xl font-bold text-gray-200 mb-4">{t('cashflow.scenarios.heading')}</h2>
                 <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <button onClick={() => setActiveScenario('base')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 border ${activeScenario === 'base' ? 'bg-accent-green/20 text-accent-green border-accent-green/50' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border-transparent'}`}>{scenarioTabs.base}</button>
                    <button onClick={() => setActiveScenario('taxClaim')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 border ${activeScenario === 'taxClaim' ? 'bg-red-800/50 text-red-300 border-red-600/80' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border-transparent'}`}>{scenarioTabs.taxClaim}</button>
                    <button onClick={() => setActiveScenario('repayment')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 border ${activeScenario === 'repayment' ? 'bg-green-800/50 text-green-300 border-green-600/80' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border-transparent'}`}>{scenarioTabs.repayment}</button>
                 </div>

                 <div className="bg-base-dark/50 p-4 rounded-md border border-border-dark/50 mb-6">
                     <h3 className="text-md font-semibold text-gray-200">{scenarioOutput.title}</h3>
                     <p className="text-sm text-gray-400 mt-1">{scenarioOutput.description}</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ScenarioKpiCard
                        title={t('cashflow.scenarios.cards.equity')}
                        value={formatCurrencyValue(scenarioOutput.equity.value)}
                        change={scenarioOutput.equity.change}
                        icon={<Briefcase className="w-6 h-6"/>}
                        formatChange={formatCurrencyValue}
                    />
                    <ScenarioKpiCard
                        title={t('cashflow.scenarios.cards.cash')}
                        value={formatCurrencyValue(scenarioOutput.cash.value)}
                        change={scenarioOutput.cash.change}
                        icon={<Banknote className="w-6 h-6"/>}
                        formatChange={formatCurrencyValue}
                    />
                    <ScenarioKpiCard
                        title={t('cashflow.scenarios.cards.dso')}
                        value={daysFormatter(scenarioOutput.dso.value)}
                        change={scenarioOutput.dso.change}
                        icon={<Clock className="w-6 h-6"/>}
                        formatChange={(value) => daysFormatter(value)}
                    />
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-component-dark p-6 rounded-lg border border-border-dark">
                    <h3 className="text-lg font-bold text-gray-200 mb-4">{t('cashflow.dsoChart.title')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dsoData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                            <XAxis dataKey="year" stroke="#a0aec0" />
                            <YAxis tickFormatter={(value: number) => formatNumberValue(value)} stroke="#a0aec0" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #2d3748' }}
                                formatter={(value: number) => [t('cashflow.dsoChart.tooltipValue', { value }), t('cashflow.dsoChart.series')]}
                                cursor={{ fill: 'rgba(229, 62, 62, 0.1)' }}
                            />
                            <Bar dataKey="DSO" name={t('cashflow.dsoChart.series')} fill="#e53e3e" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="lg:col-span-2 bg-component-dark p-6 rounded-lg border border-border-dark">
                    <h3 className="text-lg font-bold text-gray-200 mb-4">{t('cashflow.receivablesTable.title')}</h3>
                    <ReceivablesTable
                        formatNumber={formatCurrencyValue}
                        headings={{
                            item: t('cashflow.receivablesTable.columns.item'),
                            yearLabel: (year: number) => t('cashflow.receivablesTable.columns.year', { year, currency: currencyLabel }),
                        }}
                        rowLabels={{
                            internal: t('cashflow.receivablesTable.rows.internal'),
                            external: t('cashflow.receivablesTable.rows.external'),
                            total: t('cashflow.receivablesTable.rows.total'),
                        }}
                        noDataLabel={t('cashflow.receivablesTable.noData')}
                    />
                </div>
            </div>

            <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
                <h3 className="text-lg font-bold text-gray-200 mb-2">{t('cashflow.analysis.title')}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    {analysisPoints.map(point => (
                        <li key={point.title}>
                            <span className={`font-semibold ${point.colorClass}`}>{point.title}</span> {point.body}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
