import { vi } from 'vitest';
import { tslData } from '../../data/tsl';
import type { CaseData, CaseMeta } from '../../types';
import type { CaseEvent } from '../../domains/events/caseEvents';
import type { CaseKpiSummary } from '../../domains/kpi/caseKpis';

const defaultCaseData: CaseData = tslData;
const defaultCaseMeta: CaseMeta[] = [
  {
    id: 'tsl',
    name: 'TS Logistik ApS',
    type: 'business',
    defaultSubject: 'tsl',
    summary: 'Mocked TS24 case for unit tests',
    region: 'DK',
    updatedAt: '2025-01-05T00:00:00.000Z',
    tags: ['test', 'ts24'],
  },
];

const defaultCaseEvents: CaseEvent[] = [
  {
    id: 'evt-1',
    caseId: 'tsl',
    timestamp: '2025-01-05T10:00:00.000Z',
    type: 'timeline',
    severity: 'high',
    title: 'Mocked event',
    description: 'Mocked description',
  },
];

const defaultCaseKpis: CaseKpiSummary = {
  caseId: 'tsl',
  generatedAt: '2025-01-05T10:00:00.000Z',
  source: 'api',
  metrics: [
    {
      id: 'overall-risk',
      label: 'Samlet risikoscore',
      value: 78,
      unit: '%',
      severity: 'high',
      trend: 'up',
      hint: 'Mock KPI summary',
    },
  ],
};

const fetchCaseMock = vi.fn().mockResolvedValue(defaultCaseData);
const fetchCasesMock = vi.fn().mockResolvedValue(defaultCaseMeta);
const fetchCaseEventsMock = vi.fn().mockResolvedValue(defaultCaseEvents);
const fetchCaseKpisMock = vi.fn().mockResolvedValue(defaultCaseKpis);

class MockApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, options: { status: number; payload?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.payload = options.payload;
  }
}

export const caseApiMock = {
  defaultCaseData,
  defaultCaseMeta,
  defaultCaseEvents,
  defaultCaseKpis,
  fetchCaseMock,
  fetchCasesMock,
  fetchCaseEventsMock,
  fetchCaseKpisMock,
  reset() {
    fetchCaseMock.mockReset();
    fetchCaseMock.mockResolvedValue(defaultCaseData);
    fetchCasesMock.mockReset();
    fetchCasesMock.mockResolvedValue(defaultCaseMeta);
    fetchCaseEventsMock.mockReset();
    fetchCaseEventsMock.mockResolvedValue(defaultCaseEvents);
    fetchCaseKpisMock.mockReset();
    fetchCaseKpisMock.mockResolvedValue(defaultCaseKpis);
  },
};

vi.mock('../../domains/api/client', () => ({
  ApiError: MockApiError,
  fetchCase: caseApiMock.fetchCaseMock,
  fetchCases: caseApiMock.fetchCasesMock,
  fetchCaseEvents: caseApiMock.fetchCaseEventsMock,
  fetchCaseKpis: caseApiMock.fetchCaseKpisMock,
}));
