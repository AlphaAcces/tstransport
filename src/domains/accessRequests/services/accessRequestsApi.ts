/**
 * Access Requests API Service
 * Client-side API calls for access request management
 */

import type {
  AccessRequest,
  AccessRequestCreateInput,
  AccessRequestReviewInput,
  AccessRequestFilters,
  AccessRequestStats,
} from '../types';

const API_BASE = '/api/access-requests';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }
  return response.json();
}

function buildQueryString(filters: AccessRequestFilters): string {
  const params = new URLSearchParams();

  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    statuses.forEach(s => params.append('status', s));
  }
  if (filters.type) {
    const types = Array.isArray(filters.type) ? filters.type : [filters.type];
    types.forEach(t => params.append('type', t));
  }
  if (filters.requesterId) params.set('requesterId', filters.requesterId);
  if (filters.resourceId) params.set('resourceId', filters.resourceId);
  if (filters.fromDate) params.set('fromDate', filters.fromDate);
  if (filters.toDate) params.set('toDate', filters.toDate);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Fetch all access requests for a tenant with optional filters
 */
export async function getAccessRequests(
  tenantId: string,
  filters: AccessRequestFilters = {}
): Promise<AccessRequest[]> {
  const queryString = buildQueryString(filters);
  const response = await fetch(`${API_BASE}/${tenantId}${queryString}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<AccessRequest[]>(response);
}

/**
 * Fetch a single access request by ID
 */
export async function getAccessRequest(
  tenantId: string,
  requestId: string
): Promise<AccessRequest> {
  const response = await fetch(`${API_BASE}/${tenantId}/${requestId}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<AccessRequest>(response);
}

/**
 * Create a new access request
 */
export async function createAccessRequest(
  tenantId: string,
  input: AccessRequestCreateInput,
  userId: string
): Promise<AccessRequest> {
  const response = await fetch(`${API_BASE}/${tenantId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify(input),
  });
  return handleResponse<AccessRequest>(response);
}

/**
 * Review (approve/reject) an access request
 */
export async function reviewAccessRequest(
  tenantId: string,
  requestId: string,
  input: AccessRequestReviewInput,
  reviewerId: string
): Promise<AccessRequest> {
  const response = await fetch(`${API_BASE}/${tenantId}/${requestId}/review`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': reviewerId,
    },
    body: JSON.stringify(input),
  });
  return handleResponse<AccessRequest>(response);
}

/**
 * Cancel/delete an access request (only by the requester or admin)
 */
export async function deleteAccessRequest(
  tenantId: string,
  requestId: string,
  userId: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/${tenantId}/${requestId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }
}

/**
 * Get statistics for access requests
 */
export async function getAccessRequestStats(
  tenantId: string
): Promise<AccessRequestStats> {
  const response = await fetch(`${API_BASE}/${tenantId}/stats`, {
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<AccessRequestStats>(response);
}

/**
 * Get requests pending review (for admins)
 */
export async function getPendingRequests(tenantId: string): Promise<AccessRequest[]> {
  return getAccessRequests(tenantId, { status: 'pending' });
}

/**
 * Get requests made by a specific user
 */
export async function getMyRequests(tenantId: string, userId: string): Promise<AccessRequest[]> {
  return getAccessRequests(tenantId, { requesterId: userId });
}
