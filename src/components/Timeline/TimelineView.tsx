import React, { useState, useMemo } from 'react';
import { useCaseData } from '../../context/DataContext';
import { TimelineEvent } from '../../types';
import { TimelineEventCard } from './TimelineEventCard';
import { useTranslation } from 'react-i18next';

const FILTER_CONFIG = [
    { key: 'all', eventTypes: [] as TimelineEvent['type'][] },
    { key: 'structure', eventTypes: ['Etablering', 'Struktur'] as TimelineEvent['type'][] },
    { key: 'financial', eventTypes: ['Finansiel', 'Regnskab'] as TimelineEvent['type'][] },
    { key: 'address', eventTypes: ['Adresse'] as TimelineEvent['type'][] },
    { key: 'operational', eventTypes: ['Operationel'] as TimelineEvent['type'][] },
    { key: 'compliance', eventTypes: ['Compliance'] as TimelineEvent['type'][] },
] as const;

type FilterKey = typeof FILTER_CONFIG[number]['key'];

export const TimelineView: React.FC = () => {
    const { timelineData } = useCaseData();
    const { t } = useTranslation();

    const filters = useMemo(() => FILTER_CONFIG.map(config => ({
        ...config,
        label: t(`filters.${config.key}`),
    })), [t]);

    const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

    const filteredEvents = useMemo(() => {
        const sortedEvents = [...timelineData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (activeFilter === 'all') return sortedEvents;
        const typesToMatch = FILTER_CONFIG.find(config => config.key === activeFilter)?.eventTypes ?? [];
        return sortedEvents.filter(event => typesToMatch.includes(event.type));
    }, [timelineData, activeFilter]);

    const groupedEvents = useMemo(() => {
        return filteredEvents.reduce((acc, event) => {
            const year = new Date(event.date).getFullYear();
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(event);
            return acc;
        }, {} as Record<string, TimelineEvent[]>);
    }, [filteredEvents]);

    const sortedYears = useMemo(() => Object.keys(groupedEvents).sort((a, b) => Number(b) - Number(a)), [groupedEvents]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-xl font-bold text-gray-200">{t('heading')}</h2>
                <div className="flex items-center space-x-2 bg-component-dark p-1 rounded-lg border border-border-dark self-start">
                    {filters.map(filter => (
                        <button
                            key={filter.key}
                            onClick={() => setActiveFilter(filter.key)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                                activeFilter === filter.key
                                ? 'bg-accent-green/20 text-accent-green'
                                : 'text-gray-400 hover:bg-gray-700/50'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative border-l-2 border-border-dark ml-4">
                {sortedYears.map(year => (
                    <div key={year} className="relative mb-8">
                        <div className="sticky top-16 z-10 -ml-[calc(1rem+1px)] mb-4">
                            <h3 className="pl-12 py-1 bg-base-dark/80 backdrop-blur-sm text-lg font-bold text-gray-300">
                                {year}
                                <span className="text-xs font-mono text-gray-500 ml-2">{t('yearSummary', { count: groupedEvents[year].length })}</span>
                            </h3>
                        </div>
                        <div className="pl-8 space-y-8">
                            {groupedEvents[year].map((event, index) => (
                                <TimelineEventCard key={`${event.date}-${index}`} event={event} />
                            ))}
                        </div>
                    </div>
                ))}
                 {sortedYears.length === 0 && (
                    <div className="pl-8 pt-4">
                        <p className="text-gray-500">{t('noEvents')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
