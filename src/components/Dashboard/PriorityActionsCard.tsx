import React from 'react';
import { View, ActionItem } from '../../types';
import { ArrowRight, ListChecks } from 'lucide-react';
import { Tag } from '../Shared/Tag';
import { useEnrichedCaseData } from '../../context/DataContext';

interface PriorityActionsCardProps {
    onNavigate: (view: View) => void;
}

const priorityOrder: Record<ActionItem['priority'], number> = {
    'Påkrævet': 1,
    'Høj': 2,
    'Middel': 3,
};

const priorityColorMap: Record<ActionItem['priority'], 'red' | 'yellow' | 'blue'> = {
    'Påkrævet': 'red',
    'Høj': 'yellow',
    'Middel': 'blue'
}

export const PriorityActionsCard: React.FC<PriorityActionsCardProps> = ({ onNavigate }) => {
    const { priorityActions } = useEnrichedCaseData();

    const topActions = [...priorityActions]
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        .slice(0, 3);

    return (
        <div className="bg-component-dark p-6 rounded-lg border border-border-dark h-full flex flex-col">
            <h3 className="text-md font-bold text-gray-200 mb-4 border-b border-border-dark pb-2 flex items-center">
                <ListChecks className="w-4 h-4 mr-2 text-gray-400"/>
                Top-prioriterede Handlinger
            </h3>
            <div className="space-y-4 text-sm flex-grow">
                {topActions.map(action => (
                    <div key={action.id}>
                        <p className="font-semibold text-gray-300">{action.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <Tag label={action.priority} color={priorityColorMap[action.priority]} />
                           {action.timeHorizon && <Tag label={action.timeHorizon} color="gray" />}
                        </div>
                    </div>
                ))}
                 {topActions.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">Ingen handlinger at vise.</p>
                )}
            </div>
             <button onClick={() => onNavigate('actions')} className="w-full mt-4 text-center flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 bg-gray-700/50 text-gray-300 hover:bg-accent-green/10 hover:text-accent-green">
                Se alle handlinger <ArrowRight className="w-4 h-4 ml-2"/>
            </button>
        </div>
    );
};
