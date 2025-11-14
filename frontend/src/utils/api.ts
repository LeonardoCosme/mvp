// utils/api.ts

// 🔧 Sempre usar o backend hospedado na Railway
const API_BASE_URL = "https://mvp-marido-aluguel.up.railway.app/api";

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  // 🔒 Garante que o endpoint não venha duplicado
  const clean = endpoint.replace(/^\/+/, "");
  const url = `${API_BASE_URL}/${clean}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }

  console.log("🌐 [apiFetch] Requisição →", url);

  try {
    const res = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: typeof body === "string" ? body : undefined,
      mode: "cors",
    });

    console.log("📥 [apiFetch] Status:", res.status);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data?.error || data?.message || `Erro ${res.status}`;
      throw new Error(msg);
    }

    const data = await res.json();
    console.log("📦 [apiFetch] Dados retornados:", data);
    return data;
  } catch (err: any) {
    console.error("💥 Erro na comunicação com a API:", err);
    throw err;
  }
}
