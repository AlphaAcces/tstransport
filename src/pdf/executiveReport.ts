import type { jsPDF } from 'jspdf';
import {
  ExecutiveExportPayload,
  ExecutiveFinancialAlert,
  ExecutiveTimelineHighlight,
  ExecutiveRiskScoreSummary,
} from '../types';

interface ExecutiveReportChart {
  title: string;
  dataUrl: string;
  width: number;
  height: number;
}

interface ExecutiveReportOptions {
  charts?: ExecutiveReportChart[];
}

type RenderMode = 'measure' | 'draw';

interface RenderContext {
  doc: jsPDF;
  x: number;
  y: number;
  width: number;
}

interface MetricCell {
  label: string;
  value: string;
  tone?: 'positive' | 'negative' | 'warning' | 'neutral';
}

interface CardDefinition {
  span?: 1 | 2;
  render: (mode: RenderMode, ctx: RenderContext) => number;
}

const PAGE_MARGIN = 54;
const CARD_PADDING = 28;
const CARD_RADIUS = 12;
const CARD_GAP = 24;
const COLUMN_GAP = 24;

const FONT_SIZES = {
  pageTitle: 24,
  pageSubtitle: 11,
  cardTitle: 13,
  sectionLabel: 10,
  body: 10,
  metricLabel: 9,
  metricValue: 16,
  footer: 9,
};

const LINE_HEIGHTS = {
  cardTitle: 26,
  sectionLabel: 18,
  body: 16,
  bullet: 15,
};

const COLORS = {
  pageBackground: { r: 250, g: 250, b: 250 },
  pageHeading: { r: 30, g: 41, b: 59 },
  textPrimary: { r: 45, g: 55, b: 72 },
  textSecondary: { r: 88, g: 102, b: 126 },
  textMuted: { r: 149, g: 162, b: 188 },
  cardBackground: { r: 255, g: 255, b: 255 },
  cardBorder: { r: 229, g: 231, b: 235 },
  accent: { r: 99, g: 102, b: 241 },
  accentSoft: { r: 196, g: 201, b: 253 },
  bullet: { r: 99, g: 102, b: 241 },
  positive: { r: 34, g: 197, b: 94 },
  warning: { r: 245, g: 158, b: 11 },
  negative: { r: 239, g: 68, b: 68 },
};

const RISK_LEVEL_COLORS: Record<string, { fill: [number, number, number]; text: [number, number, number] }> = {
  KRITISK: { fill: [220, 38, 38], text: [255, 255, 255] },
  HØJ: { fill: [234, 179, 8], text: [17, 24, 39] },
  MODERAT: { fill: [59, 130, 246], text: [255, 255, 255] },
  LAV: { fill: [34, 197, 94], text: [17, 24, 39] },
  'N/A': { fill: [148, 163, 184], text: [17, 24, 39] },
};

const ICON_BULLETS = {
  deadline: '⏱',
  board: '🏛',
  critical: '⚠',
  roadmap: '🗓',
};

const setFillColor = (doc: jsPDF, color: { r: number; g: number; b: number }) => {
  doc.setFillColor(color.r, color.g, color.b);
};

const setStrokeColor = (doc: jsPDF, color: { r: number; g: number; b: number }) => {
  doc.setDrawColor(color.r, color.g, color.b);
};

const setTextColor = (doc: jsPDF, color: { r: number; g: number; b: number }) => {
  doc.setTextColor(color.r, color.g, color.b);
};

const resetBodyTypography = (doc: jsPDF) => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZES.body);
  setTextColor(doc, COLORS.textPrimary);
};

const formatCurrency = (value: number | null): string => {
  if (value === null) {
    return '—';
  }
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number | null): string => {
  if (value === null) {
    return '—';
  }
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

const formatDays = (value: number | null): string => {
  if (value === null) {
    return '—';
  }
  return `${value} dage`;
};

const formatAlertValue = (alert: ExecutiveFinancialAlert): string => {
  return alert.unit === 'DKK' ? formatCurrency(alert.value) : formatDays(alert.value);
};

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString('da-DK');
};

