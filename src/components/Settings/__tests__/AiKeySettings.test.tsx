import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AiKeySettings from '../AiKeySettings';
import { TenantProvider } from '../../../domains/tenant/TenantContext';

const tenant = {
  id: 't-1', name: 'T1', slug: 't1', status: 'active', tier: 'enterprise', createdAt: new Date().toISOString(),
  settings: { defaultLanguage: 'en', defaultCurrency: 'USD', timezone: 'UTC', dateFormat: 'YYYY-MM-DD', allowExternalIntegrations: true, dataRetentionDays: 30, requireMfa: false, sessionTimeoutMinutes: 30 },
  branding: { companyName: 'X', colors: { primary: '#00cc66', primaryHover: '#00b359', secondary: '#4a5568', accent: '#667eea', danger: '#e53e3e', warning: '#dd6b20', success: '#38a169', info: '#3182ce', background: '#0a0c0e', backgroundDark: '#121418', surface: '#1a1c20', surfaceHover: '#2d3748', border: '#2d3748', text: '#e2e8f0', textMuted: '#a0aec0' } },
  features: { enabledModules: ['network'], aiAssistant: true, pdfExport: true, apiAccess: false, advancedAnalytics: true, customReports: false, bulkOperations: false, auditLog: true, ssoIntegration: false, webhooks: false, dataImport: true, dataExport: true, multiLanguage: true, darkMode: true },
  limits: { maxUsers: 10, maxCases: 100, maxStorageMb: 1000, maxApiRequestsPerDay: 1000, maxExportsPerMonth: 10 }
};

test('Save button disabled if user lacks ai:configure', () => {
  const userNo = { id: 'u1', tenantId: 't-1', email: 'a@a', name: 'A', role: 'viewer', permissions: [], isActive: true, createdAt: new Date().toISOString(), mfaEnabled: false };

  render(
    <TenantProvider initialTenant={tenant} initialUser={userNo}>
      <AiKeySettings />
    </TenantProvider>
  );

  expect(screen.getByText(/AI API Key/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled();
});

test('Save button enabled when user has ai:configure', () => {
  const userYes = { id: 'u2', tenantId: 't-1', email: 'b@b', name: 'B', role: 'admin', permissions: ['ai:configure'], isActive: true, createdAt: new Date().toISOString(), mfaEnabled: false };

  render(
    <TenantProvider initialTenant={tenant} initialUser={userYes}>
      <AiKeySettings />
    </TenantProvider>
  );

  expect(screen.getByRole('button', { name: /Save/i })).toBeEnabled();
});
