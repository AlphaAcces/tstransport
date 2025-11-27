import React, { useEffect, useState } from 'react';
import { useOptionalTenant } from '../../domains/tenant';

const AiKeySettings: React.FC = () => {
  const tenantCtx = useOptionalTenant();
  if (!tenantCtx) return null;

  const { tenant, hasPermission } = tenantCtx;
  const canConfigure = hasPermission('ai:configure');

  const [key, setKey] = useState<string>('');
  const [hasStored, setHasStored] = useState<boolean>(false);
  const [masked, setMasked] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchStatus() {
      if (!tenant) return setLoading(false);
      try {
        const headers: Record<string, string> = {};
        if (canConfigure) headers['x-user-permissions'] = 'ai:configure';
        const res = await fetch(`/api/tenant/${tenant.id}/aiKey`, { headers });
        if (res.ok) {
          const body = await res.json();
          if (mounted) setHasStored(Boolean(body?.exists));
        } else {
          if (mounted) setHasStored(false);
        }
      } catch (e) {
        if (mounted) setHasStored(false);
      } finally { if (mounted) setLoading(false); }
    }
    fetchStatus();
    return () => { mounted = false; };
  }, [tenant, canConfigure]);

  const onSave = async () => {
    if (!canConfigure) return;
    setSaving(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (canConfigure) headers['x-user-permissions'] = 'ai:configure';
      if (!tenant) return;
      const res = await fetch(`/api/tenant/${tenant.id}/aiKey`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ aiKey: key || null }),
      });
      if (res.ok) {
        setKey('');
        setHasStored(true);
      } else {
        // handle error briefly
        // eslint-disable-next-line no-console
        console.error('failed to save AI key', await res.text());
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="p-4 bg-base-dark rounded-md border border-border-dark">
      <h3 className="font-semibold mb-2">AI API Key (tenant-scoped)</h3>
      <div className="flex items-center space-x-2">
        <input
          type={masked ? 'password' : 'text'}
          value={key}
          onChange={e => setKey(e.target.value)}
          disabled={!canConfigure}
          className="bg-surface p-2 rounded w-full"
          placeholder={loading ? 'Checking stored key…' : hasStored ? 'Key is stored (hidden)' : 'Paste tenant AI key'}
          aria-label="AI API Key"
        />
        <button type="button" onClick={() => setMasked(m => !m)} className="px-2 py-1 bg-secondary rounded text-xs">{masked ? 'Show' : 'Hide'}</button>
      </div>

      <div className="mt-3 flex items-center space-x-2">
        <button disabled={!canConfigure || saving} onClick={onSave} className="px-3 py-1 bg-primary rounded text-sm">{saving ? 'Saving…' : 'Save'}</button>
        {!canConfigure && <div className="text-xs text-gray-400">You need the <code>ai:configure</code> permission to update the tenant AI key.</div>}
      </div>
    </div>
  );
};

export default AiKeySettings;
