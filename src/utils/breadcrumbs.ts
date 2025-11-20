import { View } from '../types';
import i18n from '../i18n';

const KEY_MAP: Record<View, string> = {
  dashboard: 'nav.dashboard',
  executive: 'nav.executive',
  person: 'nav.person',
  companies: 'nav.companies',
  financials: 'nav.financials',
  hypotheses: 'nav.hypotheses',
  cashflow: 'nav.cashflow',
  sector: 'nav.sector',
  timeline: 'nav.timeline',
  risk: 'nav.risk',
  actions: 'nav.actions',
  counterparties: 'nav.counterparties',
  scenarios: 'nav.scenarios',
  business: 'nav.business',
  personal: 'nav.personal',
  'saved-views': 'nav.savedViews',
};

export const buildBreadcrumbs = (view: View, trail?: string[]): string[] => {
  if (Array.isArray(trail) && trail.length > 0) return trail;
  const key = KEY_MAP[view];
  const label = key ? i18n.t(key) : view;
  return [i18n.t('nav.dashboard', 'Dashboard'), label];
};

export default buildBreadcrumbs;
