// src/utils/api.ts

export type ApiOptions = RequestInit & {
  /** Se true, não envia Authorization: Bearer token */
  noAuth?: boolean;
};

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://mvp-marido-aluguel.up.railway.app/api';

function getTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('token');
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

  // adiciona token se necessário
  const token = !noAuth ? getTokenFromStorage() : null;
  if (token && !finalHeaders.has('Authorization')) {
    finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  // trata body / JSON
  let finalBody: BodyInit | undefined = body as any;

  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData;
  const isBlob = typeof Blob !== 'undefined' && body instanceof Blob;

  if (body && !isFormData && !isBlob) {
    // sempre marcar como JSON quando não for FormData/Blob
    if (!finalHeaders.has('Content-Type')) {
      finalHeaders.set('Content-Type', 'application/json');
    }

    // se for objeto, transformamos em JSON
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

  if (!resp.ok) {
    console.error('apiFetch ERROR', resp.status, data);
    const err: any = new Error(
      (data && (data.message || data.error || data.details)) ||
        `Erro na API (${resp.status})`
    );
    err.status = resp.status;
    err.body = data;
    throw err;
  }

  return data;
}
