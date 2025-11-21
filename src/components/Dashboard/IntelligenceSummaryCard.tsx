import React, { useMemo } from 'react';
import { Info } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { Subject } from '../../types';

interface IntelligenceSummaryCardProps {
    activeSubject: Subject;
}

const bulletConfig = [
    { key: 'legal', color: 'text-red-400' },
    { key: 'financial', color: 'text-orange-400' },
    { key: 'governance', color: 'text-yellow-400' },
    { key: 'protection', color: 'text-blue-400' },
];

export const IntelligenceSummaryCard: React.FC<IntelligenceSummaryCardProps> = ({ activeSubject }) => {
    const { t } = useTranslation('dashboard');
    const isTsl = activeSubject === 'tsl';
    const title = isTsl ? t('summary.corporate.title') : t('summary.personal.title');

    const personalBullets = useMemo(() => (
        bulletConfig.map(({ key, color }) => ({
            key,
            color,
            label: t(`summary.personal.bullets.${key}.label`),
            body: t(`summary.personal.bullets.${key}.body`),
        }))
    ), [t]);

    return (
        <div className="bg-component-dark p-6 rounded-lg border border-border-dark h-full">
            <h3 className="text-md font-bold text-gray-200 mb-4 border-b border-border-dark pb-2 flex items-center">
                <Info className="w-4 h-4 mr-2 text-gray-400"/>
                {title}
            </h3>
            {isTsl ? (
                <p className="text-sm text-gray-300">
                    <Trans
                        i18nKey="summary.corporate.body"
                        ns="dashboard"
                        components={{
                            red: <span className="font-semibold text-red-400" />,
                            orange: <span className="font-semibold text-orange-400" />,
                            yellow: <span className="font-semibold text-yellow-400" />,
                        }}
                    />
                </p>
            ) : (
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                    {personalBullets.map(item => (
                        <li key={item.key}>
                            <span className={`font-semibold ${item.color}`}>{item.label}</span> {item.body}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
