import type { CaseData } from '../../types';
import type { CaseEvent } from '../events/caseEvents';
import type { CaseKpiSummary } from '../kpi/caseKpis';

export type CaseExportFormat = 'json';

export type CaseExportPayload = {
  caseId: string;
  format: CaseExportFormat;
  generatedAt: string;
  source: 'api';
  case: CaseData;
  events: CaseEvent[];
  kpis: CaseKpiSummary | null;
  // TODO: versioning/classification metadata for downstream audit modules.
};

export function buildCaseExportPayload(
  caseData: CaseData,
  events: CaseEvent[],
  kpis: CaseKpiSummary | null,
  caseId = 'unknown-case',
): CaseExportPayload {
  return {
    caseId,
    format: 'json',
    generatedAt: new Date().toISOString(),
    source: 'api',
    case: caseData,
    events,
    kpis,
  };
}
