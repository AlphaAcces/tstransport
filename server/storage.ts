import { readFile, writeFile, appendFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, './data/aiKeys.json');
const AUDIT_PATH = path.resolve(__dirname, './data/audit.log');

export interface EncryptedKey {
  cipherText: string;
  iv: string;
  tag: string;
}

export interface TenantKeyRecord {
  key: EncryptedKey | null;
  lastRotated: string | null;
  rotatedBy: string | null;
  createdAt: string;
}

export type StoredRecord = Record<string, TenantKeyRecord>;

// Legacy format for backwards compatibility
export type LegacyStoredRecord = Record<string, { cipherText: string; iv: string; tag: string }>;

export async function readAll(): Promise<StoredRecord> {
  try {
    const raw = await readFile(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);

    // Migrate legacy format if needed
    const migrated: StoredRecord = {};
    for (const [tenantId, value] of Object.entries(parsed)) {
      if (value && typeof value === 'object' && 'cipherText' in value) {
        // Legacy format - migrate
        migrated[tenantId] = {
          key: value as EncryptedKey,
          lastRotated: null,
          rotatedBy: null,
          createdAt: new Date().toISOString(),
        };
      } else {
        // New format
        migrated[tenantId] = value as TenantKeyRecord;
      }
    }
    return migrated;
  } catch {
    return {};
  }
}

export async function writeAll(obj: StoredRecord): Promise<void> {
  await writeFile(DATA_PATH, JSON.stringify(obj, null, 2), 'utf8');
}

export async function getForTenant(tenantId: string): Promise<TenantKeyRecord | null> {
  const all = await readAll();
  return all[tenantId] ?? null;
}

export async function setForTenant(
  tenantId: string,
  key: EncryptedKey | null,
  userId?: string
): Promise<TenantKeyRecord> {
  const all = await readAll();
  const now = new Date().toISOString();

  const record: TenantKeyRecord = {
    key,
    lastRotated: key ? now : null,
    rotatedBy: key ? (userId ?? 'system') : null,
    createdAt: all[tenantId]?.createdAt ?? now,
  };

  all[tenantId] = record;
  await writeAll(all);
  return record;
}

// Audit logging
export interface AuditEntry {
  timestamp: string;
  tenantId: string;
  userId: string;
  action: 'key:created' | 'key:rotated' | 'key:deleted' | 'key:accessed';
  details?: string;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  const line = JSON.stringify(entry) + '\n';
  try {
    await appendFile(AUDIT_PATH, line, 'utf8');
  } catch {
    // Create file if it doesn't exist
    await writeFile(AUDIT_PATH, line, 'utf8');
  }
}

export async function getAuditLog(tenantId?: string, limit = 100): Promise<AuditEntry[]> {
  try {
    const raw = await readFile(AUDIT_PATH, 'utf8');
    const lines = raw.trim().split('\n').filter(Boolean);
    let entries = lines.map(line => JSON.parse(line) as AuditEntry);

    if (tenantId) {
      entries = entries.filter(e => e.tenantId === tenantId);
    }

    return entries.slice(-limit).reverse();
  } catch {
    return [];
  }
}

export default { readAll, writeAll, getForTenant, setForTenant, logAudit, getAuditLog };
