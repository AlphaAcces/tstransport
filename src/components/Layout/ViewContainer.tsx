import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { useTranslation } from 'react-i18next';

interface ViewContainerProps {
  children: React.ReactNode;
  canGoBack: boolean;
  onGoBack: () => void;
  breadcrumbs?: string[];
}

export const ViewContainer: React.FC<ViewContainerProps> = ({ children, canGoBack, onGoBack, breadcrumbs }) => {
  const { t } = useTranslation();
  return (
    <div>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      {canGoBack && (
        <button
          onClick={onGoBack}
          className="mb-4 inline-flex items-center text-sm text-gray-300 hover:text-accent-green transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.navigation.backToDashboard')}
        </button>
      )}
      {children}
    </div>
  );
};
