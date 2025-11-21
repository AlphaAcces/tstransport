import React from 'react';
import { Company } from '../../types';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CompanyDetailModalProps {
  company: Company | null;
  onClose: () => void;
}

const DetailRow: React.FC<{ label: string; value: string | undefined; fallback: string }> = ({ label, value, fallback }) => (
    <div className="py-2 grid grid-cols-3 gap-4">
        <dt className="text-sm font-medium text-gray-400">{label}</dt>
    <dd className="text-sm text-gray-200 col-span-2 font-mono">{value || fallback}</dd>
    </div>
);

const statusKeyByValue: Record<string, 'active' | 'historical'> = {
  Aktiv: 'active',
  Historisk: 'historical'
};

export const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({ company, onClose }) => {
  const { t } = useTranslation();

  if (!company) return null;

  const getStatusLabel = (status: string) => {
    const statusKey = statusKeyByValue[status];
    return statusKey ? t(`companies.status.${statusKey}`) : status;
  };

  const naLabel = t('common.naShort');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-detail-title"
    >
      <div
        className="bg-component-dark rounded-lg border border-border-dark shadow-xl w-full max-w-lg m-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-border-dark">
          <div>
            <h2 id="company-detail-title" className="text-lg font-bold text-gray-200">{company.name}</h2>
            <p className="text-sm text-gray-500">{company.role}</p>
          </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label={t('companies.modal.close')}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
            <dl className="divide-y divide-border-dark/50">
              <DetailRow label={t('companies.modal.fields.cvr')} value={company.cvr} fallback={naLabel} />
              <DetailRow label={t('companies.modal.fields.status')} value={getStatusLabel(company.status)} fallback={naLabel} />
              <DetailRow label={t('companies.modal.fields.established')} value={company.established} fallback={naLabel} />
              <DetailRow label={t('companies.modal.fields.industryCode')} value={company.industryCode} fallback={naLabel} />
              <DetailRow label={t('companies.modal.fields.director')} value={company.director} fallback={naLabel} />
              <DetailRow label={t('companies.modal.fields.owner')} value={company.owner} fallback={naLabel} />
              <DetailRow label={t('companies.modal.fields.auditor')} value={company.auditor} fallback={naLabel} />
            </dl>

            <div className="mt-4 pt-4 border-t border-border-dark/50">
              <h3 className="text-sm font-medium text-gray-400 mb-2">{t('companies.modal.noteHeading')}</h3>
                <p className="text-sm text-gray-300 bg-base-dark/50 p-3 rounded-md border border-border-dark/50">
                    {company.notes}
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};
