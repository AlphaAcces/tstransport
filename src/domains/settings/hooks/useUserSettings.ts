/**
 * User Settings Hook
 *
 * Provides access to global user settings (currency, locale, country, timezone).
 * Connected to Redux store for persistence.
 */

import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { UserSettings } from '../types';

export const useUserSettings = (): UserSettings => {
  const settings = useSelector((state: RootState) => state.userPreferences);

  return {
    currency: settings.currency,
    locale: settings.locale,
    country: settings.country,
    timezone: settings.timezone,
    dateFormat: settings.dateFormat,
    compactMode: settings.compactMode,
  };
};
