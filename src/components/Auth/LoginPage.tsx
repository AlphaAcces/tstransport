import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Eye, EyeOff, Shield } from 'lucide-react';

// Available systems for the platform
type SystemType = 'intel24' | 'greyeye' | 'blackboxeye';

interface SystemConfig {
  id: SystemType;
  name: string;
  displayName: string;
  tagline: string;
}

const SYSTEMS: SystemConfig[] = [
  { id: 'intel24', name: 'Intel24', displayName: 'TS24', tagline: 'Intelligence Console' },
  { id: 'greyeye', name: 'GreyEYE', displayName: 'GreyEYE', tagline: 'Data Intelligence Portal' },
  { id: 'blackboxeye', name: 'BlackboxEYE', displayName: 'BlackboxEYE', tagline: 'Deep Analysis Suite' },
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
  const [pin, setPin] = useState('');
  const [token, setToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
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

  // Render system-specific logo
  const renderLogo = () => {
    if (selectedSystem === 'intel24') {
      // TS24 Logo - Gold gradient T mark
      return (
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-copper)] shadow-lg">
              <span className="text-4xl font-black text-[var(--color-background)] tracking-tighter">T</span>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-[var(--color-gold)] opacity-20 blur-xl -z-10" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-text)] tracking-tight">TS24</h1>
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
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)]">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(227,178,60,0.06)_0%,transparent_70%)]" />
      </div>

      <div className="relative w-full max-w-[440px] mx-4">
        {/* Login Card with gold border */}
        <div className="login-card p-8 space-y-6 animate-fade-in-up">
          {/* System Selector */}
          <div className="flex justify-center">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSystemDropdownOpen(!isSystemDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-gold)]/50 transition-colors"
              >
                <span className="font-semibold text-[var(--color-gold)]">{currentSystem.name}</span>
                <ChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${isSystemDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSystemDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl overflow-hidden z-50">
                  {SYSTEMS.map((system) => (
                    <button
                      key={system.id}
                      type="button"
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

          {/* Dynamic Logo based on selected system */}
          <div className="pt-2 pb-4">
            {renderLogo()}
          </div>

          {/* Title & Tagline */}
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[var(--color-text)]">{t('auth.title')}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{currentSystem.tagline}</p>
          </div>

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Username */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                {t('auth.usernameLabel')}
              </label>
              <input
                type="text"
                placeholder={t('auth.usernamePlaceholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-gold w-full"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                {t('auth.passwordLabel')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-gold w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* PIN Code */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                {t('auth.pinLabel')}
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  placeholder={t('auth.pinPlaceholder', { defaultValue: 'Indtast PIN' })}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="input-gold w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Token (optional) */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                {t('auth.tokenLabel')}
              </label>
              <input
                type="text"
                placeholder={t('auth.tokenPlaceholder', { defaultValue: 'Indtast token' })}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="input-gold w-full"
              />
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
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {t('auth.submitting')}
                </span>
              ) : (
                t('auth.submit')
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-4 border-t border-[var(--color-border)]">
            <p className="text-xs text-center text-[var(--color-text-muted)] leading-relaxed">
              <Shield className="w-3 h-3 inline-block mr-1 opacity-60" />
              {t('auth.securityNotice')}
            </p>
          </div>
        </div>

        {/* Version */}
        <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]/60">
          {currentSystem.name} v2.4.1 · © 2025 TS Intelligence
        </p>
      </div>
    </div>
  );
};
