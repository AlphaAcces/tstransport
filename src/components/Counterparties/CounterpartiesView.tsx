import React from 'react';
import { useCaseData } from '../../context/DataContext';
import { Tag } from '../Shared/Tag';
import { View } from '../../types';
import { Users, Link as LinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CounterpartiesViewProps {
    onNavigate: (view: View) => void;
}

const riskLevelColors: Record<'Høj' | 'Middel' | 'Lav', 'red' | 'yellow' | 'blue'> = {
    'Høj': 'red',
    'Middel': 'yellow',
    'Lav': 'blue',
};

const typeColors: Record<'Regulatorisk' | 'Rådgiver' | 'Kunde' | 'Finansiel' | 'Partner', 'red' | 'blue' | 'green' | 'yellow' | 'gray'> = {
    'Regulatorisk': 'red',
    'Rådgiver': 'blue',
    'Kunde': 'green',
    'Finansiel': 'yellow',
    'Partner': 'gray',
};

const typeLabelKeys: Record<'Regulatorisk' | 'Rådgiver' | 'Kunde' | 'Finansiel' | 'Partner', string> = {
    'Regulatorisk': 'types.regulatory',
    'Rådgiver': 'types.advisor',
    'Kunde': 'types.customer',
    'Finansiel': 'types.financial',
    'Partner': 'types.partner',
};

const riskLevelLabelKeys: Record<'Høj' | 'Middel' | 'Lav', string> = {
    'Høj': 'risk.high',
    'Middel': 'risk.medium',
    'Lav': 'risk.low',
};


export const CounterpartiesView: React.FC<CounterpartiesViewProps> = ({ onNavigate }) => {
    const { counterpartiesData } = useCaseData();
    const { t } = useTranslation();

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center">
                    <Users className="w-6 h-6 mr-3 text-gray-400" />
                    {t('heading', { subject: 'TSL' })}
                </h2>
            </div>
            <div className="bg-component-dark rounded-lg border border-border-dark overflow-x-auto scrollbar-hidden">
                <table className="min-w-full divide-y divide-border-dark">
                    <thead className="bg-gray-800/50">
                        <tr>
                            <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('table.headers.counterparty')}</th>
                            <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('table.headers.typeRisk')}</th>
                            <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('table.headers.description')}</th>
                            <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('table.headers.links')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dark">
                        {counterpartiesData.map(cp => (
                            <tr key={cp.id} className="hover:bg-gray-800/40">
                                <td className="py-4 px-4 align-top w-1/5">
                                    <p className="font-bold text-gray-200 text-sm">{cp.name}</p>
                                </td>
                                <td className="py-4 px-4 align-top w-1/6">
                                    <div className="flex flex-col gap-2 items-start">
                                        <Tag label={t(typeLabelKeys[cp.type])} color={typeColors[cp.type]} />
                                        <Tag label={t('labels.riskLevel', { level: t(riskLevelLabelKeys[cp.riskLevel]) })} color={riskLevelColors[cp.riskLevel]} />
                                    </div>
                                </td>
                                <td className="py-4 px-4 align-top w-2/5">
                                    <p className="text-sm font-semibold text-gray-300">{cp.relationType}</p>
                                    <p className="text-sm text-gray-400 mt-1">{cp.description}</p>
                                </td>
                                <td className="py-4 px-4 align-top w-1/5">
                                    <div className="flex flex-col gap-2 items-start text-xs">
                                        {cp.linkedRisks.length > 0 && (
                                            <button onClick={() => onNavigate('risk')} className="flex items-center text-blue-400 hover:text-blue-300">
                                                <LinkIcon className="w-3 h-3 mr-1.5"/> {t('links.viewRisks')}
                                            </button>
                                        )}
                                        {cp.linkedHypotheses.length > 0 && (
                                             <button onClick={() => onNavigate('hypotheses')} className="flex items-center text-blue-400 hover:text-blue-300">
                                                <LinkIcon className="w-3 h-3 mr-1.5"/> {t('links.viewHypotheses')}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
