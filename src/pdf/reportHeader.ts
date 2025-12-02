import type { jsPDF } from 'jspdf';
import type { ReportTheme } from './reportTheme';
import type { ExecutiveReportMetadata } from './reportMetadata';

interface HeaderParams {
  doc: jsPDF;
  theme: ReportTheme;
  metadata: ExecutiveReportMetadata;
  pageNumber: number;
  totalPages: number;
}

export const drawReportHeader = ({ doc, theme, metadata, pageNumber, totalPages }: HeaderParams): void => {
  const width = doc.internal.pageSize.getWidth();
  const top = theme.layout.margin / 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(theme.typography.small);
  doc.setTextColor(theme.colors.textMuted[0], theme.colors.textMuted[1], theme.colors.textMuted[2]);
  doc.text('Intel24', theme.layout.margin, top);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(theme.typography.sectionTitle);
  doc.setTextColor(theme.colors.textPrimary[0], theme.colors.textPrimary[1], theme.colors.textPrimary[2]);
  doc.text(theme.brand.suite, width / 2, top, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(theme.typography.body);
  doc.setTextColor(theme.colors.textSecondary[0], theme.colors.textSecondary[1], theme.colors.textSecondary[2]);
  doc.text(metadata.caseName, width - theme.layout.margin, top, { align: 'right' });

  doc.setFontSize(theme.typography.small);
  doc.setTextColor(theme.colors.textMuted[0], theme.colors.textMuted[1], theme.colors.textMuted[2]);
  doc.text(`Side ${pageNumber}/${totalPages}`, width - theme.layout.margin, top + theme.layout.lineHeight, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(theme.typography.small);
  doc.setTextColor(theme.colors.textMuted[0], theme.colors.textMuted[1], theme.colors.textMuted[2]);
  doc.text(metadata.classification, width / 2, top + theme.layout.lineHeight, { align: 'center' });

  doc.setDrawColor(theme.colors.divider[0], theme.colors.divider[1], theme.colors.divider[2]);
  doc.setLineWidth(0.6);
  const ruleY = theme.layout.margin + theme.layout.lineHeight * 2;
  doc.line(theme.layout.margin, ruleY, width - theme.layout.margin, ruleY);
};
