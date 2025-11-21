import React, { useState } from 'react';
import { TslLogo } from '../Shared/TslLogo';
import { useTranslation } from 'react-i18next';

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
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation('auth');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorKey(null);

    setTimeout(() => {
        const user = users[username];
        if (user && user.password === password) {
            onLoginSuccess({ id: username, role: user.role });
        } else {
            setErrorKey('error.invalidCredentials');
        }
        setIsLoading(false);
    }, 500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-dark">
      <div className="w-full max-w-md p-8 space-y-8 bg-component-dark rounded-lg border border-border-dark shadow-lg">
        <div className="text-center">
            <TslLogo variant="inline" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-200">{t('title')}</h1>
          <p className="mt-2 text-sm text-gray-400">{t('subtitle')}</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">{t('usernameLabel')}</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border-dark bg-base-dark placeholder-gray-500 text-gray-200 rounded-t-md focus:outline-none focus:ring-accent-green focus:border-accent-green focus:z-10 sm:text-sm"
                placeholder={t('usernamePlaceholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password-input" className="sr-only">{t('passwordLabel')}</label>
              <input
                id="password-input"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border-dark bg-base-dark placeholder-gray-500 text-gray-200 rounded-b-md focus:outline-none focus:ring-accent-green focus:border-accent-green focus:z-10 sm:text-sm"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {errorKey && (
            <div className="text-center text-sm text-red-400">
              {t(errorKey)}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-accent-green/80 hover:bg-accent-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-component-dark focus:ring-accent-green disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isLoading ? t('submitting') : t('submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
