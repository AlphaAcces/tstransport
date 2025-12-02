import React, { useMemo, useState, useId } from 'react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Briefcase,
  Building2,
  Fingerprint,
  KeyRound,
  Lock,
  Mail,
  MessageSquare,
  Shield,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { tenantApi } from '../../domains/tenant';
import { authenticateDemoUser } from '../../domains/auth/demoUsers';
import type { AuthUser } from '../../domains/auth/types';
import { SsoErrorBanner } from './SsoErrorDisplay';
import type { BackendSsoErrorCode } from '../../domains/auth/ssoBackend';

// Available systems for the platform
type SystemType = 'intel24' | 'greyeye' | 'blackboxeye';

interface SystemConfig {
  id: SystemType;
  name: string;
  displayName: string;
  tagline: string;
}

const SYSTEMS: SystemConfig[] = [
  { id: 'intel24', name: 'Intel24', displayName: 'Intel24', tagline: 'Intelligence Console' },
  { id: 'greyeye', name: 'GreyEYE', displayName: 'GreyEYE', tagline: 'Data Intelligence Portal' },
  { id: 'blackboxeye', name: 'BlackboxEYE', displayName: 'BlackboxEYE', tagline: 'Deep Analysis Suite' },
];

type SystemTheme = {
  background: string;
  backgroundDark: string;
  surface: string;
  surfaceHover: string;
  border: string;
  borderAccent: string;
  text: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentMuted: string;
  secondary: string;
  deepBlue: string;
  glowGradient: string;
  shadow: string;
  shadowStrong: string;
  danger: string;
};

const SYSTEM_THEMES: Record<SystemType, SystemTheme> = {
  intel24: {
    background: '#0C0E1A',
    backgroundDark: '#080A12',
    surface: '#1A1E2D',
    surfaceHover: '#242838',
    border: '#2A2E3D',
    borderAccent: 'rgba(227, 178, 60, 0.3)',
    text: '#E8E6E3',
    textMuted: '#9CA3AF',
    accent: '#E3B23C',
    accentHover: '#CCA030',
    accentMuted: '#B8942E',
    secondary: '#B87333',
    deepBlue: '#1E3A5F',
    glowGradient: 'radial-gradient(ellipse at center, rgba(227, 178, 60, 0.08) 0%, transparent 70%)',
    shadow: '0 0 20px rgba(227, 178, 60, 0.15)',
    shadowStrong: '0 0 30px rgba(227, 178, 60, 0.25)',
    danger: '#E53E3E',
  },
  greyeye: {
    background: '#080A10',
    backgroundDark: '#05060B',
    surface: '#141824',
    surfaceHover: '#1C2030',
    border: '#2D3245',
    borderAccent: 'rgba(156, 163, 175, 0.25)',
    text: '#ECEFF4',
    textMuted: '#A0AEC0',
    accent: '#9CA3AF',
    accentHover: '#7E8899',
    accentMuted: '#6B7280',
    secondary: '#4B5563',
    deepBlue: '#6B7280',
    glowGradient: 'radial-gradient(ellipse at center, rgba(156, 163, 175, 0.12) 0%, transparent 70%)',
    shadow: '0 0 20px rgba(156, 163, 175, 0.12)',
    shadowStrong: '0 0 30px rgba(156, 163, 175, 0.2)',
    danger: '#F87171',
  },
  blackboxeye: {
    background: '#050910',
    backgroundDark: '#03050A',
    surface: '#0F1624',
    surfaceHover: '#161F33',
    border: '#1E2A44',
    borderAccent: 'rgba(30, 58, 95, 0.35)',
    text: '#E5E7EB',
    textMuted: '#94A3B8',
    accent: '#1E3A5F',
    accentHover: '#2A4A73',
    accentMuted: '#2F517E',
    secondary: '#E3B23C',
    deepBlue: '#1E3A5F',
    glowGradient: 'radial-gradient(ellipse at center, rgba(30, 58, 95, 0.18) 0%, transparent 75%)',
    shadow: '0 0 20px rgba(30, 58, 95, 0.2)',
    shadowStrong: '0 0 30px rgba(30, 58, 95, 0.35)',
    danger: '#FB923C',
  },
};

interface SecureInputProps {
  id: string;
  label: string;
  icon: LucideIcon;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  rightAdornment?: React.ReactNode;
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  className?: string;
}

const SecureInput: React.FC<SecureInputProps> = ({
  id,
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  autoComplete,
  required,
  rightAdornment,
  disabled,
  inputMode,
  className,
}) => (
  <div className="secure-field">
    <span className="secure-field__icon" aria-hidden="true">
      <Icon className="w-4 h-4" />
    </span>
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      required={required}
      disabled={disabled}
      inputMode={inputMode}
      placeholder=" "
      aria-label={label}
      aria-required={required}
      className={`secure-field__input ${className ?? ''}`.trim()}
      spellCheck={false}
    />
    <label htmlFor={id} className="secure-field__label">
      {label}
    </label>
    {rightAdornment}
  </div>
);

