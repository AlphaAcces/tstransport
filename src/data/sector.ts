import { SectorDriver, SectorBenchmarkYear, SectorComparisonMetric } from '../types';
import { financialData } from './financials';

const SECTOR_AVG_EBIT_MARGIN = 5.0;
const SECTOR_AVG_EQUITY_RATIO = 35.0;
const SECTOR_AVG_RESULT_PER_EMPLOYEE = 60000;

const HIGH_PERF_EBIT_MARGIN = 10.0;
const HIGH_PERF_EQUITY_RATIO = 50.0;
const HIGH_PERF_RESULT_PER_EMPLOYEE = 120000;


export const sectorBenchmarkYearlyData: SectorBenchmarkYear[] = financialData.map(d => ({
    year: d.year,
    ebitMarginTSL: d.ebitMargin,
    equityRatioTSL: d.solidity,
    resultPerEmployeeTSL: d.profitPerEmployee,
    ebitMarginSector: SECTOR_AVG_EBIT_MARGIN,
    equityRatioSector: SECTOR_AVG_EQUITY_RATIO,
    resultPerEmployeeSector: SECTOR_AVG_RESULT_PER_EMPLOYEE,
}));

const tsl2024 = financialData.find(d => d.year === 2024);

export const sectorComparisonData: SectorComparisonMetric[] = [
    {
        metric: 'EBIT-margin',
        tslValue: tsl2024?.ebitMargin,
        sectorValue: SECTOR_AVG_EBIT_MARGIN,
        highPerformerValue: HIGH_PERF_EBIT_MARGIN,
        unit: '%',
        higherIsBetter: true,
    },
    {
        metric: 'Soliditet',
        tslValue: tsl2024?.solidity,
        sectorValue: SECTOR_AVG_EQUITY_RATIO,
        highPerformerValue: HIGH_PERF_EQUITY_RATIO,
        unit: '%',
        higherIsBetter: true,
    },
    {
        metric: 'Resultat pr. medarbejder',
        tslValue: tsl2024?.profitPerEmployee,
        sectorValue: SECTOR_AVG_RESULT_PER_EMPLOYEE,
        highPerformerValue: HIGH_PERF_RESULT_PER_EMPLOYEE,
        unit: 'DKK',
        higherIsBetter: true,
    }
];


export const sectorDriversData: SectorDriver[] = [
  {
    driver: 'Chaufførmangel & Lønpres',
    industrySituation: 'Branchen mangler ca. 10.000 chauffører. Dette presser lønningerne op og skaber konkurrence om kvalificeret arbejdskraft.',
    impactOnTSL: 'TS Logistiks personaleomkostninger er steget markant, og produktiviteten er faldet. De er direkte påvirket af denne trend.',
    risk: 'Høj',
  },
  {
    driver: 'Stigende Omkostninger',
    industrySituation: 'Vejafgifter (Maut), brændstofpriser og andre driftsomkostninger stiger. Virksomheder kan kun delvist videreføre disse til kunderne.',
    impactOnTSL: 'Faldende marginer i 2023-2024 bekræfter, at TS Logistik er presset på profitabiliteten grundet stigende omkostninger.',
    risk: 'Høj',
  },
  {
    driver: 'Overkapacitet & Prispres',
    industrySituation: 'En nedadgående økonomi reducerer efterspørgslen, hvilket skaber overkapacitet i markedet og intens priskonkurrence.',
    impactOnTSL: 'Som en formodet "captive" underleverandør er TS Logistik sandsynligvis stærkt udsat for prispres fra deres få, store kunder.',
    risk: 'Middel',
  },
  {
    driver: 'Digitalisering',
    industrySituation: 'Kunder forventer realtidsopdateringer og digitale booking-platforme. Manglende investering heri er en konkurrencemæssig ulempe.',
    impactOnTSL: 'TS Logistiks "usynlige" digitale profil indikerer en manglende investering i kundevendte teknologier, hvilket kan være en langsigtet risiko.',
    risk: 'Middel',
  },
  {
    driver: 'Bæredygtighed',
    industrySituation: 'Der er pres for at reducere CO2-aftryk, men skepsis og begrænset udbud af lav-emissionskøretøjer bremser omstillingen.',
    impactOnTSL: 'Selskabet har sandsynligvis ikke investeret i grønne teknologier, hvilket kan gøre dem mindre attraktive for kunder med bæredygtighedskrav.',
    risk: 'Lav',
  }
];
