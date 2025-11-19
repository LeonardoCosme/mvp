// frontend/src/utils/auth.ts

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem('token');
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('token', token);
  } catch {
    /* ignore */
  }
}

export function removeToken() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('token');
  } catch {
    /* ignore */
  }
}
