// src/utils/api.ts
import { getToken } from './auth';

// Tenta ler de várias envs possíveis e cai no Railway se estiver vazio
const RAW_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://mvp-marido-aluguel.up.railway.app/api';

// remove / no final, se tiver
const API_BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

type ApiOptions = RequestInit & {
  /** Se true, não envia Authorization mesmo tendo token */
  noAuth?: boolean;
};

function buildUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const ts = Date.now();
  const sep = cleanPath.includes('?') ? '&' : '?';

  // Ex: https://.../api + /tipos-servico + ?_=12345
  return `${API_BASE_URL}${cleanPath}${sep}_=${ts}`;
}

export async function apiFetch<T = any>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { noAuth, ...fetchOptions } = options;

  const token = getToken();
  const headers: HeadersInit = {
    ...(fetchOptions.headers || {}),
  };

  const isFormData = fetchOptions.body instanceof FormData;
  const hasContentTypeHeader = Object.keys(headers).some(
    (k) => k.toLowerCase() === 'content-type',
  );

  // Só seta Content-Type JSON se não for FormData e se for método com body
  if (
    !isFormData &&
    !hasContentTypeHeader &&
    fetchOptions.method &&
    fetchOptions.method !== 'GET'
  ) {
    headers['Content-Type'] = 'application/json';
  }

  // Adiciona Authorization, exceto se pedirmos noAuth
  if (!noAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = buildUrl(path);

  const res = await fetch(url, {
    cache: 'no-store', // evita cache do Next/Vercel
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    let text = '';
    try {
      text = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(text || `Erro HTTP ${res.status}`);
  }

  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }

  // fallback para texto, se algum endpoint não devolver JSON
  return (await res.text()) as T;
}
