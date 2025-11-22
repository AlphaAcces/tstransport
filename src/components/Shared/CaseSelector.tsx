/**
 * CaseSelector Component
 * 
 * Unified selector for switching between company and person cases.
 * Provides dropdown with all available companies and persons.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, User } from 'lucide-react';
import { Subject } from '../../types';

interface CaseSelectorProps {
  activeSubject: Subject;
  onSubjectChange: (subject: Subject) => void;
}

// Available cases (in production, fetch from API/store)
const COMPANY_CASES = [
  { id: 'tsl', name: 'TS Logistik ApS', subject: 'tsl' as Subject },
  // Add more companies here as they become available
];

const PERSON_CASES = [
  { id: 'umit', name: 'Ümit Cetin', subject: 'umit' as Subject },
  // Add more persons here as they become available
];

export const CaseSelector: React.FC<CaseSelectorProps> = ({
  activeSubject,
  onSubjectChange,
}) => {
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSubject = e.target.value as Subject;
    onSubjectChange(selectedSubject);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-component-dark/50 rounded-lg border border-border-dark/50">
      {activeSubject === 'tsl' ? (
        <Building2 className="w-4 h-4 text-accent-green" />
      ) : (
        <User className="w-4 h-4 text-accent-green" />
      )}
      <select
        value={activeSubject}
        onChange={handleChange}
        className="bg-transparent text-gray-200 text-sm font-medium focus:outline-none cursor-pointer appearance-none pr-6"
        aria-label="Select case - Switch between company and person profiles"
        title="Select active case"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a0aec0'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0 center',
          backgroundSize: '1.5rem',
        }}
      >
        <optgroup label={t('nav.business')}>
          {COMPANY_CASES.map((company) => (
            <option key={company.id} value={company.subject}>
              {company.name}
            </option>
          ))}
        </optgroup>
        <optgroup label={t('nav.personal')}>
          {PERSON_CASES.map((person) => (
            <option key={person.id} value={person.subject}>
              {person.name}
            </option>
          ))}
        </optgroup>
      </select>
      <span className="text-xs text-gray-500 hidden sm:inline">
        {activeSubject === 'tsl' ? t('nav.business') : t('nav.personal')}
      </span>
    </div>
  );
};
