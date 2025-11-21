import React, { useState, useMemo, useCallback } from 'react';
import { useCaseData } from '../../context/DataContext';
import { ActionItem } from '../../types';
import { Target, CheckCircle, AlertOctagon } from 'lucide-react';
import { ActionCard } from '../Shared/ActionCard';
import { useTranslation } from 'react-i18next';

const ACTION_STATUSES_KEY = 'tslActionStatuses';

type ActionStatusMap = { [key: string]: ActionItem['status'] };
type FilterOption = 'Alle' | 'Påkrævet' | ActionItem['category'];
type SortOption = 'Prioritet' | 'Kategori' | 'Tidshorisont';

const categoryLabelKeys: Record<ActionItem['category'], string> = {
  'Juridisk': 'categories.legal',
  'Efterretning': 'categories.intelligence',
  'Finansiel': 'categories.financial',
  'Kommerciel': 'categories.commercial',
  'Regulatorisk': 'categories.regulatory',
  'Governance': 'categories.governance',
  'Strategisk': 'categories.strategic',
};

const useActionStatuses = (initialActions: ActionItem[]): {
  actionsWithStatus: ActionItem[];
  updateStatus: (id: string, status: ActionItem['status']) => void;
} => {
  const [statuses, setStatuses] = useState<ActionStatusMap>(() => {
    try {
      const savedStatuses = localStorage.getItem(ACTION_STATUSES_KEY);
      return savedStatuses ? JSON.parse(savedStatuses) : {};
    } catch (error) {
      console.error("Could not load statuses from localStorage", error);
      return {};
    }
  });

  const updateStatus = useCallback((id: string, status: ActionItem['status']) => {
    setStatuses(prev => {
      const newStatuses = { ...prev, [id]: status };
      try {
        localStorage.setItem(ACTION_STATUSES_KEY, JSON.stringify(newStatuses));
      } catch (error) {
        console.error("Could not save statuses to localStorage", error);
      }
      return newStatuses;
    });
  }, []);

  const actionsWithStatus = useMemo(() => initialActions.map(action => ({
    ...action,
    status: statuses[action.id] || action.status,
  })), [initialActions, statuses]);

  return { actionsWithStatus, updateStatus };
};

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-component-dark p-4 rounded-lg border border-border-dark flex items-center">
    <div className="mr-4 text-accent-green">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-200">{value}</p>
    </div>
  </div>
);

const priorityOrder: Record<ActionItem['priority'], number> = {
  'Påkrævet': 1,
  'Høj': 2,
  'Middel': 3,
};
const timeHorizonOrder: Record<NonNullable<ActionItem['timeHorizon']>, number> = {
  '0-30 dage': 1,
  '1-3 mdr': 2,
  '3-12 mdr': 3,
};

export const ActionsView: React.FC = () => {
  const { actionsData } = useCaseData();
  const { actionsWithStatus, updateStatus } = useActionStatuses(actionsData);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('Alle');
  const [activeSort, setActiveSort] = useState<SortOption>('Prioritet');
  const { t } = useTranslation();

  const processedActions = useMemo(() => {
    const filtered = actionsWithStatus.filter(action => {
      if (activeFilter === 'Alle') return true;
      if (activeFilter === 'Påkrævet') return action.priority === 'Påkrævet';
      return action.category === activeFilter;
    });

    return filtered.sort((a, b) => {
      switch (activeSort) {
        case 'Kategori':
          return a.category.localeCompare(b.category) || (priorityOrder[a.priority] - priorityOrder[b.priority]);
        case 'Tidshorisont':
          const aTime = a.timeHorizon ? timeHorizonOrder[a.timeHorizon] : 99;
          const bTime = b.timeHorizon ? timeHorizonOrder[b.timeHorizon] : 99;
          return aTime - bTime || (priorityOrder[a.priority] - priorityOrder[b.priority]);
        case 'Prioritet':
        default:
          return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
    });
  }, [actionsWithStatus, activeFilter, activeSort]);

  const kpiValues = useMemo(() => {
    const requiredCount = actionsData.filter(a => a.priority === 'Påkrævet').length;
    const highPriorityOpenCount = actionsWithStatus.filter(a => a.priority === 'Høj' && a.status !== 'Afsluttet').length;
    const completedCount = actionsWithStatus.filter(a => a.status === 'Afsluttet').length;
    const progress = actionsData.length > 0 ? Math.round((completedCount / actionsData.length) * 100) : 0;
    return { requiredCount, highPriorityOpenCount, progress };
  }, [actionsWithStatus, actionsData]);

  const filterOptions: FilterOption[] = ['Alle', 'Påkrævet', 'Finansiel', 'Juridisk', 'Regulatorisk', 'Efterretning', 'Kommerciel', 'Governance', 'Strategisk'];
  const sortOptions: SortOption[] = ['Prioritet', 'Kategori', 'Tidshorisont'];

  const getFilterLabel = (option: FilterOption) => {
    if (option === 'Alle') return t('actions.filters.options.all');
    if (option === 'Påkrævet') return t('actions.filters.options.required');
    return t(`actions.${categoryLabelKeys[option]}`);
  };

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'Kategori':
        return t('actions.sort.options.category');
      case 'Tidshorisont':
        return t('actions.sort.options.horizon');
      case 'Prioritet':
      default:
        return t('actions.sort.options.priority');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-200 mb-6">{t('actions.heading.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KpiCard title={t('actions.kpis.required')} value={`${kpiValues.requiredCount}`} icon={<AlertOctagon className="w-8 h-8" />} />
          <KpiCard title={t('actions.kpis.highPriority')} value={`${kpiValues.highPriorityOpenCount}`} icon={<Target className="w-8 h-8" />} />
          <KpiCard title={t('actions.kpis.completion')} value={`${kpiValues.progress}%`} icon={<CheckCircle className="w-8 h-8" />} />
        </div>
      </div>

      <div className="bg-component-dark p-4 rounded-lg border border-border-dark space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-400">{t('actions.filters.label')}</span>
                 {filterOptions.map(opt => (
                    <button key={opt} onClick={() => setActiveFilter(opt)} className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${activeFilter === opt ? 'bg-accent-green/20 text-accent-green' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'}`}>
                        {getFilterLabel(opt)}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-2">
                 <span className="text-sm font-semibold text-gray-400">{t('actions.sort.label')}</span>
                 <select value={activeSort} onChange={e => setActiveSort(e.target.value as SortOption)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-md p-1.5 focus:ring-accent-green focus:border-accent-green">
                    {sortOptions.map(opt => <option key={opt}>{getSortLabel(opt)}</option>)}
                 </select>
            </div>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {processedActions.map(action => (
                <ActionCard key={action.id} action={action} onStatusChange={updateStatus} />
            ))}
        </div>
        {processedActions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
                <p>{t('actions.emptyState.noMatches')}</p>
            </div>
        )}
      </div>
    </div>
  );
};
