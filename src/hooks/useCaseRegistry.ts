import { useEffect, useState } from 'react';
import type { CaseMeta } from '../types';
import { fetchCases } from '../domains/api/client';
import { CASE_METADATA } from '../domains/cases/caseMetadata';

export type CaseRegistrySource = 'api' | 'mock';

interface UseCaseRegistryResult {
  cases: CaseMeta[];
  isLoading: boolean;
  error: string | null;
  source: CaseRegistrySource;
}

export function useCaseRegistry(): UseCaseRegistryResult {
  const [cases, setCases] = useState<CaseMeta[]>(CASE_METADATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<CaseRegistrySource>('mock');

  useEffect(() => {
    let isMounted = true;

    const loadCases = async () => {
      try {
        const response = await fetchCases();
        if (!isMounted) return;
        setCases(response);
        setSource('api');
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        console.warn('[CaseRegistry] Falling back to bundled case metadata.', err);
        setCases(CASE_METADATA);
        setSource('mock');
        setError('Failed to fetch cases from API');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCases();

    return () => {
      isMounted = false;
    };
  }, []);

  return { cases, isLoading, error, source };
}
