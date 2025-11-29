/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { ExportPayload } from '../types';

const jsonExporter = {
  async renderJson(payload: ExportPayload): Promise<string> {
    // Include tenant and aiOverlay in JSON payload for export consumers
    return JSON.stringify({
      tenant: payload.tenant,
      aiOverlay: payload.aiOverlay,
      nodes: payload.nodes,
      edges: payload.edges,
      metadata: payload.metadata,
    });
  },
};

export default jsonExporter;
