/**
 * LocaleSwitcher Component
 *
 * Dropdown for selecting active locale (da-DK, en-US, en-GB, sv-SE, nb-NO, de-DE).
 */

import React from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { AppLocale, LOCALE_CONFIGS } from '../types';
import { setLocale } from '../../../store/userPreferencesSlice';
import { useUserSettings } from '../hooks/useUserSettings';

export const LocaleSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const { locale } = useUserSettings();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value as AppLocale;
    dispatch(setLocale(newLocale));

    // Sync i18n language (map AppLocale to i18n language code - fallback to EN for unsupported)
    const localeToI18nMap: Record<string, string> = {
      'da-DK': 'da',
      'en-US': 'en',
      'en-GB': 'en',
      'sv-SE': 'en', // Fallback
      'nb-NO': 'en', // Fallback
      'de-DE': 'en', // Fallback
      'fr-FR': 'en', // Fallback
      'es-ES': 'en', // Fallback
      'pt-PT': 'en', // Fallback
      'ru-RU': 'en', // Fallback
      'tr-TR': 'en', // Fallback
      'ar-SA': 'en', // Fallback
      'zh-CN': 'en', // Fallback
    };
    const i18nLang = localeToI18nMap[newLocale] || 'en';
    i18n.changeLanguage(i18nLang);
  };

  return (
    <div className="flex items-center gap-2" title="App language - Controls UI text and messages">
      <Globe className="w-4 h-4 text-gray-400" />
      <select
        value={locale}
        onChange={handleChange}
        className="bg-component-dark text-gray-200 text-sm rounded-lg px-3 py-1.5 border border-border-dark focus:ring-2 focus:ring-accent-green/50 focus:outline-none transition-colors"
        aria-label="App language - Controls UI text and messages"
      >
        {Object.values(AppLocale).map((loc) => {
          const config = LOCALE_CONFIGS[loc];
          return (
            <option key={loc} value={loc}>
              {config.flag} {config.name}
            </option>
          );
        })}
      </select>
    </div>
  );
};
