// Token + API_BASE helpers for branch-pos.
// The actual fetch interceptor lives in main.tsx so all existing role views
// keep working without modification.

export const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api`;
export const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const TOKEN_KEY = 'pos.authToken';
const BRANCH_KEY = 'pos.branchId';

export const auth = {
  setSession(token: string, branchId: string) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(BRANCH_KEY, branchId);
  },
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  getBranchId(): string | null {
    return localStorage.getItem(BRANCH_KEY);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(BRANCH_KEY);
  },
  isLoggedIn(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

/** ส่ง Authorization header พร้อม JWT ของ POS (ถ้ามี) */
export function authHeaders(): Record<string, string> {
  const token = auth.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
