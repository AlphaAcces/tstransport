declare module 'jspdf' {
  export interface JsPdfPageSize {
    getWidth(): number;
    getHeight(): number;
  }

  export interface JsPdfInternal {
    pageSize: JsPdfPageSize;
  }

  export interface JsPdfOptions {
    unit?: string;
    format?: string | [number, number];
  }

  export class jsPDF {
    internal: JsPdfInternal;
    constructor(options?: JsPdfOptions);
    setFont(fontName: string, fontStyle?: string): this;
    setFontSize(size: number): this;
    setDrawColor(r: number, g?: number, b?: number): this;
    setLineWidth(width: number): this;
    text(text: string, x: number, y: number): this;
    line(x1: number, y1: number, x2: number, y2: number): this;
    addImage(
      imageData: string,
      format: 'PNG' | 'JPEG' | 'WEBP',
      x: number,
      y: number,
      width: number,
      height: number,
    ): this;
    addPage(): this;
    save(filename: string): void;
  }
}
