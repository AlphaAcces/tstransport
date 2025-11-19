import { Subject, CaseData } from '../types';

export const getDataForSubject = async (subject: Subject): Promise<CaseData> => {
  switch (subject) {
    case 'tsl': {
      const module = await import('./tsl');
      return module.tslData;
    }
    case 'umit': {
      const module = await import('./umit');
      return module.umitData;
    }
    default: {
      const module = await import('./tsl');
      return module.tslData;
    }
  }
};
