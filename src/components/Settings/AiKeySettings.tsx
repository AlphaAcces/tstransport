import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, RefreshCw, Trash2, Eye, EyeOff, Shield, Clock, User, AlertTriangle } from 'lucide-react';
import { useOptionalTenant } from '../../domains/tenant';

interface KeyStatus {
  exists: boolean;
  lastRotated: string | null;
  rotatedBy: string | null;
}

const AiKeySettings: React.FC = () => {
  const { t } = useTranslation();
  const tenantCtx = useOptionalTenant();

  const tenant = tenantCtx?.tenant;
  const hasPermission = tenantCtx?.hasPermission;
  const canConfigure = hasPermission?.('ai:configure') ?? false;

  const [key, setKey] = useState<string>('');
  const [keyStatus, setKeyStatus] = useState<KeyStatus>({ exists: false, lastRotated: null, rotatedBy: null });
  const [masked, setMasked] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getHeaders = React.useCallback((): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (canConfigure) headers['x-user-permissions'] = 'ai:configure';
    return headers;
  }, [canConfigure]);

  useEffect(() => {
    let mounted = true;
    async function fetchStatus() {
      if (!tenant) return setLoading(false);
      try {
        const res = await fetch(`/api/tenant/${tenant.id}/aiKey`, { headers: getHeaders() });
        if (res.ok) {
          const body = await res.json();
          if (mounted) {
            setKeyStatus({
              exists: Boolean(body?.exists),
              lastRotated: body?.lastRotated || null,
              rotatedBy: body?.rotatedBy || null,
            });
          }
        } else {
          if (mounted) setKeyStatus({ exists: false, lastRotated: null, rotatedBy: null });
        }
      } catch {
        if (mounted) setKeyStatus({ exists: false, lastRotated: null, rotatedBy: null });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchStatus();
    return () => { mounted = false; };
  }, [tenant, canConfigure, getHeaders]);

  // Early return after all hooks
  if (!tenantCtx) return null;

  const onSave = async () => {
    if (!canConfigure || !tenant || !key.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tenant/${tenant.id}/aiKey`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ aiKey: key }),
      });
      if (res.ok) {
        const body = await res.json();
        setKey('');
        setKeyStatus({
          exists: true,
          lastRotated: body.lastRotated,
          rotatedBy: body.rotatedBy,
        });
      } else {
        setError(t('aiKey.error.saveFailed'));
      }
    } catch {
      setError(t('aiKey.error.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!canConfigure || !tenant) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tenant/${tenant.id}/aiKey`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        setKeyStatus({ exists: false, lastRotated: null, rotatedBy: null });
        setShowDeleteConfirm(false);
      } else {
        setError(t('aiKey.error.deleteFailed'));
      }
    } catch {
      setError(t('aiKey.error.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return t('common.never');
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)]">
        <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg">
          <Key className="w-5 h-5 text-[var(--color-primary)]" />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--color-text)]">{t('aiKey.title')}</h3>
          <p className="text-sm text-[var(--color-text-muted)]">{t('aiKey.description')}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${keyStatus.exists ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]'}`} />
            <span className={`text-sm font-medium ${keyStatus.exists ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]'}`}>
              {keyStatus.exists ? t('aiKey.status.configured') : t('aiKey.status.notConfigured')}
            </span>
          </div>
          {keyStatus.exists && keyStatus.lastRotated && (
            <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t('aiKey.lastRotated')}: {formatDate(keyStatus.lastRotated)}
              </span>
              {keyStatus.rotatedBy && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {keyStatus.rotatedBy}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg text-[var(--color-danger)] text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Input Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            {keyStatus.exists ? t('aiKey.inputLabelRotate') : t('aiKey.inputLabel')}
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={masked ? 'password' : 'text'}
                value={key}
                onChange={e => setKey(e.target.value)}
                disabled={!canConfigure || loading}
                className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:opacity-50"
                placeholder={loading ? t('aiKey.loading') : t('aiKey.placeholder')}
                aria-label={t('aiKey.inputLabel')}
              />
            </div>
            <button
              type="button"
              onClick={() => setMasked(m => !m)}
              className="p-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
              title={masked ? t('aiKey.show') : t('aiKey.hide')}
            >
              {masked ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <button
              disabled={!canConfigure || saving || !key.trim()}
              onClick={onSave}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              {saving ? t('aiKey.saving') : (keyStatus.exists ? t('aiKey.rotate') : t('aiKey.save'))}
            </button>

            {keyStatus.exists && (
              <button
                disabled={!canConfigure || deleting}
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 border border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                {t('aiKey.delete')}
              </button>
            )}
          </div>

          {!canConfigure && (
            <p className="text-xs text-[var(--color-text-muted)]">
              {t('aiKey.noPermission')}
            </p>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--color-danger)]/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-[var(--color-danger)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text)]">{t('aiKey.deleteConfirm.title')}</h3>
            </div>
            <p className="text-[var(--color-text-muted)]">{t('aiKey.deleteConfirm.message')}</p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] rounded-lg text-sm font-medium transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={onDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? t('aiKey.deleting') : t('aiKey.deleteConfirm.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiKeySettings;
