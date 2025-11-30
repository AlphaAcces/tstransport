import '@testing-library/jest-dom';
import '../i18n';
import './mocks/apiClientMock';

// Polyfill ResizeObserver for tests (used by Recharts ResponsiveContainer)
class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

const globalWithResizeObserver = globalThis as typeof globalThis & { ResizeObserver?: typeof ResizeObserver };
if (!globalWithResizeObserver.ResizeObserver) {
	globalWithResizeObserver.ResizeObserver = ResizeObserver;
}
