/**
 * Export Domain
 *
 * Provides a unified API for exporting data to various formats
 * including PDF, Excel, CSV, and JSON.
 *
 * @example
 * ```ts
 * import { exportAndDownload, preparePayload, pdfRenderer, registerRenderer } from '@/domains/export';
 *
 * // Register the PDF renderer
 * registerRenderer(pdfRenderer);
 *
 * // Prepare the export payload
 * const payload = preparePayload(subject, { financial, risk, actions });
 *
 * // Export and download
 * await exportAndDownload(payload, { format: 'pdf' });
 * ```
 */

// Types
export type {
  ExportFormat,
  ExportStatus,
  ExportOptions,
  ExportSection,
  ExportPayload,
  ExportResult,
  ExportRenderer,
  ChartImage,
  FinancialExportData,
  RiskExportData,
  ActionsExportData,
  PdfRenderOptions,
  ExcelRenderOptions,
  CsvRenderOptions,
} from './types';

// Orchestrator
export {
  registerRenderer,
  getRenderer,
  isFormatSupported,
  getSupportedFormats,
  generateFilename,
  preparePayload,
  executeExport,
  downloadBlob,
  exportAndDownload,
} from './services/exportOrchestrator';

// Renderers
export { pdfRenderer } from './renderers/pdf/pdfRenderer';
