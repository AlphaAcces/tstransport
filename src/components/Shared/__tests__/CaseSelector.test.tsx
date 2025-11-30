import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseSelector } from '../CaseSelector';

const mockCases = [
  { id: 'tsl', name: 'TS Logistik ApS', type: 'business', defaultSubject: 'tsl', region: 'DK' },
  { id: 'umit', name: 'Ümit Cetin', type: 'personal', defaultSubject: 'umit', region: 'DK' },
];

describe('CaseSelector', () => {
  it('invokes onOpenCaseLibrary when CTA clicked', async () => {
    const handleSelect = vi.fn();
    const handleOpenLibrary = vi.fn();

    render(
      <CaseSelector
        cases={mockCases}
        selectedCaseId="tsl"
        onSelectCase={handleSelect}
        onOpenCaseLibrary={handleOpenLibrary}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /TS Logistik/i }));
    await userEvent.click(screen.getByRole('button', { name: /Åbn caseliste/i }));

    expect(handleOpenLibrary).toHaveBeenCalledTimes(1);
  });
});
