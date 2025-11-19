import React from 'react';
import { LayoutDashboard, User, Building2, BarChart3, TestTube2, Banknote, Factory, GanttChart, ShieldAlert, ListChecks, Users, Route } from 'lucide-react';
import { NavItemConfig } from '../types';

// FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
// The original code used <Icon className="..." />, which is only supported in .tsx files.
export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard',  label: 'Dashboard',        icon: React.createElement(LayoutDashboard, { className: "h-5 w-5" }), showFor: ['tsl', 'umit'] },
  { id: 'executive',  label: 'Executive Summary', icon: React.createElement(LayoutDashboard, { className: "h-5 w-5" }), showFor: ['tsl'] },
  { id: 'person',     label: 'Person & Network', icon: React.createElement(User, { className: "h-5 w-5" }),            showFor: ['tsl', 'umit'] },
  { id: 'companies',  label: 'Companies',        icon: React.createElement(Building2, { className: "h-5 w-5" }),       showFor: ['tsl'] },
  { id: 'financials', label: 'Financials',       icon: React.createElement(BarChart3, { className: "h-5 w-5" }),       showFor: ['tsl'] },
  { id: 'hypotheses', label: 'Hypotheses',       icon: React.createElement(TestTube2, { className: "h-5 w-5" }),       showFor: ['tsl'] },
  { id: 'cashflow',   label: 'Cashflow & DSO',   icon: React.createElement(Banknote, { className: "h-5 w-5" }),        showFor: ['tsl'] },
  { id: 'sector',     label: 'Sector Analysis',  icon: React.createElement(Factory, { className: "h-5 w-5" }),         showFor: ['tsl'] },
  { id: 'counterparties', label: 'Modparter',    icon: React.createElement(Users, { className: "h-5 w-5" }),           showFor: ['tsl'] },
  { id: 'scenarios',  label: 'Scenarier',        icon: React.createElement(Route, { className: "h-5 w-5" }),           showFor: ['tsl'] },
  { id: 'timeline',   label: 'Timeline',         icon: React.createElement(GanttChart, { className: "h-5 w-5" }),      showFor: ['tsl', 'umit'] },
  { id: 'risk',       label: 'Risk Heatmap',     icon: React.createElement(ShieldAlert, { className: "h-5 w-5" }),     showFor: ['tsl', 'umit'] },
  { id: 'actions',    label: 'Actionables',      icon: React.createElement(ListChecks, { className: "h-5 w-5" }),      showFor: ['tsl', 'umit'] },
];