import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '../../../store';
import DataProvider from '../../../context/DataContext';
import { ExecutiveSummaryView } from '../ExecutiveSummaryView';

import * as PdfModule from '../../../pdf/executiveReport';
vi.mock('../../../pdf/executiveReport', async () => ({
  generateExecutiveReportPdf: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('html2canvas', () => ({ default: vi.fn().mockImplementation(() => Promise.resolve({ toDataURL: () => 'data:image/png;base64,', width: 100, height: 50 })) }));

describe('Executive export trigger', () => {
  test('calls generateExecutiveReportPdf when export clicked (mock provider)', async () => {
    render(
      <ReduxProvider store={store}>
        <DataProvider activeSubject="tsl">
          <ExecutiveSummaryView />
        </DataProvider>
      </ReduxProvider>
    );

    const btn = await screen.findByRole('button', { name: /eksporter pdf/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect((PdfModule as any).generateExecutiveReportPdf).toHaveBeenCalled();
    });
  }, 10000);
});