const formatTimelineItem = (event: ExecutiveTimelineHighlight): string => {
  const base = `${formatDate(event.date)} · ${event.title}`;
  return event.description ? `${base} — ${event.description}` : base;
};

const formatActionItem = (item: {
  title: string;
  priority?: string;
  ownerRole?: string;
  timeHorizon?: string;
  description?: string;
}): string => {
  const parts = [item.title];
  if (item.priority) parts.push(`(${item.priority})`);
  if (item.ownerRole) parts.push(`Ansvar: ${item.ownerRole}`);
  if (item.timeHorizon) parts.push(`Horisont: ${item.timeHorizon}`);
  const header = parts.join(' · ');
  return item.description ? `${header} — ${item.description}` : header;
};

const applyPageTheme = (doc: jsPDF) => {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  setFillColor(doc, COLORS.pageBackground);
  doc.rect(0, 0, width, height, 'F');
  setStrokeColor(doc, COLORS.cardBorder);
  resetBodyTypography(doc);
};

const ensureSpace = (doc: jsPDF, y: number, spaceNeeded: number): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + spaceNeeded > pageHeight - PAGE_MARGIN) {
    doc.addPage();
    applyPageTheme(doc);
    return PAGE_MARGIN;
  }
  return y;
};

const drawCardHeading = (mode: RenderMode, ctx: RenderContext, text: string): number => {
  if (mode === 'draw') {
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setFontSize(FONT_SIZES.cardTitle);
    setTextColor(ctx.doc, COLORS.pageHeading);
    ctx.doc.text(text, ctx.x, ctx.y + FONT_SIZES.cardTitle + 2);
    setStrokeColor(ctx.doc, COLORS.accentSoft);
    ctx.doc.setLineWidth(0.8);
    ctx.doc.line(ctx.x, ctx.y + LINE_HEIGHTS.cardTitle - 6, ctx.x + 42, ctx.y + LINE_HEIGHTS.cardTitle - 6);
  }
  return LINE_HEIGHTS.cardTitle;
};

const drawSectionLabel = (mode: RenderMode, ctx: RenderContext, label: string): number => {
  if (!label) {
    return 0;
  }
  if (mode === 'draw') {
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setFontSize(FONT_SIZES.sectionLabel);
    setTextColor(ctx.doc, COLORS.textSecondary);
    ctx.doc.text(label.toUpperCase(), ctx.x, ctx.y + FONT_SIZES.sectionLabel + 1);
  }
  return LINE_HEIGHTS.sectionLabel;
};

const drawMetricGrid = (mode: RenderMode, ctx: RenderContext, metrics: MetricCell[]): number => {
  if (metrics.length === 0) {
    return 0;
  }

  const columns = 2;
  const columnGap = 22;
  const columnWidth = (ctx.width - columnGap) / columns;
  const rowHeight = 40;

  metrics.forEach((metric, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const baseX = ctx.x + column * (columnWidth + columnGap);
    const baseY = ctx.y + row * rowHeight;

    if (mode === 'draw') {
      ctx.doc.setFont('helvetica', 'bold');
      ctx.doc.setFontSize(FONT_SIZES.metricLabel);
      setTextColor(ctx.doc, COLORS.textSecondary);
      ctx.doc.text(metric.label.toUpperCase(), baseX, baseY + 10);

      ctx.doc.setFont('helvetica', 'bold');
      ctx.doc.setFontSize(FONT_SIZES.metricValue);
      const tone = metric.tone ?? 'neutral';
      const color = tone === 'positive'
        ? COLORS.positive
        : tone === 'negative'
          ? COLORS.negative
          : tone === 'warning'
            ? COLORS.warning
            : COLORS.pageHeading;
      setTextColor(ctx.doc, color);
      ctx.doc.text(metric.value, baseX, baseY + 30);
    }
  });

  const rows = Math.ceil(metrics.length / columns);
  resetBodyTypography(ctx.doc);
  return rows * rowHeight;
};

