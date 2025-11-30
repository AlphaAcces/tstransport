export type AuthRole = 'admin' | 'user';

export interface AuthUser {
  id: string;
  role: AuthRole;
  name?: string;
}
