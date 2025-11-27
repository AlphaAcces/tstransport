import { describe, it, expect, vi, beforeEach } from 'vitest';

const { html2canvasMock, outputMock } = vi.hoisted(() => ({
  html2canvasMock: vi.fn(async () => ({
    width: 100,
    height: 140,
    toDataURL: () => 'data:image/png;base64,',
  })),
  outputMock: vi.fn(() => new Uint8Array([1, 2, 3])),
}));

vi.mock('html2canvas', () => ({
  default: html2canvasMock,
}));

vi.mock('jspdf', () => {
  class JsPdfStub {
    addImage() {}
    setFontSize() {}
    setTextColor() {}
    text() {}
    output() {
      return outputMock();
    }
  }

  return { default: JsPdfStub };
});

import pdfRenderer from '../pdfRenderer';

describe('pdfRenderer', () => {
  beforeEach(() => {
    html2canvasMock.mockClear();
    outputMock.mockClear();
  });

  it('renders pdf bytes when DOM is available', async () => {
    const payload = {
      tenant: { id: 't1', name: 'Tenant' },
      aiOverlay: { enabled: true },
      risks: [{ title: 'Threat', severity: 'high', summary: 'Alert' }],
      kpis: [{ label: 'Revenue', value: 42, trend: 'up' }],
    } as any;
    const bytes = await pdfRenderer.renderPdf(payload);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(html2canvasMock).toHaveBeenCalledTimes(1);
    const [, options] = html2canvasMock.mock.calls[0];
    expect(options).toMatchObject({ scale: 3 });
  });
});
