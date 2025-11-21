import React from 'react';
import { useCaseData } from '../../context/DataContext';
import { User, MapPin, Briefcase, Shield, Search, GanttChart } from 'lucide-react';
import { Tag } from '../Shared/Tag';
import { NetworkGraph } from './NetworkGraph';
import { useTranslation } from 'react-i18next';

const ProfileInfo: React.FC<{icon: React.ReactNode, label: string, value: string}> = ({ icon, label, value }) => (
    <div className="flex items-start">
        <div className="w-6 h-6 mr-3 text-gray-400">{icon}</div>
        <div className="flex-1">
            <p className="font-semibold text-gray-400">{label}</p>
            <p className="text-gray-200">{value}</p>
        </div>
    </div>
);

const getRiskColor = (score: number): 'red' | 'yellow' | 'gray' => {
    if (score >= 50) return 'red';
    if (score >= 30) return 'yellow';
    return 'gray';
}

export const PersonView: React.FC = () => {
    const { personData, relationRiskData, networkNodes, networkEdges } = useCaseData();
    const { t } = useTranslation();

    const profileLabels = {
        primaryRole: t('person.profile.labels.primaryRole'),
        address: t('person.profile.labels.address'),
        addressHistory: t('person.profile.labels.addressHistory'),
        pepStatus: t('person.profile.labels.pepStatus'),
        socmint: t('person.profile.labels.socmint'),
    };

    return (
        <div className="space-y-8">
            <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
                <div className="flex items-center mb-6">
                    <User className="w-8 h-8 text-accent-green mr-4"/>
                    <h2 className="text-xl font-bold text-gray-200">{t('person.profile.heading', { name: personData.name })}</h2>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <ProfileInfo icon={<Briefcase size={20}/>} label={profileLabels.primaryRole} value={`${personData.primaryRole} ${personData.uboStatus}`} />
                    <ProfileInfo icon={<MapPin size={20}/>} label={profileLabels.address} value={personData.currentAddress} />
                    <ProfileInfo icon={<GanttChart size={20}/>} label={profileLabels.addressHistory} value={personData.addressHistory.join('; ')} />
                    <ProfileInfo icon={<Shield size={20}/>} label={profileLabels.pepStatus} value={`${personData.pepStatus} ${personData.sanctionsScreening}`} />
                    <ProfileInfo icon={<Search size={20}/>} label={profileLabels.socmint} value={personData.socmintProfile} />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-gray-200 mb-4">{t('person.network.heading')}</h3>
                <div className="bg-component-dark p-4 rounded-lg border border-border-dark">
                    <NetworkGraph nodes={networkNodes} edges={networkEdges} />
                </div>
            </div>

            <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
                <h3 className="text-lg font-bold text-gray-200 mb-4 border-b border-border-dark pb-3">{t('person.relationships.heading')}</h3>
                <div className="md:hidden">
                    <ul className="space-y-4">
                        {relationRiskData.map((rel) => (
                            <li key={rel.entity} className="bg-base-dark/50 p-4 rounded-md border border-border-dark">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-gray-200 pr-2">{rel.entity}</span>
                                    <div className="flex-shrink-0">
                                        <Tag label={`${rel.riskScore}/100`} color={getRiskColor(rel.riskScore)} />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400">{rel.role}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="hidden md:block">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border-dark">
                                <th scope="col" className="py-3 px-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('person.relationships.table.entity')}</th>
                                <th scope="col" className="py-3 px-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('person.relationships.table.role')}</th>
                                <th scope="col" className="py-3 px-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{t('person.relationships.table.riskScore')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {relationRiskData.map((rel) => (
                                <tr key={rel.entity} className="border-b border-border-dark/50 last:border-b-0 hover:bg-gray-800/40">
                                    <td className="py-4 px-2 whitespace-nowrap text-sm font-medium text-gray-200">{rel.entity}</td>
                                    <td className="py-4 px-2 whitespace-nowrap text-sm text-gray-400">{rel.role}</td>
                                    <td className="py-4 px-2 whitespace-nowrap text-sm text-right">
                                        <Tag label={`${rel.riskScore}/100`} color={getRiskColor(rel.riskScore)} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
