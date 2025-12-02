import type { Subject } from '../types';

export interface ExecutiveReportMetadata {
  caseId: string;
  caseName: string;
  exportedAt: string;
  exportedBy: string;
  reportVersion: string;
  classification: string;
  subject: Subject;
}

interface BuildMetadataParams {
  caseId: string;
  caseName: string;
  subject: Subject;
  exportedBy?: string;
  exportedAt?: string;
  reportVersion?: string;
  classification?: string;
}

export const buildExecutiveReportMetadata = ({
  caseId,
  caseName,
  subject,
  exportedBy,
  exportedAt,
  reportVersion,
  classification,
}: BuildMetadataParams): ExecutiveReportMetadata => {
  return {
    caseId,
    caseName,
    subject,
    exportedBy: exportedBy ?? 'Intel24 Operator',
    exportedAt: exportedAt ?? new Date().toISOString(),
    reportVersion: reportVersion ?? 'v1',
    classification: classification ?? 'INTERN / FORTROLIG',
  };
};
