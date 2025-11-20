import { useState } from 'react';
import { View, Subject, NavigationState } from '../types';

export const useAppNavigation = () => {
  const [activeSubject, setActiveSubject] = useState<Subject>('tsl');
  const [navState, setNavState] = useState<NavigationState>({
    activeView: 'dashboard',
    previousView: null,
    lastCameFromDashboard: false,
    breadcrumbs: ['Dashboard'],
  });
  const [isNavOpen, setIsNavOpen] = useState(false);

  const handleSubjectChange = (subject: Subject) => {
    setActiveSubject(subject);
    setNavState({
      activeView: 'dashboard',
      previousView: null,
      lastCameFromDashboard: false,
    });
    setIsNavOpen(false);
  };

  const navigateTo = (view: View, options?: { fromDashboard?: boolean; breadcrumbs?: string[] }) => {
    // Lazy import buildBreadcrumbs to avoid circular imports
    let breadcrumbs = options?.breadcrumbs;
    try {
      if (!breadcrumbs) {
        // dynamic require to avoid ESM interop issues in some environments
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { buildBreadcrumbs } = require('../utils/breadcrumbs');
        breadcrumbs = buildBreadcrumbs(view as View);
      }
    } catch (e) {
      breadcrumbs = [view.charAt(0).toUpperCase() + view.slice(1)];
    }

    setNavState(prevState => ({
      activeView: view,
      previousView: prevState.activeView,
      lastCameFromDashboard: options?.fromDashboard ?? false,
      breadcrumbs,
    }));
    setIsNavOpen(false);
  };

  const handleBackToDashboard = () => {
    setNavState(prevState => ({
      ...prevState,
      activeView: 'dashboard',
      lastCameFromDashboard: false,
    }));
  };

  const canGoBackToDashboard = navState.lastCameFromDashboard && navState.activeView !== 'dashboard';

  return {
    activeSubject,
    navState,
    isNavOpen,
    handleSubjectChange,
    navigateTo,
    handleBackToDashboard,
    canGoBackToDashboard,
    setIsNavOpen,
  };
};
