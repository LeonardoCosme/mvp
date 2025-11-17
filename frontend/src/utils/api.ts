// src/utils/api.ts
'use client';

import { getToken } from './auth';

/**
 * Base da API (Railway).
 * - Em produção: use NEXT_PUBLIC_API_URL = https://mvp-marido-aluguel.up.railway.app/api
 * - Em dev: pode deixar o .env.local com http://localhost:8080/api
 */
const RAW_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://mvp-marido-aluguel.up.railway.app/api';

export const API_BASE_URL = RAW_BASE.replace(/\/+$/, ''); // tira barras no final

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const url = buildUrl(path);
  const token = getToken();

  const headers = new Headers(options.headers ?? {});
  // Só define Content-Type se não tiver sido setado (útil para form-data etc)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const resp = await fetch(url, {
    ...options,
    headers,
    // evita cache agressivo no navegador
    cache: 'no-store',
  });

  if (!resp.ok) {
    let msg = `Erro HTTP ${resp.status}`;
    try {
      const data = await resp.json();
      if (data && typeof data === 'object') {
        msg = (data.message as string) ?? msg;
      }
      // log detalhado pra debug
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
    return resp.json();
  }
  return resp.text();
}
