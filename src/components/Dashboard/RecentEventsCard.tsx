import React from 'react';
import { useCaseData } from '../../context/DataContext';
import { TimelineEvent } from '../../types';
import { Building, Calendar, Landmark, HandCoins, Wrench, MapPin, ShieldAlert } from 'lucide-react';

const typeConfig: Record<TimelineEvent['type'], { icon: React.ReactNode; }> = {
    'Etablering': { icon: <Building className="h-5 w-5 text-blue-400" /> },
    'Regnskab': { icon: <Calendar className="h-5 w-5 text-indigo-400" /> },
    'Struktur': { icon: <Landmark className="h-5 w-5 text-purple-400" /> },
    'Finansiel': { icon: <HandCoins className="h-5 w-5 text-green-400" /> },
    'Operationel': { icon: <Wrench className="h-5 w-5 text-orange-400" /> },
    'Adresse': { icon: <MapPin className="h-5 w-5 text-yellow-400" /> },
    'Compliance': { icon: <ShieldAlert className="h-5 w-5 text-red-400" /> }
};

export const RecentEventsCard: React.FC = () => {
    const { timelineData } = useCaseData();
    const recentEvents = [...timelineData]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);
    
    return (
        <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
             <h3 className="text-md font-bold text-gray-200 mb-4 border-b border-border-dark pb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-400"/>
                Seneste Hændelser (fra Timeline)
            </h3>
            <div className="space-y-4">
                {recentEvents.map((event, index) => (
                    <div key={index} className="flex items-start">
                        <div className="mr-3 mt-1 flex-shrink-0">
                            {typeConfig[event.type]?.icon || <Calendar className="h-5 w-5 text-gray-400"/>}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-200">{event.title}</p>
                            <p className="text-xs text-gray-400">{event.description.substring(0, 80)}...</p>
                            <p className="text-xs text-gray-500 font-mono mt-1">{new Date(event.date).toLocaleDateString('da-DK')} - Kilde: {event.source}</p>
                        </div>
                    </div>
                ))}
                {recentEvents.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">Ingen hændelser at vise.</p>
                )}
            </div>
        </div>
    );
};
