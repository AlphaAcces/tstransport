/**
 * SSO Error Display Component
 *
 * Displays user-friendly error messages for SSO authentication failures.
 * Maps backend error codes to localized, actionable messages.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Clock, ShieldX, UserX, WifiOff, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BackendSsoErrorCode } from '../../domains/auth/ssoBackend';

interface SsoErrorDisplayProps {
  errorCode: BackendSsoErrorCode | string;
  onRetry?: () => void;
  onBackToLogin?: () => void;
  className?: string;
}

interface ErrorConfig {
  icon: LucideIcon;
  titleKey: string;
  messageKey: string;
  defaultTitle: string;
  defaultMessage: string;
  iconColor: string;
}

const ERROR_CONFIG: Record<string, ErrorConfig> = {
  TOKEN_EXPIRED: {
    icon: Clock,
    titleKey: 'auth.sso.errors.expired.title',
    messageKey: 'auth.sso.errors.expired.message',
    defaultTitle: 'Session Expired',
    defaultMessage: 'Your session has expired. Please sign in again to continue.',
    iconColor: 'text-amber-400',
  },
  TOKEN_INVALID: {
    icon: ShieldX,
    titleKey: 'auth.sso.errors.invalid.title',
    messageKey: 'auth.sso.errors.invalid.message',
    defaultTitle: 'Invalid Session',
    defaultMessage: 'Your session is no longer valid. Please sign in again.',
    iconColor: 'text-red-400',
  },
  TOKEN_UNKNOWN_AGENT: {
    icon: UserX,
    titleKey: 'auth.sso.errors.unknownAgent.title',
    messageKey: 'auth.sso.errors.unknownAgent.message',
    defaultTitle: 'Access Denied',
    defaultMessage: 'You do not have permission to access this system. Contact your administrator.',
    iconColor: 'text-red-500',
  },
  TOKEN_MISSING: {
    icon: XCircle,
    titleKey: 'auth.sso.errors.missing.title',
    messageKey: 'auth.sso.errors.missing.message',
    defaultTitle: 'Authentication Required',
    defaultMessage: 'No authentication token was provided. Please sign in.',
    iconColor: 'text-gray-400',
  },
  TOKEN_ISSUER_MISMATCH: {
    icon: ShieldX,
    titleKey: 'auth.sso.errors.issuerMismatch.title',
    messageKey: 'auth.sso.errors.issuerMismatch.message',
    defaultTitle: 'Authentication Error',
    defaultMessage: 'The authentication source is not recognized. Please try again.',
    iconColor: 'text-red-400',
  },
  TOKEN_AUDIENCE_MISMATCH: {
    icon: ShieldX,
    titleKey: 'auth.sso.errors.audienceMismatch.title',
    messageKey: 'auth.sso.errors.audienceMismatch.message',
    defaultTitle: 'Authentication Error',
    defaultMessage: 'The authentication target is incorrect. Please try again.',
    iconColor: 'text-red-400',
  },
  NETWORK_ERROR: {
    icon: WifiOff,
    titleKey: 'auth.sso.errors.network.title',
    messageKey: 'auth.sso.errors.network.message',
    defaultTitle: 'Connection Error',
    defaultMessage: 'Unable to verify your session. Please check your network connection.',
    iconColor: 'text-amber-400',
  },
  UNKNOWN_ERROR: {
    icon: AlertTriangle,
    titleKey: 'auth.sso.errors.unknown.title',
    messageKey: 'auth.sso.errors.unknown.message',
    defaultTitle: 'Authentication Error',
    defaultMessage: 'An unexpected error occurred. Please try again.',
    iconColor: 'text-amber-400',
  },
};

const DEFAULT_ERROR: ErrorConfig = ERROR_CONFIG.UNKNOWN_ERROR;

export const SsoErrorDisplay: React.FC<SsoErrorDisplayProps> = ({
  errorCode,
  onRetry,
  onBackToLogin,
  className = '',
}) => {
  const { t } = useTranslation();

  const config = ERROR_CONFIG[errorCode] ?? DEFAULT_ERROR;
  const Icon = config.icon;

  const title = t(config.titleKey, { defaultValue: config.defaultTitle });
  const message = t(config.messageKey, { defaultValue: config.defaultMessage });

  return (
    <div className={`flex flex-col items-center text-center space-y-4 ${className}`} data-testid="sso-error-display">
      <div className={`p-4 rounded-full bg-[var(--color-surface)]/60 ${config.iconColor}`}>
        <Icon className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-sm">{message}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
          >
            {t('auth.sso.errors.retry', { defaultValue: 'Try Again' })}
          </button>
        )}
        {onBackToLogin && (
          <button
            type="button"
            onClick={onBackToLogin}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--color-gold)] text-[var(--color-background)] hover:bg-[var(--color-gold)]/90 transition-colors"
          >
            {t('auth.sso.errors.backToLogin', { defaultValue: 'Back to Login' })}
          </button>
        )}
      </div>

      {import.meta.env.DEV && (
        <p className="text-xs text-[var(--color-text-muted)]/60 font-mono">
          Error code: {errorCode}
        </p>
      )}
    </div>
  );
};

/**
 * Compact inline error banner for SSO failures
 */
interface SsoErrorBannerProps {
  errorCode: BackendSsoErrorCode | string;
  onDismiss?: () => void;
  className?: string;
}

export const SsoErrorBanner: React.FC<SsoErrorBannerProps> = ({
  errorCode,
  onDismiss,
  className = '',
}) => {
  const { t } = useTranslation();

  const config = ERROR_CONFIG[errorCode] ?? DEFAULT_ERROR;
  const Icon = config.icon;

  const title = t(config.titleKey, { defaultValue: config.defaultTitle });

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border border-red-500/30 bg-red-500/10 ${className}`}
      role="alert"
      data-testid="sso-error-banner"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${config.iconColor}`} />
      <span className="text-sm text-red-100 flex-1">{title}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 text-red-300 hover:text-red-100 transition-colors"
          aria-label={t('common.dismiss', { defaultValue: 'Dismiss' })}
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SsoErrorDisplay;
