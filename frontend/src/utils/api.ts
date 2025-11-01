// src/utils/api.ts
import { getToken } from '@/utils/auth';

// 🌎 Define automaticamente o endpoint da API conforme o ambiente
const getBaseApiUrl = (): string => {
  // ✅ 1) Usa variável de ambiente se estiver definida (melhor prática)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // ✅ 2) Detecta se está rodando localmente
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3001/api';
  }

  // ✅ 3) Detecta se está na Vercel (frontend hospedado)
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://mvp-marido-aluguel.up.railway.app/api';
  }

  // ✅ 4) Fallback padrão
  return 'https://mvp-marido-aluguel.up.railway.app/api';
};

export const API_BASE_URL = getBaseApiUrl();

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

// 🚀 Função genérica para requisições à API
export async function apiFetch(path: string, options: ApiInit = {}): Promise<any> {
  const { auth = true, headers: initHeaders, ...rest } = options;

  const headers = new Headers(initHeaders || undefined);
  const hasBody = rest.body !== undefined && rest.body !== null;

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

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

  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) || raw || `HTTP ${res.status}`;
    throw new Error(message);
  }

  if (res.status === 204 || raw === '') return null;
  return data ?? raw;
}
