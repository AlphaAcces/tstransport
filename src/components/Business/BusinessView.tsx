import React from 'react';
import { SectionHeading } from '../Shared/SectionHeading';
import { useTranslation } from 'react-i18next';

export const BusinessView: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={t('business.heading.eyebrow')}
        title={t('business.heading.title')}
        subtitle={t('business.heading.subtitle')}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-gray-900/40 border border-border-dark/50 rounded-lg p-6 h-64">
          {t('business.placeholder.kpiCards')}
        </div>
        <div className="bg-gray-900/40 border border-border-dark/50 rounded-lg p-6 h-64">
          {t('business.placeholder.filters')}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900/40 border border-border-dark/50 rounded-lg p-6 h-64">
          {t('business.placeholder.trendChart')}
        </div>
        <div className="bg-gray-900/40 border border-border-dark/50 rounded-lg p-6 h-64">
          {t('business.placeholder.tables')}
        </div>
      </div>
    </div>
  );
};