const drawParagraph = (mode: RenderMode, ctx: RenderContext, text: string): number => {
  if (!text) {
    return 0;
  }

  const previousFontSize = ctx.doc.getFontSize();
  ctx.doc.setFontSize(FONT_SIZES.body);
  const lines = ctx.doc.splitTextToSize(text, ctx.width);
  ctx.doc.setFontSize(previousFontSize);
  const blockHeight = lines.length * LINE_HEIGHTS.body;

  if (mode === 'draw') {
    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setFontSize(FONT_SIZES.body);
    setTextColor(ctx.doc, COLORS.textPrimary);
    lines.forEach((line: string, index: number) => {
      ctx.doc.text(line, ctx.x, ctx.y + 12 + index * LINE_HEIGHTS.body);
    });
  }

  return blockHeight;
};

const drawKeyFigure = (mode: RenderMode, ctx: RenderContext, label: string, value: string): number => {
  if (mode === 'draw') {
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setFontSize(FONT_SIZES.sectionLabel);
    setTextColor(ctx.doc, COLORS.textSecondary);
    ctx.doc.text(label.toUpperCase(), ctx.x, ctx.y + FONT_SIZES.sectionLabel + 1);

    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setFontSize(14);
    setTextColor(ctx.doc, COLORS.pageHeading);
    ctx.doc.text(value, ctx.x, ctx.y + FONT_SIZES.sectionLabel + 20);
  }
  return 28;
};

const drawBulletList = (mode: RenderMode, ctx: RenderContext, items: string[], icon?: string): number => {
  if (!items.length) {
    return 0;
  }

  let offset = 0;
  const bulletIndent = 14;

  items.forEach(item => {
    const previousFontSize = ctx.doc.getFontSize();
    ctx.doc.setFontSize(FONT_SIZES.body);
    const lines = ctx.doc.splitTextToSize(item, ctx.width - bulletIndent);
    ctx.doc.setFontSize(previousFontSize);
    const blockHeight = lines.length * LINE_HEIGHTS.bullet;

    if (mode === 'draw') {
      ctx.doc.setFont('helvetica', 'bold');
      ctx.doc.setFontSize(FONT_SIZES.body);
      setTextColor(ctx.doc, COLORS.bullet);
      ctx.doc.text(icon ?? '•', ctx.x, ctx.y + offset + FONT_SIZES.body);

      ctx.doc.setFont('helvetica', 'normal');
      ctx.doc.setFontSize(FONT_SIZES.body);
      setTextColor(ctx.doc, COLORS.textPrimary);
      lines.forEach((line: string, lineIndex: number) => {
        ctx.doc.text(line, ctx.x + bulletIndent, ctx.y + offset + FONT_SIZES.body + lineIndex * LINE_HEIGHTS.bullet);
      });
    }

    offset += blockHeight + 6;
  });

  resetBodyTypography(ctx.doc);
  return offset;
};

