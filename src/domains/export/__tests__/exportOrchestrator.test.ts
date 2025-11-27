import { describe, it, expect, vi } from 'vitest';

vi.mock('../renderers/pdfRenderer', () => ({
  default: { renderPdf: vi.fn(async () => new Uint8Array([1, 2, 3])) },
}));

vi.mock('../renderers/excelRenderer', () => ({
  default: { renderExcel: vi.fn(async () => new Uint8Array([4, 5, 6])) },
}));

vi.mock('../renderers/csvRenderer', () => ({
  default: { renderCsv: vi.fn(async () => 'id,label') },
}));

vi.mock('../renderers/jsonExporter', () => ({
  default: { renderJson: vi.fn(async payload => JSON.stringify(payload)) },
}));

import orchestrator, { sanitizePayload } from '../services/exportOrchestrator';

describe('ExportOrchestrator', () => {
  it('forwards payload to pdf renderer and returns bytes', async () => {
    const payload = {
      tenant: { id: 't1', name: 'Tenant 1' },
      aiOverlay: { enabled: true, sensitivity: 0.5, categories: ['risk'] },
      nodes: [{ id: 'n1', label: 'Node 1', ai: { score: 0.8, category: 'risk' } }],
    } as any;
    const out = await orchestrator.export(payload, 'pdf');
    expect(out).toBeInstanceOf(Uint8Array);
  });

  it('returns JSON for json format', async () => {
    const payload = { tenant: { id: 't2' }, aiOverlay: null } as any;
    const out = await orchestrator.export(payload, 'json');
    expect(typeof out).toBe('string');
    const parsed = JSON.parse(out as string);
    expect(parsed.tenant.id).toBe('t2');
  });

  it('strips ai data when permission missing', () => {
    const payload = {
      tenant: { id: 't3' },
      aiOverlay: { enabled: true },
      nodes: [{ id: 'n1', ai: { score: 0.9 } }],
      edges: [{ id: 'e1', source: 'n1', target: 'n2', ai: { category: 'risk' } }],
      metadata: { aiCommands: 4, lastAlarm: 'now' },
      permissions: [],
    } as any;
    const sanitized = sanitizePayload(payload);
    expect(sanitized.aiOverlay).toBeNull();
    expect(sanitized.nodes?.[0].ai).toBeUndefined();
    expect(sanitized.edges?.[0].ai).toBeUndefined();
    expect(sanitized.metadata).toEqual({ lastAlarm: 'now' });
    expect(sanitized.aiInsights).toBeUndefined();
  });

  it('keeps ai data when permission present', () => {
    const payload = {
      tenant: { id: 't4' },
      aiOverlay: { enabled: true },
      nodes: [{ id: 'n1', ai: { score: 0.9 } }],
      aiInsights: [{ label: 'Alert', description: 'High', score: 0.9 }],
      permissions: ['ai:use'],
    } as any;
    const sanitized = sanitizePayload(payload);
    expect(sanitized.aiOverlay).toBe(payload.aiOverlay);
    expect(sanitized.aiInsights).toBe(payload.aiInsights);
    expect(sanitized.nodes?.[0].ai).toEqual({ score: 0.9 });
  });
});
