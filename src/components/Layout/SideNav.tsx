import React from 'react';
import { View, Subject } from '../../types';
import { NAV_ITEMS } from '../../config/navigation';

interface SideNavProps {
  currentView: View;
  activeSubject: Subject;
  onNavigate: (view: View) => void;
  isOpen: boolean;
}

export const SideNav: React.FC<SideNavProps> = ({ currentView, activeSubject, onNavigate, isOpen }) => {
  const visibleNavItems = NAV_ITEMS.filter(item => item.showFor.includes(activeSubject));
  
  return (
    <aside className={`fixed top-0 left-0 z-30 h-full pt-16 w-64 bg-component-dark border-r border-border-dark transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:z-10`}>
      <nav className="p-4">
        <ul>
          {visibleNavItems.map(item => {
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
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};