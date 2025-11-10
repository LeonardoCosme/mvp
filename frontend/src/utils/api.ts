// 📡 Detecta ambiente automaticamente
const isProd = process.env.NODE_ENV === "production";

// 🔧 Define o backend conforme o ambiente
const API_BASE_URL = isProd
  ? "https://mvp-marido-aluguel.up.railway.app"
  : "http://localhost:5000";

/**
 * 🔗 Função genérica para consumir a API do backend.
 * Garante que o endpoint seja formatado corretamente e o corpo enviado como JSON.
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  // ✅ Monta o endpoint corretamente
  const normalizedEndpoint = endpoint.startsWith("/api/")
    ? endpoint
    : endpoint.startsWith("/")
    ? `/api${endpoint}`
    : `/api/${endpoint}`;

  const url = `${API_BASE_URL}${normalizedEndpoint}`;
  console.log("🌐 Chamando backend:", url);

  // ✅ Garante headers JSON
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // ✅ Se o corpo for objeto, converte para JSON
  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    body,
  });

  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    console.error("❌ Erro API:", res.status, msg);
    throw new Error(msg);
  }

  try {
    return await res.json();
  } catch {
    return {};
  }
}
