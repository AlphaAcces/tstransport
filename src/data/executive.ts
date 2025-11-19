import {
  ActionItem,
  CashflowSummary,
  ExecutiveActionHighlights,
  ExecutiveActionItemSummary,
  ExecutiveExportPayload,
  ExecutiveFinancialAlert,
  ExecutiveFinancialHighlights,
  ExecutiveFinancialTrendPoint,
  ExecutiveRiskHighlights,
  ExecutiveSummaryData,
  FinancialYear,
  RiskScore,
  Subject,
  TimelineEvent,
} from '../types';

interface BuildExecutiveSummaryParams {
  financials: FinancialYear[];
  cashflow: CashflowSummary;
  risks: RiskScore[];
  actions: ActionItem[];
  timeline: TimelineEvent[];
}

const PRIORITY_WEIGHT: Record<ActionItem['priority'], number> = {
  'Påkrævet': 0,
  'Høj': 1,
  'Middel': 2,
};

const extractPercentageChange = (latest?: number, previous?: number): number | null => {
  if (latest === undefined || previous === undefined || previous === 0) {
    return null;
  }
  const change = ((latest - previous) / previous) * 100;
  return Number.isFinite(change) ? change : null;
};

const summariseText = (value?: string): string => {
  if (!value) return '';
  const trimmed = value.trim();
  const sentenceEnd = trimmed.indexOf('.');
  if (sentenceEnd === -1) {
    return trimmed;
  }
  return trimmed.slice(0, sentenceEnd + 1);
};

const buildFinancialHighlights = (
  financials: FinancialYear[],
  cashflow: CashflowSummary,
): ExecutiveFinancialHighlights => {
  const sorted = [...financials].sort((a, b) => a.year - b.year);
  const trendSlice = sorted.slice(-4);

  const trendGross: ExecutiveFinancialTrendPoint[] = trendSlice.map(item => ({
    year: item.year,
    value: item.revenueOrGrossProfit,
  }));

  const trendProfit: ExecutiveFinancialTrendPoint[] = trendSlice.map(item => ({
    year: item.year,
    value: item.profitAfterTax,
  }));

  const latest = sorted[sorted.length - 1];
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : undefined;

  const alerts: ExecutiveFinancialAlert[] = [];
  if (typeof cashflow.cashOnHand === 'number') {
    alerts.push({
      id: 'liquidity',
      label: 'Likviditet',
      value: cashflow.cashOnHand,
      unit: 'DKK',
      description: 'Kontantbeholdning ved seneste årsrapport',
    });
  }
  const dsoValue = latest?.dso ?? cashflow.dsoDays2024 ?? null;
  if (dsoValue !== null) {
    alerts.push({
      id: 'dso',
      label: 'DSO',
      value: dsoValue,
      unit: 'days',
      description: 'Gennemsnitlige debitor-dage i seneste periode',
    });
  }
  if (typeof cashflow.internalReceivables === 'number') {
    alerts.push({
      id: 'intercompany',
      label: 'Intercompany-lån',
      value: cashflow.internalReceivables,
      unit: 'DKK',
      description: 'Tilgodehavender hos nærtstående parter',
    });
  }

  return {
    latestYear: latest?.year ?? null,
    grossProfit: latest?.revenueOrGrossProfit ?? null,
    profitAfterTax: latest?.profitAfterTax ?? null,
    yoyGrossChange: extractPercentageChange(latest?.revenueOrGrossProfit, previous?.revenueOrGrossProfit),
    yoyProfitChange: extractPercentageChange(latest?.profitAfterTax, previous?.profitAfterTax),
    dso: dsoValue,
    liquidity: typeof cashflow.cashOnHand === 'number' ? cashflow.cashOnHand : null,
    intercompanyLoans: typeof cashflow.internalReceivables === 'number' ? cashflow.internalReceivables : null,
    trendGrossProfit: trendGross,
    trendProfitAfterTax: trendProfit,
    alerts,
  };
};

