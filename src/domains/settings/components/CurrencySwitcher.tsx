/**
 * CurrencySwitcher Component
 *
 * Dropdown for selecting active currency (DKK, EUR, USD, GBP, SEK, NOK).
 */

import React from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { DollarSign } from 'lucide-react';
import { Currency, CURRENCY_CONFIGS } from '../types';
import { setCurrency } from '../../../store/userPreferencesSlice';
import { useUserSettings } from '../hooks/useUserSettings';

export const CurrencySwitcher: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { currency } = useUserSettings();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setCurrency(e.target.value as Currency));
  };

  return (
    <div className="flex items-center gap-2">
      <DollarSign className="w-4 h-4 text-gray-400" />
      <select
        value={currency}
        onChange={handleChange}
        className="bg-component-dark text-gray-200 text-sm rounded-lg px-3 py-1.5 border border-border-dark focus:ring-2 focus:ring-accent-green/50 focus:outline-none transition-colors"
        aria-label={t('settings.currency.label')}
      >
        {Object.values(Currency).map((cur) => {
          const config = CURRENCY_CONFIGS[cur];
          return (
            <option key={cur} value={cur}>
              {config.code} ({config.symbol})
            </option>
          );
        })}
      </select>
    </div>
  );
};
