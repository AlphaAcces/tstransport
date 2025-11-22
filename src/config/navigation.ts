import React from 'react';
import { LayoutDashboard, User, Building2, BarChart3, TestTube2, Banknote, Factory, GanttChart, ShieldAlert, ListChecks, Users, Route, FileText, Network } from 'lucide-react';
import { NavItemConfig } from '../types';

/**
 * Navigation Configuration
 * 
 * Business (Company) Menu Structure:
 * - Dashboard
 * - Business Overview
 * - Executive Summary
 * --- ANALYSIS ---
 * - Person & Network
 * - Companies
 * - Financials
 * - Hypotheses
 * - Cashflow & DSO
 * - Sector Analysis
 * --- OPERATIONS ---
 * - Counterparties
 * - Scenarios
 * --- RISK & ACTIONS ---
 * - Timeline
 * - Risk Heatmap
 * - Actions
 * --- SAVED ---
 * - Saved Views
 * 
 * Personal Menu Structure:
 * - Dashboard
 * - Personal Profile
 * - Person & Network
 * - Timeline
 * - Risk Heatmap
 * - Actions
 * - Saved Views
 */

export const NAV_ITEMS: NavItemConfig[] = [
  // Core Navigation
  { id: 'dashboard',  label: 'Dashboard',  i18nKey: 'nav.dashboard',  icon: React.createElement(LayoutDashboard, { className: "h-5 w-5" }), showFor: ['tsl', 'umit'] },
  { id: 'business',   label: 'Business Overview',    i18nKey: 'nav.business',   icon: React.createElement(BarChart3, { className: "h-5 w-5" }),       showFor: ['tsl'] },
  { id: 'personal',   label: 'Personal Profile',     i18nKey: 'nav.personal',   icon: React.createElement(User, { className: "h-5 w-5" }),            showFor: ['umit'] },
  { id: 'executive',  label: 'Executive Summary', i18nKey: 'nav.executive', icon: React.createElement(FileText, { className: "h-5 w-5" }), showFor: ['tsl'] },
  
  // Analysis Section (Business only)
  { id: 'person',     label: 'Person & Network', i18nKey: 'nav.person', icon: React.createElement(Network, { className: "h-5 w-5" }),            showFor: ['tsl', 'umit'] },
  { id: 'companies',  label: 'Companies',  i18nKey: 'nav.companies',  icon: React.createElement(Building2, { className: "h-5 w-5" }),       showFor: ['tsl'] },
  { id: 'financials', label: 'Financials', i18nKey: 'nav.financials', icon: React.createElement(BarChart3, { className: "h-5 w-5" }),       showFor: ['tsl'] },
  { id: 'hypotheses', label: 'Hypotheses', i18nKey: 'nav.hypotheses', icon: React.createElement(TestTube2, { className: "h-5 w-5" }),       showFor: ['tsl'] },
  { id: 'cashflow',   label: 'Cashflow & DSO', i18nKey: 'nav.cashflow', icon: React.createElement(Banknote, { className: "h-5 w-5" }),        showFor: ['tsl'] },
  { id: 'sector',     label: 'Sector Analysis', i18nKey: 'nav.sector', icon: React.createElement(Factory, { className: "h-5 w-5" }),         showFor: ['tsl'] },
  
  // Operations Section (Business only)
  { id: 'counterparties', label: 'Counterparties', i18nKey: 'nav.counterparties', icon: React.createElement(Users, { className: "h-5 w-5" }),           showFor: ['tsl'] },
  { id: 'scenarios',  label: 'Scenarios',  i18nKey: 'nav.scenarios', icon: React.createElement(Route, { className: "h-5 w-5" }),           showFor: ['tsl'] },
  
  // Risk & Actions Section (Both)
  { id: 'timeline',   label: 'Timeline',    i18nKey: 'nav.timeline', icon: React.createElement(GanttChart, { className: "h-5 w-5" }),      showFor: ['tsl', 'umit'] },
  { id: 'risk',       label: 'Risk Heatmap', i18nKey: 'nav.risk', icon: React.createElement(ShieldAlert, { className: "h-5 w-5" }),     showFor: ['tsl', 'umit'] },
  { id: 'actions',    label: 'Actions', i18nKey: 'nav.actions', icon: React.createElement(ListChecks, { className: "h-5 w-5" }),      showFor: ['tsl', 'umit'] },
  
  // Saved Views (Both)
  { id: 'saved-views', label: 'Saved Views', i18nKey: 'nav.savedViews', icon: React.createElement(LayoutDashboard, { className: "h-5 w-5" }), showFor: ['tsl', 'umit'] },
];
