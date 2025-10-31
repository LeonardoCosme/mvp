// src/utils/api.ts
import { getToken } from '@/utils/auth';

/**
 * 🔧 Detecta automaticamente o ambiente e ajusta a URL base da API
 * - Local: http://localhost:3001/api
 * - Produção (ex: Vercel): usa NEXT_PUBLIC_API_URL ou gera automaticamente
 */
const isServer = typeof window === 'undefined';

let API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:3001/api';

// Se estiver rodando em produção sem variável definida, gera automaticamente
if (!isServer && window.location.hostname.includes('vercel.app')) {
  const origin = window.location.origin.replace('https://', 'https://api.');
  API_BASE_URL = `${origin}/api`;
}

/**
 * Faz o parse seguro de JSON, evitando erros em respostas vazias.
 */
function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export type ApiInit = Omit<RequestInit, 'headers'> & {
  auth?: boolean;
  headers?: HeadersInit;
};

/**
 * Função genérica de requisição à API
 * Exemplo: apiFetch('auth/login', { method: 'POST', body: JSON.stringify({...}) })
 */
export async function apiFetch(path: string, options: ApiInit = {}): Promise<any> {
  const { auth = true, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders || undefined);

  const hasBody = rest.body !== undefined && rest.body !== null;
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // 🔑 Adiciona token JWT se solicitado
  if (auth) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const cleanPath = String(path).replace(/^\/+/, '');
  const url = `${API_BASE_URL}/${cleanPath}`;

  const res = await fetch(url, { ...rest, headers });
  const contentType = res.headers.get('content-type') || '';
  const raw = await res.text();
  const data = contentType.includes('application/json')
    ? safeJsonParse(raw)
    : null;

  // ❌ Erro tratado
  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) || raw || `Erro HTTP ${res.status}`;
    throw new Error(message);
  }

  // ✅ Sucesso
  if (res.status === 204 || raw === '') return null;
  return data ?? raw;
}

export { API_BASE_URL };
