import type { View } from '../../types';

export type ThreatLevelToken = 'low' | 'moderate' | 'elevated' | 'high' | 'critical';
export type TrendDirection = 'up' | 'down' | 'flat';
export type BadgeTone = 'danger' | 'warning' | 'info' | 'success' | 'neutral';

export interface ExecutiveKpiSnapshot {
  id: string;
  label: string;
  value: string;
  unit?: string;
  changePct?: number;
  changeType?: 'positive' | 'negative';
  description?: string;
  color: 'green' | 'yellow' | 'red' | 'orange' | 'gold';
  icon: 'revenue' | 'cash' | 'margin' | 'ai' | 'exposure';
}

export interface ExecutiveRiskInsight {
  id: string;
  title: string;
  hypothesis: string;
  owner: string;
  impact: 'low' | 'medium' | 'high';
  likelihood: 'low' | 'medium' | 'high';
  status: 'monitor' | 'escalate' | 'contain';
}

export interface ExecutivePriorityAction {
  id: string;
  title: string;
  owner: string;
  dueLabel: string;
  status: 'onTrack' | 'atRisk' | 'blocked';
  description: string;
}

export interface ExecutiveTrendTile {
  id: string;
  label: string;
  value: string;
  delta: string;
  direction: TrendDirection;
  helperText: string;
}

export interface ExecutiveLinkTarget {
  id: string;
  label: string;
  description: string;
  view: View;
}

export interface ExecutiveSummaryViewData {
  header: {
    eyebrow: string;
    title: string;
    subtitle: string;
    updatedAt: string;
  };
  threat: {
    level: ThreatLevelToken;
    score: number;
    previousScore: number;
    activeAlerts: number;
    badgeLabel: string;
    badgeTone: BadgeTone;
    summary: string;
    lastUpdated: string;
  };
  kpis: ExecutiveKpiSnapshot[];
  executiveNote: {
    title: string;
    summary: string;
    detail: string;
    author: string;
    timestamp: string;
  };
  risks: ExecutiveRiskInsight[];
  actions: ExecutivePriorityAction[];
  trends: ExecutiveTrendTile[];
  links: ExecutiveLinkTarget[];
}

