/**
 * Core Types
 *
 * Fundamental types used across the application including
 * views, subjects, navigation, and case data structure.
 */

import type { ReactElement } from 'react';

// ============================================================================
// View & Navigation Types
// ============================================================================

/**
 * Available views in the application
 */
export type View =
  | 'dashboard'
  | 'executive'
  | 'person'
  | 'companies'
  | 'financials'
  | 'hypotheses'
  | 'cashflow'
  | 'sector'
  | 'timeline'
  | 'risk'
  | 'actions'
  | 'counterparties'
  | 'scenarios'
  | 'business'
  | 'personal'
  | 'vault'
  | 'accessRequests';

/**
 * Available investigation subjects
 */
export type Subject = 'tsl' | 'umit';

/**
 * Navigation item configuration
 */
export interface NavItemConfig {
  id: View;
  label: string;
  i18nKey?: string;
  icon: ReactElement;
  showFor: Subject[];
}

/**
 * Current navigation state
 */
export interface NavigationState {
  activeView: View;
  previousView: View | null;
  lastCameFromDashboard: boolean;
  breadcrumbs?: string[];
}

// ============================================================================
// Priority & Status Types
// ============================================================================

/**
 * Priority levels for actions and tasks
 */
export type Priority = 'Påkrævet' | 'Høj' | 'Middel';

/**
 * Risk levels
 */
export type RiskLevel = 'KRITISK' | 'HØJ' | 'MODERAT' | 'LAV';

/**
 * Simple risk level for display
 */
export type SimpleRiskLevel = 'High' | 'Medium' | 'Low' | 'None';

/**
 * Impact levels
 */
export type ImpactLevel = 'Lav' | 'Middel' | 'Høj' | 'Ekstrem';

/**
 * Status for hypotheses
 */
export type HypothesisStatus = 'Bekræftet' | 'Åben' | 'Afkræftet';

/**
 * Status for actions
 */
export type ActionStatus = 'Ikke startet' | 'I gang' | 'Afsluttet';

/**
 * Company status
 */
export type CompanyStatus = 'Aktiv' | 'Historisk' | 'Ophørt';

// ============================================================================
// Category Types
// ============================================================================

/**
 * Risk categories
 */
export type RiskCategory =
  | 'Financial'
  | 'Legal/Compliance'
  | 'Governance'
  | 'SOCMINT/Reputation'
  | 'Sector/Operations';

/**
 * Action categories
 */
export type ActionCategory =
  | 'Juridisk'
  | 'Efterretning'
  | 'Finansiel'
  | 'Kommerciel'
  | 'Regulatorisk'
  | 'Governance'
  | 'Strategisk';

/**
 * Hypothesis categories
 */
export type HypothesisCategory =
  | 'Finansiel'
  | 'Likviditet'
  | 'Skat/Compliance'
  | 'Operationel'
  | 'Strategisk';

/**
 * Timeline event categories
 */
export type TimelineCategory =
  | 'Etablering'
  | 'Regnskab'
  | 'Struktur'
  | 'Adresse'
  | 'Finansiel'
  | 'Operationel'
  | 'Compliance';

/**
 * Company roles
 */
export type CompanyRole =
  | 'Drift (Vognmand)'
  | 'Holding'
  | 'Ejendom'
  | 'Bilsalg'
  | 'Historisk';

/**
 * Counterparty types
 */
export type CounterpartyType =
  | 'Regulatorisk'
  | 'Rådgiver'
  | 'Kunde'
  | 'Finansiel'
  | 'Partner';

/**
 * Scenario categories
 */
export type ScenarioCategory = 'Best' | 'Base' | 'Worst' | 'Exit';

// ============================================================================
// Owner Types
// ============================================================================

/**
 * Action owner roles
 */
export type OwnerRole =
  | 'Direktion'
  | 'Advokat'
  | 'Revisor'
  | 'Administration'
  | 'Finansiel rådgiver'
  | 'Ledelse'
  | 'Advokat / Revisor'
  | 'Advokat / Forsikringsmægler'
  | 'Direktion / Revisor'
  | 'Revisor / Advokat';

/**
 * Time horizons for actions
 */
export type TimeHorizon = '0-30 dage' | '1-3 mdr' | '3-12 mdr';

// ============================================================================
// Evidence Types
// ============================================================================

/**
 * Evidence levels for hypotheses
 */
export type EvidenceLevel = 'Indikation' | 'Stærk Evidens';
