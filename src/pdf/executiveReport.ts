import type { ExecutiveExportPayload } from '../types';
import { reportTheme } from './reportTheme';
import { registerReportFonts } from './reportFonts';
import { applyPageBackground, getContentStartY } from './reportElements';
import { drawReportHeader } from './reportHeader';
import { drawReportFooter } from './reportFooter';
import type { ExecutiveReportMetadata } from './reportMetadata';
import type { ExecutiveReportChart, SectionRenderer } from './reportTypes';
import { renderExecutiveSummarySection } from './sections/executiveSummarySection';
import { renderFinancialSection } from './sections/financialSection';
import { renderRiskSection } from './sections/riskSection';
import { renderActionsSection } from './sections/actionsSection';
import { renderTimelineSection } from './sections/timelineSection';
import { renderMetadataSection } from './sections/metadataSection';
import { buildReportFilename } from './reportFilename';

export interface ExecutiveReportOptions {
  charts?: ExecutiveReportChart[];
  metadata: ExecutiveReportMetadata;
}

const SECTION_PIPELINE: SectionRenderer[] = [
  renderExecutiveSummarySection,
  renderFinancialSection,
  renderRiskSection,
  renderActionsSection,
  renderTimelineSection,
  renderMetadataSection,
];

export const generateExecutiveReportPdf = async (
  payload: ExecutiveExportPayload,
  options: ExecutiveReportOptions,
): Promise<void> => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  applyPageBackground(doc, reportTheme);
  await registerReportFonts(doc);
  doc.setFont('helvetica', 'normal');

  const metadata = options.metadata;
  doc.setProperties({
    title: `${metadata.caseName} · Executive Summary`,
    subject: metadata.classification,
    author: metadata.exportedBy,
    creator: 'Intel24 Console',
    keywords: `${metadata.caseId}, Intel24`,
  });

  let cursorY = getContentStartY(reportTheme);
  SECTION_PIPELINE.forEach(renderer => {
    cursorY = renderer({
      doc,
      theme: reportTheme,
      payload,
      metadata,
      charts: options.charts,
      cursorY,
    });
  });

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    drawReportHeader({ doc, theme: reportTheme, metadata, pageNumber: page, totalPages });
    drawReportFooter({ doc, theme: reportTheme, metadata, pageNumber: page, totalPages });
  }
  const filename = buildReportFilename(metadata);
  doc.save(filename);
};
