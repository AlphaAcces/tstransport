import React, { useState, useEffect, Suspense, lazy } from 'react';
import { SideNav } from './components/Layout/SideNav';
import { TopBar } from './components/Layout/TopBar';
import { ViewContainer } from './components/Layout/ViewContainer';
import { useAppNavigation } from './hooks/useAppNavigation';
import { DataProvider } from './context/DataContext';
import { LoginPage } from './components/Auth/LoginPage';
import { Loader } from 'lucide-react';
import { View } from './types';
import './i18n';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './store';

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
const ScenariosView = lazy(() => import('./components/Scenarios/ScenariosView').then(module => ({ default: module.ScenariosView })));
const ExecutiveSummaryView = lazy(() => import('./components/Executive/ExecutiveSummaryView').then(module => ({ default: module.ExecutiveSummaryView })));


export const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<{ id: string; role: 'admin' | 'user' } | null>(null);

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

  const handleLoginSuccess = (user: { id: string; role: 'admin' | 'user' }) => {
    setAuthUser(user);
    sessionStorage.setItem('authUser', JSON.stringify(user));
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

  if (!authUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const renderView = () => {
    const commonViewProps = {
      canGoBack: canGoBackToDashboard,
      onGoBack: handleBackToDashboard,
    };

    switch (navState.activeView) {
      case 'dashboard':
        return <DashboardView activeSubject={activeSubject} onNavigate={navigateTo} />;
      case 'executive':
        return <ViewContainer {...commonViewProps}><ExecutiveSummaryView onNavigate={navigateTo} /></ViewContainer>;
      case 'person':
        return <ViewContainer {...commonViewProps}><PersonView /></ViewContainer>;
      case 'companies':
        return <ViewContainer {...commonViewProps}><CompaniesView /></ViewContainer>;
      case 'financials':
        return <ViewContainer {...commonViewProps}><FinancialsView /></ViewContainer>;
      case 'hypotheses':
        return <ViewContainer {...commonViewProps}><HypothesesView /></ViewContainer>;
      case 'cashflow':
        return <ViewContainer {...commonViewProps}><CashflowView /></ViewContainer>;
      case 'sector':
        return <ViewContainer {...commonViewProps}><SectorAnalysisView /></ViewContainer>;
      case 'counterparties':
        return <ViewContainer {...commonViewProps}><CounterpartiesView onNavigate={navigateTo as (view: View) => void} /></ViewContainer>;
      case 'scenarios':
        return <ViewContainer {...commonViewProps}><ScenariosView /></ViewContainer>;
      case 'timeline':
        return <ViewContainer {...commonViewProps}><TimelineView /></ViewContainer>;
      case 'risk':
        return <ViewContainer {...commonViewProps}><RiskView /></ViewContainer>;
      case 'actions':
        return <ViewContainer {...commonViewProps}><ActionsView /></ViewContainer>;
      default:
        return <DashboardView activeSubject={activeSubject} onNavigate={navigateTo} />;
    }
  };

  return (
    <ReduxProvider store={store}>
    <div className="app-root app-zoom min-h-screen">
      <TopBar
        onToggleNav={() => setIsNavOpen(!isNavOpen)}
        activeSubject={activeSubject}
        onSubjectChange={handleSubjectChange}
      />
      <SideNav
        currentView={navState.activeView}
        activeSubject={activeSubject}
        onNavigate={(view) => navigateTo(view)}
        isOpen={isNavOpen}
      />
      <main className="lg:pl-64 pt-16 transition-all duration-300 ease-in-out">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <DataProvider activeSubject={activeSubject}>
            <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader className="w-8 h-8 animate-spin" /></div>}>
              {renderView()}
            </Suspense>
          </DataProvider>
        </div>
      </main>
      {isNavOpen && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setIsNavOpen(false)}></div>}
    </div>
    </ReduxProvider>
  );
};
