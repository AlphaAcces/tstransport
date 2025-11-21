import { useDomainViewModel } from '../../shared/hooks/useDomainData';
import type { ExecutiveSummaryViewProps } from '../types';

export const useExecutiveSummaryViewModel = () =>
  useDomainViewModel<ExecutiveSummaryViewProps>(({ caseData }) => caseData.executiveSummary);
