import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Eye, EyeOff, Hexagon } from 'lucide-react';

// Available systems for the platform
type SystemType = 'intel24' | 'greyeye' | 'blackboxeye';

interface SystemConfig {
  id: SystemType;
  name: string;
  tagline: string;
  accentColor: string;
  logoStyle: 'gold' | 'silver' | 'blue';
}

const SYSTEMS: SystemConfig[] = [
  { id: 'intel24', name: 'Intel24', tagline: 'Intelligence Console', accentColor: '#E3B23C', logoStyle: 'gold' },
  { id: 'greyeye', name: 'GreyEYE', tagline: 'Data Intelligence (GDI) operatør-portal', accentColor: '#C9A227', logoStyle: 'gold' },
  { id: 'blackboxeye', name: 'BlackboxEYE', tagline: 'Deep Analysis Suite', accentColor: '#1E3A5F', logoStyle: 'blue' },
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
  const [selectedSystem, setSelectedSystem] = useState<SystemType>('greyeye');
  const [isSystemDropdownOpen, setIsSystemDropdownOpen] = useState(false);
  const { t } = useTranslation();

  const currentSystem = SYSTEMS.find(s => s.id === selectedSystem) || SYSTEMS[1];

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
    <div className="login-page flex items-center justify-center min-h-screen bg-[#0a0a0a]">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.08)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A227]/30 to-transparent" />
      </div>

      <div className="relative w-full max-w-[420px] mx-4">
        {/* Powered by header */}
        <div className="flex items-center justify-center gap-2 mb-8 text-xs text-[#666]">
          <span className="tracking-widest uppercase">... powered by</span>
          <div className="flex items-center gap-1.5">
            <Hexagon className="w-4 h-4 text-[#888]" />
            <span className="font-semibold text-[#ccc]">BlackboxEYE</span>
          </div>
        </div>

        {/* Main Login Card */}
        <div className="login-card-modern rounded-2xl border border-[#C9A227]/20 bg-[#111111]/90 backdrop-blur-xl p-8 shadow-2xl">
          {/* System Selector - Top */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSystemDropdownOpen(!isSystemDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#333] bg-[#1a1a1a] hover:border-[#C9A227]/50 transition-colors"
              >
                <span className="font-semibold text-[#C9A227]">{currentSystem.name}</span>
                <ChevronDown className={`w-4 h-4 text-[#666] transition-transform ${isSystemDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSystemDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-[#333] bg-[#1a1a1a] shadow-xl overflow-hidden z-50">
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
                          ? 'bg-[#C9A227] text-[#0a0a0a]'
                          : 'text-[#ccc] hover:bg-[#222]'
                      }`}
                    >
                      {system.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Logo - GreyEYE Style Eye Icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-6">
              {/* Hexagonal container with eye */}
              <div className="relative w-28 h-28">
                {/* Outer hexagon glow */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#C9A227" />
                        <stop offset="50%" stopColor="#8B7355" />
                        <stop offset="100%" stopColor="#C9A227" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <polygon
                      points="50,2 93,25 93,75 50,98 7,75 7,25"
                      fill="none"
                      stroke="url(#goldGradient)"
                      strokeWidth="2"
                      filter="url(#glow)"
                    />
                  </svg>
                </div>
                {/* Eye icon in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 60 60" className="w-16 h-16">
                    <defs>
                      <radialGradient id="eyeGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#D4AF37" />
                        <stop offset="60%" stopColor="#8B7355" />
                        <stop offset="100%" stopColor="#5C4827" />
                      </radialGradient>
                    </defs>
                    {/* Outer eye shape */}
                    <path
                      d="M30 15 Q45 30 30 45 Q15 30 30 15"
                      fill="url(#eyeGradient)"
                      stroke="#C9A227"
                      strokeWidth="1"
                    />
                    {/* Inner pupil */}
                    <circle cx="30" cy="30" r="8" fill="#1a1a1a" />
                    <circle cx="30" cy="30" r="5" fill="#C9A227" opacity="0.8" />
                    {/* Highlight */}
                    <circle cx="33" cy="27" r="2" fill="#fff" opacity="0.6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Brand Name */}
            <h1 className="text-3xl font-light tracking-[0.3em] text-[#ccc] mb-1">
              <span className="text-[#888]">Grey</span>
              <span className="text-[#C9A227] font-normal">EYE</span>
            </h1>
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#666]">Intelligence</p>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-[#eee]">{t('auth.title')}</h2>
            <p className="mt-1 text-sm text-[#666]">{currentSystem.tagline}</p>
          </div>

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Username */}
            <input
              type="text"
              placeholder={t('auth.usernameLabel')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input w-full px-4 py-3.5 rounded-lg bg-[#f5f5f5] text-[#333] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50"
              required
            />

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.passwordLabel')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input w-full px-4 py-3.5 pr-12 rounded-lg bg-[#f5f5f5] text-[#333] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* PIN Code */}
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                placeholder={t('auth.pinLabel', { defaultValue: 'PIN-kode' })}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="login-input w-full px-4 py-3.5 pr-12 rounded-lg bg-[#f5f5f5] text-[#333] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666]"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Token (optional) */}
            <input
              type="text"
              placeholder={t('auth.tokenLabel', { defaultValue: 'Token (valgfri)' })}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="login-input w-full px-4 py-3.5 rounded-lg bg-[#f5f5f5] text-[#333] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50"
            />

            {/* Error Message */}
            {errorKey && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {t(errorKey)}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-lg bg-[#C9A227] hover:bg-[#B8922A] text-[#0a0a0a] font-bold text-sm tracking-wider uppercase transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {t('auth.submitting')}
                </span>
              ) : (
                t('auth.submit', { defaultValue: 'LOG IND' })
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-4 border-t border-[#222]">
            <p className="text-[11px] text-center text-[#666] leading-relaxed">
              {t('auth.securityNoticeShort', { defaultValue: 'Adgang kræver autoriseret hardware-nøgle.' })}
              <br />
              {t('auth.securityNoticeLog', { defaultValue: 'Alle forsøg logges.' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
