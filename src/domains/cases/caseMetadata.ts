import type { CaseMeta } from '../../types';

export const CASE_METADATA: CaseMeta[] = [
  {
    id: 'tsl',
    name: 'TS Logistik ApS',
    type: 'business',
    defaultSubject: 'tsl',
    summary: 'Flagship Danish transport case involving complex holding structures and capital flight.',
    region: 'DK',
    updatedAt: '2025-01-05T00:00:00.000Z',
    tags: ['transport', 'aml', 'corporate'],
  },
  {
    id: 'umit',
    name: 'Ümit Cetin',
    type: 'personal',
    defaultSubject: 'umit',
    summary: 'High-risk personal network investigation with SOCMINT signals and offshore flows.',
    region: 'DK',
    updatedAt: '2025-01-05T00:00:00.000Z',
    tags: ['personal', 'socmint', 'offshore'],
  },
];

export const DEFAULT_CASE_ID = CASE_METADATA[0]?.id ?? 'tsl';
