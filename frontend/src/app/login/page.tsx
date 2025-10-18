'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';
import { saveToken } from '@/utils/auth';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password.trim()) {
      setError('Informe e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      // ✅ Salva sessão
      saveToken(res.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nomeUsuario', res.nomeUsuario || '');
        localStorage.setItem('tipo', res.tipo || '');
        window.dispatchEvent(new Event('auth-changed'));
      }

      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F89D13]/30 to-[#8F1D14]/10 flex items-center justify-center p-6">
      <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl w-full max-w-lg p-8 animate-[fadeIn_0.5s_ease-in]">
        <h1 className="text-3xl font-bold text-center text-[#8F1D14] mb-1">
          Entrar
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Acesse sua conta do{' '}
          <span className="font-semibold text-[#F89D13]">Marido de Aluguel</span>.
        </p>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {/* E-MAIL */}
          <div>
            <label
              htmlFor="email"
              className="block font-medium text-gray-700 mb-1"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              autoComplete="email"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F89D13] transition"
              placeholder="voce@email.com"
            />
          </div>

          {/* SENHA */}
          <div>
            <label
              htmlFor="password"
              className="block font-medium text-gray-700 mb-1"
            >
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={onChange}
                autoComplete="current-password"
                required
                className="w-full px-4 py-2 border rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-[#F89D13] transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800 px-2 py-1"
                aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPass ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>

            {/* Opções extras */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 accent-[#F89D13]"
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-gray-600 select-none"
                >
                  Lembrar de mim
                </label>
              </div>

              {/* Rota de recuperação (em breve) */}
              <button
                type="button"
                className="text-sm text-[#8F1D14] hover:underline"
                onClick={() =>
                  alert('A recuperação de senha estará disponível em breve.')
                }
              >
                Esqueci minha senha
              </button>
            </div>
          </div>

          {/* ERRO */}
          {error && (
            <p className="text-red-600 text-sm text-center mt-2">{error}</p>
          )}

          {/* BOTÃO */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8F1D14] text-white py-3 rounded-lg font-semibold hover:bg-[#a2261b] transition mt-2 shadow-md"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* RODAPÉ */}
        <p className="text-center text-gray-600 mt-6 text-sm">
          Ainda não tem conta?{' '}
          <a
            href="/cadastro"
            className="text-[#8F1D14] font-medium hover:underline"
          >
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
}
