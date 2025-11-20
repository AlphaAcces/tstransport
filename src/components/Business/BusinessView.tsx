import React from 'react';
import { SectionHeading } from '../Shared/SectionHeading';

export const BusinessView: React.FC = () => {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Erhverv" title="Erhvervsdashboard" subtitle="KPI'er, risici og trends" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-gray-900/40 border border-border-dark/50 rounded-lg p-6 h-64">KPI kort (placeholder)</div>
        <div className="bg-gray-900/40 border border-border-dark/50 rounded-lg p-6 h-64">Filtre (placeholder)</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900/40 border border-border-dark/50 rounded-lg p-6 h-64">Trend chart (placeholder)</div>
        <div className="bg-gray-900/40 border border-border-dark/50 rounded-lg p-6 h-64">Tabeller (placeholder)</div>
      </div>
    </div>
  );
};
