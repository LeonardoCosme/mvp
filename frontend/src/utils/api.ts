// utils/api.ts

// Detecta ambiente automaticamente (compatível com Vercel)
const isProd =
  typeof window !== "undefined"
    ? !window.location.hostname.includes("localhost")
    : process.env.NODE_ENV === "production";

// Define o backend conforme o ambiente
const API_BASE_URL = isProd
  ? "https://mvp-marido-aluguel.up.railway.app/api"
  : "http://localhost:5000/api";

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
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
      } catch {}
      throw new Error(msg);
    }

    return await res.json();
  } catch (err: any) {
    console.error("💥 Falha ao conectar com a API:", err.message);
    throw err;
  }
}
