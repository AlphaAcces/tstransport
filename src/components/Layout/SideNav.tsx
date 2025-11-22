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

  // Define section breaks for business menu
  const businessSections = {
    core: ['dashboard', 'business', 'executive'],
    analysis: ['person', 'companies', 'financials', 'hypotheses', 'cashflow', 'sector'],
    operations: ['counterparties', 'scenarios'],
    riskActions: ['timeline', 'risk', 'actions'],
    saved: ['saved-views'],
  };

  // Define section breaks for personal menu
  const personalSections = {
    core: ['dashboard', 'personal'],
    network: ['person'],
    riskActions: ['timeline', 'risk', 'actions'],
    saved: ['saved-views'],
  };

  const sections = activeSubject === 'tsl' ? businessSections : personalSections;

  const getSectionLabel = (sectionKey: string): string | null => {
    if (activeSubject === 'tsl') {
      switch (sectionKey) {
        case 'analysis': return 'ANALYSIS';
        case 'operations': return 'OPERATIONS';
        case 'riskActions': return 'RISK & ACTIONS';
        default: return null;
      }
    } else {
      switch (sectionKey) {
        case 'network': return 'NETWORK';
        case 'riskActions': return 'RISK & ACTIONS';
        default: return null;
      }
    }
  };

  const renderSection = (sectionKey: string, itemIds: string[]) => {
    const sectionItems = visibleNavItems.filter(item => itemIds.includes(item.id));
    if (sectionItems.length === 0) return null;

    const label = getSectionLabel(sectionKey);

    return (
      <div key={sectionKey} className="mb-4">
        {label && (
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {label}
          </div>
        )}
        <ul className="space-y-1">
          {sectionItems.map(item => {
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full text-left flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-accent-green/10 text-accent-green'
                      : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.i18nKey ? t(item.i18nKey) : item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <aside className={`fixed top-0 left-0 z-30 h-full pt-16 w-64 bg-component-dark border-r border-border-dark transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:z-10 overflow-y-auto`}>
      <nav className="p-4">
        {Object.entries(sections).map(([sectionKey, itemIds]) =>
          renderSection(sectionKey, itemIds)
        )}
      </nav>
    </aside>
  );
};
