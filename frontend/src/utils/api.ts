// src/utils/api.ts
import { getToken } from '@/utils/auth';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
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
