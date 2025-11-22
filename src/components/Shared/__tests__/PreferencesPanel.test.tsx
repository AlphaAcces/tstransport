import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../../../store';
import { PreferencesPanel } from '../PreferencesPanel';

describe('PreferencesPanel', () => {
  test('saves view, toggles compact mode, and manages saved list', async () => {
    render(
      <Provider store={store}>
        <PreferencesPanel currentViewId="dashboard" currentBreadcrumbs={["Dashboard"]} navigateTo={() => {}} />
      </Provider>
    );

    const saveBtn = screen.getByRole('button', { name: /gem visning/i });
    fireEvent.click(saveBtn);

    const openListBtn = screen.getByRole('button', { name: /gemte visninger/i });
    fireEvent.click(openListBtn);

    const savedItems = await screen.findAllByText(/dashboard/i);
    expect(savedItems.length).toBeGreaterThan(0);

    const compactToggle = screen.getByLabelText(/compact/i) as HTMLInputElement;
    fireEvent.click(compactToggle);
    expect(store.getState().userPreferences.compactMode).toBe(true);

    const deleteBtn = screen.getByRole('button', { name: /^slet$/i });
    fireEvent.click(deleteBtn);
    expect(store.getState().userPreferences.savedViews.find(s => s.payload.view === 'dashboard')).toBeUndefined();
  });
});
