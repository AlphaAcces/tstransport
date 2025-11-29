/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { ExportPayload } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SCALE = 3;
const BRAND_BG = '#050916';
const SECTION_BG = '#0f162f';
const TEXT_LIGHT = '#f7f9ff';
const BADGE_COLORS: Record<string, string> = {
  high: '#f94f6b',
  medium: '#f5a524',
  low: '#4ade80',
};

function createSection(title: string, content: string[]): HTMLDivElement {
  const section = document.createElement('div');
  section.style.background = SECTION_BG;
  section.style.borderRadius = '12px';
  section.style.padding = '16px';
  section.style.display = 'flex';
  section.style.flexDirection = 'column';
  section.style.gap = '8px';

  const heading = document.createElement('div');
  heading.textContent = title;
  heading.style.fontSize = '14px';
  heading.style.fontWeight = '600';
  heading.style.color = TEXT_LIGHT;
  section.appendChild(heading);

  content.forEach(line => {
    const row = document.createElement('div');
    row.textContent = line;
    row.style.fontSize = '12px';
    row.style.color = '#a5b4ff';
    section.appendChild(row);
  });

  return section;
}

function createBadge(label: string, severity: 'low' | 'medium' | 'high'): HTMLSpanElement {
  const badge = document.createElement('span');
  badge.textContent = label;
  badge.style.padding = '4px 10px';
  badge.style.borderRadius = '999px';
  badge.style.fontSize = '11px';
  badge.style.fontWeight = '600';
  badge.style.background = `${BADGE_COLORS[severity]}24`;
  badge.style.color = BADGE_COLORS[severity];
  return badge;
}

