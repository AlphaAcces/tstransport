import type { ExecutiveSummaryData } from '../../../types';

export interface ExecutiveSummaryViewProps {
  financial: ExecutiveSummaryData['financial'];
  risk: ExecutiveSummaryData['risk'];
  actions: ExecutiveSummaryData['actions'];
}
