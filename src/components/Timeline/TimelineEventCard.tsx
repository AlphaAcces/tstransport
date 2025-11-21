import React, { useMemo } from 'react';
import { TimelineEvent } from '../../types';
import { Building, Calendar, Landmark, HandCoins, Wrench, ShieldAlert, MapPin, Link as LinkIcon } from 'lucide-react';
import { Tag } from '../Shared/Tag';
import { useTranslation } from 'react-i18next';

interface TimelineEventCardProps {
    event: TimelineEvent;
}

// FIX: Mapped color values to those accepted by the Tag component (e.g., 'orange' to 'yellow').
const EVENT_TYPE_META: Record<TimelineEvent['type'], { icon: React.ReactNode; color: 'blue' | 'green' | 'yellow' | 'red'; labelKey: string; contextKeys?: string[] }> = {
    'Etablering': { icon: <Building className="h-5 w-5 text-blue-400" />, color: 'blue', labelKey: 'timeline.eventTypes.establishment', contextKeys: ['nav.companies', 'nav.person'] },
    'Regnskab': { icon: <Calendar className="h-5 w-5 text-indigo-400" />, color: 'blue', labelKey: 'timeline.eventTypes.accounts', contextKeys: ['nav.financials'] },
    'Struktur': { icon: <Landmark className="h-5 w-5 text-purple-400" />, color: 'blue', labelKey: 'timeline.eventTypes.structure', contextKeys: ['nav.companies', 'nav.person'] },
    'Finansiel': { icon: <HandCoins className="h-5 w-5 text-green-400" />, color: 'green', labelKey: 'timeline.eventTypes.financial', contextKeys: ['nav.financials', 'nav.cashflow'] },
    'Operationel': { icon: <Wrench className="h-5 w-5 text-orange-400" />, color: 'yellow', labelKey: 'timeline.eventTypes.operational', contextKeys: ['nav.sector'] },
    'Adresse': { icon: <MapPin className="h-5 w-5 text-yellow-400" />, color: 'yellow', labelKey: 'timeline.eventTypes.address' },
    'Compliance': { icon: <ShieldAlert className="h-5 w-5 text-red-400" />, color: 'red', labelKey: 'timeline.eventTypes.compliance', contextKeys: ['nav.risk', 'nav.actions', 'nav.hypotheses'] }
};

export const TimelineEventCard: React.FC<TimelineEventCardProps> = ({ event }) => {
    const { t, i18n } = useTranslation(['timeline', 'nav']);

    const config = EVENT_TYPE_META[event.type];
    const locale = useMemo(() => (i18n.language === 'da' ? 'da-DK' : 'en-GB'), [i18n.language]);
    const contextualTags = useMemo(() => config.contextKeys?.map(key => t(key)) ?? [], [config.contextKeys, t]);
    const label = t(config.labelKey);
    const formattedDate = useMemo(() => new Date(event.date).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }), [event.date, locale]);
    const sourceTooltip = event.sourceId ? t('timeline.sourceTooltip', { sourceId: event.sourceId }) : t('timeline.viewSource');

    return (
        <div className="relative">
            <div className="absolute -left-[38px] top-1 h-6 w-6 bg-component-dark rounded-full border-2 border-border-dark flex items-center justify-center">
                {config.icon}
            </div>
            <div className="bg-component-dark p-4 rounded-lg border border-border-dark/70 hover:border-border-dark transition-colors duration-200">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                    <div>
                        <p className="text-xs text-gray-400 font-mono mb-1">
                            {formattedDate}
                        </p>
                        <h3 className="font-bold text-gray-200">{event.title}</h3>
                    </div>
                    <div className="mt-2 sm:mt-0 sm:ml-2 flex-shrink-0">
                         <Tag label={label} color={config.color} />
                    </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">{event.description}</p>
                <div className="flex flex-col sm:flex-row justify-between items-start mt-4 pt-3 border-t border-border-dark/50 gap-2">
                    <div className="flex items-center gap-4">
                        <p className="text-xs text-gray-500">{t('timeline.sourceLabel')}: {event.source}</p>
                        {(event.sourceUrl || event.sourceId) && (
                            <a
                                href={event.sourceUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={sourceTooltip}
                                className="flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                onClick={(e) => !event.sourceUrl && e.preventDefault()}
                            >
                                <LinkIcon className="w-3 h-3 mr-1" />
                                {t('timeline.viewSource')}
                            </a>
                        )}
                    </div>
                    {contextualTags.length > 0 && (
                         <div className="flex flex-wrap gap-1">
                            {contextualTags.map(tag => (
                                <span key={tag} className="text-xs font-medium bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
