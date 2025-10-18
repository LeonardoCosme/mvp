// src/app/utils/auth.ts  ← ou src/utils/auth.ts, conforme sua estrutura

/**
 * Salva o token JWT no localStorage.
 * @param token Token de autenticação retornado pelo backend.
 */
export function saveToken(token: string): void {
  if (typeof window === 'undefined') return; // evita erro no SSR
  localStorage.setItem('auth_token', token);
}

/**
 * Retorna o token JWT armazenado, ou null se não houver.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * Remove o token JWT do localStorage.
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
}
