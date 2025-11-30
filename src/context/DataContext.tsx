import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Subject, CaseData, RiskScore, RiskCategory, CaseDataSource } from '../types';
import { getDataForSubject } from '../data';
import { enrichTimelineWithViews, groupRisksByCategory } from '../data/transformers';
import { useTranslation } from 'react-i18next';
import { useTenantId, createAuditEntry } from '../domains/tenant';
import { fetchCase } from '../domains/api/client';

interface DataContextValue {
  caseData: CaseData;
  caseId: string;
  enrichedCaseData: {
    timelineData: CaseData['timelineData'];
    actionsData: CaseData['actionsData'];
    riskBreakdown: Record<RiskCategory, RiskScore | undefined>;
    priorityActions: CaseData['actionsData'];
  };
  subject: Subject;
  tenantId: string | null;
  dataSource: CaseDataSource;
}

export const DataContext = createContext<DataContextValue | null>(null);

interface DataProviderProps {
  children: React.ReactNode;
  activeCaseId: string;
  activeSubject: Subject;
}

const DataProvider: React.FC<DataProviderProps> = ({ children, activeCaseId, activeSubject }) => {
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [resolvedCaseId, setResolvedCaseId] = useState<string>(activeCaseId);
  const [dataSource, setDataSource] = useState<CaseDataSource | null>(null);
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
    setDataSource(null);
    setResolvedCaseId(activeCaseId);

    const applyCaseData = (data: CaseData, source: CaseDataSource) => {
      if (!isActive) {
        return;
      }

      const isDefaultTenant = data.tenantId === 'default-tenant';
      const isDevelopment = import.meta.env.DEV;

      if (tenantId && data.tenantId !== tenantId && !(isDefaultTenant && isDevelopment)) {
        console.warn(`Case data tenantId (${data.tenantId}) does not match active tenantId (${tenantId})`);
        setErrorKey('tenantMismatch');
        setIsLoading(false);
        return;
      }

      if (tenantId) {
        createAuditEntry(
          tenantId,
          'system',
          'read',
          'case',
          activeSubject,
          { subjectName: activeSubject, dataSource: source, caseId: activeCaseId }
        );
      }

      setCaseData(data);
      setResolvedCaseId(activeCaseId);
      setDataSource(source);
      setIsLoading(false);
    };

    const loadCaseData = async () => {
      try {
        const apiData = await fetchCase(activeCaseId);
        applyCaseData(apiData, 'api');
        return;
      } catch (apiError) {
        if (!isActive) {
          return;
        }
        console.warn('[DataContext] Falling back to mock data after API error.', apiError);
      }

      try {
        const fallbackData = await getDataForSubject(activeSubject);
        applyCaseData(fallbackData, 'mock');
      } catch (fallbackError) {
        if (!isActive) {
          return;
        }
        console.error('Failed to load subject data', fallbackError);
        setErrorKey('loadError');
        setIsLoading(false);
      }
    };

    loadCaseData();

    return () => {
      isActive = false;
    };
  }, [activeCaseId, activeSubject, tenantId]);

  const value = useMemo<DataContextValue | null>(
    () => {
      if (!caseData || !dataSource) return null;

      // Enrich data using transformers
      const enrichedTimelineData = enrichTimelineWithViews(caseData.timelineData);
      const priorityActions = caseData.actionsData.filter(action =>
        action.priority === 'Påkrævet' || action.priority === 'Høj'
      );
      const riskBreakdown = groupRisksByCategory(caseData.riskHeatmapData);

      return {
        caseData,
        caseId: resolvedCaseId,
        enrichedCaseData: {
          timelineData: enrichedTimelineData,
          actionsData: caseData.actionsData,
          riskBreakdown,
          priorityActions,
        },
        subject: activeSubject,
        tenantId,
        dataSource,
      };
    },
    [caseData, activeSubject, tenantId, dataSource, resolvedCaseId],
  );

  if (isLoading) {
    return (
      <div
        className="space-y-6 rounded-2xl border border-white/10 bg-black/30 p-8 shadow-xl"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 text-sm text-gray-200">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span>{t('loading')}</span>
        </div>
        <div className="skeleton skeleton--text w-48" aria-hidden="true" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="skeleton skeleton--card h-32" aria-hidden="true" />
          <div className="skeleton skeleton--card h-32" aria-hidden="true" />
        </div>
        <div className="skeleton skeleton--card h-48" aria-hidden="true" />
      </div>
    );
  }

  if (errorKey || !value) {
    return (
      <div className="empty-state" role="alert" aria-live="assertive">
        <AlertTriangle className="empty-state-icon" aria-hidden="true" />
        <h3 className="empty-state-title">{t('loadErrorTitle', { defaultValue: 'Kunne ikke hente data' })}</h3>
        <p className="empty-state-description">
          {errorKey ? t(errorKey) : t('unknownError')}
        </p>
        <p className="empty-state-description text-xs text-gray-400">
          {t('loadErrorHint', { defaultValue: 'Se konsollen for detaljer eller prøv at genindlæse.' })}
        </p>
        <button
          type="button"
          className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]"
          onClick={() => window.location.reload()}
        >
          {t('retry', { defaultValue: 'Prøv igen' })}
        </button>
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
