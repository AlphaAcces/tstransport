import { ExportPayload, ExportFormat } from '../types';
import pdfRenderer from '../renderers/pdfRenderer';
import excelRenderer from '../renderers/excelRenderer';
import csvRenderer from '../renderers/csvRenderer';
import jsonExporter from '../renderers/jsonExporter';

export class ExportOrchestrator {
  async export(payload: ExportPayload, format: ExportFormat): Promise<Uint8Array | string> {
    const sanitized = sanitizePayload(payload);
    switch (format) {
      case 'pdf':
        return pdfRenderer.renderPdf(sanitized);
      case 'excel':
        return excelRenderer.renderExcel(sanitized);
      case 'csv':
        return csvRenderer.renderCsv(sanitized);
      case 'json':
        return jsonExporter.renderJson(sanitized);
      default:
        throw new Error('unsupported export format');
    }
  }
}

export default new ExportOrchestrator();

export function sanitizePayload(payload: ExportPayload): ExportPayload {
  const canUseAi = payload.permissions?.includes('ai:use');
  if (canUseAi) {
    return payload;
  }

  const stripAiFromNode = (node: any) => ({ ...node, ai: undefined });
  const stripAiFromEdge = (edge: any) => ({ ...edge, ai: undefined });
  const scrubMetadata = (metadata?: Record<string, unknown>) => {
    if (!metadata) return metadata;
    const clone: Record<string, unknown> = { ...metadata };
    Object.keys(clone).forEach(key => {
      if (key.toLowerCase().includes('ai')) {
        delete clone[key];
      }
    });
    return clone;
  };

  return {
    ...payload,
    aiOverlay: null,
    nodes: payload.nodes?.map(stripAiFromNode),
    edges: payload.edges?.map(stripAiFromEdge),
    aiInsights: undefined,
    metadata: scrubMetadata(payload.metadata as Record<string, unknown> | undefined),
  };
}

/**
 * Export Orchestrator Service
 *
 * Coordinates the export process across different formats
 * and renderers. Provides a unified API for triggering exports.
 */

import type {
  ExportFormat,
  ExportOptions,
  ExportPayload,
  ExportResult,
  ExportRenderer,
  ChartImage,
} from '../types';

/**
 * Registry of available renderers
 */
const renderers = new Map<ExportFormat, ExportRenderer>();

/**
 * Register a renderer for a specific format
 */
export function registerRenderer(renderer: ExportRenderer): void {
  renderers.set(renderer.format, renderer);
}

/**
 * Get a registered renderer
 */
export function getRenderer(format: ExportFormat): ExportRenderer | undefined {
  return renderers.get(format);
}

/**
 * Check if a format is supported
 */
export function isFormatSupported(format: ExportFormat): boolean {
  return renderers.has(format);
}

/**
 * Get all supported formats
 */
export function getSupportedFormats(): ExportFormat[] {
  return Array.from(renderers.keys());
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(
  baseName: string,
  format: ExportFormat,
  subject?: string
): string {
  const date = new Date().toISOString().split('T')[0];
  const subjectPart = subject ? `-${subject.replace(/\s+/g, '-')}` : '';
  const extension = format === 'excel' ? 'xlsx' : format;
  return `${baseName}${subjectPart}-${date}.${extension}`;
}

/**
 * Prepare export payload from raw data
 */
export function preparePayload(
  subject: { id: string; name: string; type: 'corporate' | 'personal' },
  data: {
    financial: ExportPayload['financial'];
    risk: ExportPayload['risk'];
    actions: ExportPayload['actions'];
  },
  options: { locale?: string; currency?: string; charts?: ChartImage[] } = {}
): ExportPayload {
  return {
    subject,
    generatedAt: new Date().toISOString(),
    locale: options.locale ?? 'da-DK',
    currency: options.currency ?? 'DKK',
    financial: data.financial,
    risk: data.risk,
    actions: data.actions,
    charts: options.charts,
  };
}

/**
 * Execute an export operation
 */
export async function executeExport(
  payload: ExportPayload,
  options: ExportOptions
): Promise<ExportResult> {
  const renderer = getRenderer(options.format);

  if (!renderer) {
    return {
      success: false,
      error: `Export format '${options.format}' is not supported. Available formats: ${getSupportedFormats().join(', ')}`,
    };
  }

  try {
    const result = await renderer.render(payload, options);

    if (result.success && result.blob && !result.filename) {
      result.filename = generateFilename(
        'Executive-Report',
        options.format,
        payload.subject.name
      );
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown export error';
    console.error('Export failed:', error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Trigger file download in browser
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Combined export and download
 */
export async function exportAndDownload(
  payload: ExportPayload,
  options: ExportOptions
): Promise<ExportResult> {
  const result = await executeExport(payload, options);

  if (result.success && result.blob && result.filename) {
    downloadBlob(result.blob, result.filename);
  }

  return result;
}
