import { CaseData } from '../../types';
import { personData } from './person';
import { companiesData } from './companies';
import { financialData } from './financials';
import { hypothesesData } from './hypotheses';
import { riskHeatmapData, totalRiskScore, relationRiskData } from './riskScores';
import { timelineData } from './timeline';
import { actionsData } from './actions';
import { cashflowYearlyData, cashflowSummary } from './cashflow';
import { sectorBenchmarkYearlyData, sectorComparisonData, sectorDriversData, macroRiskData } from './sector';
import { nodes as networkNodes, edges as networkEdges } from './network';
import { counterpartiesData } from './counterparties';
import { scenariosData } from './scenarios';
import { buildExecutiveSummaryData } from '../executive';

// Placeholder data for the Ümit Cetin (private) case.
// This ensures the app doesn't crash when switching subjects.
// It can be populated with real data later.
export const umitData: CaseData = {
    tenantId: 'default-tenant',
    personData,
    companiesData,
    financialData,
    hypothesesData,
    riskHeatmapData,
    totalRiskScore,
    relationRiskData,
    timelineData,
    actionsData,
    cashflowYearlyData,
    cashflowSummary,
    sectorBenchmarkYearlyData,
    sectorComparisonData,
    sectorDriversData,
    macroRiskData,
    networkNodes,
    networkEdges,
    counterpartiesData,
    scenariosData,
    executiveSummary: buildExecutiveSummaryData({
        financials: financialData,
        cashflow: cashflowSummary,
        risks: riskHeatmapData,
        actions: actionsData,
        timeline: timelineData,
    }),
};
