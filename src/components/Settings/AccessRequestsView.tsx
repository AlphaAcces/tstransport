/**
 * AccessRequestsView
 * Admin interface for managing access requests
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  User,
  FileText,
  Calendar,
  RefreshCw,
  X,
} from 'lucide-react';
import { useOptionalTenant } from '../../domains/tenant';
import { useAccessRequests } from '../../domains/accessRequests';
import type { AccessRequest, AccessRequestStatus, AccessRequestType } from '../../domains/accessRequests';

// Status badge colors
const statusConfig: Record<AccessRequestStatus, { bg: string; text: string; icon: typeof CheckCircle }> = {
  pending: { bg: 'bg-[var(--color-warning)]/10', text: 'text-[var(--color-warning)]', icon: Clock },
  approved: { bg: 'bg-[var(--color-success)]/10', text: 'text-[var(--color-success)]', icon: CheckCircle },
  rejected: { bg: 'bg-[var(--color-danger)]/10', text: 'text-[var(--color-danger)]', icon: XCircle },
  expired: { bg: 'bg-[var(--color-text-muted)]/10', text: 'text-[var(--color-text-muted)]', icon: AlertTriangle },
};

// Type display names
const typeLabels: Record<AccessRequestType, string> = {
  feature_access: 'Feature Access',
  data_export: 'Data Export',
  elevated_permission: 'Elevated Permission',
  case_access: 'Case Access',
  api_access: 'API Access',
};

interface RequestCardProps {
  request: AccessRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  canReview: boolean;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onApprove,
  onReject,
  onDelete,
  canReview,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');

  const status = statusConfig[request.status];
  const StatusIcon = status.icon;

  const handleReject = () => {
    onReject(request.id);
    setShowRejectDialog(false);
    setRejectNotes('');
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden hover:border-[var(--color-primary)]/30 transition-colors">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Status Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg}`}>
            <StatusIcon className={`w-3.5 h-3.5 ${status.text}`} />
            <span className={`text-xs font-medium ${status.text} capitalize`}>
              {t(`accessRequests.status.${request.status}`)}
            </span>
          </div>

          {/* Request Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--color-text)] truncate">
                {request.resourceName}
              </span>
              <span className="text-xs px-2 py-0.5 bg-[var(--color-background)] rounded text-[var(--color-text-muted)]">
                {typeLabels[request.type]}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-text-muted)]">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {request.requesterName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(request.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Expand Toggle */}
        <button className="p-1 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-[var(--color-text-muted)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--color-text-muted)]" />
          )}
        </button>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-[var(--color-border)] p-4 space-y-4">
          {/* Justification */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
              {t('accessRequests.justification')}
            </label>
            <p className="text-sm text-[var(--color-text)] bg-[var(--color-background)] p-3 rounded-lg">
              {request.justification}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-[var(--color-text-muted)]">
                {t('accessRequests.requester')}
              </label>
              <span className="text-sm text-[var(--color-text)]">{request.requesterName}</span>
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-muted)]">
                {t('accessRequests.email')}
              </label>
              <span className="text-sm text-[var(--color-text)]">{request.requesterEmail}</span>
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-muted)]">
                {t('accessRequests.created')}
              </label>
              <span className="text-sm text-[var(--color-text)]">
                {new Date(request.createdAt).toLocaleString()}
              </span>
            </div>
            {request.expiresAt && (
              <div>
                <label className="block text-xs text-[var(--color-text-muted)]">
                  {t('accessRequests.expires')}
                </label>
                <span className="text-sm text-[var(--color-text)]">
                  {new Date(request.expiresAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Review Info (if reviewed) */}
          {request.reviewedAt && (
            <div className="border-t border-[var(--color-border)] pt-4">
              <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-2">
                {t('accessRequests.reviewInfo')}
              </label>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[var(--color-text-muted)]">
                  {t('accessRequests.reviewedBy')}: <span className="text-[var(--color-text)]">{request.reviewedByName}</span>
                </span>
                <span className="text-[var(--color-text-muted)]">
                  {new Date(request.reviewedAt).toLocaleString()}
                </span>
              </div>
              {request.reviewNotes && (
                <p className="text-sm text-[var(--color-text)] bg-[var(--color-background)] p-3 rounded-lg mt-2">
                  {request.reviewNotes}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {request.status === 'pending' && canReview && (
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)]">
              <button
                onClick={(e) => { e.stopPropagation(); onApprove(request.id); }}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {t('accessRequests.approve')}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowRejectDialog(true); }}
                className="flex items-center gap-2 px-4 py-2 border border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-lg text-sm font-medium transition-colors"
              >
                <XCircle className="w-4 h-4" />
                {t('accessRequests.reject')}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(request.id); }}
                className="ml-auto text-[var(--color-text-muted)] hover:text-[var(--color-danger)] text-sm transition-colors"
              >
                {t('accessRequests.delete')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowRejectDialog(false)}
        >
          <div
            className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] max-w-md w-full p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">
                {t('accessRequests.rejectDialog.title')}
              </h3>
              <button
                onClick={() => setShowRejectDialog(false)}
                className="p-1 hover:bg-[var(--color-surface-hover)] rounded-lg"
              >
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                {t('accessRequests.rejectDialog.notesLabel')}
              </label>
              <textarea
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                placeholder={t('accessRequests.rejectDialog.notesPlaceholder')}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="px-4 py-2 text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] rounded-lg text-sm font-medium transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleReject}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/90 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <XCircle className="w-4 h-4" />
                {t('accessRequests.reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AccessRequestsView: React.FC = () => {
  const { t } = useTranslation();
  const tenantCtx = useOptionalTenant();

  // State
  const [statusFilter, setStatusFilter] = useState<AccessRequestStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AccessRequestType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const tenantId = tenantCtx?.tenant?.id || 'default';
  const userId = 'current-user'; // In real app, get from auth
  const canReview = tenantCtx?.hasPermission('access:review') ?? false;

  const {
    requests,
    loading,
    error,
    stats,
    reviewRequest,
    deleteRequest,
    fetchRequests,
    clearError,
  } = useAccessRequests({
    tenantId,
    userId,
    autoFetch: true,
  });

  // Filtered requests
  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(r => r.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.resourceName.toLowerCase().includes(query) ||
        r.requesterName.toLowerCase().includes(query) ||
        r.justification.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [requests, statusFilter, typeFilter, searchQuery]);

  const handleApprove = async (requestId: string) => {
    try {
      await reviewRequest(requestId, { status: 'approved' });
    } catch {
      // Error is already set in the hook
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await reviewRequest(requestId, { status: 'rejected' });
    } catch {
      // Error is already set in the hook
    }
  };

  const handleDelete = async (requestId: string) => {
    if (window.confirm(t('accessRequests.deleteConfirm'))) {
      try {
        await deleteRequest(requestId);
      } catch {
        // Error is already set in the hook
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg">
            <Shield className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">
              {t('accessRequests.title')}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {t('accessRequests.description')}
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchRequests()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('accessRequests.refresh')}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
            <div className="text-2xl font-bold text-[var(--color-text)]">{stats.total}</div>
            <div className="text-sm text-[var(--color-text-muted)]">{t('accessRequests.stats.total')}</div>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
            <div className="text-2xl font-bold text-[var(--color-warning)]">{stats.pending}</div>
            <div className="text-sm text-[var(--color-text-muted)]">{t('accessRequests.stats.pending')}</div>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
            <div className="text-2xl font-bold text-[var(--color-success)]">{stats.approved}</div>
            <div className="text-sm text-[var(--color-text-muted)]">{t('accessRequests.stats.approved')}</div>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
            <div className="text-2xl font-bold text-[var(--color-danger)]">{stats.rejected}</div>
            <div className="text-sm text-[var(--color-text-muted)]">{t('accessRequests.stats.rejected')}</div>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
            <div className="text-2xl font-bold text-[var(--color-text)]">{stats.avgReviewTimeHours}h</div>
            <div className="text-sm text-[var(--color-text-muted)]">{t('accessRequests.stats.avgReviewTime')}</div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('accessRequests.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Filter Toggle (Mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex md:hidden items-center gap-2 px-3 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-text-muted)]"
          >
            <Filter className="w-4 h-4" />
            {t('accessRequests.filters')}
          </button>

          {/* Filter Dropdowns */}
          <div className={`flex flex-wrap items-center gap-3 w-full md:w-auto ${showFilters ? 'flex' : 'hidden md:flex'}`}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as AccessRequestStatus | 'all')}
              className="px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="all">{t('accessRequests.filterStatus.all')}</option>
              <option value="pending">{t('accessRequests.status.pending')}</option>
              <option value="approved">{t('accessRequests.status.approved')}</option>
              <option value="rejected">{t('accessRequests.status.rejected')}</option>
              <option value="expired">{t('accessRequests.status.expired')}</option>
            </select>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as AccessRequestType | 'all')}
              className="px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="all">{t('accessRequests.filterType.all')}</option>
              <option value="feature_access">{typeLabels.feature_access}</option>
              <option value="data_export">{typeLabels.data_export}</option>
              <option value="elevated_permission">{typeLabels.elevated_permission}</option>
              <option value="case_access">{typeLabels.case_access}</option>
              <option value="api_access">{typeLabels.api_access}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-xl text-[var(--color-danger)]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="p-1 hover:bg-[var(--color-danger)]/20 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Request List */}
      <div className="space-y-3">
        {loading && requests.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-[var(--color-text-muted)]">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            {t('accessRequests.loading')}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
            <FileText className="w-12 h-12 mb-3 opacity-50" />
            <span className="text-lg font-medium">{t('accessRequests.noRequests')}</span>
            <span className="text-sm">{t('accessRequests.noRequestsHint')}</span>
          </div>
        ) : (
          filteredRequests.map(request => (
            <RequestCard
              key={request.id}
              request={request}
              onApprove={handleApprove}
              onReject={handleReject}
              onDelete={handleDelete}
              canReview={canReview}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AccessRequestsView;
