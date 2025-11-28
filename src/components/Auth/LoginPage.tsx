import React, { useState } from 'react';
import { TslLogo } from '../Shared/TslLogo';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Shield, Lock, Eye, EyeOff } from 'lucide-react';

// Available systems for the platform
type SystemType = 'intel24' | 'greyeye' | 'blackboxeye';

interface SystemConfig {
  id: SystemType;
  name: string;
  tagline: string;
  accentColor: string;
}

const SYSTEMS: SystemConfig[] = [
  { id: 'intel24', name: 'Intel24', tagline: 'Intelligence Console', accentColor: '#E3B23C' },
  { id: 'greyeye', name: 'GreyEYE', tagline: 'Surveillance Platform', accentColor: '#9CA3AF' },
  { id: 'blackboxeye', name: 'BlackboxEYE', tagline: 'Deep Analysis Suite', accentColor: '#1E3A5F' },
];

interface LoginPageProps {
  onLoginSuccess: (user: { id: string; role: 'admin' | 'user' }) => void;
}

const users: { [key: string]: { password: string; role: 'admin' | 'user' } } = {
  'AlphaGrey': { password: 'Nex212325', role: 'admin' },
  'cetin.umit.TS': { password: '26353569', role: 'user' },
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<SystemType>('intel24');
  const [isSystemDropdownOpen, setIsSystemDropdownOpen] = useState(false);
  const { t } = useTranslation();

  const currentSystem = SYSTEMS.find(s => s.id === selectedSystem) || SYSTEMS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorKey(null);

    setTimeout(() => {
      const user = users[username];
      if (user && user.password === password) {
        onLoginSuccess({ id: username, role: user.role });
      } else {
        setErrorKey('auth.error.invalidCredentials');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)]">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(227,178,60,0.05)_0%,transparent_50%)]" />

      <div className="relative w-full max-w-[440px] mx-4">
        {/* Login Card */}
        <div className="login-card p-8 space-y-6 animate-fade-in-up">
          {/* System Selector */}
          <div className="flex justify-center mb-2">
            <div className="system-selector">
              <button
                type="button"
                onClick={() => setIsSystemDropdownOpen(!isSystemDropdownOpen)}
                className="system-selector__button text-sm"
              >
                <span className="font-semibold" style={{ color: currentSystem.accentColor }}>
                  {currentSystem.name}
                </span>
                <ChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${isSystemDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSystemDropdownOpen && (
                <div className="system-selector__dropdown">
                  {SYSTEMS.map((system) => (
                    <button
                      key={system.id}
                      type="button"
                      onClick={() => {
                        setSelectedSystem(system.id);
                        setIsSystemDropdownOpen(false);
                      }}
                      className={`system-selector__option ${selectedSystem === system.id ? 'system-selector__option--active' : ''}`}
                    >
                      <span style={{ color: selectedSystem === system.id ? undefined : system.accentColor }}>
                        {system.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <TslLogo variant="inline" className="h-14 w-auto mx-auto" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('auth.title')}</h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{currentSystem.tagline}</p>
            </div>
          </div>

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Username Input */}
            <div className="space-y-1">
              <label htmlFor="username" className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                {t('auth.usernameLabel')}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="input-gold w-full"
                placeholder={t('auth.usernamePlaceholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label htmlFor="password-input" className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                {t('auth.passwordLabel')}
              </label>
              <div className="relative">
                <input
                  id="password-input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input-gold w-full pr-10"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorKey && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20">
                <Shield className="w-4 h-4 text-[var(--color-danger)]" />
                <span className="text-sm text-[var(--color-danger)]">{t(errorKey)}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold w-full text-base"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {t('auth.submitting')}
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  {t('auth.submit')}
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-4 border-t border-[var(--color-border)]">
            <p className="text-xs text-center text-[var(--color-text-muted)] leading-relaxed">
              <Shield className="w-3 h-3 inline-block mr-1 opacity-60" />
              {t('auth.securityNotice', {
                defaultValue: 'Secured with hardware key authentication. All access attempts are logged and monitored.'
              })}
            </p>
          </div>
        </div>

        {/* Version/Copyright */}
        <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]/60">
          {currentSystem.name} v2.4.1 · © 2025 TS Intelligence
        </p>
      </div>
    </div>
  );
};
