import { convertFromDKK } from '../src/domains/settings/services/currencyConversion.ts';
import { Currency } from '../src/domains/settings/types/index.ts';
import { formatCurrency } from '../src/lib/format/intl.ts';

const samples = [
  { label: 'Executive dashboard net result (≈DKK 3M)', amount: 3_000_000 },
  { label: 'Liquidity panel (≈DKK 15.4M)', amount: 15_400_000 },
];

const targets: Array<{ currency: Currency; locale: string }> = [
  { currency: Currency.EUR, locale: 'en-GB' },
  { currency: Currency.USD, locale: 'en-US' },
  { currency: Currency.SEK, locale: 'sv-SE' },
];

for (const sample of samples) {
  console.log(`\n${sample.label}`);
  for (const target of targets) {
    const converted = convertFromDKK(sample.amount, target.currency);
    const formatted = formatCurrency(converted, {
      currency: target.currency,
      locale: target.locale,
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
      notation: 'compact',
    });
    console.log(`${sample.amount.toLocaleString('da-DK')} DKK -> ${target.currency}:`, converted?.toFixed(2), '| formatted:', formatted);
  }
}
