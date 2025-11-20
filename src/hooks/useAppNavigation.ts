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
    setNavState(prevState => ({
      activeView: view,
      previousView: prevState.activeView,
      lastCameFromDashboard: options?.fromDashboard ?? false,
      breadcrumbs: options?.breadcrumbs ?? [view.charAt(0).toUpperCase() + view.slice(1)],
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
