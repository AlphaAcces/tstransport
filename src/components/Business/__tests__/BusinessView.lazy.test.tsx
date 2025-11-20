import React, { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

const LazyComponent = React.lazy(() => new Promise<any>(resolve => setTimeout(() => resolve({ default: () => <div>Loaded</div> }), 50)));

describe('Suspense lazy-loading', () => {
  it('shows fallback while lazy component loads', async () => {
    render(
      <Suspense fallback={<div data-testid="fallback">loading</div>}>
        <LazyComponent />
      </Suspense>,
    );

    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Loaded')).toBeInTheDocument());
  });
});
