import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SsoLoginPage } from '../SsoLoginPage';
import { LoginRoute } from '../../../App';
import type { AuthUser } from '../../../domains/auth/types';
import { verifySsoTokenViaBackend, BackendSsoError } from '../../../domains/auth/ssoBackend';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../../domains/auth/ssoBackend', async () => {
  const actual = await vi.importActual<typeof import('../../../domains/auth/ssoBackend')>('../../../domains/auth/ssoBackend');
  return {
    ...actual,
    verifySsoTokenViaBackend: vi.fn(),
    getSsoSession: vi.fn(() => null), // No existing session
  };
});

const mockedVerify = vi.mocked(verifySsoTokenViaBackend);

const mockUser: AuthUser = {
  id: 'agent-47',
  name: 'Grey Nine',
  role: 'admin',
};

describe('SSO login flow', () => {
  beforeEach(() => {
    mockedVerify.mockReset();
  });

  it('authenticates via /sso-login and redirects to dashboard when token is valid', async () => {
    mockedVerify.mockResolvedValue(mockUser);
    const onLogin = vi.fn();

    render(
      <MemoryRouter initialEntries={['/sso-login?sso=test-token']}>
        <Routes>
          <Route path="/sso-login" element={<SsoLoginPage onLoginSuccess={onLogin} />} />
          <Route path="/" element={<div data-testid="dashboard-home">dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(mockUser));
    await waitFor(() => expect(screen.getByTestId('dashboard-home')).toBeInTheDocument());
  });

  it('canonicalizes /login?sso= to /sso-login before verification', async () => {
    render(
      <MemoryRouter initialEntries={['/login?sso=alias-token']}>
        <Routes>
          <Route path="/login" element={<LoginRoute onLoginSuccess={vi.fn()} />} />
          <Route path="/sso-login" element={<CaptureLocation />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByTestId('captured-location').textContent).toBe('/sso-login?sso=alias-token'));
  });

  it('surfaces SSO failures via SsoErrorDisplay after verification fails', async () => {
    mockedVerify.mockRejectedValue(new BackendSsoError('TOKEN_INVALID', 'bad signature'));

    render(
      <MemoryRouter initialEntries={['/sso-login?sso=broken-token']}>
        <Routes>
          <Route path="/sso-login" element={<SsoLoginPage onLoginSuccess={vi.fn()} />} />
          <Route path="/login" element={<LoginRoute onLoginSuccess={vi.fn()} />} />
        </Routes>
      </MemoryRouter>
    );

    // Should show error display on SSO login page
    await waitFor(() => expect(screen.getByTestId('sso-error-display')).toBeInTheDocument(), { timeout: 5000 });

    // Error title should mention invalid token
    expect(screen.getByText('auth.sso.errors.invalid.title')).toBeInTheDocument();
  });
});

const CaptureLocation: React.FC = () => {
  const location = useLocation();
  return <span data-testid="captured-location">{`${location.pathname}${location.search}`}</span>;
};
