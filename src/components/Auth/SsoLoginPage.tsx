import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader, ShieldCheck } from 'lucide-react';
import type { AuthUser } from '../../domains/auth/types';
import {
  verifySsoTokenViaBackend,
  isBackendSsoError,
  getSsoSession,
  buildAuthUserFromSession,
  type BackendSsoErrorCode,
} from '../../domains/auth/ssoBackend';
import { SsoErrorDisplay } from './SsoErrorDisplay';

interface SsoLoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

type SsoState = 'verifying' | 'success' | 'error';

export const SsoLoginPage: React.FC<SsoLoginPageProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<SsoState>('verifying');
  const [errorCode, setErrorCode] = useState<BackendSsoErrorCode | null>(null);

  useEffect(() => {
    let isMounted = true;

    const processToken = async () => {
      const canonicalToken = searchParams.get('sso');
      const legacyToken = searchParams.get('ssoToken');
      const token = canonicalToken ?? legacyToken;

      if (!canonicalToken && legacyToken) {
        console.warn('[sso-login] Deprecated ?ssoToken query parameter detected. Use ?sso= instead.');
      }

      // No token provided - check if we have a valid SSO session cookie (set by backend)
      if (!token) {
        const session = getSsoSession();
        if (session) {
          // Backend already validated the token and set the cookie
          const user = buildAuthUserFromSession(session);
          onLoginSuccess(user);
          setStatus('success');
          navigate('/', { replace: true });
          return;
        }

        console.warn('[sso-login] No SSO token provided. Redirecting to login.');
        if (isMounted) {
          setStatus('error');
          setErrorCode('TOKEN_MISSING');
        }
        return;
      }

      // Verify token via backend API
      try {
        const user = await verifySsoTokenViaBackend(token);
        if (!isMounted) return;

        onLoginSuccess(user);
        setStatus('success');
        navigate('/', { replace: true });
      } catch (error) {
        if (!isMounted) return;

        const code = isBackendSsoError(error) ? error.code : 'UNKNOWN_ERROR';
        console.error(`[sso-login] Backend verification failed (${code})`, error);

        setStatus('error');
        setErrorCode(code);

        // Auto-redirect to login after showing error briefly
        setTimeout(() => {
          if (isMounted) {
            navigate('/login', { replace: true, state: { ssoFailed: true, errorCode: code } });
          }
        }, 3000);
      }
    };

    processToken();

    return () => {
      isMounted = false;
    };
  }, [navigate, onLoginSuccess, searchParams]);

  const handleBackToLogin = () => {
    navigate('/login', { replace: true, state: { ssoFailed: true, errorCode } });
  };

  const handleRetry = () => {
    // Reload the page to retry verification
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4 py-10">
      <div className="login-card max-w-md w-full space-y-4 text-center p-6">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[var(--color-border-gold)] bg-[var(--color-background)]/40 text-[var(--color-text-muted)] text-[0.65rem] font-semibold tracking-[0.35em] uppercase">
            <span>Intel24</span>
            <span className="text-[var(--color-gold)]">SSO</span>
          </div>
        </div>

        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="relative inline-block">
              <ShieldCheck className="w-12 h-12 text-[var(--color-gold)]" />
              <Loader className="w-5 h-5 animate-spin text-[var(--color-gold)] absolute -bottom-1 -right-1" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-[var(--color-text)]">
                {t('auth.sso.title', { defaultValue: 'Secure single sign-on' })}
              </h1>
              <p className="text-sm text-[var(--color-text-muted)]">
                {t('auth.sso.verifying', { defaultValue: 'Verifying secure session…' })}
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <ShieldCheck className="w-12 h-12 text-green-400 mx-auto" />
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-[var(--color-text)]">
                {t('auth.sso.successTitle', { defaultValue: 'Verified' })}
              </h1>
              <p className="text-sm text-[var(--color-text-muted)]">
                {t('auth.sso.success', { defaultValue: 'Session verified. Redirecting…' })}
              </p>
            </div>
          </div>
        )}

        {status === 'error' && errorCode && (
          <SsoErrorDisplay
            errorCode={errorCode}
            onRetry={handleRetry}
            onBackToLogin={handleBackToLogin}
          />
        )}
      </div>
    </div>
  );
};
