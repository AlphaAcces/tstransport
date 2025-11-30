import type { CaseData, CaseMeta } from '../../types';
import type { CaseEvent } from '../events/caseEvents';
import type { CaseKpiSummary } from '../kpi/caseKpis';

const API_BASE_URL = '/api';

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, options: { status: number; payload?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.payload = options.payload;
  }
}

async function parsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(path, {
      cache: init?.cache ?? 'no-store',
      credentials: init?.credentials ?? 'same-origin',
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const payload = await parsePayload(response);
      const error = new ApiError(`Request to ${path} failed with status ${response.status}`, {
        status: response.status,
        payload,
      });
      console.error('[TS24 API]', error);
      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json() as T;
  } catch (error) {
    if (!(error instanceof ApiError)) {
      console.error('[TS24 API]', error);
    }
    throw error;
  }
}

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export async function fetchCases(): Promise<CaseMeta[]> {
  return request<CaseMeta[]>(buildUrl('/cases'));
}

export async function fetchCase(id: string): Promise<CaseData> {
  const encodedId = encodeURIComponent(id);
  return request<CaseData>(buildUrl(`/cases/${encodedId}`));
}

export async function fetchCaseEvents(id: string): Promise<CaseEvent[]> {
  const encodedId = encodeURIComponent(id);
  const response = await request<{ events: CaseEvent[] }>(buildUrl(`/cases/${encodedId}/events`));
  return response.events ?? [];
}

export async function fetchCaseKpis(id: string): Promise<CaseKpiSummary> {
  const encodedId = encodeURIComponent(id);
  const response = await request<{ summary: CaseKpiSummary }>(buildUrl(`/cases/${encodedId}/kpis`));
  return response.summary;
}