interface LocationState {
  ssoFailed?: boolean;
  errorCode?: BackendSsoErrorCode;
}

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  ssoFailed?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, ssoFailed: propSsoFailed }) => {
  const location = useLocation();
  const locationState = (location.state as LocationState | null) ?? {};
  const ssoFailed = propSsoFailed || locationState.ssoFailed;
  const ssoErrorCode = locationState.errorCode;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [token, setToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<SystemType>('intel24');
  const [isSystemDropdownOpen, setIsSystemDropdownOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ name: '', email: '', org: '', role: '', purpose: '' });
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const { t, i18n } = useTranslation();
  const fingerprint = 'BBE4-2A7C-19F0-8D3A-77C4-AC98-1F2E-55A1';

  const usernameFieldId = useId();
  const passwordFieldId = useId();
  const pinFieldId = useId();
  const tokenFieldId = useId();
  const accessNameId = useId();
  const accessMailId = useId();
  const accessOrgId = useId();
  const accessRoleId = useId();
  const accessPurposeId = useId();

  const currentSystem = SYSTEMS.find(s => s.id === selectedSystem) || SYSTEMS[0];
  const theme = useMemo(() => SYSTEM_THEMES[selectedSystem], [selectedSystem]);
  const themeVariables = useMemo<CSSProperties>(() => ({
    '--color-background': theme.background,
    '--color-background-dark': theme.backgroundDark,
    '--color-surface': theme.surface,
    '--color-surface-hover': theme.surfaceHover,
    '--color-surface-elevated': theme.surface,
    '--color-border': theme.border,
    '--color-border-gold': theme.borderAccent,
    '--color-border-subtle': theme.borderAccent,
    '--color-text': theme.text,
    '--color-text-muted': theme.textMuted,
    '--color-text-gold': theme.accent,
    '--color-gold': theme.accent,
    '--color-gold-hover': theme.accentHover,
    '--color-gold-muted': theme.accentMuted,
    '--color-copper': theme.secondary,
    '--color-accent': theme.accent,
    '--color-accent-hover': theme.accentHover,
    '--color-accent-blue': theme.deepBlue,
    '--color-accent-copper': theme.secondary,
    '--color-deep-blue': theme.deepBlue,
    '--color-danger': theme.danger,
    '--shadow-gold': theme.shadow,
    '--shadow-gold-strong': theme.shadowStrong,
  }) as CSSProperties, [theme]);

  const updateRequestField = (field: keyof typeof requestForm) => (value: string) => {
    setRequestForm(prev => ({ ...prev, [field]: value }));
  };

  const handleRequestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isRequestSubmitting || !isRequestValid) return;

    setIsRequestSubmitting(true);
    setRequestSubmitted(false);
    setRequestError(null);

    const submissionPayload = {
      name: requestForm.name.trim(),
      email: requestForm.email.trim(),
      organization: requestForm.org.trim() || undefined,
      role: requestForm.role.trim(),
      justification: requestForm.purpose.trim(),
      locale: i18n.language,
    } as const;

    try {
      const response = await tenantApi.submitAccessRequest(submissionPayload);

      if (!response.success || !response.data) {
        const reason = response.error;
        setRequestError(
          reason
            ? t('auth.requestAccess.error.withReason', { reason })
            : t('auth.requestAccess.error.generic')
        );
        return;
      }

      setRequestSubmitted(true);
      setRequestForm({ name: '', email: '', org: '', role: '', purpose: '' });
      setTimeout(() => setRequestSubmitted(false), 6000);
    } catch (err) {
      const reason = err instanceof Error ? err.message : null;
      setRequestError(
        reason
          ? t('auth.requestAccess.error.withReason', { reason })
          : t('auth.requestAccess.error.generic')
      );
    } finally {
      setIsRequestSubmitting(false);
    }
  };

  const handleCopyFingerprint = async () => {
    try {
      if ('clipboard' in navigator) {
        await navigator.clipboard.writeText(fingerprint);
      }
    } catch {
      // Ignore clipboard errors but still provide optimistic feedback
    } finally {
      setCopiedFingerprint(true);
      setTimeout(() => setCopiedFingerprint(false), 2500);
    }
  };

  const isRequestValid = Boolean(
    requestForm.name.trim() &&
    requestForm.email.trim() &&
    requestForm.role.trim() &&
    requestForm.purpose.trim()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorKey(null);

    setTimeout(() => {
      const authenticatedUser = authenticateDemoUser(username, password);
      if (authenticatedUser) {
        onLoginSuccess(authenticatedUser);
      } else {
        setErrorKey('auth.error.invalidCredentials');
      }
      setIsLoading(false);
    }, 500);
  };

  // Render system-specific logo
  const renderLogo = () => {
    if (selectedSystem === 'intel24') {
      // Intel24 Logo - Gold gradient i mark
      return (
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-copper)] shadow-lg">
              <span className="text-4xl font-black text-[var(--color-background)] tracking-tighter">i</span>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-[var(--color-gold)] opacity-20 blur-xl -z-10" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-text)] tracking-tight">Intel24</h1>
          <p className="text-sm font-medium text-[var(--color-gold)] uppercase tracking-[0.2em]">Intelligence</p>
        </div>
      );
    } else if (selectedSystem === 'greyeye') {
      // GreyEYE Logo
      return (
        <div className="flex flex-col items-center">
          <div className="relative mb-4 w-20 h-20">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="greyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9CA3AF" />
                  <stop offset="100%" stopColor="#6B7280" />
                </linearGradient>
              </defs>
              <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" fill="none" stroke="url(#greyGradient)" strokeWidth="3" />
              <circle cx="50" cy="50" r="20" fill="none" stroke="#9CA3AF" strokeWidth="2" />
              <circle cx="50" cy="50" r="8" fill="#9CA3AF" />
            </svg>
          </div>
          <h1 className="text-3xl font-light tracking-[0.2em] text-[var(--color-text)]">
            <span className="text-[var(--color-text-muted)]">Grey</span>
            <span className="font-normal">EYE</span>
          </h1>
          <p className="text-xs tracking-[0.3em] uppercase text-[var(--color-text-muted)]">Intelligence</p>
        </div>
      );
    } else {
      // BlackboxEYE Logo
      return (
        <div className="flex flex-col items-center">
          <div className="relative mb-4 w-20 h-20">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E3A5F" />
                  <stop offset="100%" stopColor="#2A4A73" />
                </linearGradient>
              </defs>
              <rect x="15" y="15" width="70" height="70" rx="8" fill="url(#blueGradient)" stroke="#1E3A5F" strokeWidth="2" />
              <circle cx="50" cy="50" r="18" fill="none" stroke="#E3B23C" strokeWidth="2" />
              <circle cx="50" cy="50" r="6" fill="#E3B23C" />
            </svg>
          </div>
          <h1 className="text-3xl font-light tracking-[0.1em] text-[var(--color-text)]">
            <span className="text-[var(--color-deep-blue)]">Blackbox</span>
            <span className="font-semibold">EYE</span>
          </h1>
          <p className="text-xs tracking-[0.3em] uppercase text-[var(--color-text-muted)]">Deep Analysis</p>
        </div>
      );
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-[var(--color-background)] px-4 py-10"
      style={themeVariables}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[900px] h-[500px]"
          style={{ background: theme.glowGradient }}
        />
        <div className="absolute bottom-[-160px] right-[-120px] w-[520px] h-[520px] rounded-full blur-[180px] bg-[var(--color-copper-muted)] opacity-40" />
      </div>

      <div className="relative w-full max-w-[360px] lg:max-w-[30vw] xl:max-w-[28vw] space-y-3">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[var(--color-border-gold)] bg-[var(--color-background)]/40 text-[var(--color-text-muted)] text-[0.65rem] font-semibold tracking-[0.35em] uppercase">
            <span>Intel24</span>
            <span className="text-[var(--color-gold)]">Blackbox EYE™</span>
          </div>
        </div>

        <div className="login-card p-5 md:p-6 space-y-4 animate-fade-in-up relative z-10">
          <div className="flex justify-center">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSystemDropdownOpen(!isSystemDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-gold)]/60 transition-colors"
                aria-haspopup="listbox"
                aria-expanded={isSystemDropdownOpen}
              >
                <span className="font-semibold text-[var(--color-gold)] tracking-wide">{currentSystem.name}</span>
                <ChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${isSystemDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSystemDropdownOpen && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl overflow-hidden z-50"
                  role="listbox"
                >
                  {SYSTEMS.map((system) => (
                    <button
                      key={system.id}
                      type="button"
                      role="option"
                      aria-selected={selectedSystem === system.id}
                      onClick={() => {
                        setSelectedSystem(system.id);
                        setIsSystemDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left transition-colors ${
                        selectedSystem === system.id
                          ? 'bg-[var(--color-gold)] text-[var(--color-background)] font-semibold'
                          : 'text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                      }`}
                    >
                      {system.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 pb-4">
            {renderLogo()}
          </div>

          <div className="text-center space-y-1.5">
            <h2 className="text-lg font-semibold text-[var(--color-text)] tracking-tight md:text-xl">{t('auth.title')}</h2>
            <p className="text-xs text-[var(--color-text-muted)] md:text-sm">{currentSystem.tagline}</p>
            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-[var(--color-text-muted)]/80">
              {t('auth.heroSubline')}
            </p>
          </div>

          {ssoFailed && (
            <SsoErrorBanner errorCode={ssoErrorCode ?? 'TOKEN_INVALID'} />
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <SecureInput
              id={usernameFieldId}
              label={t('auth.usernameLabel')}
              icon={UserRound}
              value={username}
              onChange={setUsername}
              autoComplete="username"
              required
            />

            <SecureInput
              id={passwordFieldId}
              label={t('auth.passwordLabel')}
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              required
              className="pr-12"
              rightAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="secure-field__toggle"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <SecureInput
              id={pinFieldId}
              label={t('auth.pinLabel')}
              icon={KeyRound}
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={setPin}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="pr-12"
              rightAdornment={
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="secure-field__toggle"
                  aria-label={showPin ? t('auth.hidePin') : t('auth.showPin')}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <SecureInput
              id={tokenFieldId}
              label={t('auth.tokenLabel')}
              icon={ShieldCheck}
              value={token}
              onChange={setToken}
              autoComplete="off"
            />

            {errorKey && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20">
                <Shield className="w-4 h-4 text-[var(--color-danger)]" />
                <span className="text-sm text-[var(--color-danger)]">{t(errorKey)}</span>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="btn-gold w-full text-base">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {t('auth.submitting')}
                </span>
              ) : (
                t('auth.submit')
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-[var(--color-border)]">
            <p className="text-xs text-center text-[var(--color-text-muted)] leading-relaxed flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--color-gold)]" />
              {t('auth.securityNotice')}
            </p>
          </div>

          <div className="request-accordion">
            <button
              type="button"
              className="request-accordion__header"
              onClick={() => setIsRequestOpen(prev => !prev)}
              aria-expanded={isRequestOpen}
              aria-controls="request-access-panel"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[var(--color-gold)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{t('auth.requestAccess.title')}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{t('auth.requestAccess.subtitle')}</p>
                </div>
              </div>
              {isRequestOpen ? <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />}
            </button>

            {isRequestOpen && (
              <div id="request-access-panel" className="request-accordion__content" role="region">
                <form className="space-y-3" onSubmit={handleRequestSubmit}>
                  <SecureInput
                    id={accessNameId}
                    label={t('auth.requestAccess.fields.name')}
                    icon={UserRound}
                    value={requestForm.name}
                    onChange={updateRequestField('name')}
                    required
                  />
                  <SecureInput
                    id={accessMailId}
                    label={t('auth.requestAccess.fields.email')}
                    icon={Mail}
                    type="email"
                    value={requestForm.email}
                    onChange={updateRequestField('email')}
                    required
                    autoComplete="email"
                  />
                  <SecureInput
                    id={accessOrgId}
                    label={t('auth.requestAccess.fields.org')}
                    icon={Building2}
                    value={requestForm.org}
                    onChange={updateRequestField('org')}
                  />
                  <SecureInput
                    id={accessRoleId}
                    label={t('auth.requestAccess.fields.role')}
                    icon={Briefcase}
                    value={requestForm.role}
                    onChange={updateRequestField('role')}
                    required
                  />
                  <SecureInput
                    id={accessPurposeId}
                    label={t('auth.requestAccess.fields.purpose')}
                    icon={MessageSquare}
                    value={requestForm.purpose}
                    onChange={updateRequestField('purpose')}
                    required
                  />
                  <button
                    type="submit"
                    className="btn-gold w-full text-sm"
                    disabled={isRequestSubmitting || !isRequestValid}
                  >
                    {isRequestSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        {t('auth.requestAccess.submitting')}
                      </span>
                    ) : (
                      t('auth.requestAccess.submit')
                    )}
                  </button>
                  {requestSubmitted && (
                    <p className="text-sm text-[var(--color-success)] text-center" role="status">
                      {t('auth.requestAccess.success')}
                    </p>
                  )}
                  {requestError && (
                    <p className="text-sm text-[var(--color-danger)] text-center" role="alert">
                      {requestError}
                    </p>
                  )}
                </form>
              </div>
            )}
          </div>

          <div className="secure-comm" role="region" aria-live="polite">
            <div className="secure-comm__badge">
              <ShieldCheck className="w-4 h-4" />
              {t('auth.secureComm.label')}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text)] overflow-auto">
              <Fingerprint className="w-4 h-4 text-[var(--color-gold)]" />
              <span className="whitespace-nowrap">{fingerprint}</span>
              <button
                type="button"
                className="px-2 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-text)] text-[0.7rem] uppercase tracking-[0.2em]"
                onClick={handleCopyFingerprint}
              >
                {copiedFingerprint ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)]/70">
          {currentSystem.name} v2.4.1 · © 2025 TS Intelligence
        </p>
      </div>
    </div>
  );
};
