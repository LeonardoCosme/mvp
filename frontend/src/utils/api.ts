// src/utils/api.ts
import { getToken } from '../utils/auth';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://mvp-marido-aluguel.up.railway.app/api';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const finalPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${finalPath}`;

  const token = typeof getToken === 'function' ? getToken() : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log('[apiFetch] URL chamada =>', url);

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let text = '';
    try {
      text = await res.text();
    } catch {
      /* ignore */
    }
    console.error('[apiFetch] Erro HTTP', res.status, text);
    throw new Error(text || `Erro HTTP ${res.status}`);
  }

  // Alguns endpoints podem retornar vazio
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('[apiFetch] Falha ao fazer JSON.parse', e);
    // se não for JSON, devolve texto bruto
    return text as any;
  }
}
