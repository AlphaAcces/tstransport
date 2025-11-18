import { RiskScore, RelationRisk } from '../../types';

export const riskHeatmapData: RiskScore[] = [
  {
    category: 'Financial',
    maxScore: 30,
    assignedScore: 26,
    riskLevel: 'KRITISK',
    likelihood: 5,
    impact: 5,
    justification:
      'Akut illikviditet (31 DKK i kasse), ekstremt høj DSO (~358 dage) og stor kapitalbinding i koncerninterne tilgodehavender (12,4 mio. kr). Selskabet er operationelt insolvent.',
    linkedHypotheses: ['H3', 'H4'],
    linkedViews: ['cashflow', 'financials'],
    linkedActions: [
      'Implementer Stram Debitorstyring',
      'Oprydning i Intercompany-mellemværender',
      'Etabler Likviditetsbuffer og Cash Forecast',
    ],
  },
  {
    category: 'Legal/Compliance',
    maxScore: 25,
    assignedScore: 23,
    riskLevel: 'HØJ',
    likelihood: 4,
    impact: 5,
    justification:
      'Verserende skattesag på op til 4 mio. kr., samt revisorbemærkning om forkert momsafregning med eksplicit nævnelse af potentielt ledelsesansvar. Solidarisk hæftelse i koncern forøger risikoen.',
    linkedHypotheses: ['H4'],
    linkedViews: ['timeline', 'actions'],
    linkedActions: [
      'Indhent Fuld Sagsmappe fra Skattestyrelsen',
      'Engager Skattespecialist til Analyse & Second Opinion',
    ],
  },
  {
    category: 'Governance',
    maxScore: 20,
    assignedScore: 17,
    riskLevel: 'HØJ',
    likelihood: 5,
    impact: 4,
    justification:
      'Strukturel kapitaldræn fra drift til holding. Store lån til ledelsen og koncernforbundne selskaber, der ikke synes at være på armslængdevilkår. 100% eneejerskab eliminerer intern kontrol.',
    linkedHypotheses: ['H5'],
    linkedViews: ['companies', 'person', 'cashflow'],
    linkedActions: ['Oprydning i Intercompany-mellemværender'],
  },
  {
    category: 'Sector/Operations',
    maxScore: 15,
    assignedScore: 10,
    riskLevel: 'MODERAT',
    likelihood: 4,
    impact: 3,
    justification:
      'Markant faldende marginer og halveret nettoindtjening pr. medarbejder indikerer stort pres på effektivitet og prissætning. "Captive" B2B-model øger sårbarhed.',
    linkedHypotheses: ['H2', 'H6'],
    linkedViews: ['sector', 'financials'],
    linkedActions: [],
  },
  {
    category: 'SOCMINT/Reputation',
    maxScore: 10,
    assignedScore: 3,
    riskLevel: 'LAV',
    likelihood: 2,
    impact: 2,
    justification:
      'Ingen negativ presse. Bevidst lav digital profil ("usynlig") er en operationel strategi, ikke en direkte reputationsrisiko. Risikoen er begrænset, men kan eskalere ved en konkurssag.',
    linkedHypotheses: [],
    linkedViews: ['person'],
    linkedActions: [],
  },
];

export const totalRiskScore = {
  score: riskHeatmapData.reduce((acc, curr) => acc + curr.assignedScore, 0),
  maxScore: riskHeatmapData.reduce((acc, curr) => acc + curr.maxScore, 0),
  level: 'KRITISK',
  summary:
    'Samlet risikoprofil er kritisk, primært drevet af en eksistentiel likviditets- og solvensrisiko samt en substantiel juridisk risiko fra skattesagen. Operationel performance er under stærkt pres. Casen kræver akut intervention.',
};

export const relationRiskData: RelationRisk[] = [
  {
    entity: 'Skattestyrelsen',
    type: 'Offentlig myndighed',
    role: 'Modpart (Skattesag)',
    riskScore: 60,
    reason:
      'Aktiv, verserende skattesag med potentielt krav på 4 mio. DKK, hvilket er en eksistentiel trussel mod selskabets likviditet.',
  },
  {
    entity: 'Related parties (intercompany)',
    type: 'Kategori',
    role: 'Intern finansiering',
    riskScore: 45,
    reason:
      'Massive interne lån (12.4M DKK tilgodeh.) maskerer kritisk illikviditet (31 DKK kasse) og er ikke armslængde.',
  },
  {
    entity: 'Cömert Avci',
    type: 'Person',
    role: 'Tidligere direktør (CESR ApS)',
    riskScore: 40,
    reason:
      'Bekræftet brud i 2025. Har stiftet ny holding (Rcim Holding ApS). Årsag til brud er ukendt, men indikerer konflikt.',
  },
  {
    entity: 'Muhamed Danyal Tirpan',
    type: 'Person',
    role: 'Tidligere ledelse (Lund Capital)',
    riskScore: 35,
    reason:
      'Bekendt af Cetin; involveret i tidligere ventures. Potentiel omdømmerisiko grundet begrænset info.',
  },
  {
    entity: 'Revisionsfirmaet Christian Danielsen',
    type: 'Selskab',
    role: 'Revisor (Holding + Drift)',
    riskScore: 30,
    reason:
      'Accepterer aggressiv regnskabsføring: godkender regnskab med 31 DKK i kasse, 12.4M internt lån og 4M ikke-hensat skattesag.',
  },
  {
    entity: 'CESR Ejendomme ApS',
    type: 'Selskab',
    role: 'Kapitalmodtager (Aktiv)',
    riskScore: 28,
    reason:
      'Modtager 6.55M+ DKK i kapital. Lovlig risikospredning, men er destinationen for den kapitaldræn, der skaber illikviditet i driften.',
  },
];
