import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Subject, CaseData, RiskScore, RiskCategory } from '../types';
import { getDataForSubject } from '../data';
import { enrichTimelineWithViews, groupRisksByCategory } from '../data/transformers';
import { useTranslation } from 'react-i18next';
import { useTenantId, createAuditEntry } from '../domains/tenant';

interface DataContextValue {
  caseData: CaseData;
  enrichedCaseData: {
    timelineData: CaseData['timelineData'];
    actionsData: CaseData['actionsData'];
    riskBreakdown: Record<RiskCategory, RiskScore | undefined>;
    priorityActions: CaseData['actionsData'];
  };
  subject: Subject;
  tenantId: string | null;
}

export const DataContext = createContext<DataContextValue | null>(null);

interface DataProviderProps {
  children: React.ReactNode;
  activeSubject: Subject;
}

const DataProvider: React.FC<DataProviderProps> = ({ children, activeSubject }) => {
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const { t } = useTranslation('data');

  // Get current tenant ID for data isolation
  const tenantId = useTenantId();

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

        // Log data access for audit trail (if tenant context exists)
        if (tenantId) {
          createAuditEntry(
            tenantId,
            'system', // Replace with actual user ID from TenantContext
            'read',
            'case',
            activeSubject,
            { subjectName: activeSubject }
          );
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
  }, [activeSubject, tenantId]);

  const value = useMemo<DataContextValue | null>(
    () => {
      if (!caseData) return null;

      // Enrich data using transformers
      const enrichedTimelineData = enrichTimelineWithViews(caseData.timelineData);
      const priorityActions = caseData.actionsData.filter(action =>
        action.priority === 'Påkrævet' || action.priority === 'Høj'
      );
      const riskBreakdown = groupRisksByCategory(caseData.riskHeatmapData);

      return {
        caseData,
        enrichedCaseData: {
          timelineData: enrichedTimelineData,
          actionsData: caseData.actionsData,
          riskBreakdown,
          priorityActions,
        },
        subject: activeSubject,
        tenantId,
      };
    },
    [caseData, activeSubject, tenantId],
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

export const useDataContext = (): DataContextValue => {
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

export const useEnrichedCaseData = () => {
  const { enrichedCaseData } = useDataContext();
  return enrichedCaseData;
};

export const useActiveSubject = (): Subject => {
  const { subject } = useDataContext();
  return subject;
};

export default DataProvider;
