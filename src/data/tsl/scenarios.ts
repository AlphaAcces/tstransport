import { Scenario } from '../../types';

export const scenariosData: Scenario[] = [
  {
    id: 'scen-best',
    name: 'Best Case: Kontrolleret Genopretning',
    category: 'Best',
    description: 'Selskabet navigerer succesfuldt gennem krisen ved at løse skattesagen favorabelt og genskabe likviditeten. Driften stabiliseres med et stærkere fundament.',
    assumptions: [
      'Skattesag vindes eller forliges for <1 mio. kr.',
      'Interne lån tilbageføres delvist (~5 mio. kr.).',
      'Kassekredit etableres.',
      'Omsætning er stabil; margin forbedres let.'
    ],
    expectedOutcome: 'Overlevelse og stabilisering. Risiko falder til "Moderat".',
    probability: 'Middel',
    impact: 'Middel',
    linkedActions: ['A01', 'A02', 'A03', 'A04', 'A05'],
    sourceId: 'slutrapport_v3_0'
  },
  {
    id: 'scen-base',
    name: 'Base Case: Moderat Krise & Tilpasning',
    category: 'Base',
    description: 'Selskabet overlever, men i en svækket og trimmet form. Skattesagen tabes delvist, og markedspres tvinger til omkostningsreduktioner.',
    assumptions: [
      'Skattesag ender med forlig/tab på 2-4 mio. kr.',
      'Likviditet skaffes via salg af aktiver (f.eks. en ejendom).',
      'Omsætning falder 10-15%.',
      'Personale reduceres for at redde margin.'
    ],
    expectedOutcome: 'Overlevelse med ar. Risiko forbliver "Høj", men insolvens undgås.',
    probability: 'Høj',
    impact: 'Høj',
    linkedActions: ['A16', 'A18'],
    sourceId: 'slutrapport_v3_0'
  },
  {
    id: 'scen-worst',
    name: 'Worst Case: Alvorlig Krise / Kollaps',
    category: 'Worst',
    description: 'En "perfekt storm" hvor flere negative hændelser rammer samtidigt, hvilket fører til en ukontrollerbar krise og sandsynlig konkurs.',
    assumptions: [
      'Skattesag tabes fuldt ud (~4 mio. kr. + bøde).',
      'En stor kunde tabes, omsætning falder >20%.',
      'Dubai-projektet fejler med tab af kapital.',
      'Bank/kreditorer mister tilliden.'
    ],
    expectedOutcome: 'Betalingsstandsning eller konkurs inden for 12-18 måneder.',
    probability: 'Lav',
    impact: 'Ekstrem',
    linkedActions: ['A14', 'A17'],
    sourceId: 'slutrapport_v3_0'
  },
  {
    id: 'scen-exit',
    name: 'Strategic Exit: Positiv Variant',
    category: 'Exit',
    description: 'Ümit Cetin vælger proaktivt at sælge/fusionere TS Logistik for at realisere værdi, reducere personlig risiko og fokusere på andre investeringer.',
    assumptions: [
      'Forretningen stabiliseres nok til at være attraktiv for en køber.',
      'En industriel køber eller kapitalfond overtager driften.',
      'Ümit realiserer en gevinst og trækker sig delvist eller helt.'
    ],
    expectedOutcome: 'Værdierne sikres, og risikoen neutraliseres. Kontrolleret afslutning.',
    probability: 'Lav',
    impact: 'Høj',
    linkedActions: ['A15', 'A17'],
    sourceId: 'slutrapport_v3_0'
  }
];
