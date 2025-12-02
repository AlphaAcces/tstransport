import type { jsPDF } from 'jspdf';
import type { ReportTheme } from './reportTheme';
import type { ExecutiveReportMetadata } from './reportMetadata';

interface FooterParams {
  doc: jsPDF;
  theme: ReportTheme;
  metadata: ExecutiveReportMetadata;
  pageNumber: number;
  totalPages: number;
}

export const drawReportFooter = ({ doc, theme, metadata, pageNumber, totalPages }: FooterParams): void => {
  const width = doc.internal.pageSize.getWidth();
  const y = doc.internal.pageSize.getHeight() - theme.layout.margin / 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(theme.typography.small);
  doc.setTextColor(theme.colors.textMuted[0], theme.colors.textMuted[1], theme.colors.textMuted[2]);

  doc.text('Intel24 Data Intel™', theme.layout.margin, y);
  doc.text(`Side ${pageNumber} / ${totalPages}`, width / 2, y, { align: 'center' });
  doc.text(
    `Eksporteret af ${metadata.exportedBy} – ${new Date(metadata.exportedAt).toLocaleString()} – ${metadata.reportVersion}`,
    width - theme.layout.margin,
    y,
    { align: 'right' },
  );
};
