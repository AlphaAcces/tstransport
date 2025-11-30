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
  const { caseData, dataSource, eventsSource, events, kpisSource, kpis } = useDataContext();
  return (
    <div>
      <span data-testid="case-name">{caseData.personData.name}</span>
      <span data-testid="data-source">{dataSource}</span>
      <span data-testid="events-source">{eventsSource}</span>
      <span data-testid="events-count">{events ? events.length : 0}</span>
      <span data-testid="kpi-source">{kpisSource}</span>
      <span data-testid="kpi-count">{kpis ? kpis.metrics.length : 0}</span>
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
    caseApiMock.fetchCaseEventsMock.mockResolvedValue(caseApiMock.defaultCaseEvents);
    caseApiMock.fetchCaseKpisMock.mockResolvedValue(caseApiMock.defaultCaseKpis);
    getDataForSubjectMock.mockResolvedValue(tslData);

    renderWithProvider('tsl', 'tsl');

    await waitFor(() => {
      expect(screen.getByTestId('case-name').textContent).toBe(tslData.personData.name);
      expect(screen.getByTestId('data-source').textContent).toBe('api');
      expect(screen.getByTestId('events-source').textContent).toBe('api');
      expect(screen.getByTestId('events-count').textContent).toBe(String(caseApiMock.defaultCaseEvents.length));
      expect(screen.getByTestId('kpi-source').textContent).toBe('api');
      expect(screen.getByTestId('kpi-count').textContent).toBe(String(caseApiMock.defaultCaseKpis.metrics.length));
    });

    expect(caseApiMock.fetchCaseMock).toHaveBeenCalledWith('tsl');
    expect(getDataForSubjectMock).not.toHaveBeenCalled();
    expect(caseApiMock.fetchCaseEventsMock).toHaveBeenCalledWith('tsl');
    expect(caseApiMock.fetchCaseKpisMock).toHaveBeenCalledWith('tsl');
  });

  it('falls back to mock data when API fails', async () => {
    caseApiMock.fetchCaseMock.mockRejectedValueOnce(new Error('network error'));
    getDataForSubjectMock.mockResolvedValue(tslData);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderWithProvider('tsl', 'tsl');

    await waitFor(() => {
      expect(screen.getByTestId('data-source').textContent).toBe('mock');
      expect(screen.getByTestId('events-source').textContent).toBe('derived');
      expect(Number(screen.getByTestId('events-count').textContent)).toBeGreaterThan(0);
      expect(screen.getByTestId('kpi-source').textContent).toBe('derived');
      expect(Number(screen.getByTestId('kpi-count').textContent)).toBeGreaterThan(0);
    });

    expect(getDataForSubjectMock).toHaveBeenCalledWith('tsl');
    expect(caseApiMock.fetchCaseEventsMock).not.toHaveBeenCalled();
    expect(caseApiMock.fetchCaseKpisMock).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('falls back to derived events when events API errors', async () => {
    caseApiMock.fetchCaseMock.mockResolvedValue(tslData);
    caseApiMock.fetchCaseEventsMock.mockRejectedValueOnce(new Error('events down'));
    caseApiMock.fetchCaseKpisMock.mockResolvedValue(caseApiMock.defaultCaseKpis);
    getDataForSubjectMock.mockResolvedValue(tslData);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderWithProvider('tsl', 'tsl');

    await waitFor(() => {
      expect(screen.getByTestId('events-source').textContent).toBe('derived');
      expect(Number(screen.getByTestId('events-count').textContent)).toBeGreaterThan(0);
    });

    expect(caseApiMock.fetchCaseEventsMock).toHaveBeenCalledWith('tsl');
    warnSpy.mockRestore();
  });

  it('falls back to derived KPIs when KPI API errors', async () => {
    caseApiMock.fetchCaseMock.mockResolvedValue(tslData);
    caseApiMock.fetchCaseEventsMock.mockResolvedValue(caseApiMock.defaultCaseEvents);
    caseApiMock.fetchCaseKpisMock.mockRejectedValueOnce(new Error('kpi down'));
    getDataForSubjectMock.mockResolvedValue(tslData);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderWithProvider('tsl', 'tsl');

    await waitFor(() => {
      expect(screen.getByTestId('kpi-source').textContent).toBe('derived');
      expect(Number(screen.getByTestId('kpi-count').textContent)).toBeGreaterThan(0);
    });

    expect(caseApiMock.fetchCaseKpisMock).toHaveBeenCalledWith('tsl');
    warnSpy.mockRestore();
  });
});
