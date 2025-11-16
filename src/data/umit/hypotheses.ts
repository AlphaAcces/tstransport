import { Hypothesis } from '../../types';

export const hypothesesData: Hypothesis[] = [
  {
    id: 'U-H1',
    title: 'Bevidst "Dobbelt Usynlighed" Strategi',
    summary: 'Den lave personlige digitale profil og manglen på et firma-website er en bevidst strategi for at minimere granskning fra myndigheder og konkurrenter.',
    description: [
        'Ingen professionelle profiler (LinkedIn, X) for UBO.',
        'Intet website for TS Logistik på trods af >20 mio. DKK i omsætning.',
        'Strategien vanskeliggør traditionel OSINT og baggrundstjek.'
    ],
    analysisNote: 'Denne strategi er effektiv til at holde en lav profil, men kan virke mod hensigten ved en konkurssag, hvor den kan tolkes som et forsøg på at skjule information.',
    status: 'Bekræftet',
    category: 'Strategisk',
    impact: 'Middel',
    evidenceLevel: 'Stærk Evidens',
    relatedViews: ['person', 'risk'],
    sourceId: 'edd_rapport_v2'
  },
  {
    id: 'U-H2',
    title: 'Personlig Eksponering ved TSL-Kollaps',
    summary: 'Ümit Cetins privatøkonomi er stærkt afhængig af TS Logistiks overlevelse, og et kollaps vil have alvorlige personlige konsekvenser.',
    description: [
        'TS Logistik er den primære indtægtskilde, der finansierer hele koncernen.',
        'De 12,4 mio. DKK i interne lån vil sandsynligvis blive tabt ved en konkurs.',
        'Værdien af ejendomsinvesteringerne er direkte bundet til det udbytte, der blev trukket ud af TS Logistik.'
    ],
    analysisNote: 'Selvom holdingstrukturen beskytter aktiver, er den samlede værdi af Cetins formue nært knyttet til driftsselskabets skæbne.',
    status: 'Åben',
    category: 'Finansiel',
    impact: 'Høj',
    evidenceLevel: 'Stærk Evidens',
    relatedViews: ['risk', 'actions'],
    sourceId: 'edd_rapport_v2'
  },
  {
    id: 'U-H3',
    title: 'Potentiel Personlig Hæftelse i Skattesag',
    summary: 'Som direktør og eneejer risikerer Ümit Cetin personlig hæftelse for skattekravet, hvis der kan påvises grov uagtsomhed.',
    description: [
        'Revisors bemærkning i 2024-regnskabet nævner eksplicit "ledelsesansvar".',
        'Manglende hensættelse af et kendt potentielt krav kan anses som uansvarlig ledelse.',
        'Ved konkurs kan kurator forfølge et personligt erstatningskrav mod direktøren.'
    ],
    analysisNote: 'Skattesagen er ikke kun en selskabsrisiko, men en direkte trussel mod Ümit Cetins personlige formue, som rækker ud over selskabskonstruktionen.',
    status: 'Åben',
    category: 'Skat/Compliance',
    impact: 'Høj',
    evidenceLevel: 'Indikation',
    relatedViews: ['risk', 'timeline', 'actions'],
    sourceId: 'årsrapport_2024_note1'
  },
  {
    id: 'U-H4',
    title: 'Aktiver er Beskyttet mod Almindelige Kreditorer',
    summary: 'Holdingstrukturen og ejendomskøbene er en effektiv strategi til at beskytte værdier mod almindelige driftskreditorer i TS Logistik.',
    description: [
        'Kapital er flyttet fra driftsselskab (høj risiko) til ejendomsselskab (lav risiko).',
        'Ejendommene er ejet af CESR Ejendomme, som ikke direkte hæfter for TS Logistiks gæld.',
        'Ved en konkurs i TS Logistik vil almindelige kreditorer have svært ved at gøre krav på ejendommene.'
    ],
    analysisNote: 'Strategien er juridisk holdbar over for almindelige kreditorer, men kan udfordres af Skattestyrelsen eller en kurator ved mistanke om omstødelige dispositioner.',
    status: 'Bekræftet',
    category: 'Strategisk',
    impact: 'Høj',
    evidenceLevel: 'Stærk Evidens',
    relatedViews: ['companies', 'person'],
    sourceId: 'cvr_analyse'
  },
  {
    id: 'U-H5',
    title: 'Interne Lån er De Facto Egenkapital',
    summary: 'De 12.4 mio. DKK i interne lån til holdingselskabet fungerer i praksis som en uformel udlodning og er ikke reelle omsætningsaktiver.',
    description: [
      'DSO på ~358 dage viser, at lånene ikke tilbagebetales på kommercielle vilkår.',
      'Midlerne er brugt til langfristede investeringer (ejendomme) og kan ikke tilbagekaldes uden at skabe en krise i koncernen.',
      'Transaktionen har karakter af en kapitalreduktion, der svækker driftselskabets solvens over for kreditorer.'
    ],
    analysisNote: 'Denne struktur er en central del af governance-risikoen, hvor UBO prioriterer egne interesser over driftsselskabets finansielle helbred.',
    status: 'Åben',
    category: 'Finansiel',
    impact: 'Høj',
    evidenceLevel: 'Indikation',
    relatedViews: ['cashflow', 'risk'],
    sourceId: 'årsrapport_2024'
  }
];