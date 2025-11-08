const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Função utilitária para chamadas à API do backend.
 * - Adiciona automaticamente o token JWT se { auth: true } for usado.
 * - Retorna o JSON da resposta ou lança erro com mensagem descritiva.
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<any> {
  const url = `${API_BASE_URL}/api/${endpoint}`;

  // 🔍 Log da URL chamada
  console.log("🌐 Chamando backend:", url);

  // 🔑 Configura headers
  const headers = new Headers({
    "Content-Type": "application/json",
    ...(options.headers || {}),
  });

  // 🔐 Se auth: true, adiciona o token JWT salvo
  if (options.auth) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : null;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  // 🚀 Faz a requisição
  const res = await fetch(url, {
    ...options,
    headers,
  });

  // ⚠️ Tratamento de erro HTTP
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.error || data?.message || msg;
    } catch {
      msg = res.statusText || msg;
    }
    console.error("❌ Erro API:", res.status, msg);
    throw new Error(msg);
  }

  // ✅ Retorna o JSON da resposta (ou objeto vazio)
  try {
    const json = await res.json();
    console.log("✅ Resposta API:", json);
    return json;
  } catch {
    return {};
  }
}
