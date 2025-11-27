/**
 * Export Domain Types
 *
 * Type definitions for the export module that handles
 * PDF, Excel, and other export formats.
 */

export type TenantInfo = {
  id: string;
  name?: string;
  aiKeyPresent?: boolean;
};

export type AiOverlay = {
  enabled: boolean;
  sensitivity?: number;
  categories?: string[];
};

/**
 * Supported export formats
 */
export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

/**
 * Export status
 */
export type ExportStatus = 'idle' | 'preparing' | 'rendering' | 'complete' | 'error';

/**
 * Chart image data for PDF rendering
 */
export interface ChartImage {
  title: string;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Export configuration options
 */
export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeCharts?: boolean;
  includeTimeline?: boolean;
  locale?: string;
  currency?: string;
}

/**
 * Section that can be included in exports
 */
export type ExportSection =
  | 'financial'
  | 'risk'
  | 'actions'
  | 'timeline'
  | 'scenarios'
  | 'hypotheses'
  | 'companies'
  | 'counterparties';

/**
 * Export payload for financial data
 */
export interface FinancialExportData {
  grossProfit: number | null;
  profitAfterTax: number | null;
  equity: number | null;
  solidity: number | null;
  dso: number | null;
  cash: number | null;
  yoyGrossChange: number | null;
  yoyProfitChange: number | null;
  trendGrossProfit: Array<{ year: number; value: number }>;
  trendProfitAfterTax: Array<{ year: number; value: number }>;
  alerts: Array<{
    id: string;
    label: string;
    value: number;
    unit: 'DKK' | 'days';
    description: string;
  }>;
}

/**
 * Export payload for risk data
 */
export interface RiskExportData {
  totalScore: number;
  maxScore: number;
  level: string;
  taxCaseExposure: number | null;
  complianceIssue: string;
  redFlags: Array<{
    id: string;
    value: number | null;
    unit: 'DKK' | 'days';
  }>;
  riskScores: Array<{
    category: string;
    riskLevel: string;
    score: number;
    maxScore: number;
    justification: string;
  }>;
}

/**
 * Export payload for actions
 */
export interface ActionsExportData {
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    priority: string;
    ownerRole: string | null;
    timeHorizon: string | null;
  }>;
  criticalEvents: Array<{
    title: string;
    date: string;
    description: string;
  }>;
  boardActionables: Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
    timeHorizon: string | null;
  }>;
  upcomingEvents: Array<{
    title: string;
    date: string;
  }>;
}

/**
 * Complete export payload - unified type supporting both AI/tenant exports and executive reports
 */
export interface ExportPayload {
  // Common fields
  subject?: {
    id: string;
    name: string;
    type: 'corporate' | 'personal';
  };
  generatedAt?: string;
  locale?: string;
  currency?: string;
  
  // AI/Tenant export fields
  tenant?: TenantInfo;
  aiOverlay?: AiOverlay | null;
  nodes?: Array<{ id: string; label?: string; ai?: { score?: number; category?: string } | null }>;
  edges?: Array<{ id: string; source: string; target: string; ai?: { score?: number; category?: string } | null }>;
  metadata?: Record<string, unknown>;
  kpis?: Array<{ label: string; value: string | number; trend?: 'up' | 'down' | 'flat' }>;
  risks?: Array<{ title: string; severity: 'low' | 'medium' | 'high'; summary?: string }>;
  finance?: { revenue?: number; ebitda?: number; burnRate?: number; currency?: string };
  aiInsights?: Array<{ label: string; description: string; category?: string; score?: number }>;
  permissions?: string[];
  
  // Executive report fields
  financial?: FinancialExportData;
  risk?: RiskExportData;
  actions?: ActionsExportData;
  charts?: ChartImage[];
}

/**
 * Export result
 */
export interface ExportResult {
  success: boolean;
  filename?: string;
  blob?: Blob;
  error?: string;
}

/**
 * Renderer interface for different export formats
 */
export interface ExportRenderer<TOptions = unknown> {
  format: ExportFormat;
  render(payload: ExportPayload, options?: TOptions): Promise<ExportResult>;
}

/**
 * PDF-specific render options
 */
export interface PdfRenderOptions {
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  headerLogo?: string;
  footerText?: string;
  watermark?: string;
}

/**
 * Excel-specific render options
 */
export interface ExcelRenderOptions {
  sheetName?: string;
  includeFormulas?: boolean;
  styleHeaders?: boolean;
}

/**
 * CSV-specific render options
 */
export interface CsvRenderOptions {
  delimiter?: ',' | ';' | '\t';
  includeHeaders?: boolean;
  encoding?: 'utf-8' | 'latin1';
}
