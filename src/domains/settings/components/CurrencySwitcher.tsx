/**
 * CurrencySwitcher Component
 *
 * Dropdown for selecting active currency (DKK, EUR, USD, GBP, SEK, NOK).
 */

import React from 'react';
import { useDispatch } from 'react-redux';
import { DollarSign } from 'lucide-react';
import { Currency, CURRENCY_CONFIGS } from '../types';
import { setCurrency } from '../../../store/userPreferencesSlice';
import { useUserSettings } from '../hooks/useUserSettings';

interface CurrencySwitcherProps {
  variant?: 'standard' | 'condensed';
}

export const CurrencySwitcher: React.FC<CurrencySwitcherProps> = ({ variant = 'standard' }) => {
  const dispatch = useDispatch();
  const { currency } = useUserSettings();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setCurrency(e.target.value as Currency));
  };

  const selectClasses = variant === 'condensed'
    ? 'w-full sm:w-auto sm:min-w-[105px] bg-component-dark/60 text-xs font-semibold leading-tight px-2 py-1 rounded-lg border border-border-dark/70 text-gray-100'
    : 'bg-component-dark text-gray-200 text-sm rounded-lg px-3 py-1.5 border border-border-dark';

  return (
    <div className="flex items-center gap-2" title="Display currency - Converts amounts for viewing only (not accounting currency)">
      <DollarSign className="w-4 h-4 shrink-0 text-gray-400" />
      <select
        value={currency}
        onChange={handleChange}
        className={`${selectClasses} focus:ring-2 focus:ring-accent-green/40 focus:outline-none transition-colors`}
        aria-label="Display currency - Converts amounts for viewing"
      >
        {Object.values(Currency).map((cur) => {
          const config = CURRENCY_CONFIGS[cur];
          const optionLabel = variant === 'condensed'
            ? `${config.code} · ${config.symbol}`
            : `${config.code} (${config.symbol}) - ${config.name}`;
          return (
            <option key={cur} value={cur}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
};
