import React, { useState, useMemo, memo } from 'react';
import { useCaseData } from '../../context/DataContext';
import { Hypothesis } from '../../types';
import { ChevronDown, CheckCircle, AlertCircle, XCircle, Link as LinkIcon, Lightbulb } from 'lucide-react';
import { Tag } from '../Shared/Tag';
import { useTranslation } from 'react-i18next';

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
    'Ekstrem': { color: 'red' },
} as const;

const categoryConfig: Record<Hypothesis['category'], { color: 'blue' | 'green' | 'yellow' | 'red' | 'gray' }> = {
    'Finansiel': { color: 'blue' },
    'Likviditet': { color: 'red' },
    'Skat/Compliance': { color: 'yellow' },
    'Operationel': { color: 'gray' },
    'Strategisk': { color: 'green' },
};

const statusLabelKeys: Record<Hypothesis['status'], string> = {
    'Bekræftet': 'hypotheses.status.confirmed',
    'Åben': 'hypotheses.status.open',
    'Afkræftet': 'hypotheses.status.rejected',
};

const impactLabelKeys: Record<Hypothesis['impact'], string> = {
    'Høj': 'hypotheses.impact.high',
    'Middel': 'hypotheses.impact.medium',
    'Lav': 'hypotheses.impact.low',
    'Ekstrem': 'hypotheses.impact.extreme',
};

const categoryLabelKeys: Record<Hypothesis['category'], string> = {
    'Finansiel': 'hypotheses.categories.financial',
    'Likviditet': 'hypotheses.categories.liquidity',
    'Skat/Compliance': 'hypotheses.categories.taxCompliance',
    'Operationel': 'hypotheses.categories.operational',
    'Strategisk': 'hypotheses.categories.strategic',
};

const evidenceLabelKeys: Record<Hypothesis['evidenceLevel'], string> = {
    'Indikation': 'hypotheses.evidence.indication',
    'Stærk Evidens': 'hypotheses.evidence.strong',
};

const viewLabelKeys: { [key in Hypothesis['relatedViews'][0]]: string } = {
    dashboard: 'hypotheses.views.dashboard',
    executive: 'hypotheses.views.executive',
    person: 'hypotheses.views.person',
    companies: 'hypotheses.views.companies',
    financials: 'hypotheses.views.financials',
    hypotheses: 'hypotheses.views.hypotheses',
    cashflow: 'hypotheses.views.cashflow',
    sector: 'hypotheses.views.sector',
    timeline: 'hypotheses.views.timeline',
    risk: 'hypotheses.views.risk',
    actions: 'hypotheses.views.actions',
    counterparties: 'hypotheses.views.counterparties',
    scenarios: 'hypotheses.views.scenarios',
    business: 'hypotheses.views.business',
    personal: 'hypotheses.views.personal',
    vault: 'hypotheses.views.vault',
    accessRequests: 'hypotheses.views.accessRequests',
};

