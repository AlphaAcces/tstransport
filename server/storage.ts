import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, './data/aiKeys.json');

export type StoredRecord = Record<string, { cipherText: string; iv: string; tag: string }>;

export async function readAll(): Promise<StoredRecord> {
  try {
    const raw = await readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw) as StoredRecord;
  } catch (err) {
    return {};
  }
}

export async function writeAll(obj: StoredRecord): Promise<void> {
  await writeFile(DATA_PATH, JSON.stringify(obj, null, 2), 'utf8');
}

export async function getForTenant(tenantId: string) {
  const all = await readAll();
  return all[tenantId] ?? null;
}

export async function setForTenant(tenantId: string, payload: { cipherText: string; iv: string; tag: string }) {
  const all = await readAll();
  all[tenantId] = payload;
  await writeAll(all);
}

export default { readAll, writeAll, getForTenant, setForTenant };
