// frontend/src/utils/authWatcher.ts
import { getToken, removeToken } from "@/utils/auth";
import { apiFetch } from "@/utils/api";

// Função que verifica periodicamente se o token ainda é válido
export function startAuthWatcher() {
  if (typeof window === "undefined") return;

  const checkToken = async () => {
    const token = getToken();
    if (!token) return;

    try {
      // Verifica o token com o endpoint protegido
      await apiFetch("user/me");
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes("jwt expired")) {
        console.warn("⚠️ Token expirado. Fazendo logout automático...");
        removeToken();
        localStorage.removeItem("nomeUsuario");
        localStorage.removeItem("tipo");
        window.dispatchEvent(new Event("auth-changed"));
        window.location.href = "/login";
      }
    }
  };

  // Verifica a cada 60 segundos
  setInterval(checkToken, 60000);
}
