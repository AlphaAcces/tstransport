import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '../../../store';
import DataProvider from '../../../context/DataContext';
import { TenantProvider } from '../../../domains/tenant/TenantContext';
import { ExecutiveSummaryView } from '../ExecutiveSummaryView';
import { ExecutiveSummaryViewData, getMockExecutiveSummary } from '../../../domains/executive/mockExecutiveSummary';
import { caseApiMock } from '../../../test/mocks/apiClientMock';

const renderExecutiveView = (data?: ExecutiveSummaryViewData) =>
  render(
    <ReduxProvider store={store}>
      <TenantProvider>
        <DataProvider activeSubject="tsl" activeCaseId="tsl">
          <ExecutiveSummaryView dataOverride={data} />
        </DataProvider>
      </TenantProvider>
    </ReduxProvider>,
  );

describe('ExecutiveSummaryView – mock dashboard layout', () => {
  beforeEach(() => {
    caseApiMock.reset();
  });

  it('renders threat badge and at least one KPI card', async () => {
    renderExecutiveView();

    expect(await screen.findByText(/Trusselsniveau: Kritisk/i)).toBeInTheDocument();
    expect(await screen.findByText(/Omsætnings-run-rate/i)).toBeInTheDocument();
    expect(await screen.findByText(/Executive briefing/i)).toBeInTheDocument();
  });

  it('lists risks and actions from mock helper', async () => {
    renderExecutiveView();

    expect(await screen.findByText(/Regulatorisk eksponering i DE/i)).toBeInTheDocument();
    expect(await screen.findByText(/Stabilisér API-gatewayen/i)).toBeInTheDocument();
  });

  it('shows empty-state placeholders when risks/actions arrays are empty', async () => {
    const data = getMockExecutiveSummary();
    data.risks = [];
    data.actions = [];

    renderExecutiveView(data);

    expect(await screen.findByText(/Ingen kritiske risici/i)).toBeInTheDocument();
    expect(await screen.findByText(/Ingen prioriterede handlinger/i)).toBeInTheDocument();
  });

  it('renders case KPI metrics from DataContext', async () => {
    renderExecutiveView();

    expect(await screen.findByText(/Samlet risikoscore/i)).toBeInTheDocument();
  });

  it('shows KPI loader while KPIs are fetching', async () => {
    caseApiMock.fetchCaseKpisMock.mockImplementation(() => new Promise(() => {}));

    renderExecutiveView();

    expect(await screen.findByTestId('executive-kpi-loading')).toBeInTheDocument();
  });

  it('shows KPI empty state when API returns no metrics', async () => {
    caseApiMock.fetchCaseKpisMock.mockResolvedValue({
      caseId: 'tsl',
      metrics: [],
      generatedAt: new Date().toISOString(),
      source: 'api',
    });

    renderExecutiveView();

    expect(await screen.findByTestId('executive-kpi-empty')).toBeInTheDocument();
  });
});
