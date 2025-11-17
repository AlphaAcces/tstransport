import React, { useState } from 'react';
import { useCaseData } from '../../context/DataContext';
import { RiskScore, View } from '../../types';
import { ShieldAlert, AlertTriangle, Zap } from 'lucide-react';
import { Tag } from '../Shared/Tag';
import { InfoTooltip } from '../Shared/InfoTooltip';

const getRiskColorClass = (level: RiskScore['riskLevel']) => {
  switch (level) {
    case 'KRITISK': return 'bg-red-800/60 border-red-600';
    case 'HØJ': return 'bg-red-900/60 border-red-700';
    case 'MODERAT': return 'bg-orange-900/60 border-orange-700';
    case 'LAV': return 'bg-yellow-900/60 border-yellow-700';
    default: return 'bg-gray-800 border-gray-600';
  }
};

const getRiskTextColorClass = (level: RiskScore['riskLevel']) => {
    switch (level) {
        case 'KRITISK': return 'text-red-300';
        case 'HØJ': return 'text-red-400';
        case 'MODERAT': return 'text-orange-400';
        case 'LAV': return 'text-yellow-400';
        default: return 'text-gray-300';
    }
}

const RiskKpiCard: React.FC<{ title: string; value: string; subValue: string; icon: React.ReactNode; color: 'red' | 'orange' | 'yellow' }> = ({ title, value, subValue, icon, color }) => {
    const colorClasses = {
        red: 'text-red-400',
        orange: 'text-orange-400',
        yellow: 'text-yellow-400'
    };
    return (
        <div className="bg-component-dark p-4 rounded-lg border border-border-dark flex items-center">
            <div className={`mr-4 ${colorClasses[color]}`}>{icon}</div>
            <div>
                <p className="text-sm text-gray-400">{title}</p>
                <p className={`text-xl font-bold ${colorClasses[color]}`}>{value}</p>
                <p className="text-xs text-gray-500 font-mono">{subValue}</p>
            </div>
        </div>
    );
};

const viewLabels: { [key in View]?: string } = {
    cashflow: 'Cashflow & DSO',
    financials: 'Financials',
    timeline: 'Timeline',
    actions: 'Actionables',
    companies: 'Companies',
    person: 'Person & Network',
    sector: 'Sector Analysis',
    hypotheses: 'Hypotheses',
};

const scenarioData = {
    'Balancet vurdering': {
        level: 'KRITISK',
        description: 'Den balancerede vurdering anerkender selskabets stærke egenkapital som en buffer, men anser kombinationen af likviditetsdræn og skattesag som en alvorlig trussel, der kræver omgående handling for at undgå en solvenskrise.'
    },
    'EDD v1 (streng)': {
        level: 'HØJ (Streng Vurdering)',
        description: 'En streng vurdering fokuserer udelukkende på den operationelle insolvens (31 DKK i kasse) og den potentielt fatale skattesag. I dette lys er selskabet teknisk set konkurs, og egenkapitalen er primært bundet i illikvide, interne lån.'
    },
    'Stress-scenarie 2025': {
        level: 'KRITISK (Stress-test)',
        description: 'Et stress-scenarie for 2025 antager, at skattesagen tabes, og at en stor kunde opsiger samarbejdet. Dette vil udløse en øjeblikkelig konkurs og sandsynligvis en kaskade af cross-konkurs i hele koncernstrukturen pga. interne lån.'
    }
};
type Scenario = keyof typeof scenarioData;

