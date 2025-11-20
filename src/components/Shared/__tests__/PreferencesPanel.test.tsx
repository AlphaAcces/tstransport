import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../../../store';
import { PreferencesPanel } from '../PreferencesPanel';

describe('PreferencesPanel', () => {
  test('renders and toggles compact mode and saves view', () => {
    render(
      <Provider store={store}>
        <PreferencesPanel currentViewId="dashboard" />
      </Provider>
    );

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();

    // toggle
    fireEvent.click(checkbox);
    expect(store.getState().userPreferences.compactMode).toBe(true);

    // save view
    const btn = screen.getByRole('button', { name: /gem visning/i });
    fireEvent.click(btn);
    const saved = store.getState().userPreferences.savedViews;
    expect(saved.length).toBeGreaterThanOrEqual(1);
    expect(saved[saved.length - 1].payload.view).toBe('dashboard');
  });
});
