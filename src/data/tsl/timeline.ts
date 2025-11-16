import { TimelineEvent } from '../../types';

export const timelineData: TimelineEvent[] = [
  {
    date: '2025-11-15',
    type: 'Finansiel',
    title: 'Dubai-investering afdækket',
    description: 'Efterretninger afdækker en anslået transnational investering på 4-4,5 mio. DKK i et Dubai-projekt, der forbinder TS/Ümit-netværket med Husam/Bilgruppen via mellemmændene Ramo og Adel.',
    source: 'Sprint 2.5',
    sourceId: 'sprint_2_5_rapport',
    isCritical: true,
  },
  {
    date: '2025-09-02',
    type: 'Struktur',
    title: 'Cömert Avci Stifter RCIM Holding ApS',
    description: 'Den tidligere partner Cömert Avci etablerer (stiftelse 2. september 2025) et nyt holding-setup med familien (RCIM Holding ApS), hvilket signalerer etableringen af et potentielt konkurrerende netværk.',
    source: 'Paqle / Sprint 2',
    sourceId: 'sprint_2_rapport'
  },
  {
    date: '2025-08-01',
    type: 'Finansiel',
    title: 'Interne Lån Runder 12,4 mio. kr.',
    description: 'Analyse af balancen viser, at tilgodehavender hos nærtstående parter nu udgør 12,4 mio. kr., hvilket cementerer likviditetsdrænet fra driften.',
    source: 'Analyse af Årsrapport 2024',
    sourceId: 'årsrapport_2024'
  },
  {
    date: '2025-07-16',
    type: 'Regnskab',
    title: 'Årsrapport 2024 Afslører Pres',
    description: 'Resultatet er faldet til 2,96 mio. kr. Noter afslører leasingforpligtelser (ca. 8 mio. kr.) og den verserende skattesag (4 mio. kr.). Likviditeten er på 31 DKK.',
    source: 'Årsrapport 2024',
    sourceId: 'årsrapport_2024'
  },
  {
    date: '2025-02-10',
    type: 'Compliance',
    title: 'Vognmandstilladelser Verificeret',
    description: 'Opslag i Færdselsstyrelsens register bekræfter tilladelser (Licensnr. 4087192). Bemærk: Tidligere automatiske opslag gav fejl, hvilket understreger behovet for løbende manuel verifikation.',
    source: 'Færdselsstyrelsen'
  },
  {
    date: '2024-12-10',
    type: 'Compliance',
    title: 'Skattestyrelsen Varsler Sag',
    description: 'Skattestyrelsen varsler et potentielt krav på op til 4 mio. kr. vedrørende fradrag og moms. Ledelsen undlader at hensætte beløbet.',
    source: 'Årsrapport 2024, Note 1',
    sourceId: 'årsrapport_2024_note1'
  },
  {
    date: '2024-08-16',
    type: 'Adresse',
    title: 'Flytning til Nyt Domicil i Glostrup',
    description: 'TS Logistik får permanent erhvervsadresse i et logistikcenter på Naverland 13, 2600 Glostrup.',
    source: 'CVR'
  },
  {
    date: '2024-06-20',
    type: 'Compliance',
    title: 'Lov om km-afgift for lastbiler vedtages',
    description: 'Den nye lov om en vejafgift for lastbiler (dato estimeret), der træder i kraft i 2025, vedtages. Dette er en kritisk makro-hændelse, der forventes at øge driftsomkostningerne markant for hele branchen.',
    source: 'Sprint 2.5 / DI / Folketinget',
    sourceId: 'sprint_2_5_rapport',
    isCritical: true,
  },
  {
    date: '2024-03-15',
    type: 'Adresse',
    title: 'Midlertidig Retur til Albertslund',
    description: 'Selskabets adresse flyttes midlertidigt tilbage til Tornegårdsvej, hvilket indikerer et hul mellem lejemål.',
    source: 'Lasso'
  },
  {
    date: '2023-11-21',
    type: 'Finansiel',
    title: 'Ejendomskøb #2',
    description: 'CESR Ejendomme ApS køber Vejlebrovej 115, st. th, 2635 Ishøj for 4.450.000 DKK, hvilket bringer de samlede ejendomsinvesteringer op på 6,55 mio. kr.',
    source: 'PROLOG v2.0'
  },
  {
    date: '2023-09-30',
    type: 'Struktur',
    title: 'Direktør Udtræder af CESR ApS',
    description: 'Cömert Avci udtræder som direktør for CESR ApS efter formodet uenighed omkring efteråret 2023. Ümit Cetin overtager fuld kontrol.',
    source: 'OSINT Analyse / Sprint 2',
    sourceId: 'sprint_2_rapport',
  },
  {
    date: '2023-08-29',
    type: 'Finansiel',
    title: 'Ejendomskøb #1',
    description: 'CESR Ejendomme ApS køber Vejlebrovej 115, 4. th, 2635 Ishøj for 2.100.000 DKK. Transaktionen er finansieret af udbyttet.',
    source: 'PROLOG v2.0'
  },
  {
    date: '2023-06-23',
    type: 'Finansiel',
    title: 'Udbytte på 5 Mio. DKK Besluttes',
    description: 'På generalforsamlingen godkendes 2022-regnskabet, og der besluttes et ekstraordinært udbytte på 5 mio. DKK fra TS Logistik til CESR Holding.',
    source: 'Årsrapport 2022',
    sourceId: 'årsrapport_2022'
  },
   {
    date: '2023-06-14',
    type: 'Etablering',
    title: 'CESR ApS (Bilsalg) stiftes',
    description: 'Udvidelse til brugtbilsalg, en højrisikobranche. Cömert Avci indsættes som direktør.',
    source: 'CVR'
  },
  {
    date: '2022-12-31',
    type: 'Regnskab',
    title: 'Rekordresultat for 2022',
    description: 'Årsregnskabet for 2022 viser et resultat på 6,7 mio. kr., delvist drevet af engangsindtægter. Dette er det finansielle grundlag for de efterfølgende strukturændringer.',
    source: 'Årsrapport 2022',
    sourceId: 'årsrapport_2022'
  },
  {
    date: '2022-12-06',
    type: 'Struktur',
    title: 'CESR Ejendomme ApS Stiftes',
    description: 'Datterselskab til ejendomsinvesteringer oprettes under CESR Holding.',
    source: 'CVR'
  },
  {
    date: '2022-10-15',
    type: 'Struktur',
    title: 'CESR Holding ApS Stiftes',
    description: 'Ümit Cetin stifter holdingselskabet for at eje TS Logistik og fremtidige selskaber, hvilket er et nøgletrin i kapitalbeskyttelsen.',
    source: 'CVR'
  },
   {
    date: '2022-06-30',
    type: 'Adresse',
    title: 'Flytning til Brøndby',
    description: 'Adresse ændres til Vallensbækvej 6, Brøndby, et formodet logistik-kontorhotel.',
    source: 'Lasso'
  },
  {
    date: '2022-06-16',
    type: 'Struktur',
    title: 'Revisor Registreres',
    description: 'Revisionsfirmaet Christian Danielsen registreres på selskabet, to uger før revisionspligt formelt indtræder pga. størrelse.',
    source: 'PROLOG v2.0'
  },
  {
    date: '2022-01-01',
    type: 'Struktur',
    title: 'Ümit Cetin Udtræder af Lund Capital',
    description: 'Ümit Cetin udtræder af direktionen og ejerkredsen i Lund Capital, som overtages fuldt af M.D. Tirpan.',
    source: 'CVR'
  },
  {
    date: '2020-09-14',
    type: 'Adresse',
    title: 'Flytning til Albertslund',
    description: 'Selskabets C/O adresse flyttes til Tornegårdsvej 39, Albertslund, Ümit Cetins private bolig.',
    source: 'CVR'
  },
  {
    date: '2019-04-01',
    type: 'Struktur',
    title: 'Lund Capital Holding ApS Stiftes',
    description: 'Ümit Cetin stifter Lund Capital Holding ApS som et sideprojekt, der senere overdrages.',
    source: 'CVR'
  },
  {
    date: '2017-04-12',
    type: 'Etablering',
    title: 'TS Logistik ApS Stiftes',
    description: 'Ümit Cetin stifter TS Logistik ApS med 50.000 kr i kapital. Start på privatadresse i Taastrup.',
    source: 'CVR'
  }
];