/**
 * PDF Renderer
 *
 * Renders export payloads to PDF format using jsPDF.
 * Extracts and modularizes logic from the original executiveReport.ts.
 */

import type {
  ExportRenderer,
  ExportPayload,
  ExportResult,
  PdfRenderOptions,
  ChartImage,
} from '../../types';

// Lazy load jsPDF to reduce bundle size
let jsPDFModule: typeof import('jspdf') | null = null;

async function getJsPDF() {
  if (!jsPDFModule) {
    jsPDFModule = await import('jspdf');
  }
  return jsPDFModule.jsPDF;
}

/**
 * PDF color palette matching the app theme
 */
const colors = {
  primary: '#0F172A',
  accent: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    muted: '#64748B',
  },
  border: '#334155',
} as const;

/**
 * Default PDF options
 */
const defaultOptions: Required<PdfRenderOptions> = {
  pageSize: 'A4',
  orientation: 'portrait',
  margins: { top: 20, right: 15, bottom: 20, left: 15 },
  headerLogo: '',
  footerText: '',
  watermark: '',
};

/**
 * PDF Renderer implementation
 */
export const pdfRenderer: ExportRenderer<PdfRenderOptions> = {
  format: 'pdf',

  async render(
    payload: ExportPayload,
    options: PdfRenderOptions = {}
  ): Promise<ExportResult> {
    try {
      const jsPDF = await getJsPDF();
      const opts = { ...defaultOptions, ...options };

      const doc = new jsPDF({
        orientation: opts.orientation,
        unit: 'mm',
        format: opts.pageSize,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - opts.margins.left - opts.margins.right;

      let y = opts.margins.top;

      // Header
      y = renderHeader(doc, payload, y, contentWidth, opts.margins.left);

      // Financial Section
      y = renderFinancialSection(doc, payload.financial, y, contentWidth, opts.margins.left);

      // Check if we need a new page
      if (y > pageHeight - 80) {
        doc.addPage();
        y = opts.margins.top;
      }

      // Risk Section
      y = renderRiskSection(doc, payload.risk, y, contentWidth, opts.margins.left);

      // Charts (if provided)
      if (payload.charts && payload.charts.length > 0) {
        if (y > pageHeight - 100) {
          doc.addPage();
          y = opts.margins.top;
        }
        y = renderCharts(doc, payload.charts, y, contentWidth, opts.margins.left, pageHeight, opts.margins);
      }

      // Footer on all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        renderFooter(doc, payload, i, totalPages, pageHeight, opts.margins);
      }

      // Generate blob
      const blob = doc.output('blob');

      return {
        success: true,
        blob,
        filename: `Executive-Report-${payload.subject.name}-${payload.generatedAt.split('T')[0]}.pdf`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PDF generation failed';
      return {
        success: false,
        error: message,
      };
    }
  },
};

/**
 * Render document header
 */
function renderHeader(
  doc: InstanceType<Awaited<ReturnType<typeof getJsPDF>>>,
  payload: ExportPayload,
  startY: number,
  contentWidth: number,
  marginLeft: number
): number {
  let y = startY;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(colors.text.primary);
  doc.text('Executive Intelligence Brief', marginLeft, y);
  y += 8;

  // Subject line
  doc.setFontSize(10);
  doc.setTextColor(colors.text.secondary);
  doc.text(`Subject: ${payload.subject.name}`, marginLeft, y);
  y += 5;

  // Date
  const formattedDate = new Date(payload.generatedAt).toLocaleDateString(payload.locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Generated: ${formattedDate}`, marginLeft, y);
  y += 10;

  // Divider line
  doc.setDrawColor(colors.border);
  doc.line(marginLeft, y, marginLeft + contentWidth, y);
  y += 8;

  return y;
}

/**
 * Render financial section
 */
function renderFinancialSection(
  doc: InstanceType<Awaited<ReturnType<typeof getJsPDF>>>,
  financial: ExportPayload['financial'],
  startY: number,
  contentWidth: number,
  marginLeft: number
): number {
  let y = startY;

  // Section title
  doc.setFontSize(14);
  doc.setTextColor(colors.accent);
  doc.text('Financial Overview', marginLeft, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(colors.text.primary);

  // Key metrics
  const metrics = [
    { label: 'Gross Profit', value: formatCurrency(financial.grossProfit) },
    { label: 'Profit After Tax', value: formatCurrency(financial.profitAfterTax) },
    { label: 'Equity', value: formatCurrency(financial.equity) },
    { label: 'Solvency', value: financial.solidity ? `${financial.solidity.toFixed(1)}%` : 'N/A' },
    { label: 'DSO', value: financial.dso ? `${financial.dso} days` : 'N/A' },
  ];

  const colWidth = contentWidth / 2;
  metrics.forEach((metric, index) => {
    const col = index % 2;
    const x = marginLeft + col * colWidth;

    if (col === 0 && index > 0) {
      y += 6;
    }

    doc.setTextColor(colors.text.muted);
    doc.text(metric.label, x, y);
    doc.setTextColor(colors.text.primary);
    doc.text(metric.value, x + 40, y);
  });

  y += 10;

  // Alerts
  if (financial.alerts.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(colors.danger);
    doc.text('Critical Observations:', marginLeft, y);
    y += 6;

    doc.setFontSize(9);
    doc.setTextColor(colors.text.secondary);
    financial.alerts.forEach(alert => {
      doc.text(`• ${alert.label}: ${formatAlertValue(alert.value, alert.unit)}`, marginLeft + 4, y);
      y += 4;
    });
    y += 4;
  }

  return y;
}

/**
 * Render risk section
 */
function renderRiskSection(
  doc: InstanceType<Awaited<ReturnType<typeof getJsPDF>>>,
  risk: ExportPayload['risk'],
  startY: number,
  _contentWidth: number,
  marginLeft: number
): number {
  let y = startY;

  // Section title
  doc.setFontSize(14);
  doc.setTextColor(colors.danger);
  doc.text('Risk & Compliance', marginLeft, y);
  y += 8;

  // Total risk score
  doc.setFontSize(12);
  doc.setTextColor(colors.text.primary);
  doc.text(`Total Risk: ${risk.totalScore}/${risk.maxScore} (${risk.level})`, marginLeft, y);
  y += 8;

  // Tax case
  if (risk.taxCaseExposure) {
    doc.setFontSize(10);
    doc.setTextColor(colors.warning);
    doc.text(`Tax Case Exposure: ${formatCurrency(risk.taxCaseExposure)}`, marginLeft, y);
    y += 6;
  }

  // Risk scores by category
  if (risk.riskScores.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(colors.text.muted);
    doc.text('Risk Categories:', marginLeft, y);
    y += 6;

    doc.setFontSize(9);
    risk.riskScores.forEach(score => {
      const levelColor = getRiskLevelColor(score.riskLevel);
      doc.setTextColor(levelColor);
      doc.text(`• ${score.category}: ${score.riskLevel} (${score.score}/${score.maxScore})`, marginLeft + 4, y);
      y += 5;
    });
    y += 4;
  }

  return y;
}

/**
 * Render chart images
 */
function renderCharts(
  doc: InstanceType<Awaited<ReturnType<typeof getJsPDF>>>,
  charts: ChartImage[],
  startY: number,
  contentWidth: number,
  marginLeft: number,
  pageHeight: number,
  margins: PdfRenderOptions['margins']
): number {
  let y = startY;

  doc.setFontSize(12);
  doc.setTextColor(colors.text.primary);
  doc.text('Trend Charts', marginLeft, y);
  y += 8;

  charts.forEach(chart => {
    // Check if we need a new page
    if (y + 60 > pageHeight - (margins?.bottom ?? 20)) {
      doc.addPage();
      y = margins?.top ?? 20;
    }

    // Chart title
    doc.setFontSize(9);
    doc.setTextColor(colors.text.muted);
    doc.text(chart.title, marginLeft, y);
    y += 4;

    // Calculate aspect ratio and dimensions
    const aspectRatio = chart.width / chart.height;
    const maxWidth = Math.min(contentWidth, 120);
    const imgWidth = maxWidth;
    const imgHeight = imgWidth / aspectRatio;

    // Add image
    doc.addImage(chart.dataUrl, 'PNG', marginLeft, y, imgWidth, Math.min(imgHeight, 50));
    y += Math.min(imgHeight, 50) + 8;
  });

  return y;
}

/**
 * Render page footer
 */
function renderFooter(
  doc: InstanceType<Awaited<ReturnType<typeof getJsPDF>>>,
  payload: ExportPayload,
  currentPage: number,
  totalPages: number,
  pageHeight: number,
  margins: PdfRenderOptions['margins']
): void {
  const footerY = pageHeight - (margins?.bottom ?? 20) + 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = margins?.left ?? 15;

  doc.setFontSize(8);
  doc.setTextColor(colors.text.muted);

  // Left: date and subject
  const dateStr = new Date(payload.generatedAt).toLocaleDateString(payload.locale);
  doc.text(`${dateStr} · ${payload.subject.name}`, marginLeft, footerY);

  // Right: page number
  const pageText = `Page ${currentPage}/${totalPages}`;
  const pageTextWidth = doc.getTextWidth(pageText);
  doc.text(pageText, pageWidth - (margins?.right ?? 15) - pageTextWidth, footerY);
}

// Helper functions

function formatCurrency(value: number | null): string {
  if (value === null) return 'N/A';
  const millions = value / 1_000_000;
  return `DKK ${millions.toFixed(1)}m`;
}

function formatAlertValue(value: number, unit: 'DKK' | 'days'): string {
  if (unit === 'DKK') {
    return `DKK ${value.toLocaleString()}`;
  }
  return `${value} days`;
}

function getRiskLevelColor(level: string): string {
  switch (level) {
    case 'KRITISK':
      return colors.danger;
    case 'HØJ':
      return colors.warning;
    case 'MODERAT':
      return colors.accent;
    case 'LAV':
      return colors.success;
    default:
      return colors.text.muted;
  }
}

export default pdfRenderer;
