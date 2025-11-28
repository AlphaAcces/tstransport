/**
 * useAccessRequests Hook
 * React hook for managing access requests state and operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  AccessRequest,
  AccessRequestCreateInput,
  AccessRequestReviewInput,
  AccessRequestFilters,
  AccessRequestStats,
} from '../types';
import * as api from '../services/accessRequestsApi';

export interface UseAccessRequestsOptions {
  tenantId: string;
  userId?: string;
  initialFilters?: AccessRequestFilters;
  autoFetch?: boolean;
}

export interface UseAccessRequestsReturn {
  // State
  requests: AccessRequest[];
  loading: boolean;
  error: string | null;
  stats: AccessRequestStats | null;

  // Filtered/computed data
  pendingRequests: AccessRequest[];
  myRequests: AccessRequest[];

  // Actions
  fetchRequests: (filters?: AccessRequestFilters) => Promise<void>;
  fetchStats: () => Promise<void>;
  createRequest: (input: AccessRequestCreateInput) => Promise<AccessRequest>;
  reviewRequest: (requestId: string, input: AccessRequestReviewInput) => Promise<void>;
  deleteRequest: (requestId: string) => Promise<void>;
  setFilters: (filters: AccessRequestFilters) => void;
  clearError: () => void;
}

export function useAccessRequests(options: UseAccessRequestsOptions): UseAccessRequestsReturn {
  const { tenantId, userId, initialFilters = {}, autoFetch = true } = options;

  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [stats, setStats] = useState<AccessRequestStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<AccessRequestFilters>(initialFilters);

  const fetchRequests = useCallback(async (customFilters?: AccessRequestFilters) => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.getAccessRequests(tenantId, customFilters || filters);
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch access requests');
    } finally {
      setLoading(false);
    }
  }, [tenantId, filters]);

  const fetchStats = useCallback(async () => {
    if (!tenantId) return;

    try {
      const data = await api.getAccessRequestStats(tenantId);
      setStats(data);
    } catch (err) {
      // Stats fetch failure is not critical, don't show error
      console.warn('Failed to fetch access request stats:', err);
    }
  }, [tenantId]);

  const createRequest = useCallback(async (input: AccessRequestCreateInput): Promise<AccessRequest> => {
    if (!tenantId || !userId) {
      throw new Error('Tenant ID and User ID are required');
    }

    setLoading(true);
    setError(null);
    try {
      const newRequest = await api.createAccessRequest(tenantId, input, userId);
      setRequests(prev => [newRequest, ...prev]);
      return newRequest;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create access request';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId, userId]);

  const reviewRequest = useCallback(async (requestId: string, input: AccessRequestReviewInput) => {
    if (!tenantId || !userId) {
      throw new Error('Tenant ID and User ID are required');
    }

    setLoading(true);
    setError(null);
    try {
      const updated = await api.reviewAccessRequest(tenantId, requestId, input, userId);
      setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to review access request';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId, userId]);

  const deleteRequest = useCallback(async (requestId: string) => {
    if (!tenantId || !userId) {
      throw new Error('Tenant ID and User ID are required');
    }

    setLoading(true);
    setError(null);
    try {
      await api.deleteAccessRequest(tenantId, requestId, userId);
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete access request';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId, userId]);

  const setFilters = useCallback((newFilters: AccessRequestFilters) => {
    setFiltersState(newFilters);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Computed data
  const pendingRequests = useMemo(() =>
    requests.filter(r => r.status === 'pending'),
    [requests]
  );

  const myRequests = useMemo(() =>
    userId ? requests.filter(r => r.requesterId === userId) : [],
    [requests, userId]
  );

  // Auto-fetch on mount and filter changes
  useEffect(() => {
    if (autoFetch && tenantId) {
      fetchRequests();
      fetchStats();
    }
  }, [autoFetch, tenantId, fetchRequests, fetchStats]);

  return {
    requests,
    loading,
    error,
    stats,
    pendingRequests,
    myRequests,
    fetchRequests,
    fetchStats,
    createRequest,
    reviewRequest,
    deleteRequest,
    setFilters,
    clearError,
  };
}
