import { Subject, CaseData } from '../types';
import { tslData } from './tsl';
import { umitData } from './umit';

export const getDataForSubject = (subject: Subject): CaseData => {
  switch (subject) {
    case 'tsl':
      return tslData;
    case 'umit':
      return umitData;
    default:
      // Fallback to TSL data if subject is unknown
      return tslData;
  }
};
