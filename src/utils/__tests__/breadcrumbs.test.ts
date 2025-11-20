import { buildBreadcrumbs } from '../breadcrumbs';

test('buildBreadcrumbs uses provided trail', () => {
  const trail = ['Business', 'Financials', 'KPI'];
  expect(buildBreadcrumbs('financials', trail as any)).toEqual(trail);
});

test('buildBreadcrumbs returns Dashboard + label by default', () => {
  const result = buildBreadcrumbs('executive');
  expect(result[0]).toBe('Dashboard');
  expect(result.length).toBeGreaterThanOrEqual(2);
});
