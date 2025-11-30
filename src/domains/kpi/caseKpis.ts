import type { CaseData } from '../../types';

export type KpiSeverity = 'low' | 'medium' | 'high' | 'critical';
export type KpiTrend = 'up' | 'down' | 'flat';

export type CaseKpiMetric = {
  id: string;
  label: string;
  value: number;
  unit?: string;
  trend?: KpiTrend;
  severity?: KpiSeverity;
  hint?: string;
};

export type CaseKpiSummary = {
  caseId: string;
  metrics: CaseKpiMetric[];
  generatedAt: string;
  source: 'derived' | 'api';
};

type DeriveOptions = {
  caseId?: string;
  generatedAt?: Date;
};

const riskSeverityFromPercent = (percent: number): KpiSeverity => {
  if (percent >= 80) return 'critical';
  if (percent >= 60) return 'high';
  if (percent >= 40) return 'medium';
  return 'low';
};

const severityFromCount = (count: number): KpiSeverity => {
  if (count >= 8) return 'critical';
  if (count >= 5) return 'high';
  if (count >= 2) return 'medium';
  return 'low';
};

const severityFromCash = (cash: number): KpiSeverity => {
  if (cash <= 1000000) return 'critical';
  if (cash <= 3000000) return 'high';
  if (cash <= 6000000) return 'medium';
  return 'low';
};

const severityFromDso = (days: number): KpiSeverity => {
  if (days >= 90) return 'critical';
  if (days >= 70) return 'high';
  if (days >= 55) return 'medium';
  return 'low';
};

const normalizeStatus = (status: string | undefined): string => (status ?? '').toLowerCase();

export function deriveKpisFromCaseData(caseData: CaseData, options: DeriveOptions = {}): CaseKpiSummary {
  const caseId = options.caseId ?? caseData.tenantId ?? 'unknown-case';
  const generatedAt = (options.generatedAt ?? new Date()).toISOString();

  const riskScore = caseData.totalRiskScore?.score ?? 0;
  const maxScore = caseData.totalRiskScore?.maxScore ?? 100;
  const riskPercent = maxScore > 0 ? (riskScore / maxScore) * 100 : 0;

  const outstandingActions = (caseData.actionsData ?? []).filter(action => {
    const status = normalizeStatus(action.status);
    return status === '' || (!status.includes('done') && !status.includes('complete') && !status.includes('afsl'));
  }).length;

  const cashSummary = caseData.cashflowSummary ?? {
    cashOnHand: 0,
    internalReceivables: 0,
    dsoDays2024: 0,
    potentialTaxClaim: 0,
  };

  const metrics: CaseKpiMetric[] = [
    {
      id: 'overall-risk',
      label: 'Samlet risikoscore',
      value: Math.round(riskPercent),
      unit: '%',
      trend: riskPercent >= 75 ? 'up' : riskPercent <= 45 ? 'down' : 'flat',
      severity: riskSeverityFromPercent(riskPercent),
      hint: 'Beregnet ud fra totalRiskScore (0-100).',
    },
    {
      id: 'open-actions',
      label: 'Aktive handlingspunkter',
      value: outstandingActions,
      unit: 'items',
      trend: outstandingActions >= 6 ? 'up' : outstandingActions === 0 ? 'down' : 'flat',
      severity: severityFromCount(outstandingActions),
      hint: 'Antal handlinger der endnu ikke er afsluttet.',
    },
    {
      id: 'liquidity',
      label: 'Likviditet (kontantbeholdning)',
      value: Math.round(cashSummary.cashOnHand ?? 0),
      unit: 'DKK',
      trend: (cashSummary.cashOnHand ?? 0) >= 6000000 ? 'up' : (cashSummary.cashOnHand ?? 0) <= 2000000 ? 'down' : 'flat',
      severity: severityFromCash(cashSummary.cashOnHand ?? 0),
      hint: 'Brutto kontantbeholdning fra cashflowSummary.',
    },
    {
      id: 'dso',
      label: 'DSO (debitor-dage)',
      value: Math.round(cashSummary.dsoDays2024 ?? 0),
      unit: 'days',
      trend: (cashSummary.dsoDays2024 ?? 0) >= 70 ? 'up' : (cashSummary.dsoDays2024 ?? 0) <= 45 ? 'down' : 'flat',
      severity: severityFromDso(cashSummary.dsoDays2024 ?? 0),
      hint: 'Days Sales Outstanding seneste periode.',
    },
  ];

  return {
    caseId,
    metrics,
    generatedAt,
    source: 'derived',
  };
}
