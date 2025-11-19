// src/utils/api.ts

import { removeToken } from './auth';

export type ApiOptions = RequestInit & {
  /** Se true, não envia Authorization: Bearer token */
  noAuth?: boolean;
};

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://mvp-marido-aluguel.up.railway.app/api';

// lê sempre do localStorage
function getTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem('token');
  } catch {
    return null;
  }
}

export async function apiFetch(path: string, options: ApiOptions = {}) {
  // monta URL completa
  const url = path.startsWith('http')
    ? path
    : `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const { noAuth, headers, body, ...rest } = options;

  const finalHeaders = new Headers(headers || {});
  if (!finalHeaders.has('Accept')) {
    finalHeaders.set('Accept', 'application/json');
  }

  // ===== TOKEN / AUTH =====
  let token: string | null = null;

  if (!noAuth && typeof window !== 'undefined') {
    token = getTokenFromStorage();
  }

  if (token && !finalHeaders.has('Authorization')) {
    finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  // ===== BODY / JSON =====
  let finalBody: BodyInit | undefined = body as any;

  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData;
  const isBlob = typeof Blob !== 'undefined' && body instanceof Blob;

  if (body && !isFormData && !isBlob) {
    if (!finalHeaders.has('Content-Type')) {
      finalHeaders.set('Content-Type', 'application/json');
    }

    if (typeof body === 'object' && typeof body !== 'string') {
      finalBody = JSON.stringify(body);
    }
  }

  const resp = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: finalBody,
  });

  const text = await resp.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  // ===== TRATAMENTO DE ERRO =====
  if (!resp.ok) {
    console.error('apiFetch ERROR', resp.status, data);

    if (resp.status === 401 && typeof window !== 'undefined') {
      // se deu 401, limpamos token para evitar "semi logado"
      try {
        removeToken();
      } catch {
        try {
          window.localStorage.removeItem('token');
        } catch {
          /* ignore */
        }
      }
    }

    const baseMsg =
      (data && (data.message || data.error || data.details)) ||
      `Erro na API (${resp.status})`;

    const message =
      resp.status === 401
        ? 'Não autorizado. Faça login novamente.'
        : baseMsg;

    const err: any = new Error(message);
    err.status = resp.status;
    err.body = data;
    throw err;
  }

  return data;
}
