import React, { useState } from 'react';
import { ActionItem, View } from '../../types';
import { Tag } from './Tag';
import { Link as LinkIcon, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const priorityConfig: Record<ActionItem['priority'], { color: 'red' | 'yellow' | 'blue' }> = {
  'Påkrævet': { color: 'red' },
  'Høj': { color: 'yellow' },
  'Middel': { color: 'blue' },
};

// FIX: Add 'Strategisk' to match the ActionItem['category'] type from types.ts
const categoryConfig: Record<ActionItem['category'], { color: 'blue' | 'green' | 'yellow' | 'gray' }> = {
  'Juridisk': { color: 'blue' },
  'Finansiel': { color: 'green' },
  'Efterretning': { color: 'yellow' },
  'Kommerciel': { color: 'gray' },
  'Regulatorisk': { color: 'blue' },
  'Governance': { color: 'blue' },
  'Strategisk': { color: 'green' },
};

const viewLabelKeys: { [key in View]?: string } = {
  cashflow: 'views.cashflow',
  risk: 'views.risk',
  timeline: 'views.timeline',
  hypotheses: 'views.hypotheses',
  companies: 'views.companies',
  person: 'views.person',
  sector: 'views.sector',
  financials: 'views.financials'
};

const categoryLabelKeys: Record<ActionItem['category'], string> = {
  'Juridisk': 'categories.legal',
  'Efterretning': 'categories.intelligence',
  'Finansiel': 'categories.financial',
  'Kommerciel': 'categories.commercial',
  'Regulatorisk': 'categories.regulatory',
  'Governance': 'categories.governance',
  'Strategisk': 'categories.strategic',
};

const priorityLabelKeys: Record<ActionItem['priority'], string> = {
  'Påkrævet': 'priorities.required',
  'Høj': 'priorities.high',
  'Middel': 'priorities.medium'
};

const statusLabelKeys: Record<ActionItem['status'], string> = {
  'Ikke startet': 'card.statusOptions.notStarted',
  'I gang': 'card.statusOptions.inProgress',
  'Afsluttet': 'card.statusOptions.completed'
};

const horizonLabelKeys: Record<NonNullable<ActionItem['timeHorizon']>, string> = {
  '0-30 dage': 'horizons.short',
  '1-3 mdr': 'horizons.mid',
  '3-12 mdr': 'horizons.long'
};

interface ActionCardProps {
    action: ActionItem;
    onStatusChange: (id: string, status: ActionItem['status']) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({ action, onStatusChange }) => {
    const [copied, setCopied] = useState(false);
    const { t } = useTranslation();

    const priorityLabel = t(`actions.${priorityLabelKeys[action.priority]}`);
    const categoryLabel = t(`actions.${categoryLabelKeys[action.category]}`);

    const getStatusLabel = (status: ActionItem['status']) => t(`actions.${statusLabelKeys[status]}`);
    const getHorizonLabel = (horizon: NonNullable<ActionItem['timeHorizon']>) => t(`actions.${horizonLabelKeys[horizon]}`);
    const getViewLabel = (view: View) => {
      const key = viewLabelKeys[view];
      return key ? t(`actions.${key}`) : view;
    };

    const handleCopy = () => {
        const textToCopy = `[${action.title}] — ${action.description}\n${t('actions.card.copy.priority')}: ${priorityLabel}\n${t('actions.card.copy.category')}: ${categoryLabel}\n${t('actions.card.copy.source')}: ${action.sourceId || t('actions.card.copy.noSource')}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
      <div className="bg-component-dark rounded-lg border border-border-dark flex flex-col h-full">
        <div className="p-4 flex-grow">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-gray-200 pr-2">{action.title}</h3>
            <Tag label={priorityLabel} color={priorityConfig[action.priority].color} />
          </div>
          <div className="mt-1">
            <Tag label={categoryLabel} color={categoryConfig[action.category].color} />
          </div>
          <p className="text-sm text-gray-400 mt-3">{action.description}</p>
        </div>
        <div className="p-4 border-t border-border-dark/50 text-xs space-y-3">
          <div>
            <span className="font-semibold text-gray-500 block mb-1">{t('actions.card.statusHeading')}</span>
            <div className="flex items-center gap-2">
              <select
                value={action.status}
                onChange={(e) => onStatusChange(action.id, e.target.value as ActionItem['status'])}
                className="bg-gray-700 border border-gray-600 text-white text-xs rounded-md p-1 focus:ring-accent-green focus:border-accent-green"
              >
                <option value="Ikke startet">{getStatusLabel('Ikke startet')}</option>
                <option value="I gang">{getStatusLabel('I gang')}</option>
                <option value="Afsluttet">{getStatusLabel('Afsluttet')}</option>
              </select>
              {action.timeHorizon && <Tag label={getHorizonLabel(action.timeHorizon)} color="gray" />}
            </div>
          </div>
          <div>
            <span className="font-semibold text-gray-500">{t('actions.card.evidenceHeading')} </span>
            <span className="text-gray-400 italic">{action.evidenceType}</span>
          </div>
           <div className="flex items-center gap-4">
              {(action.sourceUrl || action.sourceId) && (
                <a
                    href={action.sourceUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={action.sourceId || t('actions.card.viewSource')}
                    className="flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    onClick={(e) => !action.sourceUrl && e.preventDefault()}
                >
                    <LinkIcon className="w-3 h-3 mr-1" />
                    {t('actions.card.viewSource')}
                </a>
              )}
               <button
                    onClick={handleCopy}
                    className="flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                    {copied ? (
                        <>
                            <Check className="w-3 h-3 mr-1 text-accent-green" />
                            <span className="text-accent-green">{t('actions.card.copy.copied')}</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-3 h-3 mr-1" />
                            {t('actions.card.copy.button')}
                        </>
                    )}
                </button>
           </div>
        </div>
        <div className="p-4 border-t border-border-dark/50 text-xs">
            <span className="font-semibold text-gray-500 block mb-2">{t('actions.card.relationsHeading')}</span>
            <div className="flex flex-wrap gap-1">
                {action.linkedHypotheses?.map(h => <Tag key={h} label={h} color="yellow" />)}
                {action.linkedRisks?.map(r => <Tag key={r} label={r.split('/')[0]} color="red" />)}
                {action.linkedViews?.map(v => <Tag key={v} label={getViewLabel(v)} color="blue" />)}
            </div>
        </div>
      </div>
    );
};
