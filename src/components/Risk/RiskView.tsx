import React, { useMemo, useState } from 'react';
import { useCaseData } from '../../context/DataContext';
import { RiskScore, View } from '../../types';
import { ShieldAlert, AlertTriangle, Zap } from 'lucide-react';
import { Tag } from '../Shared/Tag';
import { InfoTooltip } from '../Shared/InfoTooltip';
import { useTranslation } from 'react-i18next';

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

const SCENARIO_CONFIG = {
    balanced: {
        buttonKey: 'risk.scenarios.balanced.label',
        levelKey: 'risk.scenarios.balanced.level',
        descriptionKey: 'risk.scenarios.balanced.description',
    },
    eddStrict: {
        buttonKey: 'risk.scenarios.eddStrict.label',
        levelKey: 'risk.scenarios.eddStrict.level',
        descriptionKey: 'risk.scenarios.eddStrict.description',
    },
    stress2025: {
        buttonKey: 'risk.scenarios.stress.label',
        levelKey: 'risk.scenarios.stress.level',
        descriptionKey: 'risk.scenarios.stress.description',
    },
} as const;

type ScenarioKey = keyof typeof SCENARIO_CONFIG;

const CATEGORY_KEY_MAP: Record<RiskScore['category'], 'financial' | 'legalCompliance' | 'governance' | 'socmintReputation' | 'sectorOperations'> = {
    Financial: 'financial',
    'Legal/Compliance': 'legalCompliance',
    Governance: 'governance',
    'SOCMINT/Reputation': 'socmintReputation',
    'Sector/Operations': 'sectorOperations',
};

