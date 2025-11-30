/**
 * IntelVaultView Component
 *
 * Document management interface with search, filtering, and pagination.
 * - Responsive: Card view on mobile (<768px), table on desktop
 * - Slide-in filter panel with overlay
 * - Improved accessibility with tooltips and ARIA
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  Shield,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
  X,
  FolderOpen,
  FileSpreadsheet,
  FileJson,
  File,
  Image,
  SortAsc,
  SortDesc,
  RefreshCw,
} from 'lucide-react';
import { useVault, formatFileSize, type VaultDocument, type SecurityLevel } from '../../domains/vault';

// ============================================================================
// Helper Components
// ============================================================================

function SecurityBadge({ level }: { level: SecurityLevel }) {
  const { t } = useTranslation();

  // Use centralized badge CSS classes
  const classMap: Record<SecurityLevel, string> = {
    'unclassified': 'badge-security-unclassified',
    'confidential': 'badge-security-confidential',
    'secret': 'badge-security-secret',
    'top-secret': 'badge-security-top-secret',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${classMap[level]}`}>
      <Shield className="w-3 h-3" aria-hidden="true" />
      {t(`vault.security.${level}`)}
    </span>
  );
}

function FileTypeIcon({ type }: { type: string }) {
  const iconClass = 'w-5 h-5 text-slate-500';

  switch (type) {
    case 'pdf':
      return <FileText className={iconClass} style={{ color: '#e74c3c' }} />;
    case 'docx':
      return <FileText className={iconClass} style={{ color: '#2980b9' }} />;
    case 'xlsx':
      return <FileSpreadsheet className={iconClass} style={{ color: '#27ae60' }} />;
    case 'json':
      return <FileJson className={iconClass} style={{ color: '#f39c12' }} />;
    case 'csv':
      return <FileSpreadsheet className={iconClass} style={{ color: '#16a085' }} />;
    case 'image':
      return <Image className={iconClass} />;
    default:
      return <File className={iconClass} />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();

  const config: Record<string, { bg: string; text: string }> = {
    'draft': { bg: 'bg-slate-100', text: 'text-slate-600' },
    'active': { bg: 'bg-green-100', text: 'text-green-700' },
    'archived': { bg: 'bg-gray-100', text: 'text-gray-600' },
    'pending-review': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  };

  const style = config[status] || config.draft;

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}>
      {t(`vault.status.${status}`)}
    </span>
  );
}

// ============================================================================
// Document Row Component
// ============================================================================

interface DocumentRowProps {
  document: VaultDocument;
  onView: (doc: VaultDocument) => void;
}

function DocumentRow({ document, onView }: DocumentRowProps) {
  const { t } = useTranslation();

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-gray-800/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <FileTypeIcon type={document.fileType} />
          <div className="min-w-0">
            <p className="font-medium text-slate-900 dark:text-gray-200 text-sm truncate">{document.title}</p>
            <p className="text-xs text-slate-500 dark:text-gray-500 truncate">{document.filename}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-sm text-slate-600 dark:text-gray-400 capitalize">
          {t(`vault.category.${document.category}`)}
        </span>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <SecurityBadge level={document.securityLevel} />
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <StatusBadge status={document.status} />
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 dark:text-gray-400 hidden lg:table-cell">
        {formatFileSize(document.size)}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 dark:text-gray-400 hidden md:table-cell">
        {new Date(document.updatedAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(document)}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title={t('vault.actions.view')}
            aria-label={t('vault.actions.viewAriaLabel', { title: document.title, defaultValue: `Vis ${document.title}` })}
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title={t('vault.actions.download')}
            aria-label={t('vault.actions.downloadAriaLabel', { title: document.title, defaultValue: `Download ${document.title}` })}
          >
            <Download className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ============================================================================
// Document Card Component (Mobile View)
// ============================================================================

interface DocumentCardProps {
  document: VaultDocument;
  onView: (doc: VaultDocument) => void;
}

function DocumentCard({ document, onView }: DocumentCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-component-dark rounded-lg border border-slate-200 dark:border-border-dark p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <FileTypeIcon type={document.fileType} />
          <div className="min-w-0">
            <p className="font-medium text-slate-900 dark:text-gray-200 text-sm truncate">{document.title}</p>
            <p className="text-xs text-slate-500 dark:text-gray-500 truncate">{document.filename}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onView(document)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 transition-colors"
            title={t('vault.actions.view')}
            aria-label={t('vault.actions.viewAriaLabel', { title: document.title, defaultValue: `Vis ${document.title}` })}
          >
            <Eye className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 transition-colors"
            title={t('vault.actions.download')}
            aria-label={t('vault.actions.downloadAriaLabel', { title: document.title, defaultValue: `Download ${document.title}` })}
          >
            <Download className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SecurityBadge level={document.securityLevel} />
        <StatusBadge status={document.status} />
        <span className="text-xs text-slate-500 dark:text-gray-500">
          {formatFileSize(document.size)}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-500">
        <span className="capitalize">{t(`vault.category.${document.category}`)}</span>
        <span>{new Date(document.updatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

// ============================================================================
// Document Detail Modal
// ============================================================================

interface DocumentDetailModalProps {
  document: VaultDocument;
  onClose: () => void;
}

function DocumentDetailModal({ document, onClose }: DocumentDetailModalProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <FileTypeIcon type={document.fileType} />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{document.title}</h2>
              <p className="text-sm text-slate-500">{document.filename}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Badges */}
          <div className="flex items-center gap-3">
            <SecurityBadge level={document.securityLevel} />
            <StatusBadge status={document.status} />
          </div>

          {/* Description */}
          {document.description && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-1">
                {t('vault.detail.description')}
              </h3>
              <p className="text-sm text-slate-600">{document.description}</p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-1">
                {t('vault.detail.category')}
              </h3>
              <p className="text-sm text-slate-600 capitalize">
                {t(`vault.category.${document.category}`)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-1">
                {t('vault.detail.size')}
              </h3>
              <p className="text-sm text-slate-600">{formatFileSize(document.size)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-1">
                {t('vault.detail.createdAt')}
              </h3>
              <p className="text-sm text-slate-600">
                {new Date(document.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-1">
                {t('vault.detail.updatedAt')}
              </h3>
              <p className="text-sm text-slate-600">
                {new Date(document.updatedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-1">
                {t('vault.detail.createdBy')}
              </h3>
              <p className="text-sm text-slate-600">{document.createdBy}</p>
            </div>
            {document.caseId && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-1">
                  {t('vault.detail.caseId')}
                </h3>
                <p className="text-sm text-slate-600">{document.caseId}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {document.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">
                {t('vault.detail.tags')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {t('common.close')}
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            {t('vault.actions.download')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function IntelVaultView() {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [viewingDocument, setViewingDocument] = useState<VaultDocument | null>(null);

  const {
    documents,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    searchParams,
    filterOptions,
    setQuery,
    setFilters,
    clearFilters,
    setPage,
    setSort,
    refresh,
  } = useVault();

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput);
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchParams.category) count++;
    if (searchParams.securityLevel) count++;
    if (searchParams.status) count++;
    if (searchParams.fileType) count++;
    if (searchParams.caseId) count++;
    return count;
  }, [searchParams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FolderOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('vault.title')}</h1>
            <p className="text-sm text-slate-500">{t('vault.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          title={t('common.refresh')}
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('vault.search.placeholder')}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </form>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            {t('vault.filters.title')}
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              {t('vault.filters.clear')}
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && filterOptions && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('vault.filters.category')}
              </label>
              <select
                value={searchParams.category || ''}
                onChange={(e) => setFilters({ category: e.target.value || undefined } as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('vault.filters.all')}</option>
                {filterOptions.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(`vault.category.${cat}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Security Level Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('vault.filters.securityLevel')}
              </label>
              <select
                value={searchParams.securityLevel || ''}
                onChange={(e) => setFilters({ securityLevel: e.target.value || undefined } as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('vault.filters.all')}</option>
                {filterOptions.securityLevels.map((level) => (
                  <option key={level} value={level}>
                    {t(`vault.security.${level}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('vault.filters.status')}
              </label>
              <select
                value={searchParams.status || ''}
                onChange={(e) => setFilters({ status: e.target.value || undefined } as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('vault.filters.all')}</option>
                {filterOptions.statuses.map((status) => (
                  <option key={status} value={status}>
                    {t(`vault.status.${status}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Case ID Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('vault.filters.caseId')}
              </label>
              <select
                value={searchParams.caseId || ''}
                onChange={(e) => setFilters({ caseId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('vault.filters.all')}</option>
                {filterOptions.caseIds.map((caseId) => (
                  <option key={caseId} value={caseId}>
                    {caseId}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          {t('vault.results.showing', {
            from: (page - 1) * pageSize + 1,
            to: Math.min(page * pageSize, total),
            total,
          })}
        </span>
        <div className="flex items-center gap-2">
          <span>{t('vault.sort.label')}</span>
          <button
            onClick={() => setSort('updatedAt', searchParams.sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
          >
            <Calendar className="w-4 h-4" />
            {t('vault.sort.date')}
            {searchParams.sortOrder === 'desc' ? (
              <SortDesc className="w-3 h-3" />
            ) : (
              <SortAsc className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Documents - Mobile Card View */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" aria-label={t('common.loading', 'Indlæser...')} />
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-state" role="status" aria-live="polite">
            <FolderOpen className="empty-state-icon" aria-hidden="true" />
            <h3 className="empty-state-title">{t('vault.empty.title')}</h3>
            <p className="empty-state-description">{t('vault.empty.description')}</p>
          </div>
        ) : (
          documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onView={setViewingDocument}
            />
          ))
        )}
      </div>

      {/* Documents - Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-component-dark rounded-lg border border-slate-200 dark:border-border-dark overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" aria-label={t('common.loading', 'Indlæser...')} />
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-state" role="status" aria-live="polite">
            <FolderOpen className="empty-state-icon" aria-hidden="true" />
            <h3 className="empty-state-title">{t('vault.empty.title')}</h3>
            <p className="empty-state-description">{t('vault.empty.description')}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-border-dark">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('vault.table.document')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  {t('vault.table.category')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('vault.table.security')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  {t('vault.table.status')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  {t('vault.table.size')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  {t('vault.table.modified')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('vault.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-border-dark">
              {documents.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  document={doc}
                  onView={setViewingDocument}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                p === page
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Document Detail Modal */}
      {viewingDocument && (
        <DocumentDetailModal
          document={viewingDocument}
          onClose={() => setViewingDocument(null)}
        />
      )}
    </div>
  );
}
