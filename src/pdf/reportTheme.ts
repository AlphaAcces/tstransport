export type ReportColor = [number, number, number];

export interface ReportTheme {
  brand: {
    name: string;
    suite: string;
    classification: string;
  };
  colors: {
    background: ReportColor;
    contentBackground: ReportColor;
    accent: ReportColor;
    accentSoft: ReportColor;
    textPrimary: ReportColor;
    textSecondary: ReportColor;
    textMuted: ReportColor;
    divider: ReportColor;
    badgeBackground: ReportColor;
    badgeText: ReportColor;
  };
  layout: {
    margin: number;
    sectionSpacing: number;
    columnGap: number;
    lineHeight: number;
  };
  typography: {
    heading: number;
    subheading: number;
    sectionTitle: number;
    body: number;
    small: number;
  };
}

export const reportTheme: ReportTheme = {
  brand: {
    name: 'Intel24 Data Intel™',
    suite: 'Executive Intelligence Brief',
    classification: 'INTERN / FORTROLIG',
  },
  colors: {
    background: [7, 12, 24],
    contentBackground: [255, 255, 255],
    accent: [247, 181, 0],
    accentSoft: [253, 211, 115],
    textPrimary: [14, 23, 47],
    textSecondary: [71, 85, 105],
    textMuted: [148, 163, 184],
    divider: [226, 232, 240],
    badgeBackground: [15, 23, 42],
    badgeText: [241, 245, 249],
  },
  layout: {
    margin: 56,
    sectionSpacing: 32,
    columnGap: 28,
    lineHeight: 16,
  },
  typography: {
    heading: 20,
    subheading: 14,
    sectionTitle: 12,
    body: 10,
    small: 8,
  },
};
