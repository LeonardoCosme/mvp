// 📡 Detecta ambiente automaticamente
const isProd = process.env.NODE_ENV === "production";

// 🔧 Define o backend conforme o ambiente
const API_BASE_URL = isProd
  ? "https://mvp-marido-aluguel.up.railway.app"
  : "http://localhost:5000";

/**
 * 🔗 Função para consumir a API do backend.
 * Garante que o endpoint será corretamente formatado.
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  // ✅ Garante que o endpoint começa com "/api/"
  const normalizedEndpoint = endpoint.startsWith("/api/")
    ? endpoint
    : endpoint.startsWith("/")
    ? `/api${endpoint}`
    : `/api/${endpoint}`;

  const url = `${API_BASE_URL}${normalizedEndpoint}`;
  console.log("🌐 Chamando backend:", url);

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
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
