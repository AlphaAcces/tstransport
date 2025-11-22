/**
 * CountrySelector Component
 *
 * Dropdown for selecting market/country context (DK, SE, NO, DE, GB, US).
 * Automatically updates default currency and locale.
 */

import React from 'react';
import { useDispatch } from 'react-redux';
import { MapPin } from 'lucide-react';
import { Country, COUNTRY_CONFIGS } from '../types';
import { setCountry, setCurrency, setLocale, setTimezone } from '../../../store/userPreferencesSlice';
import { useUserSettings } from '../hooks/useUserSettings';

interface CountrySelectorProps {
  variant?: 'standard' | 'condensed';
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({ variant = 'standard' }) => {
  const dispatch = useDispatch();
  const { country } = useUserSettings();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value as Country;
    const config = COUNTRY_CONFIGS[newCountry];

    dispatch(setCountry(newCountry));
    dispatch(setCurrency(config.defaultCurrency));
    dispatch(setLocale(config.defaultLocale));
    dispatch(setTimezone(config.timezone));
  };

  const selectClasses = variant === 'condensed'
    ? 'w-full sm:w-auto sm:min-w-[110px] bg-component-dark/60 text-xs font-semibold leading-tight px-2 py-1 rounded-lg border border-border-dark/70 text-gray-100'
    : 'bg-component-dark text-gray-200 text-sm rounded-lg px-3 py-1.5 border border-border-dark';

  return (
    <div className="flex items-center gap-2" title="Home country/market - Sets jurisdiction context and defaults">
      <MapPin className="w-4 h-4 shrink-0 text-gray-400" />
      <select
        value={country}
        onChange={handleChange}
        className={`${selectClasses} focus:ring-2 focus:ring-accent-green/40 focus:outline-none transition-colors`}
        aria-label="Home country/market - Sets jurisdiction context"
      >
        {Object.values(Country).map((cntry) => {
          const config = COUNTRY_CONFIGS[cntry];
          const optionLabel = variant === 'condensed'
            ? `${config.flag} ${config.code}`
            : `${config.flag} ${config.name}`;
          return (
            <option key={cntry} value={cntry}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
};