export const getMockExecutiveSummary = (): ExecutiveSummaryViewData => ({
  header: {
    eyebrow: 'LEDELSESOVERBLIK',
    title: 'GreyEYE Command – Executive Summary',
    subtitle: 'Kritiske signaler og handlingspunkter på tværs af finans, risiko og AI drift',
    updatedAt: 'Opdateret 08:32 CET • 30. november',
  },
  threat: {
    level: 'critical',
    score: 82,
    previousScore: 75,
    activeAlerts: 6,
    badgeLabel: 'Trusselsniveau: Kritisk',
    badgeTone: 'danger',
    summary: 'API-gatewayen oplever ustabil latency og to kontrollerede netværksalarmer kræver opfølgning.',
    lastUpdated: new Date().toISOString(),
  },
  kpis: [
    {
      id: 'revenue',
      label: 'Omsætnings-run-rate',
      value: '4,3 mia.',
      changePct: 3.2,
      changeType: 'positive',
      description: 'Opjusteret guidance baseret på seneste ordreindtag',
      color: 'gold',
      icon: 'revenue',
    },
    {
      id: 'cash',
      label: 'Likviditetsreserve',
      value: '612 mio.',
      unit: 'DKK',
      changePct: -1.4,
      changeType: 'negative',
      description: 'DSO forlænget 4 dage ugen over',
      color: 'green',
      icon: 'cash',
    },
    {
      id: 'margin',
      label: 'Operativ margin',
      value: '18,4%',
      changePct: -0.8,
      changeType: 'negative',
      description: 'Tryk fra energipriser og kontraktindexering',
      color: 'orange',
      icon: 'margin',
    },
    {
      id: 'ai',
      label: 'AI-kommando throughput',
      value: '122/min',
      changePct: 5.6,
      changeType: 'positive',
      description: 'Forbedret svarrate efter modelopdatering',
      color: 'yellow',
      icon: 'ai',
    },
  ],
  executiveNote: {
    title: 'Executive briefing',
    summary: 'Boardet forventer opdatering på netværkshændelser og finansiel modforanstaltning før næste release gate.',
    detail: 'Fokus: Sikre at cash-buffer forbliver over 600 mio. DKK, og at API-gatewayen kan håndtere højsæsonens last uden failover.',
    author: 'Operativ chef: Ingrid Mølgaard',
    timestamp: 'Senest bekræftet 07:55 CET',
  },
  risks: [
    {
      id: 'risk-1',
      title: 'Regulatorisk eksponering i DE',
      hypothesis: 'Bundne kapitalvilkår kan udløse ekstra sikkerhedskrav',
      owner: 'Chief Legal, H. Falk',
      impact: 'high',
      likelihood: 'medium',
      status: 'escalate',
    },
    {
      id: 'risk-2',
      title: 'Supply chain afhængighed af enkeltleverandør',
      hypothesis: '48% af specialkomponenterne er single-source i Østeuropa',
      owner: 'COO, J. Levinsen',
      impact: 'medium',
      likelihood: 'high',
      status: 'monitor',
    },
    {
      id: 'risk-3',
      title: 'AI audit log afvigelser',
      hypothesis: 'Fem uafklarede adgangsforsøg uden MFA registreret natten til i dag',
      owner: 'CISO, L. Bertram',
      impact: 'high',
      likelihood: 'low',
      status: 'contain',
    },
  ],
  actions: [
    {
      id: 'action-1',
      title: 'Stabilisér API-gatewayen',
      owner: 'Platform lead',
      dueLabel: 'Due: +6 timer',
      status: 'atRisk',
      description: 'Failover tests planlagt kl. 14:00 – kræver grønt lys fra Security.',
    },
    {
      id: 'action-2',
      title: 'Likviditetsplan til bestyrelsen',
      owner: 'CFO office',
      dueLabel: 'Due: i morgen 08:00',
      status: 'onTrack',
      description: 'Indbyg stress-scenarie for energi spotpris på +35%.',
    },
    {
      id: 'action-3',
      title: 'AI audit remediation',
      owner: 'AI governance',
      dueLabel: 'Due: 48 timer',
      status: 'blocked',
      description: 'Afventer log dumps fra partner-cloud inden oprydning.',
    },
  ],
  trends: [
    {
      id: 'trend-1',
      label: 'Netværkslatency (p95)',
      value: '412 ms',
      delta: '+87 ms vs. SLA',
      direction: 'up',
      helperText: 'Stigende under sidste nattevagt',
    },
    {
      id: 'trend-2',
      label: 'Aktive alarmer',
      value: '14',
      delta: '+4 siden kl. 04',
      direction: 'up',
      helperText: '6 kritiske • 3 høj • 5 moderat',
    },
    {
      id: 'trend-3',
      label: 'Likvid buffer',
      value: '612 mio.',
      delta: '-22 mio. uge/uge',
      direction: 'down',
      helperText: 'Begrænset til 1,2 måneders runway',
    },
    {
      id: 'trend-4',
      label: 'AI-kommandoer pr. min',
      value: '122',
      delta: '+5% efter fine-tune',
      direction: 'up',
      helperText: 'Fejlrate: 0,7%',
    },
  ],
  links: [
    {
      id: 'cta-risk',
      label: 'Åbn risiko heatmap',
      description: 'Detaljeret visning af de 24 aktive risikoscenarier',
      view: 'risk',
    },
    {
      id: 'cta-actions',
      label: 'Gå til Actions',
      description: 'Planlæg og tildel ejere på tværs af squads',
      view: 'actions',
    },
    {
      id: 'cta-timeline',
      label: 'Timeline briefing',
      description: 'Se hændelser og audit log i kronologisk rækkefølge',
      view: 'timeline',
    },
    {
      id: 'cta-financials',
      label: 'Åbn finansielt cockpit',
      description: 'DSO bevægelser, cash runway og rating',
      view: 'financials',
    },
  ],
});
