import { useMemo } from 'react';
import { useCaseData, useActiveSubject } from '../../../context/DataContext';
import type { ViewModel } from '../types/view-model';

/**
 * Base hook for creating domain-specific view models.
 * @param select Deriver function that maps the raw case data into a view-model props object.
 */
export function useDomainViewModel<TProps>(
  select: (args: { caseData: ReturnType<typeof useCaseData>; subject: ReturnType<typeof useActiveSubject> }) => TProps,
): ViewModel<TProps> {
  const caseData = useCaseData();
  const subject = useActiveSubject();

  const props = useMemo(() => select({ caseData, subject }), [caseData, select, subject]);

  return {
    subjectId: subject,
    generatedAt: new Date().toISOString(),
    props,
  };
}
