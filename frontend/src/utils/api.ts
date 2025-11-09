// 📡 Detecta ambiente automaticamente
const isProd = process.env.NODE_ENV === "production";

// 🔧 Define o backend conforme o ambiente
const API_BASE_URL = isProd
  ? process.env.NEXT_PUBLIC_API_URL || "https://mvp-marido-aluguel.up.railway.app"
  : "http://localhost:5000";

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  // 🔒 Remove possíveis barras ou prefixos errados
  const cleanEndpoint = endpoint.replace(/^\/+/, "").replace(/^user\//, "").replace(/^auth\//, "");

  const url = `${API_BASE_URL}/api/${cleanEndpoint}`;
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
