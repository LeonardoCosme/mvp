// frontend/src/app/login/page.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/utils/api';

type LoginResponse = {
  token?: string;
  message?: string;
  error?: string;
  [key: string]: any;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg('');

    if (!email.trim() || !senha.trim()) {
      setMsg('E-mail e senha são obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const data = (await apiFetch('/login', {
        method: 'POST',
        noAuth: true,
        body: {
          email: email.trim(),
          senha: senha,    // compatível com backend antigo
          password: senha, // compatível com backend novo
          lembrar,
        },
      })) as LoginResponse;

      const token = data.token;
      if (!token) {
        setMsg(
          data.message ||
            data.error ||
            'Não foi possível realizar o login. Tente novamente.'
        );
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }

      const next = searchParams.get('next') || '/home';
      router.push(next);
    } catch (err: any) {
      const body = err?.body || {};
      setMsg(
        body.message ||
          body.error ||
          err.message ||
          'Erro ao tentar fazer login.'
      );
      console.error('❌ Erro no login:', err);
    } finally {
      setLoading(false);
    }
  }

  const msgClass = msg
    ? msg.startsWith('E-mail e senha são obrigatórios')
      ? 'text-red-600'
      : msg.toLowerCase().includes('sucesso')
      ? 'text-green-600'
      : 'text-red-600'
    : '';

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#4b2506] to-[#2b1304] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 rounded-2xl shadow-xl px-8 py-10">
          <h1 className="text-3xl font-bold text-center text-[#8F1D14] mb-2">
            Entrar
          </h1>
          <p className="text-center text-sm text-gray-600 mb-6">
            Acesse sua conta do{' '}
            <span className="font-semibold text-[#F89D13]">
              Marido de Aluguel
            </span>
            .
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F89D13]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1" htmlFor="senha">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F89D13]"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Lembrar de mim
              </label>

              {/* 🔑 Esqueci minha senha → vai para /forgot-password */}
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="px-3 py-1 rounded-md bg-[#F89D13] text-white font-semibold hover:opacity-90 transition"
              >
                Esqueci minha senha
              </button>
            </div>

            {msg && (
              <p className={`text-xs mt-1 ${msgClass}`}>
                {msg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8F1D14] text-white py-2.5 rounded-lg font-semibold mt-2 hover:bg-[#a2261b] transition disabled:opacity-70"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Ainda não tem conta?{' '}
            <button
              type="button"
              onClick={() => router.push('/cadastro')}
              className="text-[#F89D13] font-semibold hover:underline"
            >
              Cadastre-se
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
