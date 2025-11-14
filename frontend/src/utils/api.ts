// utils/api.ts

// 🚀 Configuração central do backend
// Em produção (Vercel), sempre chama a API da Railway diretamente.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://mvp-marido-aluguel.up.railway.app/api"; // backend fixo

/**
 * Faz uma requisição à API backend.
 * - Aceita endpoint com ou sem barra inicial
 * - Converte body para JSON automaticamente
 * - Faz log de diagnóstico no console
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const cleanEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const url = `${API_BASE_URL}${cleanEndpoint}`;

  // Cabeçalhos padrão
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Converte body em string JSON, se necessário
  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }

  console.groupCollapsed(`🌐 [apiFetch] ${options.method || "GET"} → ${url}`);
  console.log("📤 Headers:", headers);
  if (body) console.log("📦 Body:", body);
  console.groupEnd();

  try {
    const res = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: typeof body === "string" ? body : undefined,
      mode: "cors",
    });

    if (!res.ok) {
      let msg = `Erro ${res.status}`;
      try {
        const data = await res.json();
        msg = data?.error || data?.message || msg;
      } catch {
        console.warn("⚠️ Resposta não era JSON válida.");
      }
      throw new Error(msg);
    }

    const data = await res.json();
    console.log("✅ [apiFetch] Sucesso:", data);
    return data;
  } catch (err: any) {
    console.error("💥 Erro de conexão com o backend:", err.message);
    throw err;
  }
}
