import React, { useState } from 'react';
import { useCaseData } from '../../context/DataContext';
import { Company } from '../../types';
import { OwnershipStructure } from './OwnershipStructure';
import { Tag } from '../Shared/Tag';
import { CompanyDetailModal } from './CompanyDetailModal';
import { useTranslation } from 'react-i18next';

const statusKeyByValue: Record<string, 'active' | 'historical'> = {
    Aktiv: 'active',
    Historisk: 'historical'
};

const getStatusColor = (status: string): 'green' | 'yellow' | 'gray' => {
    const statusKey = statusKeyByValue[status];
    switch (statusKey) {
        case 'active':
            return 'green';
        case 'historical':
            return 'yellow';
        default:
            return 'gray';
    }
};

export const CompaniesView: React.FC = () => {
    const { companiesData } = useCaseData();
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const { t } = useTranslation();

    const rolePriority: { [key: string]: number } = {
        'Drift (Vognmand)': 1,
        'Holding': 2,
        'Ejendom': 3,
        'Bilsalg': 4,
        'Historisk': 5,
    };

    const sortedCompanies = [...companiesData].sort((a, b) => {
        const priorityA = rolePriority[a.role] || 99;
        const priorityB = rolePriority[b.role] || 99;
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        return a.name.localeCompare(b.name);
    });

    const getStatusLabel = (status: string) => {
        const statusKey = statusKeyByValue[status];
        return statusKey ? t(`companies.status.${statusKey}`) : status;
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold text-gray-200 mb-4">{t('companies.heading.structure')}</h2>
                <div className="bg-component-dark p-4 rounded-lg border border-border-dark">
                    <OwnershipStructure />
                </div>
            </div>

            <div>
                 <h2 className="text-xl font-bold text-gray-200 mb-4">{t('companies.heading.overview')}</h2>
                 <div className="bg-component-dark rounded-lg border border-border-dark">
                    <div className="hidden md:grid md:grid-cols-12 px-4 py-3 bg-gray-800/50 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        <div className="col-span-4">{t('companies.table.company')}</div>
                        <div className="col-span-2">{t('companies.table.cvr')}</div>
                        <div className="col-span-3">{t('companies.table.role')}</div>
                        <div className="col-span-3 text-right">{t('companies.table.status')}</div>
                    </div>
                    <div className="divide-y divide-border-dark/50">
                        {sortedCompanies.map((company) => (
                            <div
                                key={company.id}
                                className="grid grid-cols-1 md:grid-cols-12 gap-y-2 p-4 cursor-pointer hover:bg-gray-800/40 transition-colors duration-150"
                                onClick={() => setSelectedCompany(company)}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => e.key === 'Enter' && setSelectedCompany(company)}
                            >
                                <div className="md:col-span-4 flex flex-col">
                                    <span className="font-bold text-gray-200">{company.name}</span>
                                    <span className="text-sm text-gray-500 md:hidden">{company.role}</span>
                                </div>
                                <div className="md:col-span-2">
                                    <span className="text-xs font-medium text-gray-500 md:hidden mr-2">{t('companies.table.mobile.cvrLabel')}</span>
                                    <span className="font-mono text-sm text-gray-400">{company.cvr}</span>
                                </div>
                                <div className="hidden md:flex md:col-span-3 items-center text-sm text-gray-400">
                                    {company.role}
                                </div>
                                <div className="md:col-span-3 flex justify-end items-center">
                                     <div className="mt-2 md:mt-0">
                                        <Tag label={getStatusLabel(company.status)} color={getStatusColor(company.status)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
            </div>

            <CompanyDetailModal
                company={selectedCompany}
                onClose={() => setSelectedCompany(null)}
            />
        </div>
    );
};
