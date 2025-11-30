import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseLibraryView } from '../CaseLibraryView';
import { caseApiMock } from '../../../test/mocks/apiClientMock';

const buildCaseMeta = (overrides: Partial<typeof caseApiMock.defaultCaseMeta[number]>) => ({
  id: 'tsl',
  name: 'TS Logistik',
  type: 'business',
  defaultSubject: 'tsl',
  summary: 'Baseline summary',
  region: 'DK',
  updatedAt: '2025-01-05T00:00:00.000Z',
  tags: [],
  ...overrides,
});

describe('CaseLibraryView', () => {
  beforeEach(() => {
    caseApiMock.reset();
  });

  it('renders cases from API and triggers selection with redirect flag', async () => {
    const cases = [
      buildCaseMeta({ id: 'alpha', name: 'Alpha Holdings', type: 'business' }),
      buildCaseMeta({ id: 'beta', name: 'Beta Ventures', type: 'personal', defaultSubject: 'umit' }),
    ];
    caseApiMock.fetchCasesMock.mockResolvedValueOnce(cases);
    const handleSelect = vi.fn();

    render(<CaseLibraryView activeCaseId="alpha" onSelectCase={handleSelect} />);

    expect(await screen.findByText('Alpha Holdings')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Beta Ventures/i }));

    expect(handleSelect).toHaveBeenCalledWith('beta', { redirectToDashboard: true });
  });

  it('shows fallback notice when API fails and uses bundled metadata', async () => {
    caseApiMock.fetchCasesMock.mockRejectedValueOnce(new Error('network error'));
    const handleSelect = vi.fn();

    render(<CaseLibraryView activeCaseId={null} onSelectCase={handleSelect} />);

    await waitFor(() => {
      expect(screen.getByText((content) => /Viser lokale case-data|Displaying offline case data/i.test(content))).toBeInTheDocument();
    });

    expect(screen.getAllByRole('button', { name: /TS Logistik/i })[0]).toBeInTheDocument();
  });
});
