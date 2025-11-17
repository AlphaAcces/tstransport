import React from 'react';
import { Company } from '../../types';
import { X } from 'lucide-react';

interface CompanyDetailModalProps {
  company: Company | null;
  onClose: () => void;
}

const DetailRow: React.FC<{ label: string; value: string | undefined }> = ({ label, value }) => (
    <div className="py-2 grid grid-cols-3 gap-4">
        <dt className="text-sm font-medium text-gray-400">{label}</dt>
        <dd className="text-sm text-gray-200 col-span-2 font-mono">{value || 'N/A'}</dd>
    </div>
);


export const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({ company, onClose }) => {
  if (!company) return null;

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
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Luk">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
            <dl className="divide-y divide-border-dark/50">
                <DetailRow label="CVR-nummer" value={company.cvr} />
                <DetailRow label="Status" value={company.status} />
                <DetailRow label="Etableret" value={company.established} />
                <DetailRow label="Branchekode" value={company.industryCode} />
                <DetailRow label="Direktør" value={company.director} />
                <DetailRow label="Ejer" value={company.owner} />
                <DetailRow label="Revisor" value={company.auditor} />
            </dl>

            <div className="mt-4 pt-4 border-t border-border-dark/50">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Note</h3>
                <p className="text-sm text-gray-300 bg-base-dark/50 p-3 rounded-md border border-border-dark/50">
                    {company.notes}
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};
