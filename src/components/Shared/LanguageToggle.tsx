import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();

  const toggle = () => {
    const next = i18n.language === 'da' ? 'en' : 'da';
    i18n.changeLanguage(next);
  };

  return (
    <button onClick={toggle} className="text-sm px-2 py-1 rounded bg-component-dark/60 hover:bg-component-dark/80">
      {i18n.language === 'da' ? 'DA' : 'EN'}
    </button>
  );
};
