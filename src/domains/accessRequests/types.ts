/**
 * Access Requests Domain Types
 * Handles requests for access to resources, features, or elevated permissions
 */

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export type AccessRequestType =
  | 'feature_access'      // Request access to a specific feature
  | 'data_export'         // Request to export sensitive data
  | 'elevated_permission' // Request temporary elevated permissions
  | 'case_access'         // Request access to a specific case
  | 'api_access';         // Request API key or access

export interface AccessRequest {
  id: string;
  tenantId: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  type: AccessRequestType;
  status: AccessRequestStatus;

  /** Resource or feature being requested */
  resourceId: string;
  resourceName: string;

  /** Business justification for the request */
  justification: string;

  /** Timestamps */
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;

  /** Review information */
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;

  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

export interface AccessRequestCreateInput {
  type: AccessRequestType;
  resourceId: string;
  resourceName: string;
  justification: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface AccessRequestReviewInput {
  status: 'approved' | 'rejected';
  reviewNotes?: string;
}

export interface AccessRequestFilters {
  status?: AccessRequestStatus | AccessRequestStatus[];
  type?: AccessRequestType | AccessRequestType[];
  requesterId?: string;
  resourceId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AccessRequestsState {
  requests: AccessRequest[];
  loading: boolean;
  error: string | null;
  filters: AccessRequestFilters;
  selectedId: string | null;
}

export interface AccessRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  avgReviewTimeHours: number;
}
