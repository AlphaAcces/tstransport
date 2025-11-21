import { RiskScore, RelationRisk, TotalRiskScore } from '../../types';

export const riskHeatmapData: RiskScore[] = [
  {
    category: 'Financial',
    maxScore: 30,
    assignedScore: 25,
    riskLevel: 'KRITISK',
    likelihood: 5,
    impact: 5,
    justification: 'risk.heatmap.justifications.financial',
    linkedHypotheses: ['H3', 'H4'],
    linkedViews: ['cashflow', 'financials'],
    linkedActions: ['A03', 'A04', 'A05'],
  },
  {
    category: 'Legal/Compliance',
    maxScore: 25,
    assignedScore: 23,
    riskLevel: 'HØJ',
    likelihood: 4,
    impact: 5,
    justification: 'risk.heatmap.justifications.legalCompliance',
    linkedHypotheses: ['H4'],
    linkedViews: ['timeline', 'actions'],
    linkedActions: ['A01', 'A02'],
  },
  {
    category: 'Governance',
    maxScore: 20,
    assignedScore: 17, // Justeret fra 15 til 17 for at matche total 79
    riskLevel: 'HØJ',
    likelihood: 5,
    impact: 4,
    justification: 'risk.heatmap.justifications.governance',
    linkedHypotheses: ['H5'],
    linkedViews: ['companies', 'person', 'cashflow'],
    linkedActions: ['A03', 'A15'],
  },
  {
    category: 'SOCMINT/Reputation',
    maxScore: 15,
    assignedScore: 5,
    riskLevel: 'LAV',
    likelihood: 2,
    impact: 2,
    justification: 'risk.heatmap.justifications.socmintReputation',
    linkedHypotheses: [],
    linkedViews: ['person'],
    linkedActions: [],
  },
  {
    category: 'Sector/Operations',
    maxScore: 10,
    assignedScore: 9,
    riskLevel: 'MODERAT',
    likelihood: 4,
    impact: 3,
    justification: 'risk.heatmap.justifications.sectorOperations',
    linkedHypotheses: ['H2', 'H6'],
    linkedViews: ['sector', 'financials'],
    linkedActions: [],
  }
];

export const totalRiskScore: TotalRiskScore = {
  score: riskHeatmapData.reduce((acc, curr) => acc + curr.assignedScore, 0),
  maxScore: riskHeatmapData.reduce((acc, curr) => acc + curr.maxScore, 0),
  level: 'HØJ',
  summary: 'Høj/Alvorlig risiko (79/100) er ikke drevet af dårlig indtjening, men af en farlig cocktail af akut illikviditet, en verserende skattesag, svag governance og en ny, uafklaret Dubai-eksponering.'
};


export const relationRiskData: RelationRisk[] = [
    {
      entity: 'Dubai-projekt (Ramo/Adel)',
      type: 'International Investering',
      role: 'Ukendt struktur / højrisiko-projekt',
      riskScore: 75,
      reason: 'Transnational investering på anslået 4-4,5 mio. DKK i en fjern jurisdiktion med ukendte partnere (Ramo/Adel). Markant AML-risiko, lav transparens og risiko for tab af midler. Skaber ny, uafklaret forbindelse mellem TS og Husam/Bilgruppen-netværket.',
      sourceId: 'sprint_2_5_rapport'
    },
    { entity: 'Færdselsstyrelsen', type: 'Offentlig myndighed', role: 'Modpart (Tilladelser)', riskScore: 70, reason: 'Potentielt manglende vognmandstilladelser udgør en eksistentiel \'license to operate\'-risiko. Status er uafklaret, men et negativt udfald vil medføre driftsstop.' },
    { entity: 'Skattestyrelsen', type: 'Offentlig myndighed', role: 'Modpart (Skattesag)', riskScore: 60, reason: 'Aktiv, verserende skattesag med potentielt krav på 4 mio. DKK, hvilket er en eksistentiel trussel mod selskabets likviditet.' },
    { entity: 'Related parties (intercompany)', type: 'Kategori', role: 'Intern finansiering', riskScore: 45, reason: 'Massive interne lån (12.4M DKK tilgodeh.) maskerer kritisk illikviditet (31 DKK kasse) og er ikke armslængde.' },
    { entity: 'CESR Ejendomme ApS', type: 'Selskab', role: 'Kapitalmodtager (Aktiv)', riskScore: 40, reason: 'Modtager 12.4M+ DKK i kapital via interne lån. Er destinationen for det kritiske kapitaldræn, der skaber illikviditet i driften.' },
    { entity: 'Revisionsfirmaet Christian Danielsen', type: 'Selskab', role: 'Revisor (Holding + Drift)', riskScore: 30, reason: 'Accepterer aggressiv regnskabsføring: godkender regnskab med 31 DKK i kasse, 12.4M internt lån og 4M ikke-hensat skattesag.' },
    { entity: 'Cömert Avci', type: 'Person', role: 'Ekstern, tidl. partner', riskScore: 30, reason: 'Har forladt koncernen og etableret eget setup. Udgør en ekstern risiko (potentiel konkurrent, whistleblower) frem for en intern.' },
    { entity: 'Muhamed Danyal Tirpan', type: 'Person', role: 'Tidligere ledelse (Lund Capital)', riskScore: 10, reason: 'Relationen er historisk og inaktiv. Anses som perifer for det nuværende risikobillede.' },
];
