import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import DataProvider, { useDataContext } from '../DataContext';
import { tslData } from '../../data/tsl';
import type { Subject } from '../../types';
import { getDataForSubject } from '../../data';
import { caseApiMock } from '../../test/mocks/apiClientMock';

vi.mock('../../data', () => ({
  getDataForSubject: vi.fn(),
}));

vi.mock('../../domains/tenant', () => ({
  useTenantId: () => null,
  createAuditEntry: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

const getDataForSubjectMock = vi.mocked(getDataForSubject);

const TestConsumer = () => {
  const { caseData, dataSource } = useDataContext();
  return (
    <div>
      <span data-testid="case-name">{caseData.personData.name}</span>
      <span data-testid="data-source">{dataSource}</span>
    </div>
  );
};

const renderWithProvider = (subject: Subject = 'tsl', caseId = 'tsl') =>
  render(
    <DataProvider activeSubject={subject} activeCaseId={caseId}>
      <TestConsumer />
    </DataProvider>
  );

describe('DataContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    caseApiMock.reset();
  });

  it('hydrates context with API data when fetch succeeds', async () => {
    caseApiMock.fetchCaseMock.mockResolvedValue(tslData);
    getDataForSubjectMock.mockResolvedValue(tslData);

    renderWithProvider('tsl', 'tsl');

    await waitFor(() => {
      expect(screen.getByTestId('case-name').textContent).toBe(tslData.personData.name);
      expect(screen.getByTestId('data-source').textContent).toBe('api');
    });

    expect(caseApiMock.fetchCaseMock).toHaveBeenCalledWith('tsl');
    expect(getDataForSubjectMock).not.toHaveBeenCalled();
  });

  it('falls back to mock data when API fails', async () => {
    caseApiMock.fetchCaseMock.mockRejectedValueOnce(new Error('network error'));
    getDataForSubjectMock.mockResolvedValue(tslData);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderWithProvider('tsl', 'tsl');

    await waitFor(() => {
      expect(screen.getByTestId('data-source').textContent).toBe('mock');
    });

    expect(getDataForSubjectMock).toHaveBeenCalledWith('tsl');
    warnSpy.mockRestore();
  });
});
