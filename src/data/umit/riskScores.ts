import { RiskScore, RelationRisk, TotalRiskScore } from '../../types';

export const riskHeatmapData: RiskScore[] = [
  {
    category: 'Legal/Compliance',
    maxScore: 30,
    assignedScore: 24,
    riskLevel: 'HØJ',
    likelihood: 4,
    impact: 5,
    justification: 'Potentiel personlig hæftelse i den verserende skattesag (4 mio. DKK) og ved konkurs. Den transnationale Dubai-investering med ukendte modparter (Ramo/Adel) medfører desuden en forhøjet AML-risiko.',
    linkedHypotheses: ['U-H3'],
    linkedViews: ['risk', 'actions'],
    linkedActions: ['Udarbejd juridisk notat om personlig hæftelse', 'Vurder D&O-forsikringsdækning'],
    sourceId: 'sprint_2_5_rapport',
  },
  {
    category: 'Financial',
    maxScore: 30,
    assignedScore: 22,
    riskLevel: 'HØJ',
    likelihood: 5,
    impact: 4,
    justification: 'Privatøkonomien er stærkt eksponeret via TS Logistiks likviditetsdræn (12,4 mio. DKK internt lån) og en anslået personlig investering på 4-4,5 mio. DKK i et Dubai-projekt med uklar struktur og modparter.',
    linkedHypotheses: ['U-H2', 'U-H5'],
    linkedViews: ['risk', 'person'],
    linkedActions: ['Kortlæg privatøkonomisk eksponering', 'Udarbejd scenarieplanlægning for privatøkonomi'],
    sourceId: 'sprint_2_5_rapport',
  },
  {
    category: 'SOCMINT/Reputation',
    maxScore: 20,
    assignedScore: 12,
    riskLevel: 'MODERAT',
    likelihood: 3,
    impact: 4,
    justification: 'Nuværende lav profil er en fordel, men en potentiel konkurs vil medføre betydelig negativ medieomtale og omdømmetab. Dette kan påvirke fremtidige forretningsmuligheder.',
    linkedHypotheses: ['U-H1'],
    linkedViews: ['person'],
    linkedActions: ['Udarbejd kommunikationsstrategi for krisescenarier'],
  },
  {
    category: 'Governance',
    maxScore: 20,
    assignedScore: 15,
    riskLevel: 'HØJ',
    likelihood: 5,
    impact: 3,
    justification: 'Som 100% eneejer er der ingen intern kontrol. Beslutninger (f.eks. om interne lån) er ikke underlagt uafhængig granskning, hvilket øger risikoen for dispositioner, der skader kreditorer.',
    linkedHypotheses: ['U-H4', 'U-H5'],
    linkedViews: ['companies', 'person'],
    linkedActions: ['Formaliser alle mellemværender (person/selskab)'],
  }
];

export const totalRiskScore: TotalRiskScore = {
  score: riskHeatmapData.reduce((acc, curr) => acc + curr.assignedScore, 0),
  maxScore: riskHeatmapData.reduce((acc, curr) => acc + curr.maxScore, 0),
  level: 'HØJ',
  summary: 'Ümit Cetins personlige risikoprofil er høj, drevet af direkte eksponering mod TS Logistiks likviditetsdræn, den verserende skattesag, og en anslået højrisiko-investering i Dubai. Selvom aktiver er strukturelt beskyttet, er hans samlede formue og omdømme tæt forbundet med selskabets skæbne.'
};


export const relationRiskData: RelationRisk[] = [
    { entity: 'TS Logistik ApS', type: 'Selskab', role: 'Primær indtægtskilde / Aktiv', riskScore: 80, reason: 'Total finansiel afhængighed. Kilde til både formue og den primære juridiske/finansielle risiko.' },
    { entity: 'Skattestyrelsen', type: 'Offentlig myndighed', role: 'Modpart', riskScore: 75, reason: 'Aktiv sag med risiko for personlig hæftelse. Kan potentielt underminere hele den finansielle struktur.' },
    { entity: 'Revisionsfirmaet Christian Danielsen', type: 'Selskab', role: 'Rådgiver / Revisor', riskScore: 40, reason: 'Har godkendt regnskaber med kritisable dispositioner (lav likviditet, ingen hensættelse). Kan anses som en "enabler" af den risikable strategi.' },
    { entity: 'Kreditorer i TS Logistik', type: 'Kategori', role: 'Potentielle modparter', riskScore: 35, reason: 'Ved en konkurs kan en kurator, på vegne af kreditorerne, forfølge omstødelseskrav og ledelsesansvar mod Cetin.' },
];