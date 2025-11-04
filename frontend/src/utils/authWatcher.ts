// frontend/src/utils/authWatcher.ts
import { getToken, removeToken } from "@/utils/auth";
import { apiFetch } from "@/utils/api";

// Função que verifica periodicamente se o token ainda é válido
export function startAuthWatcher() {
  if (globalThis.window === undefined) return;


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
        globalThis.window.localStorage.removeItem("nomeUsuario");
        globalThis.window.localStorage.removeItem("tipo");
        globalThis.window.dispatchEvent(new Event("auth-changed"));
        globalThis.window.location.href = "/login";
      }
    }
  };

  // Verifica a cada 60 segundos
  setInterval(checkToken, 60000);
}