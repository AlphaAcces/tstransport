import { Hypothesis } from '../../types';

export const hypothesesData: Hypothesis[] = [
  {
    id: 'H1',
    title: 'Engangsindtægter drev 2022-boom',
    summary: 'Den markante vækst i 2022 var delvist drevet af engangsindtægter, ikke kun organisk vækst.',
    description: [
      'Resultat 2022 indeholder 517 t.kr. fra salg af driftsmidler og 500 t.kr. i lønrefusioner.',
      'Produktivitet pr. ansat (bruttofortjeneste) faldt fra 938 t.kr. i 2021 til 821 t.kr. i 2022.'
    ],
    analysisNote: 'Væksten i bruttofortjeneste kom primært fra flere ansatte, ikke højere output pr. person. Den underliggende marginforbedring var delvist drevet af engangsindtægter.',
    status: 'Bekræftet',
    category: 'Finansiel',
    impact: 'Middel',
    evidenceLevel: 'Stærk Evidens',
    relatedViews: ['financials', 'sector'],
    sourceId: 'årsrapport_2022'
  },
  {
    id: 'H2',
    title: 'Faldende margin 2023-24 skyldes overkapacitet',
    summary: 'Faldende marginer og produktivitet i 2023-2024 skyldes en medarbejderstab, der vokser hurtigere end indtjeningen.',
    description: [
      'Antal ansatte steg fra 31 til 35, mens bruttofortjenesten faldt.',
      'Produktivitet pr. medarbejder (nettoresultat) kollapsede fra ~170 t.kr. i 2023 til ~85 t.kr. i 2024.',
      'Personaleomkostningernes andel af bruttofortjenesten steg fra 59% til 73% (2023-2024).'
    ],
    analysisNote: 'Virksomheden hyrede flere folk for at producere mindre, et tegn på operationel ineffektivitet og et stort pres på marginerne.',
    status: 'Bekræftet',
    category: 'Operationel',
    impact: 'Høj',
    evidenceLevel: 'Stærk Evidens',
    relatedViews: ['financials', 'sector'],
    sourceId: 'årsrapport_2024'
  },
  {
    id: 'H3',
    title: 'Store interne lån maskerer likviditetskrise',
    summary: 'På trods af høj egenkapital er selskabet kritisk illikvidt, da likvide midler er bundet i interne lån til koncernselskaber.',
    description: [
      'Kontantbeholdning i 2024: 31 DKK.',
      'Tilgodehavender hos nærtstående parter: 12,4 mio. DKK.',
      'DSO (Days Sales Outstanding) er steget til ~358 dage, hvilket indikerer at næsten et års omsætning er bundet i kreditter.'
    ],
    analysisNote: 'Driftselskabet er en "kredit-ko", der systematisk drænes for likviditet for at finansiere ejerens ejendomsinvesteringer via holdingselskabet.',
    status: 'Bekræftet',
    category: 'Likviditet',
    impact: 'Høj',
    evidenceLevel: 'Stærk Evidens',
    relatedViews: ['cashflow', 'risk'],
    sourceId: 'sprint_1_rapport'
  },
  {
    id: 'H4',
    title: 'Skattesag er en eksistentiel trussel',
    summary: 'En verserende skattesag med et potentielt krav på 4 mio. DKK udgør en akut trussel mod selskabets overlevelse pga. den akutte likviditetskrise.',
    description: [
      'Potentielt krav på 4 mio. DKK svarer til 135% af årets overskud (2024).',
      'Ledelsen har ikke hensat beløbet i regnskabet, hvilket er bemærket af revisor.',
      'Med en kassebeholdning på 31 DKK kan selskabet ikke betale kravet, hvis det forfalder.'
    ],
    analysisNote: 'Hvis Skattestyrelsen vinder, vil selskabet blive tvunget i konkurs eller til at tilbagekalde det interne lån, hvilket vil skabe en krise i hele koncernen.',
    status: 'Åben',
    category: 'Skat/Compliance',
    impact: 'Høj',
    evidenceLevel: 'Stærk Evidens',
    relatedViews: ['risk', 'actions'],
    sourceId: 'sprint_1_rapport'
  },
  {
    id: 'H5',
    title: 'Holdingstruktur er strategisk kapitalbeskyttelse',
    summary: 'Oprettelsen af CESR-selskaber er en bevidst strategi for at isolere akkumuleret profit fra operationelle risici i TS Logistik.',
    description: [
      'CESR Holding blev stiftet i Q4 2022, umiddelbart efter det profitable 2021-regnskab blev godkendt.',
      'Et udbytte på 5 mio. DKK blev overført fra drift (høj risiko) til holding (lav risiko) i juni 2023.',
      'Pengene blev omgående brugt til at købe ejendomme for 6,55 mio. DKK i CESR Ejendomme ApS.'
    ],
    analysisNote: 'En klassisk "penge-pipeline" for at flytte kapital fra drift til passive aktiver, væk fra driftselskabets kreditorer.',
    status: 'Bekræftet',
    category: 'Strategisk',
    impact: 'Middel',
    evidenceLevel: 'Stærk Evidens',
    relatedViews: ['companies', 'person'],
    sourceId: 'edd_rapport_v2'
  },
   {
    id: 'H6',
    title: 'Markedspres og "captive" model presser driften',
    summary: 'TS Logistiks faldende produktivitet skyldes en "usynlig" B2B "white-label" model, hvor de er en "captive" underleverandør for få store kunder.',
    description: [
      'Ingen officiel hjemmeside eller markedsføring på trods af en omsætning på >20 mio. kr.',
      'Produktiviteten (GP/ansat) er faldet 34.5% siden 2021.',
      'Selskabet er 100% afhængig af få, formodede store 3PL-kunder, som kan diktere priserne.'
    ],
    analysisNote: 'Den "usynlige" digitale profil kombineret med en "personaletung" model gør TS Logistik ekstremt sårbar over for det markedspres (prispres, chaufførmangel), der er identificeret i branchen.',
    status: 'Bekræftet',
    category: 'Operationel',
    impact: 'Høj',
    evidenceLevel: 'Indikation',
    relatedViews: ['sector', 'financials'],
    sourceId: 'edd_rapport_v2'
  }
];