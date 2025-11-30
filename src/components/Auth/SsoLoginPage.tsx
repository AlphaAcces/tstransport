import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader, ShieldAlert } from 'lucide-react';
import type { AuthUser } from '../../domains/auth/types';
import { isSsoError, verifySsoToken } from '../../domains/auth/sso';

interface SsoLoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

type SsoState = 'verifying' | 'error';

export const SsoLoginPage: React.FC<SsoLoginPageProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<SsoState>('verifying');
  const [message, setMessage] = useState<string>(t('auth.sso.verifying', { defaultValue: 'Verifying secure token…' }));

  useEffect(() => {
    let isMounted = true;

    const redirectToLogin = () => {
      navigate('/login', { replace: true, state: { ssoFailed: true } });
    };

    const failAndRedirect = () => {
      if (!isMounted) return;
      setStatus('error');
      setMessage(t('auth.sso.invalid', { defaultValue: 'SSO token invalid or expired. Please log in manually.' }));
      redirectToLogin();
    };

    const processToken = async () => {
      const canonicalToken = searchParams.get('sso');
      const legacyToken = searchParams.get('ssoToken');
      const token = canonicalToken ?? legacyToken;

      if (!canonicalToken && legacyToken) {
        console.warn('[sso-login] Deprecated ?ssoToken query parameter detected. Use ?sso= instead.');
      }

      if (!token) {
        console.warn('[sso-login] Missing ?sso token. Redirecting to login.');
        failAndRedirect();
        return;
      }

      try {
        const user = await verifySsoToken(token);
        if (!isMounted) {
          return;
        }
        onLoginSuccess(user);
        setMessage(t('auth.sso.success', { defaultValue: 'Secure token verified. Redirecting…' }));
        navigate('/', { replace: true });
      } catch (error) {
        const code = isSsoError(error) ? error.code : 'SSO_MALFORMED';
        const details = isSsoError(error) ? error.details : undefined;
        console.error(`[sso-login] Token verification failed (${code})`, { code, details });
        // TODO: Emit structured telemetry/rate-limits once ops pipeline is wired up.
        failAndRedirect();
      }
    };

    processToken();

    return () => {
      isMounted = false;
    };
  }, [navigate, onLoginSuccess, searchParams, t]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4 py-10">
      <div className="login-card max-w-md w-full space-y-4 text-center p-6">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[var(--color-border-gold)] bg-[var(--color-background)]/40 text-[var(--color-text-muted)] text-[0.65rem] font-semibold tracking-[0.35em] uppercase">
            <span>TS24</span>
            <span className="text-[var(--color-gold)]">SSO</span>
          </div>
        </div>
        <div className="space-y-2">
          <ShieldAlert className="w-10 h-10 text-[var(--color-gold)] mx-auto" />
          <h1 className="text-xl font-semibold text-[var(--color-text)]">{t('auth.sso.title', { defaultValue: 'Secure single sign-on' })}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
        </div>
        {status === 'verifying' ? (
          <div className="flex items-center justify-center gap-2 text-[var(--color-text)]">
            <Loader className="w-5 h-5 animate-spin" />
            <span>{t('auth.sso.progress', { defaultValue: 'Validating access…' })}</span>
          </div>
        ) : (
          <button
            type="button"
            className="btn-gold w-full text-sm"
            onClick={() => navigate('/login', { replace: true })}
          >
            {t('auth.sso.fallbackCta', { defaultValue: 'Back to login' })}
          </button>
        )}
      </div>
    </div>
  );
};
