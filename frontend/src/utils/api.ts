// 📡 Detecta ambiente
const isProd = process.env.NODE_ENV === "production";

// 🔧 Define a URL base do backend dinamicamente
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (isProd
    ? "https://mvp-marido-aluguel.up.railway.app" // ✅ URL do backend em produção
    : "http://localhost:5000"); // 💻 ambiente local

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  // 🔍 Garante que o endpoint não tenha barra inicial
  const cleanEndpoint = endpoint.replace(/^\/+/, "");

  // 🔗 Monta URL final
  const url = `${API_BASE_URL}/api/${cleanEndpoint}`;
  console.log("🌐 Chamando backend:", url);

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    // ❗ Trata erros HTTP (404, 500, etc.)
    if (!res.ok) {
      let msg = `Erro ${res.status}: ${res.statusText}`;
      try {
        const data = await res.json();
        msg = data?.error || data?.message || msg;
      } catch {}
      console.error("❌ Erro API:", res.status, msg);
      throw new Error(msg);
    }

    // ✅ Retorna JSON ou objeto vazio
    try {
      const json = await res.json();
      console.log("✅ Resposta API:", json);
      return json;
    } catch {
      console.warn("⚠️ API retornou resposta sem JSON válido.");
      return {};
    }
  } catch (error: any) {
    console.error("🚨 Falha na requisição à API:", error);
    throw new Error("Falha de conexão com o servidor. Tente novamente mais tarde.");
  }
}
