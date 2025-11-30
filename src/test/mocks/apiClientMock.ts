import { vi } from 'vitest';
import { tslData } from '../../data/tsl';
import type { CaseData, CaseMeta } from '../../types';

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

const fetchCaseMock = vi.fn().mockResolvedValue(defaultCaseData);
const fetchCasesMock = vi.fn().mockResolvedValue(defaultCaseMeta);

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
  fetchCaseMock,
  fetchCasesMock,
  reset() {
    fetchCaseMock.mockReset();
    fetchCaseMock.mockResolvedValue(defaultCaseData);
    fetchCasesMock.mockReset();
    fetchCasesMock.mockResolvedValue(defaultCaseMeta);
  },
};

vi.mock('../../domains/api/client', () => ({
  ApiError: MockApiError,
  fetchCase: caseApiMock.fetchCaseMock,
  fetchCases: caseApiMock.fetchCasesMock,
}));
