import { View } from '../types';

const LABEL_MAP: Record<View, string> = {
  dashboard: 'Dashboard',
  executive: 'Executive Summary',
  person: 'Person & Network',
  companies: 'Selskaber',
  financials: 'Financials',
  hypotheses: 'Hypoteser',
  cashflow: 'Cashflow & DSO',
  sector: 'Sector Analysis',
  timeline: 'Timeline',
  risk: 'Risk Heatmap',
  actions: 'Actionables',
  counterparties: 'Modparter',
  scenarios: 'Scenarier',
  business: 'Erhverv',
  personal: 'Privat',
};

export const buildBreadcrumbs = (view: View, trail?: string[]): string[] => {
  if (Array.isArray(trail) && trail.length > 0) return trail;
  const label = LABEL_MAP[view] ?? view;
  return ['Dashboard', label];
};

export default buildBreadcrumbs;
