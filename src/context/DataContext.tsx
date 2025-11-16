import React, { createContext, useContext, useMemo } from 'react';
import { Subject, CaseData } from '../types';
import { getDataForSubject } from '../data';

const DataContext = createContext<CaseData | null>(null);

interface DataProviderProps {
  children: React.ReactNode;
  activeSubject: Subject;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children, activeSubject }) => {
  const caseData = useMemo(() => getDataForSubject(activeSubject), [activeSubject]);

  return (
    <DataContext.Provider value={caseData}>
      {children}
    </DataContext.Provider>
  );
};

export const useCaseData = (): CaseData => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useCaseData must be used within a DataProvider');
  }
  return context;
};
