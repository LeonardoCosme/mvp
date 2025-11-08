const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${API_BASE_URL}/api/${endpoint}`;

  // 🔍 Log para ver a URL chamada
  console.log("🌐 Chamando backend:", url);

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let msg = "Erro desconhecido.";
    try {
      const data = await res.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    console.error("❌ Erro API:", res.status, msg);
    throw new Error(msg);
  }

  try {
    const json = await res.json();
    console.log("✅ Resposta API:", json);
    return json;
  } catch {
    return {};
  }
}
