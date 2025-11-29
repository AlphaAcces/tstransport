/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { ExportPayload } from '../types';

const csvRenderer = {
  async renderCsv(payload: ExportPayload): Promise<string> {
    const rows = ['id,label,ai_score,ai_category'];
    (payload.nodes || []).forEach(n => {
      rows.push(`${n.id},"${n.label ?? ''}",${n.ai?.score ?? ''},${n.ai?.category ?? ''}`);
    });
    return rows.join('\n');
  },
};

export default csvRenderer;
