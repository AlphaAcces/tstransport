
import React, { useState } from 'react';
import { ActionItem, View } from '../../types';
import { Tag } from './Tag';
import { Link as LinkIcon, Copy, Check } from 'lucide-react';

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

const viewLabels: { [key in View]?: string } = {
  cashflow: 'Cashflow',
  risk: 'Risk',
  timeline: 'Timeline',
  hypotheses: 'Hypoteser',
  companies: 'Selskaber',
  person: 'Person',
  sector: 'Sektor',
  financials: 'Finansiel'
};

interface ActionCardProps {
    action: ActionItem;
    onStatusChange: (id: string, status: ActionItem['status']) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({ action, onStatusChange }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const textToCopy = `[${action.title}] — ${action.description}\nPrioritet: ${action.priority}\nKategori: ${action.category}\nKilde: ${action.sourceId || 'ingen'}`;
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
            <Tag label={action.priority} color={priorityConfig[action.priority].color} />
          </div>
          <div className="mt-1">
            <Tag label={action.category} color={categoryConfig[action.category].color} />
          </div>
          <p className="text-sm text-gray-400 mt-3">{action.description}</p>
        </div>
        <div className="p-4 border-t border-border-dark/50 text-xs space-y-3">
          <div>
            <span className="font-semibold text-gray-500 block mb-1">Status & Tidshorisont</span>
            <div className="flex items-center gap-2">
              <select
                value={action.status}
                onChange={(e) => onStatusChange(action.id, e.target.value as ActionItem['status'])}
                className="bg-gray-700 border border-gray-600 text-white text-xs rounded-md p-1 focus:ring-accent-green focus:border-accent-green"
              >
                <option>Ikke startet</option>
                <option>I gang</option>
                <option>Afsluttet</option>
              </select>
              {action.timeHorizon && <Tag label={action.timeHorizon} color="gray" />}
            </div>
          </div>
          <div>
            <span className="font-semibold text-gray-500">Forventet Evidens: </span>
            <span className="text-gray-400 italic">{action.evidenceType}</span>
          </div>
           <div className="flex items-center gap-4">
              {(action.sourceUrl || action.sourceId) && (
                <a 
                    href={action.sourceUrl || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    title={action.sourceId || 'Se kildedokument'}
                    className="flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    onClick={(e) => !action.sourceUrl && e.preventDefault()}
                >
                    <LinkIcon className="w-3 h-3 mr-1" />
                    Vis kilde
                </a>
              )}
               <button 
                    onClick={handleCopy} 
                    className="flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                    {copied ? (
                        <>
                            <Check className="w-3 h-3 mr-1 text-accent-green" />
                            <span className="text-accent-green">Kopieret!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-3 h-3 mr-1" />
                            KOPIÉR
                        </>
                    )}
                </button>
           </div>
        </div>
        <div className="p-4 border-t border-border-dark/50 text-xs">
            <span className="font-semibold text-gray-500 block mb-2">Relationer</span>
            <div className="flex flex-wrap gap-1">
                {action.linkedHypotheses?.map(h => <Tag key={h} label={h} color="yellow" />)}
                {action.linkedRisks?.map(r => <Tag key={r} label={r.split('/')[0]} color="red" />)}
                {action.linkedViews?.map(v => <Tag key={v} label={viewLabels[v] || v} color="blue" />)}
            </div>
        </div>
      </div>
    );
};