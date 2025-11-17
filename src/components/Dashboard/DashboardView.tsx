import React from 'react';
import { View, Subject } from '../../types';
import { useCaseData } from '../../context/DataContext';
import { KpiCard } from '../Shared/KpiCard';
import { PriorityActionsCard } from './PriorityActionsCard';
import { IntelligenceSummaryCard } from './IntelligenceSummaryCard';
import { RecentEventsCard } from './RecentEventsCard';
import { ShieldAlert, TrendingUp, DollarSign, Banknote, Users } from 'lucide-react';
import { FileWarning } from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: View, options?: { fromDashboard?: boolean }) => void;
  activeSubject: Subject;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, activeSubject }) => {
    const { totalRiskScore, riskHeatmapData, financialData } = useCaseData();

    if (activeSubject === 'umit') {
        const legalRisk = riskHeatmapData.find(r => r.category === 'Legal/Compliance');
        const financialRisk = riskHeatmapData.find(r => r.category === 'Financial');
        const governanceRisk = riskHeatmapData.find(r => r.category === 'Governance');
        
        const primaryDrivers = [...riskHeatmapData]
            .sort((a, b) => b.assignedScore - a.assignedScore)
            .slice(0, 2)
            .map(r => r.category.split('/')[0])
            .join(' & ');

        return (
             <div className="space-y-8">
                <div className="bg-component-dark p-2 rounded-lg border border-border-dark text-center">
                    <p className="text-sm font-semibold text-gray-300 tracking-wider">Case: Ümit Cetin (Privatprofil)</p>
                </div>
                <section>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KpiCard 
                            title="Samlet Personlig Risiko" 
                            value={`${totalRiskScore.score}/${totalRiskScore.maxScore}`}
                            color="red"
                            icon={<ShieldAlert className="w-4 h-4"/>}
                            onClick={() => onNavigate('risk', { fromDashboard: true })}
                        >
                            {totalRiskScore.level} / Drivere: {primaryDrivers}
                        </KpiCard>
                        <KpiCard
                            title="Juridisk Risiko"
                            value={`${legalRisk?.assignedScore ?? 'N/A'}`}
                            unit={`/ ${legalRisk?.maxScore ?? 'N/A'}`}
                            color="orange"
                            icon={<FileWarning className="w-4 h-4"/>}
                            onClick={() => onNavigate('risk', { fromDashboard: true })}
                        >
                            Potentiel personlig hæftelse
                        </KpiCard>
                        <KpiCard
                            title="Finansiel Eksponering"
                            value={`${financialRisk?.assignedScore ?? 'N/A'}`}
                            unit={`/ ${financialRisk?.maxScore ?? 'N/A'}`}
                            color="orange"
                            icon={<DollarSign className="w-4 h-4"/>}
                            onClick={() => onNavigate('risk', { fromDashboard: true })}
                        >
                            Afhængighed af TSL-koncernen
                        </KpiCard>
                         <KpiCard
                            title="Governance Risiko"
                            value={`${governanceRisk?.assignedScore ?? 'N/A'}`}
                            unit={`/ ${governanceRisk?.maxScore ?? 'N/A'}`}
                            color="yellow"
                            icon={<Users className="w-4 h-4"/>}
                            onClick={() => onNavigate('risk', { fromDashboard: true })}
                        >
                            UBO-kontrol, ingen intern kontrol
                        </KpiCard>
                    </div>
                </section>
                 <section>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <IntelligenceSummaryCard activeSubject={activeSubject} />
                        </div>
                        <PriorityActionsCard onNavigate={(view) => onNavigate(view, {fromDashboard: true})} />
                    </div>
                </section>
                <section>
                    <RecentEventsCard />
                </section>
            </div>
        )
    }

    const latestFinancials = financialData[financialData.length - 1];
    const prevFinancials = financialData.length > 1 ? financialData[financialData.length - 2] : null;

    const netResultChange = latestFinancials && prevFinancials && prevFinancials.profitAfterTax !== 0
      ? ((latestFinancials.profitAfterTax - prevFinancials.profitAfterTax) / Math.abs(prevFinancials.profitAfterTax)) * 100 
      : 0;
    
    const primaryDrivers = [...riskHeatmapData]
        .sort((a, b) => b.assignedScore - a.assignedScore)
        .slice(0, 2)
        .map(r => (r.category === 'Financial' ? 'Likviditet' : r.category === 'Legal/Compliance' ? 'Skat' : r.category))
        .join(' & ');
        
    const equitySparkline = financialData.map(d => ({ year: d.year, value: d.equityEndOfYear }));
    const resultSparkline = financialData.map(d => ({ year: d.year, value: d.profitAfterTax }));

    return (
        <div className="space-y-8">
            <div className="bg-component-dark p-2 rounded-lg border border-border-dark text-center">
                <p className="text-sm font-semibold text-gray-300 tracking-wider">Case: TS Logistik ApS (Erhverv)</p>
            </div>
            {/* Section 1: Mission Status */}
            <section>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard 
                        title="Samlet Risikoniveau" 
                        value={`${totalRiskScore.score}/${totalRiskScore.maxScore}`}
                        color="red"
                        icon={<ShieldAlert className="w-4 h-4"/>}
                        onClick={() => onNavigate('risk', { fromDashboard: true })}
                    >
                        {totalRiskScore.level} / Drivere: {primaryDrivers}
                    </KpiCard>
                    <KpiCard
                        title="Årets Resultat (2024)"
                        value={`${(latestFinancials.profitAfterTax / 1000000).toFixed(2)}`}
                        unit="mio."
                        color={netResultChange < 0 ? 'orange' : 'green'}
                        change={netResultChange}
                        changeType="positive"
                        sparklineData={resultSparkline}
                        icon={<TrendingUp className="w-4 h-4"/>}
                        onClick={() => onNavigate('financials', { fromDashboard: true })}
                    />
                    <KpiCard
                        title="Egenkapital & Soliditet"
                        value={`${(latestFinancials.equityEndOfYear / 1000000).toFixed(2)}`}
                        unit="mio."
                        color="green"
                        sparklineData={equitySparkline}
                        icon={<DollarSign className="w-4 h-4"/>}
                        onClick={() => onNavigate('financials', { fromDashboard: true })}
                    >
                        Soliditet: {latestFinancials.solidity}%
                    </KpiCard>
                    <KpiCard
                        title="Likviditet (Cash) & DSO"
                        value={latestFinancials.cash?.toLocaleString() ?? 'N/A'}
                        unit="DKK"
                        color="red"
                        icon={<Banknote className="w-4 h-4"/>}
                        onClick={() => onNavigate('cashflow', { fromDashboard: true })}
                    >
                        Akut Risiko / DSO: ~{latestFinancials.dso} dage
                    </KpiCard>
                </div>
            </section>

            {/* Section 2: Intelligence Summary & Actions */}
            <section>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <IntelligenceSummaryCard activeSubject={activeSubject} />
                    </div>
                    <PriorityActionsCard onNavigate={(view) => onNavigate(view, {fromDashboard: true})} />
                </div>
            </section>
            
            {/* Section 3: Recent Activity */}
            <section>
                <RecentEventsCard />
            </section>
        </div>
    );
};
