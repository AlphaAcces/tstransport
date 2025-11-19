import { jsPDF } from 'jspdf';
import { ExecutiveExportPayload, ExecutiveFinancialAlert, ExecutiveTimelineHighlight } from '../types';

interface ExecutiveReportChart {
  title: string;
  dataUrl: string;
  width: number;
  height: number;
}

interface ExecutiveReportOptions {
  charts?: ExecutiveReportChart[];
}

const PAGE_MARGIN = 56;
const LINE_HEIGHT = 18;

const formatCurrency = (value: number | null): string => {
  if (value === null) {
    return '—';
  }
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: Math.abs(value) >= 500 ? 0 : 0,
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

const ensureSpace = (doc: jsPDF, y: number, spaceNeeded: number): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + spaceNeeded > pageHeight - PAGE_MARGIN) {
    doc.addPage();
    return PAGE_MARGIN;
  }
  return y;
};

const addHeading = (doc: jsPDF, text: string, y: number): number => {
  y = ensureSpace(doc, y, LINE_HEIGHT * 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(text, PAGE_MARGIN, y);
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(1);
  doc.line(PAGE_MARGIN, y + 4, PAGE_MARGIN + 42, y + 4);
  return y + LINE_HEIGHT;
};

const addBodyLine = (doc: jsPDF, text: string, y: number, indent = 0): number => {
  y = ensureSpace(doc, y, LINE_HEIGHT);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(text, PAGE_MARGIN + indent, y);
  return y + LINE_HEIGHT;
};

const addBulletList = (doc: jsPDF, items: string[], y: number): number => {
  return items.reduce((position, item) => addBodyLine(doc, `- ${item}`, position), y);
};

const formatTimelineItem = (event: ExecutiveTimelineHighlight): string => {
  return `${formatDate(event.date)} · ${event.title}`;
};

const addMetricLine = (doc: jsPDF, label: string, value: string, y: number): number => {
  const labelColumnWidth = 170;
  const contentY = ensureSpace(doc, y, LINE_HEIGHT);
  doc.setFont('helvetica', 'bold');
  doc.text(`${label}:`, PAGE_MARGIN, contentY);
  doc.setFont('helvetica', 'normal');
  doc.text(value, PAGE_MARGIN + labelColumnWidth, contentY);
  return contentY + LINE_HEIGHT;
};

const addSectionSubtitle = (doc: jsPDF, text: string, y: number): number => {
  y = ensureSpace(doc, y, LINE_HEIGHT);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.text(text, PAGE_MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  return y + LINE_HEIGHT * 0.75;
};

const addMetricPairs = (
  doc: jsPDF,
  metrics: Array<{ label: string; value: string }>,
  y: number,
  contentWidth: number,
): number => {
  if (metrics.length === 0) {
    return y;
  }

  const columnSpacing = 16;
  const columnWidth = (contentWidth - columnSpacing) / 2;
  const rowHeight = LINE_HEIGHT * 2.1;

  for (let index = 0; index < metrics.length; index += 2) {
    y = ensureSpace(doc, y, rowHeight);
    const rowMetrics = metrics.slice(index, index + 2);

    rowMetrics.forEach((metric, columnIndex) => {
      const x = PAGE_MARGIN + columnIndex * (columnWidth + columnSpacing);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(metric.label, x, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(metric.value, x, y + LINE_HEIGHT * 0.8);
    });

    y += rowHeight - LINE_HEIGHT * 0.3;
  }

  return y;
};

const addCharts = (
  doc: jsPDF,
  charts: ExecutiveReportChart[] | undefined,
  y: number,
  contentWidth: number,
): number => {
  if (!charts || charts.length === 0) {
    return y;
  }

  const validCharts = charts.filter(chart => Boolean(chart?.dataUrl));
  if (validCharts.length === 0) {
    return y;
  }

  y = addHeading(doc, 'Visualiserede KPI-trends', y);
  validCharts.forEach(chart => {
    const aspectRatio = chart.width > 0 ? chart.height / chart.width : 0.5;
    const targetHeight = Math.min(contentWidth * aspectRatio, 280);
    y = ensureSpace(doc, y, targetHeight + LINE_HEIGHT);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(chart.title, PAGE_MARGIN, y);
    y += LINE_HEIGHT / 1.5;
    doc.addImage(chart.dataUrl, 'PNG', PAGE_MARGIN, y, contentWidth, targetHeight);
    y += targetHeight + LINE_HEIGHT / 2;
  });

  return y;
};

export const generateExecutiveReportPdf = async (
  payload: ExecutiveExportPayload,
  options: ExecutiveReportOptions = {},
): Promise<void> => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = PAGE_MARGIN;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Executive Summary Report', PAGE_MARGIN, y);
  y += LINE_HEIGHT;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const generatedDate = formatDate(payload.generatedAt);
  y = addBodyLine(doc, `Subject: ${payload.subject.toUpperCase()}`, y);
  y = addBodyLine(doc, `Genereret: ${generatedDate}`, y);
  y += LINE_HEIGHT / 2;

  // Financial section
  y = addHeading(doc, 'Finansielt Overblik', y);
  y = addMetricLine(doc, 'Seneste regnskabsår', `${payload.financial.latestYear ?? '—'}`, y);
  y = addSectionSubtitle(doc, 'Resultatindikatorer', y);
  y = addMetricPairs(
    doc,
    [
      { label: 'Bruttofortjeneste', value: formatCurrency(payload.financial.grossProfit) },
      { label: 'YoY bruttofortjeneste', value: formatPercent(payload.financial.yoyGrossChange) },
      { label: 'Resultat efter skat', value: formatCurrency(payload.financial.profitAfterTax) },
      { label: 'YoY resultat efter skat', value: formatPercent(payload.financial.yoyProfitChange) },
    ],
    y,
    contentWidth,
  );
  y = addSectionSubtitle(doc, 'Likviditet & arbejdskapital', y);
  y = addMetricPairs(
    doc,
    [
      { label: 'DSO', value: formatDays(payload.financial.dso) },
      { label: 'Likviditet', value: formatCurrency(payload.financial.liquidity) },
      { label: 'Konsernlån', value: formatCurrency(payload.financial.intercompanyLoans) },
    ],
    y,
    contentWidth,
  );

  if (payload.financial.alerts.length > 0) {
    y = addBodyLine(doc, 'Observationer:', y);
    const alertItems = payload.financial.alerts.map(alert => `${alert.label}: ${formatAlertValue(alert)} – ${alert.description}`);
    y = addBulletList(doc, alertItems, y);
  }

  y += LINE_HEIGHT / 2;

  // Risk section
  y = addHeading(doc, 'Risiko & Compliance', y);
  y = addSectionSubtitle(doc, 'Overblik', y);
  y = addBodyLine(doc, `Compliance note: ${payload.risk.complianceIssue}`, y);
  y = addBodyLine(
    doc,
    `Skattesag eksponering: ${payload.risk.taxCaseExposure ? formatCurrency(payload.risk.taxCaseExposure) : 'Ingen registreret'}`,
    y,
  );
  if (payload.risk.riskScores.length > 0) {
    y = addSectionSubtitle(doc, 'Risikoscore resume', y);
    y = addBodyLine(doc, 'Risikoscore resume:', y);
    const riskItems = payload.risk.riskScores.map(score => `${score.category}: ${score.riskLevel} – ${score.justification}`);
    y = addBulletList(doc, riskItems, y);
  }
  if (payload.risk.redFlags.length > 0) {
    y = addBodyLine(doc, 'Red flags:', y);
    y = addBulletList(doc, payload.risk.redFlags, y);
  }

  y += LINE_HEIGHT / 2;

  // Actions section
  y = addHeading(doc, 'Handlinger & Tidslinje', y);
  if (payload.actions.upcomingDeadlines.length > 0) {
    y = addBodyLine(doc, 'Kommende deadlines (30 dage):', y);
    const deadlineItems = payload.actions.upcomingDeadlines.map(action => {
      const priority = action.priority ? ` (${action.priority})` : '';
      const owner = action.ownerRole ? ` · Ansvar: ${action.ownerRole}` : '';
      const horizon = action.timeHorizon ? ` · Horisont: ${action.timeHorizon}` : '';
      return `${action.title}${priority}${owner}${horizon}`;
    });
    y = addBulletList(doc, deadlineItems, y);
  } else {
    y = addBodyLine(doc, 'Ingen deadlines registreret de næste 30 dage.', y);
  }

  if (payload.actions.boardActionables.length > 0) {
    y = addBodyLine(doc, 'Board actionables:', y);
    const boardItems = payload.actions.boardActionables.map(action => {
      const priority = action.priority ? ` (${action.priority})` : '';
      const description = action.description ? ` – ${action.description}` : '';
      const horizon = action.timeHorizon ? ` · Horisont: ${action.timeHorizon}` : '';
      return `${action.title}${priority}${description}${horizon}`;
    });
    y = addBulletList(doc, boardItems, y);
  }

  if (payload.actions.criticalEvents.length > 0) {
    y = addBodyLine(doc, 'Kritiske hændelser:', y);
    const criticalItems = payload.actions.criticalEvents.map(event => `${formatTimelineItem(event)} – ${event.description}`);
    y = addBulletList(doc, criticalItems, y);
  }

  if (payload.actions.upcomingEvents.length > 0) {
    y = addBodyLine(doc, 'Næste nøglehændelser:', y);
    const eventItems = payload.actions.upcomingEvents.map(event => formatTimelineItem(event));
    y = addBulletList(doc, eventItems, y);
  }

  y += LINE_HEIGHT / 2;
  y = addCharts(doc, options.charts, y, contentWidth);

  y = ensureSpace(doc, y, LINE_HEIGHT * 2);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(PAGE_MARGIN, y, PAGE_MARGIN + contentWidth, y);
  y += LINE_HEIGHT;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.text('PDF genereret automatisk – gennemgå data før ekstern deling.', PAGE_MARGIN, y);

  const filename = `Executive-Summary-${payload.subject}-${payload.generatedAt.slice(0, 10)}.pdf`;
  doc.save(filename);
};
