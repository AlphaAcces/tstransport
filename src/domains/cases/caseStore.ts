import { tslData } from '../../data/tsl';
import { umitData } from '../../data/umit';
import type { CaseData, CaseMeta } from '../../types';
import { CASE_METADATA } from './caseMetadata';

const CASE_DATA: Record<string, CaseData> = {
  tsl: tslData,
  umit: umitData,
};

export function listCases(): CaseMeta[] {
  return CASE_METADATA;
}

export function getCaseById(id: string): CaseData | undefined {
  return CASE_DATA[id];
}
