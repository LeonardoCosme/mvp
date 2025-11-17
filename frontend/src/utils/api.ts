// src/utils/api.ts
'use client';

import { getToken } from './auth';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Em desenvolvimento:
 *   - usa NEXT_PUBLIC_API_URL se existir
 *   - senão, cai em http://localhost:8080/api
 *
 * Em produção:
 *   - OBRIGA ter NEXT_PUBLIC_API_URL configurada
 */
const RAW_BASE = isDev
  ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api')
  : process.env.NEXT_PUBLIC_API_URL;

if (!RAW_BASE) {
  throw new Error(
    'NEXT_PUBLIC_API_URL não está configurada. ' +
      'Defina nas variáveis de ambiente (ex.: https://SEU-APP.up.railway.app/api).'
  );
}

export const API_BASE_URL = RAW_BASE.replace(/\/+$/, ''); // tira barras finais

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

type ApiOptions = RequestInit & {
  /** Se true, não envia Authorization Bearer */
  noAuth?: boolean;
};

export async function apiFetch<T = any>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { noAuth, ...fetchOptions } = options;

  const url = buildUrl(path);
  const headers = new Headers(fetchOptions.headers ?? {});

  // Só define Content-Type se não tiver sido setado
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = !noAuth ? getToken() : null;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const resp = await fetch(url, {
    ...fetchOptions,
    headers,
    cache: 'no-store',
  });

  if (!resp.ok) {
    let msg = `Erro HTTP ${resp.status}`;
    try {
      const data = await resp.json();
      if (data && typeof data === 'object') {
        msg = (data as any).message ?? (data as any).error ?? msg;
      }
      // debug
      // eslint-disable-next-line no-console
      console.error('apiFetch ERROR body JSON =>', data);
    } catch {
      const text = await resp.text();
      if (text) msg = text;
      // eslint-disable-next-line no-console
      console.error('apiFetch ERROR body TEXT =>', text);
    }
    throw new Error(msg);
  }

  const contentType = resp.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await resp.json()) as T;
  }
  return (await resp.text()) as T;
}