function formatNumber(value?: number, currency?: string): string {
  if (value == null) return 'n/a';
  try {
    return new Intl.NumberFormat('da-DK', {
      style: currency ? 'currency' : 'decimal',
      currency: currency ?? 'DKK',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return value.toString();
  }
}

function buildHeroRow(payload: ExportPayload): HTMLDivElement {
  const metadata = (payload.metadata ?? {}) as Record<string, any>;
  const hero = document.createElement('div');
  hero.style.display = 'grid';
  hero.style.gridTemplateColumns = '2fr 1fr';
  hero.style.gap = '16px';

  const threatCard = document.createElement('div');
  threatCard.style.background = SECTION_BG;
  threatCard.style.borderRadius = '16px';
  threatCard.style.padding = '24px';
  threatCard.style.display = 'flex';
  threatCard.style.flexDirection = 'column';
  threatCard.style.gap = '12px';

  const activeHighRisks = (payload.risks ?? []).filter(r => r.severity === 'high');
  const activeAlertCount = metadata.activeAlarms ?? activeHighRisks.length;

  const heroLabel = document.createElement('div');
  heroLabel.textContent = 'Threat Overview';
  heroLabel.style.textTransform = 'uppercase';
  heroLabel.style.letterSpacing = '1px';
  heroLabel.style.fontSize = '12px';
  heroLabel.style.color = '#9ca6ff';
  threatCard.appendChild(heroLabel);

  const heroValue = document.createElement('div');
  heroValue.textContent = `${activeAlertCount} Critical Alerts`;
  heroValue.style.fontSize = '32px';
  heroValue.style.fontWeight = '700';
  threatCard.appendChild(heroValue);

  const heroDesc = document.createElement('div');
  heroDesc.textContent = 'Most severe events surfaced from live intelligence feeds.';
  heroDesc.style.fontSize = '13px';
  heroDesc.style.color = '#c8d0ff';
  threatCard.appendChild(heroDesc);

  const heroList = document.createElement('div');
  heroList.style.display = 'grid';
  heroList.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
  heroList.style.gap = '10px';
  (activeHighRisks.slice(0, 3).length ? activeHighRisks.slice(0, 3) : payload.risks?.slice(0, 3) ?? []).forEach(risk => {
    const row = document.createElement('div');
    row.style.background = '#0b1226';
    row.style.padding = '10px';
    row.style.borderRadius = '10px';
    row.style.display = 'flex';
    row.style.flexDirection = 'column';
    row.style.gap = '4px';

    const title = document.createElement('div');
    title.textContent = risk.title;
    title.style.fontWeight = '600';
    row.appendChild(title);

    const summary = document.createElement('div');
    summary.textContent = risk.summary ?? 'No investigator summary provided.';
    summary.style.fontSize = '12px';
    summary.style.color = '#9ba5d1';
    row.appendChild(summary);

    const badge = createBadge(risk.severity.toUpperCase(), risk.severity);
    badge.style.alignSelf = 'flex-start';
    row.appendChild(badge);
    heroList.appendChild(row);
  });

  if (!heroList.childElementCount) {
    const empty = document.createElement('div');
    empty.textContent = 'Ingen risici rapporteret';
    empty.style.fontSize = '12px';
    empty.style.color = '#9ba5d1';
    heroList.appendChild(empty);
  }

  threatCard.appendChild(heroList);
  hero.appendChild(threatCard);

  const statusStack = document.createElement('div');
  statusStack.style.display = 'flex';
  statusStack.style.flexDirection = 'column';
  statusStack.style.gap = '12px';

  const metrics: Array<{ label: string; value: string; subtitle: string }> = [
    {
      label: 'Active Alarms',
      value: String(activeAlertCount ?? 0),
      subtitle: metadata.lastAlarm ?? 'No timestamp',
    },
    {
      label: 'AI Commands',
      value: String(metadata.aiCommands ?? payload.aiInsights?.length ?? 0),
      subtitle: 'last 24h',
    },
    {
      label: 'Network Load',
      value: `${metadata.networkLoad ?? 'Normal'}`,
      subtitle: 'Avg throughput',
    },
  ];

  metrics.forEach(metric => {
    const card = document.createElement('div');
    card.style.background = SECTION_BG;
    card.style.borderRadius = '12px';
    card.style.padding = '16px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '4px';

    const label = document.createElement('div');
    label.textContent = metric.label;
    label.style.fontSize = '12px';
    label.style.color = '#a3acf5';
    card.appendChild(label);

    const value = document.createElement('div');
    value.textContent = metric.value;
    value.style.fontSize = '24px';
    value.style.fontWeight = '700';
    card.appendChild(value);

    const subtitle = document.createElement('div');
    subtitle.textContent = metric.subtitle;
    subtitle.style.fontSize = '11px';
    subtitle.style.color = '#8188b2';
    card.appendChild(subtitle);

    statusStack.appendChild(card);
  });

  hero.appendChild(statusStack);
  return hero;
}

function buildGrid(payload: ExportPayload): HTMLDivElement {
  const container = document.createElement('div');
  container.style.width = '1024px';
  container.style.background = BRAND_BG;
  container.style.color = TEXT_LIGHT;
  container.style.fontFamily = 'Inter, Segoe UI, system-ui, sans-serif';
  container.style.padding = '32px';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '16px';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  const title = document.createElement('div');
  title.textContent = `GreyEYE Report • ${payload.tenant.name ?? payload.tenant.id}`;
  title.style.fontWeight = '600';
  title.style.fontSize = '18px';
  header.appendChild(title);
  const date = document.createElement('div');
  date.textContent = new Date().toLocaleString('da-DK');
  date.style.fontSize = '12px';
  header.appendChild(date);
  container.appendChild(header);

  container.appendChild(buildHeroRow(payload));

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
  grid.style.gap = '16px';

  const financeLines = [
    `Revenue: ${formatNumber(payload.finance?.revenue, payload.finance?.currency)}`,
    `EBITDA: ${formatNumber(payload.finance?.ebitda, payload.finance?.currency)}`,
    `Burn: ${formatNumber(payload.finance?.burnRate, payload.finance?.currency)}`,
  ];
  grid.appendChild(createSection('Financial Overview', financeLines));

  const kpiSection = document.createElement('div');
  kpiSection.style.background = SECTION_BG;
  kpiSection.style.borderRadius = '12px';
  kpiSection.style.padding = '16px';
  kpiSection.style.display = 'flex';
  kpiSection.style.flexDirection = 'column';
  kpiSection.style.gap = '12px';
  const kpiTitle = document.createElement('div');
  kpiTitle.textContent = 'Key KPIs';
  kpiTitle.style.fontWeight = '600';
  kpiSection.appendChild(kpiTitle);
  const kpiGrid = document.createElement('div');
  kpiGrid.style.display = 'grid';
  kpiGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(120px, 1fr))';
  kpiGrid.style.gap = '12px';
  (payload.kpis ?? []).slice(0, 6).forEach(kpi => {
    const card = document.createElement('div');
    card.style.background = '#0b1226';
    card.style.borderRadius = '10px';
    card.style.padding = '12px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '6px';
    const label = document.createElement('div');
    label.textContent = kpi.label;
    label.style.fontSize = '12px';
    label.style.color = '#a5b4ff';
    card.appendChild(label);
    const value = document.createElement('div');
    value.textContent = String(kpi.value ?? 'n/a');
    value.style.fontSize = '18px';
    value.style.fontWeight = '600';
    card.appendChild(value);
    const trend = document.createElement('div');
    trend.textContent = `Trend: ${kpi.trend ?? 'flat'}`;
    trend.style.fontSize = '11px';
    trend.style.color = '#8d96c6';
    card.appendChild(trend);
    kpiGrid.appendChild(card);
  });
  if (!kpiGrid.childElementCount) {
    const empty = document.createElement('div');
    empty.textContent = 'No KPIs available';
    empty.style.fontSize = '12px';
    empty.style.color = '#a3acf5';
    kpiGrid.appendChild(empty);
  }
  kpiSection.appendChild(kpiGrid);
  grid.appendChild(kpiSection);

  const riskPanel = document.createElement('div');
  riskPanel.style.background = SECTION_BG;
  riskPanel.style.borderRadius = '12px';
  riskPanel.style.padding = '16px';
  riskPanel.style.display = 'flex';
  riskPanel.style.flexDirection = 'column';
  riskPanel.style.gap = '12px';

  const riskTitle = document.createElement('div');
  riskTitle.textContent = 'Risk Badges';
  riskTitle.style.fontWeight = '600';
  riskPanel.appendChild(riskTitle);

  const badgeRow = document.createElement('div');
  badgeRow.style.display = 'flex';
  badgeRow.style.flexWrap = 'wrap';
  badgeRow.style.gap = '10px';
  (payload.risks ?? []).forEach(risk => {
    const badge = createBadge(risk.title, risk.severity);
    badgeRow.appendChild(badge);
  });
  if (!badgeRow.childElementCount) {
    const empty = document.createElement('span');
    empty.textContent = 'No risk indicators';
    empty.style.fontSize = '12px';
    empty.style.color = '#9ca6ff';
    badgeRow.appendChild(empty);
  }
  riskPanel.appendChild(badgeRow);
  grid.appendChild(riskPanel);

  const aiLines = payload.aiOverlay?.enabled
    ? (payload.aiInsights ?? []).map(
      ai => `${ai.label}: ${ai.description}${ai.score ? ` (score ${ai.score.toFixed(2)})` : ''}`,
    )
    : ['AI overlays disabled'];
  grid.appendChild(createSection('AI Overlay', aiLines.length ? aiLines : ['AI data unavailable']));

  container.appendChild(grid);

  const nodeSummary = document.createElement('div');
  nodeSummary.textContent = `Nodes: ${payload.nodes?.length ?? 0} • Edges: ${payload.edges?.length ?? 0}`;
  nodeSummary.style.fontSize = '12px';
  nodeSummary.style.color = '#8ea0ff';
  container.appendChild(nodeSummary);

  return container;
}

async function renderPdf(payload: ExportPayload): Promise<Uint8Array> {
  if (typeof document === 'undefined') {
    throw new Error('pdfRenderer requires DOM environment');
  }
  const grid = buildGrid(payload);
  document.body.appendChild(grid);
  try {
    await new Promise(resolve => requestAnimationFrame(resolve as any));
    const canvas = await html2canvas(grid, { scale: SCALE, backgroundColor: BRAND_BG });
    const pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] });
    const data = canvas.toDataURL('image/png');
    pdf.addImage(data, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.setFontSize(10);
    pdf.setTextColor('#b3b8d4');
    const footerY = canvas.height - 20;
    const footerText = `${new Date().toLocaleString('da-DK')} • ${payload.tenant.name ?? payload.tenant.id} • Page 1 of 1`;
    pdf.text(footerText, 32, footerY);
    const buffer = pdf.output('arraybuffer');
    return new Uint8Array(buffer);
  } finally {
    document.body.removeChild(grid);
  }
}

export default { renderPdf };

