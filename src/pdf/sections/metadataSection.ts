import type { SectionRenderer } from '../reportTypes';
import { drawSectionTitle, drawKeyValueRow, ensureSectionSpace } from '../reportElements';

export const renderMetadataSection: SectionRenderer = ({ doc, theme, metadata, cursorY }) => {
  let currentY = ensureSectionSpace(doc, cursorY, theme.layout.sectionSpacing, theme);
  currentY = drawSectionTitle(doc, theme, 'Metadata / noter', currentY, 'Klassificering og version');

  const rows: Array<[string, string]> = [
    ['Case ID', metadata.caseId],
    ['Case-navn', metadata.caseName],
    ['Subject', metadata.subject.toUpperCase()],
    ['Klassificering', metadata.classification],
    ['Eksporteret af', metadata.exportedBy],
    ['Eksporteret', new Date(metadata.exportedAt).toLocaleString('da-DK')],
    ['Rapport-version', metadata.reportVersion],
  ];

  rows.forEach(([label, value]) => {
    currentY = ensureSectionSpace(doc, currentY, theme.layout.lineHeight * 2, theme);
    currentY = drawKeyValueRow(doc, theme, theme.layout.margin, currentY, label, value);
  });

  currentY += theme.layout.lineHeight;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(theme.typography.small);
  doc.text(
    'Intel24 Data Intel™ – rapporten er udarbejdet på baggrund af tilgængelige data og må ikke distribueres uden skriftligt samtykke.',
    theme.layout.margin,
    currentY,
    { maxWidth: doc.internal.pageSize.getWidth() - theme.layout.margin * 2 },
  );

  return currentY + theme.layout.sectionSpacing;
};
