import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Subject } from '../../types';
import { NAV_ITEMS } from '../../config/navigation';

interface SideNavProps {
  currentView: View;
  activeSubject: Subject;
  onNavigate: (view: View) => void;
  isOpen: boolean;
}

export const SideNav: React.FC<SideNavProps> = ({ currentView, activeSubject, onNavigate, isOpen }) => {
  const { t } = useTranslation();
  const visibleNavItems = NAV_ITEMS.filter(item => item.showFor.includes(activeSubject));

  const businessSections: Array<{ key: string; label?: string; items: View[] }> = [
    { key: 'core', items: ['dashboard', 'business', 'executive'] },
    { key: 'analysis', label: 'ANALYSIS', items: ['person', 'companies', 'financials', 'hypotheses', 'cashflow', 'sector'] },
    { key: 'operations', label: 'OPERATIONS', items: ['counterparties', 'scenarios'] },
    { key: 'riskActions', label: 'RISK & ACTIONS', items: ['timeline', 'risk', 'actions'] },
    { key: 'saved', label: 'SAVED WORK', items: ['saved-views'] },
  ];

  const personalSections: Array<{ key: string; label?: string; items: View[] }> = [
    { key: 'profile', items: ['dashboard', 'personal'] },
    { key: 'network', label: 'NETWORK', items: ['person'] },
    { key: 'history', label: 'TIMELINE', items: ['timeline'] },
    { key: 'riskActions', label: 'RISK & ACTIONS', items: ['risk', 'actions'] },
    { key: 'saved', label: 'SAVED WORK', items: ['saved-views'] },
  ];

  const sections = activeSubject === 'tsl' ? businessSections : personalSections;

  const renderIcon = (icon: React.ReactElement) => {
    const className = `h-4 w-4 ${icon.props.className ?? ''}`.trim();
    return React.cloneElement(icon, { className, color: undefined, stroke: 'currentColor' });
  };

  return (
    <aside
      aria-label={t('nav.primaryMenu', { defaultValue: 'Primary navigation' })}
      className={`fixed top-0 left-0 z-30 h-full pt-16 w-64 sm:w-72 max-w-[90vw] border-r border-border-dark bg-component-dark/95 backdrop-blur shadow-2xl lg:bg-component-dark lg:shadow-none transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:z-10 overflow-y-auto`}
    >
      <nav className="space-y-5 p-4">
        {sections.map(section => {
          const sectionItems = visibleNavItems.filter(item => section.items.includes(item.id));
          if (sectionItems.length === 0) return null;

          return (
            <div key={section.key}>
              {section.label && (
                <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                  {section.label}
                </p>
              )}
              <ul className="space-y-1">
                {sectionItems.map(item => {
                  const isActive = currentView === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => onNavigate(item.id)}
                        className={`group flex w-full items-center rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                          isActive
                            ? 'border-accent-green/40 bg-accent-green/10 text-white shadow-[inset_3px_0_0_0] shadow-accent-green'
                            : 'border-transparent text-gray-300 hover:border-border-dark/80 hover:bg-component-dark'
                        }`}
                      >
                        <span className={`mr-3 flex h-8 w-8 items-center justify-center rounded-lg ${
                          isActive ? 'bg-accent-green/15 text-accent-green' : 'bg-component-dark/80 text-gray-400 group-hover:text-gray-200'
                        }`}>
                          {renderIcon(item.icon)}
                        </span>
                        <span className="truncate">{item.i18nKey ? t(item.i18nKey) : item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};
