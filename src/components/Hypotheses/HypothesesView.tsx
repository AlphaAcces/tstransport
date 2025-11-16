import React, { useState, useMemo, memo } from 'react';
import { useCaseData } from '../../context/DataContext';
import { Hypothesis } from '../../types';
import { ChevronDown, CheckCircle, AlertCircle, XCircle, Link as LinkIcon } from 'lucide-react';
import { Tag } from '../Shared/Tag';

type StatusFilter = 'Alle' | Hypothesis['status'];

const statusOptions: StatusFilter[] = ['Alle', 'Bekræftet', 'Åben', 'Afkræftet'];

const statusConfig = {
    'Bekræftet': { color: 'green', icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
    'Åben': { color: 'yellow', icon: <AlertCircle className="w-5 h-5 text-yellow-500" /> },
    'Afkræftet': { color: 'gray', icon: <XCircle className="w-5 h-5 text-gray-500" /> },
} as const;

const impactConfig = {
    'Høj': { color: 'red' },
    'Middel': { color: 'yellow' },
    'Lav': { color: 'blue' },
} as const;

const categoryConfig: Record<Hypothesis['category'], { color: 'blue' | 'green' | 'yellow' | 'red' | 'gray' }> = {
    'Finansiel': { color: 'blue' },
    'Likviditet': { color: 'red' },
    'Skat/Compliance': { color: 'yellow' },
    'Operationel': { color: 'gray' },
    'Strategisk': { color: 'green' },
};

const viewLabels: { [key in Hypothesis['relatedViews'][0]]: string } = {
    dashboard: 'Dashboard',
    person: 'Person & Network',
    companies: 'Selskaber',
    financials: 'Financials',
    hypotheses: 'Hypoteser',
    cashflow: 'Cashflow & DSO',
    sector: 'Sector Analysis',
    timeline: 'Timeline',
    risk: 'Risk Heatmap',
    actions: 'Actionables',
    counterparties: 'Modparter',
    scenarios: 'Scenarier',
};

const HypothesisCard: React.FC<{ hypothesis: Hypothesis }> = ({ hypothesis }) => {
    const [isOpen, setIsOpen] = useState(false);
    const sConf = statusConfig[hypothesis.status];
    const iConf = impactConfig[hypothesis.impact];
    const cConf = categoryConfig[hypothesis.category];

    return (
        <div className="bg-component-dark rounded-lg border border-border-dark overflow-hidden flex flex-col h-full">
            <button 
                className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-800/40"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center">
                    <div className="mr-3">{sConf.icon}</div>
                    <div>
                        <h3 className="font-bold text-gray-200">{hypothesis.id}: {hypothesis.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">{hypothesis.summary}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                    <Tag label={hypothesis.impact} color={iConf.color} />
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-border-dark bg-base-dark/50 flex-grow">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="md:col-span-2">
                            <h4 className="font-semibold text-gray-300 mb-1">Beskrivelse</h4>
                            <ul className="list-disc list-inside text-gray-400 space-y-1">
                                {hypothesis.description.map((desc, i) => <li key={i}>{desc}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Detaljer</h4>
                            <div className="space-y-2">
                                <div className="flex items-center"><Tag label={hypothesis.category} color={cConf.color} /></div>
                                <div className="flex items-center"><Tag label={hypothesis.evidenceLevel} color={hypothesis.evidenceLevel === 'Stærk Evidens' ? 'green' : 'yellow'} /></div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border-dark/50">
                        <h4 className="font-semibold text-gray-300 mb-2">Note & Relationer</h4>
                        <p className="text-sm text-gray-400 italic mb-3">"{hypothesis.analysisNote}"</p>
                         <div className="flex items-center flex-wrap gap-2">
                            <LinkIcon className="w-4 h-4 text-gray-500"/>
                            {hypothesis.relatedViews.map(view => (
                                <Tag key={view} label={viewLabels[view]} color="blue" />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const HypothesesView: React.FC = memo(() => {
    const { hypothesesData } = useCaseData();
    const [activeFilter, setActiveFilter] = useState<StatusFilter>('Alle');

    const filteredHypotheses = useMemo(() => {
        if (activeFilter === 'Alle') return hypothesesData;
        return hypothesesData.filter(h => h.status === activeFilter);
    }, [hypothesesData, activeFilter]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-200">Hypotese-Dashboard</h2>
                <div className="flex items-center space-x-2 bg-component-dark p-1 rounded-lg border border-border-dark self-start">
                    {statusOptions.map(opt => (
                        <button 
                            key={opt}
                            onClick={() => setActiveFilter(opt)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                                activeFilter === opt 
                                ? 'bg-accent-green/20 text-accent-green' 
                                : 'text-gray-400 hover:bg-gray-700/50'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
                {filteredHypotheses.map(hypo => (
                    <HypothesisCard key={hypo.id} hypothesis={hypo} />
                ))}
            </div>
        </div>
    );
});