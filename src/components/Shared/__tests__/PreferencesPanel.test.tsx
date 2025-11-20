import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../../../store';
import { PreferencesPanel } from '../PreferencesPanel';

describe('PreferencesPanel', () => {
  test('renders and toggles compact mode and saves view', async () => {
    render(
      <Provider store={store}>
        <PreferencesPanel currentViewId="dashboard" currentBreadcrumbs={["Dashboard"]} navigateTo={() => {}} />
      </Provider>
    );

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();

    // toggle
    fireEvent.click(checkbox);
    expect(store.getState().userPreferences.compactMode).toBe(true);

    // save view and open list
    const saveBtn = screen.getByRole('button', { name: /gem visning/i });
    fireEvent.click(saveBtn);

    const openListBtn = screen.getByRole('button', { name: /gemte visninger/i });
    fireEvent.click(openListBtn);

    const item = await screen.findByText(/dashboard/i);
    expect(item).toBeInTheDocument();

    const openBtn = screen.getByRole('button', { name: /åbn/i });
    expect(openBtn).toBeInTheDocument();

    const delBtn = screen.getByRole('button', { name: /slet/i });
    fireEvent.click(delBtn);
    // confirm it was removed
    const saved = store.getState().userPreferences.savedViews;
    expect(saved.find(s => s.payload.view === 'dashboard')).toBeUndefined();
  });
});
