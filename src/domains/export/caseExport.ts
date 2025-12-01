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
  caseId: string,
  caseData: CaseData,
  events: CaseEvent[],
  kpis: CaseKpiSummary | null,
): CaseExportPayload {
  const effectiveCaseId = caseId || 'unknown-case';

  return {
    caseId: effectiveCaseId,
    format: 'json',
    generatedAt: new Date().toISOString(),
    source: 'api',
    case: caseData,
    events,
    kpis,
  };
}