export const RiskView: React.FC = () => {
    const { riskHeatmapData, totalRiskScore } = useCaseData();
    const [activeScenario, setActiveScenario] = useState<Scenario>('Balancet vurdering');
    const currentScenario = scenarioData[activeScenario];

    const criticalCategoriesCount = riskHeatmapData.filter(r => r.riskLevel === 'KRITISK' || r.riskLevel === 'HØJ').length;

    const primaryDriversData = [...riskHeatmapData]
        .sort((a, b) => b.assignedScore - a.assignedScore)
        .slice(0, 2);

    const primaryDriversValue = primaryDriversData
        .map(r => {
            if (r.category === 'Financial') return 'Likviditet';
            if (r.category === 'Legal/Compliance') return 'Skat';
            return r.category;
        })
        .join(' & ');
        
    const primaryDriversSubValue = primaryDriversData
        .map(r => r.category)
        .join(' & ');

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold text-gray-200 mb-4">Risiko-oversigt</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <RiskKpiCard 
                        title="Samlet Risikoscore" 
                        value={`${totalRiskScore.score} / ${totalRiskScore.maxScore}`} 
                        subValue={currentScenario.level} 
                        icon={<ShieldAlert className="w-8 h-8"/>} 
                        color="red" 
                    />
                    <RiskKpiCard 
                        title="Primære Risikodrivere" 
                        value={primaryDriversValue} 
                        subValue={primaryDriversSubValue} 
                        icon={<Zap className="w-8 h-8"/>} 
                        color="orange" 
                    />
                    <RiskKpiCard 
                        title="Kritiske Kategorier" 
                        value={`${criticalCategoriesCount} / ${riskHeatmapData.length}`} 
                        subValue="Kategorier med 'Høj' eller 'Kritisk' risiko" 
                        icon={<AlertTriangle className="w-8 h-8"/>} 
                        color="yellow" 
                    />
                </div>
            </div>

            <div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                     <h2 className="text-xl font-bold text-gray-200">Detaljeret Risiko-Heatmap</h2>
                    <div className="flex items-center space-x-1 bg-component-dark p-1 rounded-lg border border-border-dark self-start">
                        {(Object.keys(scenarioData) as Scenario[]).map(scen => (
                            <button key={scen} onClick={() => setActiveScenario(scen)} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeScenario === scen ? 'bg-accent-green/20 text-accent-green' : 'text-gray-400 hover:bg-gray-700/50'}`}>
                                {scen}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-component-dark border border-border-dark rounded-lg overflow-x-auto scrollbar-hidden">
                    <table className="min-w-full divide-y divide-border-dark">
                        <thead className="bg-gray-800/50">
                            <tr>
                                <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Kategori</th>
                                <th scope="col" className="py-3 px-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">L/I</th>
                                <th scope="col" className="py-3 px-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Score</th>
                                <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Niveau</th>
                                <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Begrundelse</th>
                                <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Relationer</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark">
                            {riskHeatmapData.map(item => (
                                <tr key={item.category} className={`${getRiskColorClass(item.riskLevel)}`}>
                                    <td className="py-4 px-4 align-top font-semibold text-sm text-gray-200">{item.category}</td>
                                    <td className="py-4 px-2 align-top text-center">
                                        <div className="flex flex-col items-center font-mono text-xs">
                                            <span className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">L: {item.likelihood}/5</span>
                                            <span className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300 mt-1">I: {item.impact}/5</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-2 align-top text-center">
                                        <div className={`text-lg font-bold ${getRiskTextColorClass(item.riskLevel)}`}>{item.assignedScore}</div>
                                        <div className="text-xs text-gray-400">/ {item.maxScore}</div>
                                    </td>
                                    <td className="py-4 px-4 align-top">
                                        <Tag label={item.riskLevel} color={item.riskLevel === 'KRITISK' || item.riskLevel === 'HØJ' ? 'red' : item.riskLevel === 'MODERAT' ? 'yellow' : 'blue'} size="md"/>
                                    </td>
                                    <td className="py-4 px-4 align-top text-sm text-gray-300 min-w-[300px]">{item.justification}</td>
                                    <td className="py-4 px-4 align-top text-xs min-w-[250px]">
                                        <div className="space-y-2">
                                            <div>
                                                <p className="font-bold text-gray-500 mb-1">Hypoteser</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {item.linkedHypotheses.map(h => <Tag key={h} label={h} color="gray"/>)}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-500 mb-1">Views</p>
                                                <div className="flex flex-wrap gap-1">
                                                     {item.linkedViews.map(v => <Tag key={v} label={viewLabels[v] || v} color="blue"/>)}
                                                </div>
                                            </div>
                                             <div>
                                                <p className="font-bold text-gray-500 mb-1">Actions</p>
                                                <div className="flex flex-wrap gap-1">
                                                     {item.linkedActions.slice(0,1).map(a => <Tag key={a} label={a.length > 25 ? a.substring(0, 22) + '...' : a} color="green"/>)}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="mt-4 bg-component-dark p-4 rounded-lg border border-border-dark">
                    <h3 className="text-md font-bold text-gray-200 flex items-center">
                        Vurdering: <span className="ml-2 font-mono text-accent-green">{activeScenario}</span>
                        <InfoTooltip text="Skift mellem forskellige analytiske scenarier for at vurdere casens robusthed under forskellige antagelser." />
                    </h3>
                    <p className="text-sm text-gray-400 mt-2">{currentScenario.description}</p>
                </div>
            </div>
        </div>
    );
};
