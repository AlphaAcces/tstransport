import React from 'react';
import { TslLogo } from '../Shared/TslLogo';
import { LanguageToggle } from '../Shared/LanguageToggle';
import { PreferencesPanel } from '../Shared/PreferencesPanel';
import { Subject } from '../../types';

interface TopBarProps {
  onToggleNav: () => void;
  activeSubject: Subject;
  onSubjectChange: (subject: Subject) => void;
  currentViewId?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleNav, activeSubject, onSubjectChange, currentViewId }) => {
  const getButtonClass = (subject: Subject) => {
    const baseClass = "flex flex-col items-center px-4 py-1 rounded-md transition-colors duration-200";
    if (activeSubject === subject) {
      return `${baseClass} bg-accent-green/10 border border-accent-green/50`;
    }
    return `${baseClass} bg-component-dark hover:bg-gray-700/50`;
  };

  const headerTitle = activeSubject === 'tsl' ? 'TS Logistik ApS' : 'Ümit Cetin';

  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-component-dark/80 backdrop-blur-sm border-b border-border-dark">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center flex-shrink-0 min-w-0">
          <button onClick={onToggleNav} className="lg:hidden text-gray-400 hover:text-white mr-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          </button>
          <TslLogo variant="header" className="h-8 w-auto mr-4" />
          <div className="hidden sm:flex items-baseline truncate">
            <h1 className="text-xl font-bold text-gray-200 tracking-tight">{headerTitle}</h1>
            <span className="font-normal text-gray-400 ml-2 truncate">/ Intelligence Console</span>
          </div>
           <h1 className="sm:hidden text-lg font-bold text-gray-200 truncate ml-2">{activeSubject === 'tsl' ? 'TSL' : 'ÜC'} / IC</h1>
        </div>

        <div className="flex items-center space-x-2">
            <button onClick={() => onSubjectChange('tsl')} className={getButtonClass('tsl')}>
                <span className={`text-sm font-bold ${activeSubject === 'tsl' ? 'text-accent-green' : 'text-gray-200'}`}>TS Logistik</span>
                <span className="text-xs text-gray-500">Erhverv</span>
            </button>
            <button onClick={() => onSubjectChange('umit')} className={getButtonClass('umit')}>
                 <span className={`text-sm font-bold ${activeSubject === 'umit' ? 'text-accent-green' : 'text-gray-200'}`}>Ümit Cetin</span>
                <span className="text-xs text-gray-500">Privat</span>
            </button>
            <div className="ml-2">
              <LanguageToggle />
            </div>
            <div className="ml-4">
              <PreferencesPanel currentViewId={currentViewId ?? 'dashboard'} />
            </div>
          </div>
      </div>
    </header>
  );
};
