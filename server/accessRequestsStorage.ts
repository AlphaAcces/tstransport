/**
 * Access Requests Storage
 * JSON file-based storage for access requests (development/demo purposes)
 * In production, replace with your database of choice
 */

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

// Types
export type AccessRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type AccessRequestType = 'feature_access' | 'data_export' | 'elevated_permission' | 'case_access' | 'api_access';

export interface AccessRequest {
  id: string;
  tenantId: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  type: AccessRequestType;
  status: AccessRequestStatus;
  resourceId: string;
  resourceName: string;
  justification: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  metadata?: Record<string, unknown>;
}

export interface AccessRequestFilters {
  status?: AccessRequestStatus[];
  type?: AccessRequestType[];
  requesterId?: string;
  resourceId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateAccessRequestInput {
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  type: AccessRequestType;
  resourceId: string;
  resourceName: string;
  justification: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ReviewAccessRequestInput {
  status: 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy: string;
  reviewedByName: string;
}

export interface AccessRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  avgReviewTimeHours: number;
}

// Storage paths
const DATA_DIR = path.join(__dirname, 'data');
const getRequestsFile = (tenantId: string) => path.join(DATA_DIR, `access-requests-${tenantId}.json`);

// Ensure data directory exists
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory may already exist
  }
}

// Load requests for a tenant
async function loadRequests(tenantId: string): Promise<AccessRequest[]> {
  await ensureDataDir();
  const filePath = getRequestsFile(tenantId);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as AccessRequest[];
  } catch {
    // File doesn't exist or is invalid, return empty array
    return [];
  }
}

// Save requests for a tenant
async function saveRequests(tenantId: string, requests: AccessRequest[]): Promise<void> {
  await ensureDataDir();
  const filePath = getRequestsFile(tenantId);
  await fs.writeFile(filePath, JSON.stringify(requests, null, 2), 'utf-8');
}

// Check and update expired requests
function processExpiredRequests(requests: AccessRequest[]): AccessRequest[] {
  const now = new Date().toISOString();
  return requests.map(r => {
    if (r.status === 'pending' && r.expiresAt && r.expiresAt < now) {
      return { ...r, status: 'expired' as AccessRequestStatus, updatedAt: now };
    }
    return r;
  });
}

/**
 * Get all access requests for a tenant with optional filters
 */
export async function getAccessRequests(
  tenantId: string,
  filters: AccessRequestFilters = {}
): Promise<AccessRequest[]> {
  let requests = await loadRequests(tenantId);
  requests = processExpiredRequests(requests);

  // Apply filters
  if (filters.status?.length) {
    requests = requests.filter(r => filters.status!.includes(r.status));
  }
  if (filters.type?.length) {
    requests = requests.filter(r => filters.type!.includes(r.type));
  }
  if (filters.requesterId) {
    requests = requests.filter(r => r.requesterId === filters.requesterId);
  }
  if (filters.resourceId) {
    requests = requests.filter(r => r.resourceId === filters.resourceId);
  }
  if (filters.fromDate) {
    requests = requests.filter(r => r.createdAt >= filters.fromDate!);
  }
  if (filters.toDate) {
    requests = requests.filter(r => r.createdAt <= filters.toDate!);
  }

  // Sort by createdAt descending (newest first)
  return requests.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Get a single access request by ID
 */
export async function getAccessRequest(
  tenantId: string,
  requestId: string
): Promise<AccessRequest | null> {
  const requests = await loadRequests(tenantId);
  return requests.find(r => r.id === requestId) || null;
}

/**
 * Create a new access request
 */
export async function createAccessRequest(
  tenantId: string,
  input: CreateAccessRequestInput
): Promise<AccessRequest> {
  const requests = await loadRequests(tenantId);

  const now = new Date().toISOString();
  const newRequest: AccessRequest = {
    id: randomUUID(),
    tenantId,
    requesterId: input.requesterId,
    requesterName: input.requesterName,
    requesterEmail: input.requesterEmail,
    type: input.type,
    status: 'pending',
    resourceId: input.resourceId,
    resourceName: input.resourceName,
    justification: input.justification,
    createdAt: now,
    updatedAt: now,
    expiresAt: input.expiresAt,
    metadata: input.metadata,
  };

  requests.push(newRequest);
  await saveRequests(tenantId, requests);

  return newRequest;
}

/**
 * Review (approve/reject) an access request
 */
export async function reviewAccessRequest(
  tenantId: string,
  requestId: string,
  input: ReviewAccessRequestInput
): Promise<AccessRequest | null> {
  const requests = await loadRequests(tenantId);
  const index = requests.findIndex(r => r.id === requestId);

  if (index === -1) return null;

  const now = new Date().toISOString();
  const updated: AccessRequest = {
    ...requests[index],
    status: input.status,
    reviewedBy: input.reviewedBy,
    reviewedByName: input.reviewedByName,
    reviewedAt: now,
    reviewNotes: input.reviewNotes,
    updatedAt: now,
  };

  requests[index] = updated;
  await saveRequests(tenantId, requests);

  return updated;
}

/**
 * Delete an access request
 */
export async function deleteAccessRequest(
  tenantId: string,
  requestId: string
): Promise<boolean> {
  const requests = await loadRequests(tenantId);
  const filtered = requests.filter(r => r.id !== requestId);

  if (filtered.length === requests.length) return false;

  await saveRequests(tenantId, filtered);
  return true;
}

/**
 * Get statistics for access requests
 */
export async function getAccessRequestStats(tenantId: string): Promise<AccessRequestStats> {
  let requests = await loadRequests(tenantId);
  requests = processExpiredRequests(requests);

  const stats: AccessRequestStats = {
    total: requests.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
    avgReviewTimeHours: 0,
  };

  let totalReviewTime = 0;
  let reviewedCount = 0;

  for (const r of requests) {
    switch (r.status) {
      case 'pending': stats.pending++; break;
      case 'approved': stats.approved++; break;
      case 'rejected': stats.rejected++; break;
      case 'expired': stats.expired++; break;
    }

    // Calculate review time for completed requests
    if (r.reviewedAt) {
      const created = new Date(r.createdAt).getTime();
      const reviewed = new Date(r.reviewedAt).getTime();
      const diffHours = (reviewed - created) / (1000 * 60 * 60);
      totalReviewTime += diffHours;
      reviewedCount++;
    }
  }

  stats.avgReviewTimeHours = reviewedCount > 0
    ? Math.round((totalReviewTime / reviewedCount) * 10) / 10
    : 0;

  return stats;
}
