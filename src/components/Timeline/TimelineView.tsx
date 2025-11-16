import React, { useState, useMemo, useCallback } from 'react';
import { useCaseData } from '../../context/DataContext';
import { TimelineEvent } from '../../types';
import { TimelineEventCard } from './TimelineEventCard';

const FILTERS = ['Alle', 'Struktur', 'Finansiel', 'Adresse', 'Operationel', 'Skat/Compliance'] as const;
type FilterType = typeof FILTERS[number];

const filterMap: Record<FilterType, TimelineEvent['type'][]> = {
    'Alle': [],
    'Struktur': ['Etablering', 'Struktur'],
    'Finansiel': ['Finansiel', 'Regnskab'],
    'Adresse': ['Adresse'],
    'Operationel': ['Operationel'],
    'Skat/Compliance': ['Compliance'],
};

export const TimelineView: React.FC = () => {
    const { timelineData } = useCaseData();

    const [events, setEvents] = useState<TimelineEvent[]>(() => 
        [...timelineData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
    const [activeFilter, setActiveFilter] = useState<FilterType>('Alle');

    const filteredEvents = useMemo(() => {
        const sortedEvents = [...timelineData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (activeFilter === 'Alle') return sortedEvents;
        const typesToMatch = filterMap[activeFilter];
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
                <h2 className="text-xl font-bold text-gray-200">Kronologisk Tidslinje</h2>
                <div className="flex items-center space-x-2 bg-component-dark p-1 rounded-lg border border-border-dark self-start">
                    {FILTERS.map(filter => (
                        <button 
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                                activeFilter === filter 
                                ? 'bg-accent-green/20 text-accent-green' 
                                : 'text-gray-400 hover:bg-gray-700/50'
                            }`}
                        >
                            {filter}
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
                                <span className="text-xs font-mono text-gray-500 ml-2">({groupedEvents[year].length} events)</span>
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
                        <p className="text-gray-500">Ingen hændelser for det valgte filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
