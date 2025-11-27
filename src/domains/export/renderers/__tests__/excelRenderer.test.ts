import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import excelRenderer from '../excelRenderer';

describe('excelRenderer', () => {
  it('creates workbook with multiple sheets', async () => {
    const payload = {
      tenant: { id: 't1' },
      aiOverlay: { enabled: true },
      nodes: [{ id: 'n1', label: 'Node', ai: { score: 0.8, category: 'risk' } }],
      edges: [{ id: 'e1', source: 'n1', target: 'n2', ai: { category: 'risk' } }],
      aiInsights: [{ label: 'Alert', description: 'High risk', category: 'risk', score: 0.92 }],
      kpis: [{ label: 'Revenue', value: 1200000, trend: 'up' }],
    } as any;

    const bytes = await excelRenderer.renderExcel(payload);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.byteLength).toBeGreaterThan(0);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(bytes));
    const overview = workbook.getWorksheet('Overview');
    expect(overview).toBeDefined();
    expect(overview?.getCell('A1').value).toBe('GreyEYE Export Summary');
    expect(workbook.getWorksheet('Nodes')?.actualRowCount).toBeGreaterThan(1);
  });
});
