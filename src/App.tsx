import React, { useState, useEffect, Suspense, lazy, useCallback, useMemo } from 'react';
import { Routes, Route, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { SideNav } from './components/Layout/SideNav';
import { TopBar } from './components/Layout/TopBar';
import { ViewContainer } from './components/Layout/ViewContainer';
import { CommandDeck } from './components/Layout/CommandDeck';
import { useAppNavigation } from './hooks/useAppNavigation';
import DataProvider from './context/DataContext';
import { LoginPage } from './components/Auth/LoginPage';
import { SsoLoginPage } from './components/Auth/SsoLoginPage';
import { Loader } from 'lucide-react';
import { View } from './types';
import './i18n';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './store';
import { TenantProvider } from './domains/tenant';
import { ThemeProvider } from './domains/tenant/ThemeContext';
import type { TenantConfig, TenantUser } from './domains/tenant';
import { tenantApi } from './domains/tenant/tenantApi';
import type { AuthUser } from './domains/auth/types';
import { useCaseRegistry } from './hooks/useCaseRegistry';
import { DEFAULT_CASE_ID } from './domains/cases/caseMetadata';
import CaseLibraryView from './components/Cases/CaseLibraryView';

// Lazy load heavy components
const DashboardView = lazy(() => import('./components/Dashboard/DashboardView').then(module => ({ default: module.DashboardView })));
const PersonView = lazy(() => import('./components/Person/PersonView').then(module => ({ default: module.PersonView })));
const CompaniesView = lazy(() => import('./components/Companies/CompaniesView').then(module => ({ default: module.CompaniesView })));
const FinancialsView = lazy(() => import('./components/Financials/FinancialsView').then(module => ({ default: module.FinancialsView })));
const HypothesesView = lazy(() => import('./components/Hypotheses/HypothesesView').then(module => ({ default: module.HypothesesView })));
const RiskView = lazy(() => import('./components/Risk/RiskView').then(module => ({ default: module.RiskView })));
const TimelineView = lazy(() => import('./components/Timeline/TimelineView').then(module => ({ default: module.TimelineView })));
const ActionsView = lazy(() => import('./components/Actions/ActionsView').then(module => ({ default: module.ActionsView })));
const CashflowView = lazy(() => import('./components/Cashflow/CashflowView').then(module => ({ default: module.CashflowView })));
const SectorAnalysisView = lazy(() => import('./components/Sector/SectorAnalysisView').then(module => ({ default: module.SectorAnalysisView })));
const CounterpartiesView = lazy(() => import('./components/Counterparties/CounterpartiesView').then(module => ({ default: module.CounterpartiesView })));
const ScenariosView = lazy(() => import('./components/Scenarios/ScenariosView'));
const ExecutiveSummaryView = lazy(() => import('./components/Executive/ExecutiveSummaryView').then(module => ({ default: module.ExecutiveSummaryView })));
const IntelVaultView = lazy(() => import('./components/Vault/IntelVaultView'));
const AccessRequestsView = lazy(() => import('./components/Settings/AccessRequestsView'));

export const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [topBarHeight, setTopBarHeight] = useState(96);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [tenantUser, setTenantUser] = useState<TenantUser | null>(null);
  const [isTenantLoading, setIsTenantLoading] = useState(true);
  const [isCommandDeckOpen, setIsCommandDeckOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const routerNavigate = useNavigate();
  const { cases, isLoading: isCaseRegistryLoading, source: caseRegistrySource, error: caseRegistryError } = useCaseRegistry();

  // Initialize tenant on app load
  useEffect(() => {
    const initTenant = async () => {
      try {
        const response = await tenantApi.initializeTenant();
        if (response.success && response.data) {
          setTenantConfig(response.data.tenant);
          setTenantUser(response.data.user);
        }
      } catch (error) {
        console.error('Failed to initialize tenant:', error);
      } finally {
        setIsTenantLoading(false);
      }
    };

    initTenant();
  }, []);

  // TODO: Håndter token-refresh/expiry via backend i stedet for ren client-side sessionStorage.
  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('authUser');
      if (storedUser) {
        setAuthUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Could not parse auth user from session storage", error);
      sessionStorage.removeItem('authUser');
    }
  }, []);

  // Handle tenant change from TenantSwitcher
  const handleTenantChange = useCallback(async (tenantId: string) => {
    try {
      const response = await tenantApi.switchTenant(tenantId);
      if (response.success && response.data) {
        setTenantConfig(response.data.tenant);
        setTenantUser(response.data.user);
      }
    } catch (error) {
      console.error('Failed to switch tenant:', error);
    }
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    sessionStorage.setItem('authUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setAuthUser(null);
    sessionStorage.removeItem('authUser');
    setIsCommandDeckOpen(false);
  };


  const {
    activeSubject,
    navState,
    isNavOpen,
    handleSubjectChange,
    navigateTo,
    handleBackToDashboard,
    canGoBackToDashboard,
    setIsNavOpen,
  } = useAppNavigation();

  const availableCaseIds = useMemo(() => new Set(cases.map(c => c.id)), [cases]);
  const requestedCaseId = searchParams.get('case');
  const fallbackCaseId = cases[0]?.id ?? DEFAULT_CASE_ID;
  const hasUnknownCase = Boolean(requestedCaseId && !availableCaseIds.has(requestedCaseId));
  const resolvedCaseId = hasUnknownCase ? fallbackCaseId : (requestedCaseId || fallbackCaseId);
  const activeCaseMeta = cases.find(c => c.id === resolvedCaseId) ?? cases[0];
  const derivedSubject = activeCaseMeta?.defaultSubject ?? activeSubject;

  useEffect(() => {
    if (!requestedCaseId && resolvedCaseId) {
      setSearchParams(prev => {
        const params = new URLSearchParams(prev);
        params.set('case', resolvedCaseId);
        return params;
      }, { replace: true });
    }
  }, [requestedCaseId, resolvedCaseId, setSearchParams]);

  useEffect(() => {
    if (derivedSubject && derivedSubject !== activeSubject) {
      handleSubjectChange(derivedSubject);
    }
  }, [derivedSubject, activeSubject, handleSubjectChange]);

  const handleCaseSelect = useCallback((caseId: string, options?: { redirectToDashboard?: boolean }) => {
    const targetMeta = cases.find(c => c.id === caseId);
    if (!targetMeta) {
      console.warn(`[CaseSelector] Unknown case id: ${caseId}`);
      return;
    }

    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      params.set('case', caseId);
      return params;
    });

    if (targetMeta.defaultSubject !== activeSubject) {
      handleSubjectChange(targetMeta.defaultSubject);
    }

    if (options?.redirectToDashboard) {
      routerNavigate('/');
    }
  }, [cases, activeSubject, handleSubjectChange, routerNavigate, setSearchParams]);

  const handleOpenCaseLibrary = useCallback(() => {
    routerNavigate('/cases');
  }, [routerNavigate]);

  // Expose a dev-only global navigator for deterministic Playwright screenshots
  if (import.meta.env.DEV) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (window as any).__navigateTo = navigateTo;
  }

  if (!authUser) {
    return (
      <Routes>
        <Route path="/sso-login" element={<SsoLoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/login" element={<LoginRoute onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/" element={<LoginRoute onLoginSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<LoginRoute onLoginSuccess={handleLoginSuccess} />} />
      </Routes>
    );
  }

  const openCommandDeck = () => setIsCommandDeckOpen(true);
  const closeCommandDeck = () => setIsCommandDeckOpen(false);
  const toggleCommandDeck = () => setIsCommandDeckOpen((prev) => !prev);

  const renderView = () => {
    const commonViewProps = {
      canGoBack: canGoBackToDashboard,
      onGoBack: handleBackToDashboard,
    };

    switch (navState.activeView) {
      case 'dashboard':
        return <DashboardView activeSubject={activeSubject} onNavigate={navigateTo} />;
      case 'executive':
        return <ViewContainer {...commonViewProps} breadcrumbs={navState.breadcrumbs}><ExecutiveSummaryView onNavigate={navigateTo} /></ViewContainer>;
      case 'person':
        return <ViewContainer {...commonViewProps} breadcrumbs={navState.breadcrumbs}><PersonView /></ViewContainer>;
      case 'companies':
        return <ViewContainer {...commonViewProps} breadcrumbs={navState.breadcrumbs}><CompaniesView /></ViewContainer>;
      case 'financials':
        return <ViewContainer {...commonViewProps} breadcrumbs={navState.breadcrumbs}><FinancialsView /></ViewContainer>;
      case 'hypotheses':
        return <ViewContainer {...commonViewProps} breadcrumbs={navState.breadcrumbs}><HypothesesView /></ViewContainer>;
      case 'cashflow':
        return <ViewContainer {...commonViewProps} breadcrumbs={navState.breadcrumbs}><CashflowView /></ViewContainer>;
      case 'sector':
        return <ViewContainer {...commonViewProps} breadcrumbs={navState.breadcrumbs}><SectorAnalysisView /></ViewContainer>;
      case 'counterparties':
        return <ViewContainer {...commonViewProps} breadcrumbs={navState.breadcrumbs}><CounterpartiesView onNavigate={navigateTo as (view: View) => void} /></ViewContainer>;
      case 'scenarios':
        return <ViewContainer {...commonViewProps} breadcrumbs={navState.breadcrumbs}><ScenariosView /></ViewContainer>;
      case 'timeline':
        return <ViewContainer {...commonViewProps} breadcrumbs={navState.breadcrumbs}><TimelineView /></ViewContainer>;
      case 'risk':
        return <ViewContainer {...commonViewProps} breadcrumbs={navState.breadcrumbs}><RiskView /></ViewContainer>;
      case 'actions':
        return <ViewContainer {...commonViewProps} breadcrumbs={navState.breadcrumbs}><ActionsView /></ViewContainer>;
      case 'vault':
        return <ViewContainer {...commonViewProps} breadcrumbs={navState.breadcrumbs}><IntelVaultView /></ViewContainer>;
      case 'accessRequests':
        return <ViewContainer {...commonViewProps} breadcrumbs={navState.breadcrumbs}><AccessRequestsView /></ViewContainer>;
      default:
        return <DashboardView activeSubject={activeSubject} onNavigate={navigateTo} />;
    }
  };

  // Show loading state while tenant initializes
  if (isTenantLoading) {
    return (
      <div className="min-h-screen bg-base-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-10 h-10 animate-spin text-accent-green" />
          <p className="text-gray-400 text-sm">Initialiserer platform...</p>
        </div>
      </div>
    );
  }

  return (
    <ReduxProvider store={store}>
    <TenantProvider initialTenant={tenantConfig || undefined} initialUser={tenantUser || undefined}>
    <ThemeProvider
      darkScheme={tenantConfig?.branding?.colors}
      lightScheme={tenantConfig?.branding?.colorsLight}
    >
    <div className="app-root app-zoom min-h-screen bg-[var(--color-background)]">
      <TopBar
        onToggleNav={() => setIsNavOpen(!isNavOpen)}
        caseOptions={cases}
        selectedCaseId={resolvedCaseId}
        onSelectCase={handleCaseSelect}
        isCaseListLoading={isCaseRegistryLoading}
        caseSource={caseRegistrySource}
        onOpenCaseLibrary={handleOpenCaseLibrary}
        currentView={navState.activeView}
        currentBreadcrumbs={navState.breadcrumbs}
        onNavigate={navigateTo}
        onHeightChange={setTopBarHeight}
        user={authUser}
        onTenantChange={handleTenantChange}
        onOpenCommandDeck={openCommandDeck}
        onLogout={handleLogout}
      />
      <SideNav
        currentView={navState.activeView}
        activeSubject={activeSubject}
        onNavigate={(view) => navigateTo(view)}
        isOpen={isNavOpen}
        navigateToFull={navigateTo}
        topOffset={topBarHeight}
        onOpenCommandDeck={openCommandDeck}
      />
      <main
        className="lg:pl-64 transition-all duration-300 ease-in-out"
        style={{ paddingTop: topBarHeight + 24 }}
      >
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Routes>
            <Route
              path="/cases"
              element={(
                <CaseLibraryView
                  activeCaseId={resolvedCaseId}
                  onSelectCase={handleCaseSelect}
                  onClose={() => routerNavigate('/')}
                />
              )}
            />
            <Route
              path="*"
              element={(
                <>
                  {hasUnknownCase && requestedCaseId && (
                    <div className="mb-4 rounded-lg border border-amber-500/60 bg-amber-500/10 p-4 text-sm text-amber-100" role="status">
                      Ukendt case-id "{requestedCaseId}". Viser i stedet {activeCaseMeta?.name ?? 'standard case'}.
                    </div>
                  )}
                  {caseRegistryError && (
                    <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100" role="status">
                      Kunne ikke hente seneste caseliste fra API. Viser lokale data.
                    </div>
                  )}
                  <DataProvider activeCaseId={resolvedCaseId} activeSubject={derivedSubject}>
                    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader className="w-8 h-8 animate-spin" /></div>}>
                      {renderView()}
                    </Suspense>
                  </DataProvider>
                </>
              )}
            />
          </Routes>
        </div>
      </main>
      <CommandDeck
        activeSubject={activeSubject}
        currentView={navState.activeView}
        onNavigate={navigateTo}
        user={authUser}
        onLogout={handleLogout}
        topOffset={topBarHeight}
        isOpen={isCommandDeckOpen}
        onOpen={openCommandDeck}
        onClose={closeCommandDeck}
        onToggle={toggleCommandDeck}
      />
      {isNavOpen && <div className="fixed inset-0 bg-black/60 z-25 lg:hidden" onClick={() => setIsNavOpen(false)}></div>}
    </div>
    </ThemeProvider>
    </TenantProvider>
    </ReduxProvider>
  );
};

interface LoginRouteProps {
  onLoginSuccess: (user: AuthUser) => void;
}

const LoginRoute: React.FC<LoginRouteProps> = ({ onLoginSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const state = location.state as { ssoFailed?: boolean } | null;
  const primaryToken = searchParams.get('sso');
  const legacyToken = searchParams.get('ssoToken');

  useEffect(() => {
    const tokenToUse = primaryToken || legacyToken;
    if (!tokenToUse) {
      return;
    }

    if (!primaryToken && legacyToken) {
      console.warn('[sso-login] Received legacy ssoToken param. TODO: remove alias support in future release.');
    }

    const params = new URLSearchParams();
    params.set('sso', tokenToUse);
    navigate(`/sso-login?${params.toString()}`, { replace: true });
  }, [legacyToken, navigate, primaryToken]);

  return <LoginPage onLoginSuccess={onLoginSuccess} ssoFailed={Boolean(state?.ssoFailed)} />;
};

export { LoginRoute };
