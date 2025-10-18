// src/utils/api.ts
import { getToken } from '@/utils/auth';

const RAW_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// remove barras no fim; vamos garantir só uma barra entre base e path
export const API_BASE_URL = RAW_BASE.replace(/\/+$/, '');

function safeJsonParse(text: string) {
  try { return JSON.parse(text); } catch { return null; }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = { ...(options.headers as any) };

  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // remove barras à esquerda do path
  const cleanPath = String(path).replace(/^\/+/, '');
  const url = `${API_BASE_URL}/${cleanPath}`;

  const res = await fetch(url, { ...options, headers });
  const contentType = res.headers.get('content-type') || '';
  const raw = await res.text();
  const data = contentType.includes('application/json') ? safeJsonParse(raw) : null;

  if (!res.ok) {
    const message = (data && (data.error || data.message)) || raw || `HTTP ${res.status}`;
    throw new Error(message);
  }

  if (res.status === 204 || raw === '') return null;
  return data ?? raw;
}
