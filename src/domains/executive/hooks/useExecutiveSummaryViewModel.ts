import { useDomainViewModel } from '../../shared/hooks/useDomainData';

// The view model returns the executive summary payload from the case data.
export const useExecutiveSummaryViewModel = () =>
  useDomainViewModel(({ caseData }) => caseData.executiveSummary);
