import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '../../../store';
import DataProvider from '../../../context/DataContext';
import { TenantProvider } from '../../../domains/tenant/TenantContext';
import { ExecutiveSummaryView } from '../ExecutiveSummaryView';
import { ExecutiveSummaryViewData, getMockExecutiveSummary } from '../../../domains/executive/mockExecutiveSummary';

const renderExecutiveView = (data?: ExecutiveSummaryViewData) =>
  render(
    <ReduxProvider store={store}>
      <TenantProvider>
        <DataProvider activeSubject="tsl">
          <ExecutiveSummaryView dataOverride={data} />
        </DataProvider>
      </TenantProvider>
    </ReduxProvider>,
  );

describe('ExecutiveSummaryView – mock dashboard layout', () => {
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
});
