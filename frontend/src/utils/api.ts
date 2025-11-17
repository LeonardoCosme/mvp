// src/utils/api.ts
import { getToken } from './auth';

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api').replace(/\/$/, '');

type ApiOptions = RequestInit & {
  /** se quiser o Response bruto, sem fazer json() */
  raw?: boolean;
};

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (!path.startsWith('/')) path = '/' + path;
  return `${API_BASE}${path}`;
}

export async function apiFetch(path: string, options: ApiOptions = {}) {
  const url = buildUrl(path);

  const token = typeof window !== 'undefined' ? getToken() : null;

  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  // só adiciona Content-Type se tiver body
  if (options.body && !('Content-Type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && !('Authorization' in headers)) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const init: RequestInit = {
    // sempre força o navegador a NÃO reutilizar cache HTTP
    cache: 'no-store',
    ...options,
    headers,
  };

  const res = await fetch(url, init);

  // --- Tratamento especial para 304 (Not Modified) ---
  // Com cache: 'no-store' isso deve praticamente sumir,
  // mas deixamos por segurança para não explodir o json().
  if (res.status === 304) {
    // não tem corpo útil; deixamos o chamador decidir o default
    return null;
  }

  if (!res.ok) {
    let message = `Erro HTTP ${res.status}`;

    try {
      const text = await res.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          if (data?.message) message = data.message;
          else if (typeof data === 'string') message = data;
        } catch {
          message = text;
        }
      }
    } catch {
      // se der erro para ler o body, mantemos a mensagem padrão
    }

    throw new Error(message);
  }

  if (options.raw) {
    // para casos em que você quer lidar com o Response direto
    return res;
  }

  // algumas rotas podem devolver 204 (sem conteúdo)
  if (res.status === 204) return null;

  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    // se não for JSON, devolve texto cru
    return text;
  }
}
