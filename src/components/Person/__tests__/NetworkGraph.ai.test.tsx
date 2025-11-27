import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NetworkGraph } from '../NetworkGraph';
import TenantProvider from '../../../domains/tenant/TenantContext';

const sampleNodes = [
  { id: 'n1', x: 100, y: 100, label: 'Alice', type: 'person', size: 1, connections: 2 },
  { id: 'n2', x: 200, y: 120, label: 'Bob', type: 'person', size: 1, connections: 1 }
];

const sampleEdges = [
  { from: 'n1', to: 'n2', type: 'current', label: 'colleague' }
];

describe('NetworkGraph AI overlays (RBAC)', () => {
  test('toggle visible for user with ai:use permission and disabled for others', () => {
    // user with permission
    const tenant = {
      id: 't1', name: 'T1', slug: 't1', status: 'active', tier: 'enterprise', createdAt: new Date().toISOString(),
      settings: { defaultLanguage: 'en', defaultCurrency: 'USD', timezone: 'UTC', dateFormat: 'YYYY-MM-DD', allowExternalIntegrations: true, dataRetentionDays: 30, requireMfa: false, sessionTimeoutMinutes: 30 },
      branding: { companyName: 'X', colors: { primary: '#00cc66', primaryHover: '#00b359', secondary: '#4a5568', accent: '#667eea', danger: '#e53e3e', warning: '#dd6b20', success: '#38a169', info: '#3182ce', background: '#0a0c0e', backgroundDark: '#121418', surface: '#1a1c20', surfaceHover: '#2d3748', border: '#2d3748', text: '#e2e8f0', textMuted: '#a0aec0' } },
      features: { enabledModules: ['network'], aiAssistant: true, pdfExport: true, apiAccess: false, advancedAnalytics: true, customReports: false, bulkOperations: false, auditLog: true, ssoIntegration: false, webhooks: false, dataImport: true, dataExport: true, multiLanguage: true, darkMode: true },
      limits: { maxUsers: 10, maxCases: 100, maxStorageMb: 1000, maxApiRequestsPerDay: 1000, maxExportsPerMonth: 10 }
    };

    const userWithAi = { id: 'u1', tenantId: 't1', email: 'a@a', name: 'A', role: 'analyst', permissions: ['ai:use'], isActive: true, createdAt: new Date().toISOString(), mfaEnabled: false };

    render(
      <TenantProvider initialTenant={tenant} initialUser={userWithAi}>
        <NetworkGraph nodes={sampleNodes as any} edges={sampleEdges as any} />
      </TenantProvider>
    );

    // Toggle input should be present for users with permission
    expect(screen.getByLabelText(/Toggle AI overlays/i)).toBeInTheDocument();

    // user without permission
    const userNoAi = { ...userWithAi, id: 'u2', role: 'viewer', permissions: [] };
    render(
      <TenantProvider initialTenant={tenant} initialUser={userNoAi}>
        <NetworkGraph nodes={sampleNodes as any} edges={sampleEdges as any} />
      </TenantProvider>
    );

    expect(screen.getAllByText(/AI overlay/i).length).toBeGreaterThanOrEqual(1);
    // legend should indicate not permitted for second render
    expect(screen.getAllByText(/Not permitted/i).length).toBeGreaterThanOrEqual(1);
  });
});
