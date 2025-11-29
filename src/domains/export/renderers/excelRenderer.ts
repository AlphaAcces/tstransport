/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { ExportPayload } from '../types';
import ExcelJS from 'exceljs';

const HEADER_STYLE = {
  font: { bold: true, color: { argb: 'FFFFFFFF' } },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } },
  border: {
    bottom: { style: 'thin', color: { argb: 'FF374151' } },
  },
};

function styleHeader(row: ExcelJS.Row) {
  row.height = 22;
  row.font = HEADER_STYLE.font;
  row.fill = HEADER_STYLE.fill;
  row.alignment = { vertical: 'middle', horizontal: 'left' };
  row.border = HEADER_STYLE.border as ExcelJS.Borders;
}

function buildCoverSheet(sheet: ExcelJS.Worksheet, payload: ExportPayload) {
  sheet.columns = [
    { width: 24 },
    { width: 36 },
    { width: 24 },
    { width: 36 },
  ];

  sheet.mergeCells('A1:D1');
  const title = sheet.getCell('A1');
  title.value = 'GreyEYE Export Summary';
  title.font = { size: 20, bold: true, color: { argb: 'FFEEF2FF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
  title.alignment = { horizontal: 'left', vertical: 'middle' };
  sheet.getRow(1).height = 32;

  const metadata = (payload.metadata ?? {}) as Record<string, any>;
  const rows: Array<[string, string]> = [
    ['Tenant', payload.tenant.name ?? payload.tenant.id],
    ['Generated', new Date().toLocaleString('da-DK')],
    ['AI Overlay', payload.aiOverlay?.enabled ? 'Enabled' : 'Disabled'],
    ['Nodes', String(payload.nodes?.length ?? 0)],
    ['Edges', String(payload.edges?.length ?? 0)],
    ['AI Insights', String(payload.aiInsights?.length ?? 0)],
    ['KPIs', String(payload.kpis?.length ?? 0)],
    ['Active Alarms', String(metadata.activeAlarms ?? 0)],
  ];

  sheet.addRow([]);
  rows.forEach(([label, value]) => {
    const row = sheet.addRow([label, value]);
    row.getCell(1).font = { bold: true };
    row.alignment = { vertical: 'middle' };
    row.height = 20;
  });
}

function buildNodesSheet(sheet: ExcelJS.Worksheet, payload: ExportPayload) {
  sheet.columns = [
    { header: 'Node ID', key: 'id', width: 24 },
    { header: 'Label', key: 'label', width: 32 },
    { header: 'AI Score', key: 'aiScore', width: 12 },
    { header: 'AI Category', key: 'aiCategory', width: 18 },
  ];
  styleHeader(sheet.getRow(1));
  (payload.nodes ?? []).forEach(n => {
    sheet.addRow({
      id: n.id,
      label: n.label ?? '',
      aiScore: n.ai?.score,
      aiCategory: n.ai?.category,
    });
  });
  sheet.getColumn('aiScore').numFmt = '0.00';
}

function buildEdgesSheet(sheet: ExcelJS.Worksheet, payload: ExportPayload) {
  sheet.columns = [
    { header: 'Edge ID', key: 'id', width: 24 },
    { header: 'Source', key: 'source', width: 24 },
    { header: 'Target', key: 'target', width: 24 },
    { header: 'AI Category', key: 'aiCategory', width: 18 },
  ];
  styleHeader(sheet.getRow(1));
  (payload.edges ?? []).forEach(e => {
    sheet.addRow({ id: e.id, source: e.source, target: e.target, aiCategory: e.ai?.category });
  });
}

function buildAiSheet(sheet: ExcelJS.Worksheet, payload: ExportPayload) {
  sheet.columns = [
    { header: 'Insight', key: 'label', width: 32 },
    { header: 'Description', key: 'description', width: 64 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Score', key: 'score', width: 12 },
  ];
  (payload.aiInsights ?? []).forEach(ai => sheet.addRow(ai));
  if (!sheet.rowCount) sheet.addRow({ label: 'AI overlay disabled' });
  styleHeader(sheet.getRow(1));
  sheet.getColumn('score').numFmt = '0.00';
}

function buildKpiSheet(sheet: ExcelJS.Worksheet, payload: ExportPayload) {
  sheet.columns = [
    { header: 'KPI', key: 'label', width: 32 },
    { header: 'Value', key: 'value', width: 18 },
    { header: 'Trend', key: 'trend', width: 12 },
  ];
  (payload.kpis ?? []).forEach(kpi => sheet.addRow(kpi));
  styleHeader(sheet.getRow(1));
}

const excelRenderer = {
  async renderExcel(payload: ExportPayload): Promise<Uint8Array> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TSL Intelligence Console';
    workbook.created = new Date();

    buildCoverSheet(workbook.addWorksheet('Overview'), payload);
    buildNodesSheet(workbook.addWorksheet('Nodes'), payload);
    buildEdgesSheet(workbook.addWorksheet('Edges'), payload);
    buildAiSheet(workbook.addWorksheet('AI_Insights'), payload);
    buildKpiSheet(workbook.addWorksheet('KPIs'), payload);

    const buffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(buffer);
  },
};

export default excelRenderer;
