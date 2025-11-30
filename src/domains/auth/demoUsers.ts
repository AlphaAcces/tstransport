import { AuthRole, AuthUser } from './types';

interface DemoUserRecord {
  password: string;
  role: AuthRole;
  displayName?: string;
}

// TODO: Erstat statisk user-map med rigtigt /api/auth/login backend-endpoint.
const DEMO_USERS: Record<string, DemoUserRecord> = {
  AlphaGrey: { password: 'Nex212325', role: 'admin', displayName: 'Alpha Grey' },
  'cetin.umit.TS': { password: '26353569', role: 'user', displayName: 'Cetin Ümit' },
};

export const authenticateDemoUser = (username: string, password: string): AuthUser | null => {
  const record = DEMO_USERS[username];
  if (!record || record.password !== password) {
    return null;
  }
  return { id: username, role: record.role, name: record.displayName };
};

export const getDemoUser = (username: string): AuthUser | null => {
  const record = DEMO_USERS[username];
  if (!record) return null;
  return { id: username, role: record.role, name: record.displayName };
};

export const coerceAuthRole = (role: unknown): AuthRole => (role === 'admin' ? 'admin' : 'user');
