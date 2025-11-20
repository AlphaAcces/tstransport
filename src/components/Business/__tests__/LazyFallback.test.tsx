import React, { Suspense } from 'react';
import { render, screen } from '@testing-library/react';

const LazyComp = React.lazy(() => new Promise<{ default: React.ComponentType<any> }>(resolve => setTimeout(() => resolve({ default: () => <div>Lazy content</div> }), 50)));

test('shows fallback while lazy component loads', async () => {
  render(
    <Suspense fallback={<div>Loading fallback</div>}>
      <LazyComp />
    </Suspense>
  );

  expect(screen.getByText(/Loading fallback/i)).toBeInTheDocument();
  const resolved = await screen.findByText(/Lazy content/i);
  expect(resolved).toBeInTheDocument();
});