const buildRiskHighlights = (risks: RiskScore[], cashflow: CashflowSummary): ExecutiveRiskHighlights => {
  const legalRisk = risks.find(risk => risk.category === 'Legal/Compliance');
  const governanceRisk = risks.find(risk => risk.category === 'Governance');
  const sectorRisk = risks.find(risk => risk.category === 'Sector/Operations');

  const complianceIssue = summariseText(legalRisk?.justification) || 'Ingen juridiske bemærkninger registreret.';
  const sectorSummary = summariseText(sectorRisk?.justification) || 'Ingen sektorrelaterede risici registreret.';

  const riskScores = risks.map(risk => ({
    category: risk.category,
    riskLevel: risk.riskLevel,
    justification: summariseText(risk.justification),
  }));

  const redFlags = [
    typeof cashflow.cashOnHand === 'number' ? `Likviditet: ${cashflow.cashOnHand.toLocaleString('da-DK')} DKK` : null,
    typeof cashflow.internalReceivables === 'number' ? `Intercompany-lån: ${cashflow.internalReceivables.toLocaleString('da-DK')} DKK` : null,
    typeof cashflow.dsoDays2024 === 'number' ? `DSO: ${cashflow.dsoDays2024} dage` : null,
  ].filter(Boolean) as string[];

  return {
    taxCaseExposure: typeof cashflow.potentialTaxClaim === 'number' ? cashflow.potentialTaxClaim : null,
    complianceIssue,
    sectorRiskSummary: governanceRisk ? summariseText(governanceRisk.justification) : sectorSummary,
    riskScores,
    redFlags,
  };
};

const buildActionHighlights = (actions: ActionItem[], timeline: TimelineEvent[]): ExecutiveActionHighlights => {
  const upcomingDeadlines = actions
    .filter(action => action.timeHorizon === '0-30 dage')
    .sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority])
    .slice(0, 3)
    .map<ExecutiveActionItemSummary>(action => ({
      id: action.id,
      title: action.title,
      priority: action.priority,
      ownerRole: action.ownerRole,
      timeHorizon: action.timeHorizon,
      description: action.description,
    }));

  const boardActionables = actions
    .filter(action => action.priority === 'Påkrævet' || action.priority === 'Høj')
    .sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority])
    .slice(0, 4)
    .map<ExecutiveActionItemSummary>(action => ({
      id: action.id,
      title: action.title,
      priority: action.priority,
      ownerRole: action.ownerRole,
      timeHorizon: action.timeHorizon,
      description: action.description,
    }));

  const criticalEvents = timeline
    .filter(event => event.isCritical)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)
    .map(event => ({
      date: event.date,
      title: event.title,
      description: event.description,
      isCritical: event.isCritical,
    }));

  const upcomingEvents = timeline
    .filter(event => new Date(event.date).getTime() >= Date.now())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)
    .map(event => ({
      date: event.date,
      title: event.title,
      description: event.description,
      isCritical: event.isCritical,
    }));

  return {
    upcomingDeadlines,
    boardActionables,
    criticalEvents,
    upcomingEvents,
  };
};

export const buildExecutiveSummaryData = ({
  financials,
  cashflow,
  risks,
  actions,
  timeline,
}: BuildExecutiveSummaryParams): ExecutiveSummaryData => {
  return {
    financial: buildFinancialHighlights(financials, cashflow),
    risk: buildRiskHighlights(risks, cashflow),
    actions: buildActionHighlights(actions, timeline),
  };
};

export const createExecutiveExportPayload = (
  subject: Subject,
  summary: ExecutiveSummaryData,
): ExecutiveExportPayload => {
  return {
    subject,
    generatedAt: new Date().toISOString(),
    financial: {
      latestYear: summary.financial.latestYear,
      grossProfit: summary.financial.grossProfit,
      profitAfterTax: summary.financial.profitAfterTax,
      yoyGrossChange: summary.financial.yoyGrossChange,
      yoyProfitChange: summary.financial.yoyProfitChange,
      dso: summary.financial.dso,
      liquidity: summary.financial.liquidity,
      intercompanyLoans: summary.financial.intercompanyLoans,
      alerts: summary.financial.alerts.map(alert => ({ ...alert })),
    },
    risk: {
      ...summary.risk,
      riskScores: summary.risk.riskScores.map(score => ({ ...score })),
      redFlags: [...summary.risk.redFlags],
    },
    actions: {
      upcomingDeadlines: summary.actions.upcomingDeadlines.map(item => ({ ...item })),
      boardActionables: summary.actions.boardActionables.map(item => ({ ...item })),
      criticalEvents: summary.actions.criticalEvents.map(event => ({ ...event })),
      upcomingEvents: summary.actions.upcomingEvents.map(event => ({ ...event })),
    },
  };
};
