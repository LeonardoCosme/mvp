// utils/api.ts
const isProd = process.env.NODE_ENV === "production";

const API_BASE_URL = isProd
  ? "https://mvp-marido-aluguel.up.railway.app/api" // 👈 já inclui /api
  : "http://localhost:5000/api";

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  // ✅ Remove /api duplicado e garante / no início
  const clean = endpoint.replace(/^\/+/, "");
  const url = `${API_BASE_URL}/${clean}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // ✅ Se o body for objeto, transforma em JSON string
  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }

  console.log("🌐 Requisição:", url, options.method || "GET");

  const res = await fetch(url, { ...options, headers, body });

  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    console.error("❌ Erro API:", msg);
    throw new Error(msg);
  }

  try {
    return await res.json();
  } catch {
    return {};
  }
}
