import '@testing-library/jest-dom';

// Polyfill ResizeObserver for tests (used by Recharts ResponsiveContainer)
class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

// @ts-ignore
global.ResizeObserver = global.ResizeObserver || ResizeObserver;
