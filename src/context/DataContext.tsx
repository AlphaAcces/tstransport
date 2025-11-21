import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Subject, CaseData } from '../types';
import { getDataForSubject } from '../data';
import { useTranslation } from 'react-i18next';

interface DataContextValue {
  caseData: CaseData;
  subject: Subject;
}

export const DataContext = createContext<DataContextValue | null>(null);

interface DataProviderProps {
  children: React.ReactNode;
  activeSubject: Subject;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children, activeSubject }) => {
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const { t } = useTranslation('data');

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setErrorKey(null);
    setCaseData(null);

    getDataForSubject(activeSubject)
      .then(data => {
        if (!isActive) {
          return;
        }
        setCaseData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load subject data', err);
        if (!isActive) {
          return;
        }
        setErrorKey('loadError');
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [activeSubject]);

  const value = useMemo<DataContextValue | null>(
    () => (caseData ? { caseData, subject: activeSubject } : null),
    [caseData, activeSubject],
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        {t('loading')}
      </div>
    );
  }

  if (errorKey || !value) {
    return (
      <div className="rounded-lg border border-red-600/60 bg-red-900/40 p-6 text-sm text-red-200">
        {errorKey ? t(errorKey) : t('unknownError')}
      </div>
    );
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
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

export const useActiveSubject = (): Subject => {
  const { subject } = useDataContext();
  return subject;
};
