import React, { createContext, useContext, useMemo } from 'react';
import { Subject, CaseData, ExecutiveExportPayload } from '../types';
import { getDataForSubject } from '../data';
import { createExecutiveExportPayload } from '../data/executive';

interface DataContextValue {
  caseData: CaseData;
  subject: Subject;
}

const DataContext = createContext<DataContextValue | null>(null);

interface DataProviderProps {
  children: React.ReactNode;
  activeSubject: Subject;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children, activeSubject }) => {
  const caseData = useMemo(() => getDataForSubject(activeSubject), [activeSubject]);
  const value = useMemo<DataContextValue>(() => ({ caseData, subject: activeSubject }), [caseData, activeSubject]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

const useDataContext = (): DataContextValue => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('DataContext hooks must be used within a DataProvider');
  }
  return context;
};

export const useCaseData = (): CaseData => {
  const { caseData } = useDataContext();
  return caseData;
};

export const useExecutiveExportPayload = (): ExecutiveExportPayload => {
  const { caseData, subject } = useDataContext();
  const { executiveSummary } = caseData;

  return useMemo(
    () => createExecutiveExportPayload(subject, executiveSummary),
    [executiveSummary, subject],
  );
};
