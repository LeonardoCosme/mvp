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

  // 🧩 LOGS DE DIAGNÓSTICO
  console.groupCollapsed(`🚀 [apiFetch] ${options.method || "GET"} → ${url}`);
  console.log("🧠 Ambiente:", isProd ? "Produção" : "Desenvolvimento");
  console.log("📤 Headers enviados:", headers);
  console.log("📦 Body enviado:", body);
  console.groupEnd();

  try {
    const res = await fetch(url, { ...options, headers, body });

    console.log(`📬 [apiFetch] Resposta recebida (${res.status}) de →`, url);

    if (!res.ok) {
      let msg = `Erro ${res.status}`;
      try {
        const data = await res.json();
        msg = data?.error || data?.message || msg;
        console.error("❌ Erro detalhado da API:", data);
      } catch (e) {
        console.error("❌ Erro ao interpretar resposta JSON:", e);
      }
      throw new Error(msg);
    }

    // ✅ Tenta converter resposta JSON normalmente
    const data = await res.json().catch(() => ({}));
    console.log("📦 Dados retornados pela API:", data);
    return data;
  } catch (err: any) {
    console.error("💥 Falha na comunicação com o backend:", err);
    throw err;
  }
}