const drawRiskRows = (mode: RenderMode, ctx: RenderContext, risks: ExecutiveRiskScoreSummary[]): number => {
  if (!risks.length) {
    return 0;
  }

  let offset = 0;
  const badgeHeight = 20;
  const rowSpacing = 10;

  risks.forEach(risk => {
    const palette = RISK_LEVEL_COLORS[risk.riskLevel] ?? RISK_LEVEL_COLORS['N/A'];
    const textWidth = ctx.width - 100;
    const lines = ctx.doc.splitTextToSize(risk.justification, textWidth);
    const blockHeight = Math.max(badgeHeight, lines.length * LINE_HEIGHTS.body + 6);

    if (mode === 'draw') {
      const badgeWidth = Math.max(52, ctx.doc.getTextWidth(risk.riskLevel) + 18);
      setFillColor(ctx.doc, { r: palette.fill[0], g: palette.fill[1], b: palette.fill[2] });
      ctx.doc.roundedRect(ctx.x, ctx.y + offset, badgeWidth, badgeHeight, 6, 6, 'F');
      ctx.doc.setFont('helvetica', 'bold');
      ctx.doc.setFontSize(10);
      ctx.doc.setTextColor(palette.text[0], palette.text[1], palette.text[2]);
      ctx.doc.text(risk.riskLevel, ctx.x + badgeWidth / 2, ctx.y + offset + badgeHeight / 2 + 3, { align: 'center' });

      const textX = ctx.x + badgeWidth + 14;
      ctx.doc.setFont('helvetica', 'bold');
      ctx.doc.setFontSize(FONT_SIZES.body);
      setTextColor(ctx.doc, COLORS.pageHeading);
      ctx.doc.text(risk.category, textX, ctx.y + offset + 12);

      ctx.doc.setFont('helvetica', 'normal');
      ctx.doc.setFontSize(FONT_SIZES.body);
      setTextColor(ctx.doc, COLORS.textPrimary);
      lines.forEach((line: string, index: number) => {
        ctx.doc.text(line, textX, ctx.y + offset + 12 + (index + 1) * LINE_HEIGHTS.body);
      });
    }

    offset += blockHeight + rowSpacing;
  });

  resetBodyTypography(ctx.doc);
  return offset;
};

const drawChart = (mode: RenderMode, ctx: RenderContext, chart: ExecutiveReportChart): number => {
  let offset = drawCardHeading(mode, ctx, chart.title);
  offset += 10;

  const aspectRatio = chart.width > 0 ? chart.height / chart.width : 0.6;
  const maxHeight = 240;
  const imageHeight = Math.min(ctx.width * aspectRatio, maxHeight);

  if (mode === 'draw') {
    ctx.doc.setDrawColor(0, 0, 0);
    ctx.doc.addImage(chart.dataUrl, 'PNG', ctx.x, ctx.y + offset, ctx.width, imageHeight, undefined, 'FAST');
  }

  offset += imageHeight;
  resetBodyTypography(ctx.doc);
  return offset;
};

const renderCardRow = (doc: jsPDF, y: number, cards: CardDefinition[], contentWidth: number): number => {
  if (!cards.length) {
    return y;
  }

  const multiColumn = cards.length > 1 && cards.every(card => card.span !== 2);
  const baseCardWidth = multiColumn ? (contentWidth - COLUMN_GAP) / 2 : contentWidth;

  const heights = cards.map(card => {
    const width = card.span === 2 || !multiColumn ? contentWidth : baseCardWidth;
    const innerWidth = width - CARD_PADDING * 2;
    const innerHeight = card.render('measure', { doc, x: 0, y: 0, width: innerWidth });
    return innerHeight + CARD_PADDING * 2;
  });

  const rowHeight = Math.max(...heights);
  y = ensureSpace(doc, y, rowHeight);
  const rowTop = y;

  cards.forEach((card, index) => {
    const width = card.span === 2 || !multiColumn ? contentWidth : baseCardWidth;
    const cardHeight = heights[index];
    const x = multiColumn ? PAGE_MARGIN + index * (baseCardWidth + COLUMN_GAP) : PAGE_MARGIN;

    setFillColor(doc, COLORS.cardBackground);
    doc.roundedRect(x, rowTop, width, cardHeight, CARD_RADIUS, CARD_RADIUS, 'F');
    setStrokeColor(doc, COLORS.cardBorder);
    doc.roundedRect(x, rowTop, width, cardHeight, CARD_RADIUS, CARD_RADIUS, 'S');

    const innerCtx: RenderContext = {
      doc,
      x: x + CARD_PADDING,
      y: rowTop + CARD_PADDING,
      width: width - CARD_PADDING * 2,
    };

    resetBodyTypography(doc);
    card.render('draw', innerCtx);
  });

  return rowTop + rowHeight + CARD_GAP;
};