const HypothesisCard: React.FC<{ hypothesis: Hypothesis }> = ({ hypothesis }) => {
    const [isOpen, setIsOpen] = useState(false);
    const sConf = statusConfig[hypothesis.status];
    const iConf = impactConfig[hypothesis.impact];
    const cConf = categoryConfig[hypothesis.category];
    const { t } = useTranslation();
    const impactLabel = t(impactLabelKeys[hypothesis.impact]);
    const categoryLabel = t(categoryLabelKeys[hypothesis.category]);
    const evidenceLabel = t(evidenceLabelKeys[hypothesis.evidenceLevel]);

    return (
        <div className="bg-component-dark rounded-lg border border-border-dark overflow-hidden flex flex-col">
            <button
                className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-800/40 focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:ring-inset"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls={`hypothesis-content-${hypothesis.id}`}
            >
                <div className="flex items-center min-w-0 flex-1">
                    <div className="mr-3 flex-shrink-0" aria-hidden="true">{sConf.icon}</div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-gray-200 truncate">{hypothesis.id}: {hypothesis.title}</h3>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{hypothesis.summary}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                    <Tag label={impactLabel} color={iConf.color} />
                    <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                    />
                </div>
            </button>
            <div
                id={`hypothesis-content-${hypothesis.id}`}
                className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                aria-hidden={!isOpen}
            >
                <div className="p-4 border-t border-border-dark bg-base-dark/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="md:col-span-2">
                            <h4 className="font-semibold text-gray-300 mb-1">{t('hypotheses.card.description')}</h4>
                            <ul className="list-disc list-inside text-gray-400 space-y-1">
                                {hypothesis.description.map((desc, i) => <li key={i}>{desc}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-2">{t('hypotheses.card.details')}</h4>
                            <div className="space-y-2">
                                <div className="flex items-center"><Tag label={categoryLabel} color={cConf.color} /></div>
                                <div className="flex items-center"><Tag label={evidenceLabel} color={hypothesis.evidenceLevel === 'Stærk Evidens' ? 'green' : 'yellow'} /></div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border-dark/50">
                        <h4 className="font-semibold text-gray-300 mb-2">{t('hypotheses.card.notesHeading')}</h4>
                        <p className="text-sm text-gray-400 italic mb-3">"{hypothesis.analysisNote}"</p>
                         <div className="flex items-center flex-wrap gap-2">
                            <LinkIcon className="w-4 h-4 text-gray-500" aria-hidden="true"/>
                            {hypothesis.relatedViews.map(view => {
                                const viewKey = viewLabelKeys[view];
                                const viewLabel = viewKey ? t(viewKey) : view;
                                return <Tag key={view} label={viewLabel} color="blue" />;
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const HypothesesView: React.FC = memo(() => {
    const { hypothesesData } = useCaseData();
    const [activeFilter, setActiveFilter] = useState<StatusFilter>('Alle');
    const { t } = useTranslation();

    const filteredHypotheses = useMemo(() => {
        if (activeFilter === 'Alle') return hypothesesData;
        return hypothesesData.filter(h => h.status === activeFilter);
    }, [hypothesesData, activeFilter]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-200">{t('hypotheses.heading.title')}</h2>
                <div
                    className="filter-bar bg-component-dark p-1 rounded-lg border border-border-dark"
                    role="group"
                    aria-label={t('hypotheses.filters.ariaLabel', 'Filter hypotheses by status')}
                >
                    {statusOptions.map(opt => (
                        <button
                            key={opt}
                            onClick={() => setActiveFilter(opt)}
                            aria-pressed={activeFilter === opt}
                            className={`filter-btn px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                                activeFilter === opt
                                ? 'active bg-accent-green/20 text-accent-green'
                                : 'text-gray-400 hover:bg-gray-700/50'
                            }`}
                        >
                            {opt === 'Alle' ? t('hypotheses.filters.all') : t(statusLabelKeys[opt])}
                        </button>
                    ))}
                </div>
            </div>

            {filteredHypotheses.length === 0 ? (
                <div className="empty-state" role="status" aria-live="polite">
                    <Lightbulb className="empty-state-icon" aria-hidden="true" />
                    <h3 className="empty-state-title">{t('hypotheses.empty.title', 'Ingen hypoteser fundet')}</h3>
                    <p className="empty-state-description">
                        {activeFilter === 'Alle'
                            ? t('hypotheses.empty.noData', 'Der er ingen hypoteser registreret for denne sag.')
                            : t('hypotheses.empty.noMatch', 'Ingen hypoteser matcher det valgte filter. Prøv at justere dine filtre.')}
                    </p>
                </div>
            ) : (
                <div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    style={{ gridAutoRows: 'min-content' }}
                >
                    {filteredHypotheses.map(hypo => (
                        <HypothesisCard key={hypo.id} hypothesis={hypo} />
                    ))}
                </div>
            )}
        </div>
    );
});
