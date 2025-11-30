import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Subject, CaseData, RiskScore, RiskCategory, CaseDataSource } from '../types';
import { getDataForSubject } from '../data';
import { enrichTimelineWithViews, groupRisksByCategory } from '../data/transformers';
import { useTranslation } from 'react-i18next';
import { useTenantId, createAuditEntry } from '../domains/tenant';
import { fetchCase, fetchCaseEvents, fetchCaseKpis } from '../domains/api/client';
import type { CaseEvent } from '../domains/events/caseEvents';
import { deriveEventsFromCaseData } from '../domains/events/caseEvents';
import type { CaseKpiSummary } from '../domains/kpi/caseKpis';
import { deriveKpisFromCaseData } from '../domains/kpi/caseKpis';

type CaseEventsSource = 'api' | 'derived';
type CaseKpiSource = 'api' | 'derived';

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
  events: CaseEvent[] | null;
  eventsLoading: boolean;
  eventsError: Error | null;
  eventsSource: CaseEventsSource;
  kpis: CaseKpiSummary | null;
  kpisLoading: boolean;
  kpisError: Error | null;
  kpisSource: CaseKpiSource;
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
  const [events, setEvents] = useState<CaseEvent[] | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<Error | null>(null);
  const [eventsSource, setEventsSource] = useState<CaseEventsSource>('api');
  const [kpis, setKpis] = useState<CaseKpiSummary | null>(null);
  const [kpisLoading, setKpisLoading] = useState(false);
  const [kpisError, setKpisError] = useState<Error | null>(null);
  const [kpisSource, setKpisSource] = useState<CaseKpiSource>('api');
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
    setEvents(null);
    setEventsError(null);
    setEventsSource('api');
    setEventsLoading(true);
    setKpis(null);
    setKpisError(null);
    setKpisSource('api');
    setKpisLoading(true);

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

    const loadEvents = async (caseId: string, data: CaseData, allowApiFetch: boolean) => {
      if (!isActive) {
        return;
      }

      if (allowApiFetch) {
        try {
          const apiEvents = await fetchCaseEvents(caseId);
          if (!isActive) {
            return;
          }
          setEvents(apiEvents);
          setEventsSource('api');
          setEventsLoading(false);
          return;
        } catch (apiError) {
          if (!isActive) {
            return;
          }
          console.warn('[DataContext] Case events API failed, deriving locally.', apiError);
          setEventsError(apiError instanceof Error ? apiError : new Error('Failed to fetch case events'));
        }
      }

      try {
        const derivedEvents = deriveEventsFromCaseData(data, { caseId });
        if (!isActive) {
          return;
        }
        setEvents(derivedEvents);
        setEventsSource('derived');
      } catch (deriveError) {
        if (!isActive) {
          return;
        }
        console.error('[DataContext] Failed to derive events from case data', deriveError);
        setEvents([]);
        setEventsError(prev => prev ?? (deriveError instanceof Error ? deriveError : new Error('Failed to derive events')));
      } finally {
        if (isActive) {
          setEventsLoading(false);
        }
      }
    };

    const loadKpis = async (caseId: string, data: CaseData, allowApiFetch: boolean) => {
      if (!isActive) {
        return;
      }

      if (allowApiFetch) {
        try {
          const summary = await fetchCaseKpis(caseId);
          if (!isActive) {
            return;
          }
          setKpis(summary);
          setKpisSource('api');
          setKpisLoading(false);
          return;
        } catch (apiError) {
          if (!isActive) {
            return;
          }
          console.warn('[DataContext] Case KPI API failed, deriving locally.', apiError);
          setKpisError(apiError instanceof Error ? apiError : new Error('Failed to fetch case KPIs'));
        }
      }

      try {
        const derived = deriveKpisFromCaseData(data, { caseId });
        if (!isActive) {
          return;
        }
        setKpis(derived);
        setKpisSource('derived');
      } catch (deriveError) {
        if (!isActive) {
          return;
        }
        console.error('[DataContext] Failed to derive KPIs from case data', deriveError);
        setKpis({
          caseId,
          metrics: [],
          generatedAt: new Date().toISOString(),
          source: 'derived',
        });
        setKpisError(prev => prev ?? (deriveError instanceof Error ? deriveError : new Error('Failed to derive KPIs')));
      } finally {
        if (isActive) {
          setKpisLoading(false);
        }
      }
    };

    const loadCaseData = async () => {
      try {
        const apiData = await fetchCase(activeCaseId);
        applyCaseData(apiData, 'api');
        await Promise.all([
          loadEvents(activeCaseId, apiData, true),
          loadKpis(activeCaseId, apiData, true),
        ]);
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
        await Promise.all([
          loadEvents(activeCaseId, fallbackData, false),
          loadKpis(activeCaseId, fallbackData, false),
        ]);
      } catch (fallbackError) {
        if (!isActive) {
          return;
        }
        console.error('Failed to load subject data', fallbackError);
        setErrorKey('loadError');
        setIsLoading(false);
        setEvents([]);
        setEventsLoading(false);
        setEventsSource('derived');
        setKpis({
          caseId: activeCaseId,
          metrics: [],
          generatedAt: new Date().toISOString(),
          source: 'derived',
        });
        setKpisLoading(false);
        setKpisSource('derived');
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
        events,
        eventsLoading,
        eventsError,
        eventsSource,
        kpis,
        kpisLoading,
        kpisError,
        kpisSource,
      };
    },
    [
      caseData,
      activeSubject,
      tenantId,
      dataSource,
      resolvedCaseId,
      events,
      eventsLoading,
      eventsError,
      eventsSource,
      kpis,
      kpisLoading,
      kpisError,
      kpisSource,
    ],
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