const addFooterMetadata = (doc: jsPDF, meta: { generatedDate: string; subject: string }) => {
  const pageCount = doc.getNumberOfPages();
  for (let pageIndex = 1; pageIndex <= pageCount; pageIndex += 1) {
    doc.setPage(pageIndex);
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    setTextColor(doc, COLORS.textMuted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SIZES.footer);
    const footerY = height - PAGE_MARGIN / 2;
    doc.text(`${meta.generatedDate} · ${meta.subject.toUpperCase()}`, PAGE_MARGIN, footerY);
    doc.text(`Side ${pageIndex}/${pageCount}`, width - PAGE_MARGIN, footerY, { align: 'right' });
  }
};

const chunkArray = <T,>(items: T[], chunkSize: number): T[][] => {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    result.push(items.slice(index, index + chunkSize));
  }
  return result;
};

const renderFinancialCard = (payload: ExecutiveExportPayload): CardDefinition => ({
  render: (mode, ctx) => {
    resetBodyTypography(ctx.doc);
    let offset = drawCardHeading(mode, ctx, 'Finansielt overblik');
    offset += drawSectionLabel(mode, { ...ctx, y: ctx.y + offset }, `Status ${payload.financial.latestYear ?? '—'}`);

    const grossTone = payload.financial.yoyGrossChange === null ? 'neutral' : payload.financial.yoyGrossChange >= 0 ? 'positive' : 'negative';
    const profitTone = payload.financial.yoyProfitChange === null ? 'neutral' : payload.financial.yoyProfitChange >= 0 ? 'positive' : 'negative';

    const metrics: MetricCell[] = [
      { label: 'Bruttofortjeneste', value: formatCurrency(payload.financial.grossProfit) },
      { label: 'YoY bruttofortjeneste', value: formatPercent(payload.financial.yoyGrossChange), tone: grossTone as MetricCell['tone'] },
      { label: 'Resultat efter skat', value: formatCurrency(payload.financial.profitAfterTax) },
      { label: 'YoY resultat efter skat', value: formatPercent(payload.financial.yoyProfitChange), tone: profitTone as MetricCell['tone'] },
      { label: 'Likviditet', value: formatCurrency(payload.financial.liquidity), tone: 'warning' },
      { label: 'DSO', value: formatDays(payload.financial.dso) },
      { label: 'Konsernlån', value: formatCurrency(payload.financial.intercompanyLoans), tone: 'negative' },
    ];

    offset += drawMetricGrid(mode, { ...ctx, y: ctx.y + offset }, metrics);

    if (payload.financial.alerts.length > 0) {
      offset += drawSectionLabel(mode, { ...ctx, y: ctx.y + offset }, 'Observationer');
      const alerts = payload.financial.alerts.map(alert => `${alert.label}: ${formatAlertValue(alert)} — ${alert.description}`);
      offset += drawBulletList(mode, { ...ctx, y: ctx.y + offset }, alerts);
    }

    return offset;
  },
});

const renderRiskCard = (payload: ExecutiveExportPayload): CardDefinition => ({
  render: (mode, ctx) => {
    resetBodyTypography(ctx.doc);
    let offset = drawCardHeading(mode, ctx, 'Risiko & compliance');
    offset += drawSectionLabel(mode, { ...ctx, y: ctx.y + offset }, 'Makroanalyse');
    offset += drawParagraph(mode, { ...ctx, y: ctx.y + offset }, payload.risk.sectorRiskSummary);
    offset += 6;
    offset += drawKeyFigure(mode, { ...ctx, y: ctx.y + offset }, 'Compliance note', payload.risk.complianceIssue || 'Ingen registreret');
    offset += drawKeyFigure(
      mode,
      { ...ctx, y: ctx.y + offset },
      'Skattesag eksponering',
      payload.risk.taxCaseExposure ? formatCurrency(payload.risk.taxCaseExposure) : 'Ingen registreret',
    );

    if (payload.risk.riskScores.length > 0) {
      offset += drawSectionLabel(mode, { ...ctx, y: ctx.y + offset }, 'Vægtede risici');
      offset += drawRiskRows(mode, { ...ctx, y: ctx.y + offset }, payload.risk.riskScores);
    }

    if (payload.risk.redFlags.length > 0) {
      offset += drawSectionLabel(mode, { ...ctx, y: ctx.y + offset }, 'Red flags');
      offset += drawBulletList(mode, { ...ctx, y: ctx.y + offset }, payload.risk.redFlags, ICON_BULLETS.critical);
    }

    return offset;
  },
});