export const RiskView: React.FC = () => {
    const { riskHeatmapData, totalRiskScore } = useCaseData();
    const { t } = useTranslation(['risk', 'common', 'nav']);
    const [activeScenario, setActiveScenario] = useState<ScenarioKey>('balanced');

    const criticalCategoriesCount = riskHeatmapData.filter(r => r.riskLevel === 'KRITISK' || r.riskLevel === 'HØJ').length;

    const primaryDriversData = [...riskHeatmapData]
        .sort((a, b) => b.assignedScore - a.assignedScore)
        .slice(0, 2);

    const viewLabels = useMemo<Partial<Record<View, string>>>(() => ({
        cashflow: t('nav.cashflow'),
        financials: t('nav.financials'),
        timeline: t('nav.timeline'),
        actions: t('nav.actions'),
        companies: t('nav.companies'),
        person: t('nav.person'),
        sector: t('nav.sector'),
        hypotheses: t('nav.hypotheses'),
        risk: t('nav.risk'),
        executive: t('nav.executive'),
        dashboard: t('nav.dashboard'),
    }), [t]);

    const categoryLabels = useMemo(() => ({
        financial: t('risk.heatmap.categories.financial'),
        legalCompliance: t('risk.heatmap.categories.legalCompliance'),
        governance: t('risk.heatmap.categories.governance'),
        socmintReputation: t('risk.heatmap.categories.socmintReputation'),
        sectorOperations: t('risk.heatmap.categories.sectorOperations'),
    }), [t]);

    const categoryJustifications = useMemo(() => ({
        financial: t('risk.heatmap.justifications.financial'),
        legalCompliance: t('risk.heatmap.justifications.legalCompliance'),
        governance: t('risk.heatmap.justifications.governance'),
        socmintReputation: t('risk.heatmap.justifications.socmintReputation'),
        sectorOperations: t('risk.heatmap.justifications.sectorOperations'),
    }), [t]);

    const primaryDriversValue = primaryDriversData
        .map(r => t(`risk.primaryDrivers.${CATEGORY_KEY_MAP[r.category]}`))
        .join(t('common.delimiters.and'));

    const primaryDriversSubValue = primaryDriversData
        .map(r => categoryLabels[CATEGORY_KEY_MAP[r.category]] ?? r.category)
        .join(t('common.delimiters.and'));

    const riskLevelLabels = useMemo(() => ({
        KRITISK: t('risk.levels.critical'),
        HØJ: t('risk.levels.high'),
        MODERAT: t('risk.levels.medium'),
        LAV: t('risk.levels.low'),
    }), [t]);

    const scenarioOptions = useMemo(
        () => (Object.keys(SCENARIO_CONFIG) as ScenarioKey[]).map(key => ({
            key,
            label: t(SCENARIO_CONFIG[key].buttonKey),
        })),
        [t]
    );

    const scenarioSummary = useMemo(() => {
        const config = SCENARIO_CONFIG[activeScenario];
        return {
            title: t(config.buttonKey),
            level: t(config.levelKey),
            description: t(config.descriptionKey),
        };
    }, [activeScenario, t]);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold text-gray-200 mb-4">{t('risk.heading')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <RiskKpiCard
                        title={t('risk.kpi.total.title')}
                        value={`${totalRiskScore.score} / ${totalRiskScore.maxScore}`}
                        subValue={scenarioSummary.level}
                        icon={<ShieldAlert className="w-8 h-8"/>}
                        color="red"
                    />
                    <RiskKpiCard
                        title={t('risk.kpi.primaryDrivers.title')}
                        value={primaryDriversValue}
                        subValue={primaryDriversSubValue}
                        icon={<Zap className="w-8 h-8"/>}
                        color="orange"
                    />
                    <RiskKpiCard
                        title={t('risk.kpi.criticalCategories.title')}
                        value={`${criticalCategoriesCount} / ${riskHeatmapData.length}`}
                        subValue={t('risk.kpi.criticalCategories.note')}
                        icon={<AlertTriangle className="w-8 h-8"/>}
                        color="yellow"
                    />
                </div>
            </div>

            <div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                     <h2 className="text-xl font-bold text-gray-200">{t('risk.heatmap.heading')}</h2>
                    <div className="flex items-center space-x-1 bg-component-dark p-1 rounded-lg border border-border-dark self-start">
                        {scenarioOptions.map(option => (
                            <button
                                key={option.key}
                                onClick={() => setActiveScenario(option.key)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeScenario === option.key ? 'bg-accent-green/20 text-accent-green' : 'text-gray-400 hover:bg-gray-700/50'}`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-component-dark border border-border-dark rounded-lg overflow-x-auto scrollbar-hidden">
                    <table className="min-w-full divide-y divide-border-dark">
                        <thead className="bg-gray-800/50">
                            <tr>
                                <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('risk.heatmap.columns.category')}</th>
                                <th scope="col" className="py-3 px-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">{t('risk.heatmap.columns.likelihoodImpact')}</th>
                                <th scope="col" className="py-3 px-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">{t('risk.heatmap.columns.score')}</th>
                                <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('risk.heatmap.columns.level')}</th>
                                <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('risk.heatmap.columns.justification')}</th>
                                <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('risk.heatmap.columns.relations')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark">
                            {riskHeatmapData.map(item => (
                                <tr key={item.category} className={`${getRiskColorClass(item.riskLevel)}`}>
                                    <td className="py-4 px-4 align-top font-semibold text-sm text-gray-200">{categoryLabels[CATEGORY_KEY_MAP[item.category]] ?? item.category}</td>
                                    <td className="py-4 px-2 align-top text-center">
                                        <div className="flex flex-col items-center font-mono text-xs">
                                            <span className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">{t('risk.heatmap.likelihoodLabel', { value: item.likelihood })}</span>
                                            <span className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300 mt-1">{t('risk.heatmap.impactLabel', { value: item.impact })}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-2 align-top text-center">
                                        <div className={`text-lg font-bold ${getRiskTextColorClass(item.riskLevel)}`}>{item.assignedScore}</div>
                                        <div className="text-xs text-gray-400">/ {item.maxScore}</div>
                                    </td>
                                    <td className="py-4 px-4 align-top">
                                        <Tag label={riskLevelLabels[item.riskLevel] ?? item.riskLevel} color={item.riskLevel === 'KRITISK' || item.riskLevel === 'HØJ' ? 'red' : item.riskLevel === 'MODERAT' ? 'yellow' : 'blue'} size="md"/>
                                    </td>
                                    <td className="py-4 px-4 align-top text-sm text-gray-300 min-w-[300px]">{categoryJustifications[CATEGORY_KEY_MAP[item.category]] ?? item.justification}</td>
                                    <td className="py-4 px-4 align-top text-xs min-w-[250px]">
                                        <div className="space-y-2">
                                            <div>
                                                <p className="font-bold text-gray-500 mb-1">{t('risk.heatmap.sections.hypotheses')}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {item.linkedHypotheses.map(h => <Tag key={h} label={h} color="gray"/>)}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-500 mb-1">{t('risk.heatmap.sections.views')}</p>
                                                <div className="flex flex-wrap gap-1">
                                                     {item.linkedViews.map(v => <Tag key={v} label={viewLabels[v] || v} color="blue"/>)}
                                                </div>
                                            </div>
                                             <div>
                                                <p className="font-bold text-gray-500 mb-1">{t('risk.heatmap.sections.actions')}</p>
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
                        {t('risk.scenarios.heading')}: <span className="ml-2 font-mono text-accent-green">{scenarioSummary.title}</span>
                        <InfoTooltip text={t('risk.heatmap.tooltip')} />
                    </h3>
                    <p className="text-sm text-gray-400 mt-2">{scenarioSummary.description}</p>
                </div>
            </div>
        </div>
    );
};
