/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import exportOrchestrator from '../../domains/export/services/exportOrchestrator';
import type { ExportFormat, ExportPayload } from '../../domains/export/types';
import { useOptionalTenant, usePermission } from '../../domains/tenant';

interface ExportModalProps {
  isOpen: boolean;
  payload: ExportPayload;
  onClose: () => void;
}

const FORMAT_OPTIONS: Array<{ value: ExportFormat; label: string }> = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
];

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, payload, onClose }) => {
  const tenantCtx = useOptionalTenant();
  const canUseAi = usePermission('ai:use');
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [includeAi, setIncludeAi] = useState<boolean>(() => Boolean(payload.aiOverlay?.enabled && canUseAi));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>('');

  const approxRows = useMemo(() => (payload.nodes?.length ?? 0) + (payload.edges?.length ?? 0) + (payload.aiInsights?.length ?? 0), [payload.edges?.length, payload.nodes?.length, payload.aiInsights?.length]);
  const isHeavyExport = approxRows > 1500;

  const formatDescription = useMemo(() => {
    switch (format) {
      case 'pdf':
        return 'PDF samler et visuelt GreyEYE-dashboard med KPI-kort, risikobadges og AI-noter.';
      case 'excel':
        return 'Excel-arbejdsbogen indeholder faner for noder, kanter, AI-insights, KPI’er og et resume-cover.';
      case 'csv':
        return 'CSV-eksporten er letvægt til hurtige importjobs og data-blending.';
      case 'json':
        return 'JSON giver rådata til scripts og efterbehandling.';
      default:
        return '';
    }
  }, [format]);

  useEffect(() => {
    setIncludeAi(Boolean(payload.aiOverlay?.enabled && canUseAi));
  }, [payload.aiOverlay?.enabled, canUseAi]);

  const permissions = useMemo(() => tenantCtx?.user?.permissions ?? [], [tenantCtx?.user?.permissions]);

  if (!isOpen) return null;

  const enrichedPayload: ExportPayload = {
    ...payload,
    aiOverlay: includeAi && canUseAi ? payload.aiOverlay : null,
    permissions,
  };

  const downloadBlob = (data: Uint8Array, mime: string, extension: string) => {
    const normalized = data instanceof Uint8Array ? new Uint8Array(data) : new Uint8Array();
    const blob = new Blob([normalized], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tsl-export-${payload.tenant.id}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setPreview(isHeavyExport ? 'Dataset er stort — genererer eksport …' : '');
    try {
      const result = await exportOrchestrator.export(enrichedPayload, format);
      if (typeof result === 'string') {
        setPreview(result.slice(0, 2000));
        downloadBlob(new TextEncoder().encode(result), format === 'csv' ? 'text/csv' : 'application/json', format);
      } else {
        const extension = format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'bin';
        const mime = format === 'pdf' ? 'application/pdf'
          : format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/octet-stream';
        downloadBlob(result, mime, extension);
        setPreview(`Exported ${format.toUpperCase()} (${result.byteLength} bytes)`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-3xl rounded-xl bg-base-dark p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Export Intelligence Report</h2>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-white" aria-label="Close export modal">Close</button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-gray-400" htmlFor="export-format-select">Format</label>
            <select
              id="export-format-select"
              value={format}
              onChange={event => setFormat(event.target.value as ExportFormat)}
              className="mt-1 w-full rounded-md border border-gray-700 bg-black/30 px-3 py-2 text-sm text-gray-100"
            >
              {FORMAT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="mt-2 flex flex-wrap gap-2" aria-hidden>
              {FORMAT_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setFormat(option.value)}
                  className={`rounded-md border px-3 py-1 text-sm ${format === option.value ? 'border-primary text-white' : 'border-gray-600 text-gray-300'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400" data-testid="format-description">{formatDescription}</p>

            {canUseAi ? (
              <label className="mt-4 flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={includeAi}
                  onChange={e => setIncludeAi(e.target.checked)}
                  aria-label="Include AI overlays"
                />
                Include AI overlays & insights
              </label>
            ) : (
              <div className="mt-4 text-xs text-gray-500">AI overlays disabled for your role.</div>
            )}

            <div className="mt-4 text-xs text-gray-400">
              Tenant: <strong>{payload.tenant.name ?? payload.tenant.id}</strong>
            </div>

            {isHeavyExport && (
              <div className="mt-2 rounded-md border border-amber-400/40 bg-amber-500/10 p-2 text-xs text-amber-200">
                Stort datasæt ({approxRows.toLocaleString()} rækker). Eksport kan tage ekstra tid, og vi låser UI’et mens filen genereres.
              </div>) }
          </div>

          <div>
            <div className="text-sm text-gray-400">Preview</div>
            <div className="mt-2 h-48 overflow-auto rounded-lg border border-gray-700 bg-black/20 p-3 text-xs text-gray-200" aria-live="polite" aria-busy={loading}>
              {loading ? 'Rendering preview…' : preview || 'Run an export to see preview'}
            </div>
          </div>
        </div>

        {error && <div className="mt-3 rounded bg-red-500/20 p-2 text-sm text-red-200">{error}</div>}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-gray-600 px-4 py-2 text-sm text-gray-300">Cancel</button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {loading ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ExportModal;