const renderActionCard = (payload: ExecutiveExportPayload): CardDefinition => ({
  span: 2,
  render: (mode, ctx) => {
    resetBodyTypography(ctx.doc);
    let offset = drawCardHeading(mode, ctx, 'Action radar');

    if (payload.actions.upcomingDeadlines.length > 0) {
      offset += drawSectionLabel(mode, { ...ctx, y: ctx.y + offset }, 'Deadlines (30 dage)');
      const items = payload.actions.upcomingDeadlines.map(formatActionItem);
      offset += drawBulletList(mode, { ...ctx, y: ctx.y + offset }, items, ICON_BULLETS.deadline);
    }

    if (payload.actions.boardActionables.length > 0) {
      offset += drawSectionLabel(mode, { ...ctx, y: ctx.y + offset }, 'Board actionables');
      const items = payload.actions.boardActionables.map(formatActionItem);
      offset += drawBulletList(mode, { ...ctx, y: ctx.y + offset }, items, ICON_BULLETS.board);
    }

    if (payload.actions.criticalEvents.length > 0) {
      offset += drawSectionLabel(mode, { ...ctx, y: ctx.y + offset }, 'Kritiske hændelser');
      const items = payload.actions.criticalEvents.map(event => `${formatTimelineItem(event)}`);
      offset += drawBulletList(mode, { ...ctx, y: ctx.y + offset }, items, ICON_BULLETS.critical);
    }

    if (payload.actions.upcomingEvents.length > 0) {
      offset += drawSectionLabel(mode, { ...ctx, y: ctx.y + offset }, 'Næste milepæle (60 dage)');
      const items = payload.actions.upcomingEvents.map(formatTimelineItem);
      offset += drawBulletList(mode, { ...ctx, y: ctx.y + offset }, items, ICON_BULLETS.roadmap);
    }

    return offset;
  },
});

const renderChartCard = (chart: ExecutiveReportChart): CardDefinition => ({
  render: (mode, ctx) => drawChart(mode, ctx, chart),
});

export const generateExecutiveReportPdf = async (
  payload: ExecutiveExportPayload,
  options: ExecutiveReportOptions = {},
): Promise<void> => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  applyPageTheme(doc);

  let y = PAGE_MARGIN;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  const generatedDate = formatDate(payload.generatedAt);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONT_SIZES.pageTitle);
  setTextColor(doc, COLORS.pageHeading);
  doc.text('Executive Intelligence Brief', PAGE_MARGIN, y);
  y += 32;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZES.pageSubtitle);
  setTextColor(doc, COLORS.textSecondary);
  doc.text(`Subject · ${payload.subject.toUpperCase()}`, PAGE_MARGIN, y);
  y += 16;
  doc.text(`Genereret · ${generatedDate}`, PAGE_MARGIN, y);
  y += 26;

  const coreRows: CardDefinition[][] = [
    [renderFinancialCard(payload), renderRiskCard(payload)],
    [renderActionCard(payload)],
  ];

  coreRows.forEach(row => {
    y = renderCardRow(doc, y, row, contentWidth);
  });

  const chartCards = (options.charts ?? []).filter(chart => chart.dataUrl).map(renderChartCard);
  if (chartCards.length > 0) {
    const chartRows = chunkArray(chartCards, 2);
    chartRows.forEach(row => {
      y = renderCardRow(doc, y, row, contentWidth);
    });
  }

  addFooterMetadata(doc, { generatedDate, subject: payload.subject });

  const filename = `Executive-Summary-${payload.subject}-${payload.generatedAt.slice(0, 10)}.pdf`;
  doc.save(filename);
};
