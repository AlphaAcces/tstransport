import { TimelineEvent } from '../../types';

export const timelineData: TimelineEvent[] = [
  {
    date: '2017-04-12',
    type: 'Etablering',
    title: 'Grundlægger TS Logistik ApS',
    description: 'Ümit Cetin etablerer sin primære operationelle virksomhed, TS Logistik ApS, fra en privatadresse i Taastrup. Dette markerer starten på hans vækstrejse i transportsektoren.',
    source: 'CVR',
    sourceId: 'cvr_tsl'
  },
  {
    date: '2022-10-15',
    type: 'Struktur',
    title: 'Etablerer Holdingstruktur',
    description: 'Efter flere års profitabel drift stifter Cetin CESR Holding ApS. Dette er et afgørende skridt for at adskille personlig formue og selskabsrisici, og for at muliggøre kapitalflytning.',
    source: 'CVR',
    sourceId: 'cvr_cesr_holding'
  },
  {
    date: '2022-12-06',
    type: 'Struktur',
    title: 'Diversificerer til Ejendomme',
    description: 'Stifter CESR Ejendomme ApS som led i en strategi om at konvertere driftsoverskud til mere passive, sikre aktiver (fast ejendom), isoleret fra driften.',
    source: 'CVR',
    sourceId: 'cvr_cesr_ejendomme'
  },
  {
    date: '2023-06-23',
    type: 'Finansiel',
    title: 'Trækker 5 Mio. DKK ud til Holding',
    description: 'Et ekstraordinært udbytte på 5 mio. DKK overføres fra TS Logistik til CESR Holding, hvilket realiserer strategien om at flytte kapital væk fra det operationelle selskab.',
    source: 'Årsrapport 2022',
    sourceId: 'årsrapport_2022'
  },
  {
    date: '2023-11-21',
    type: 'Finansiel',
    title: 'Fuldfører Ejendomsinvestering',
    description: 'Med det andet ejendomskøb når de samlede investeringer i CESR Ejendomme op på 6,55 mio. DKK, finansieret af udbyttet fra TS Logistik. Kapitalen er nu fuldt reinvesteret.',
    source: 'PROLOG v2.0',
    sourceId: 'tidslinje_pdf'
  },
  {
    date: '2024-12-10',
    type: 'Compliance',
    title: 'Konfronteres med Skattesag',
    description: 'Skattestyrelsens varsel om en sag på 4 mio. kr. skaber en direkte personlig og økonomisk risiko for Cetin som eneejer og direktør, med potentiel personlig hæftelse.',
    source: 'Årsrapport 2024, Note 1',
    sourceId: 'årsrapport_2024_note1'
  },
  {
    date: '2025-01-15',
    type: 'Struktur',
    title: 'Overtager Fuld Kontrol med CESR ApS',
    description: 'Efter Cömert Avcis udtræden overtager Cetin den fulde kontrol med brugtbilsforretningen, hvilket øger hans personlige ledelsesansvar i en ny højrisikobranche.',
    source: 'OSINT Analyse',
    sourceId: 'edd_rapport_v2'
  },
  {
    date: '2025-08-01',
    type: 'Finansiel',
    title: 'Intern Gældsætning Topper',
    description: 'De interne lån fra TS Logistik til Cetins holdingselskab runder 12,4 mio. kr. Dette indikerer en maksimal udnyttelse af driftselskabet til at finansiere UBO-niveauets strategi.',
    source: 'Analyse af Årsrapport 2024',
    sourceId: 'årsrapport_2024'
  }
];