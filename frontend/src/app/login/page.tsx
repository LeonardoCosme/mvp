// frontend/src/app/login/page.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '../../utils/api';

type LoginResponse = {
  token?: string;
  message?: string;
  error?: string;
  nomeUsuario?: string;
  tipo?: string;
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
          senha: senha,
          password: senha,
          lembrar,
        } as any,
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
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('nomeUsuario');
        window.localStorage.removeItem('tipo');
        window.localStorage.removeItem('tipoUsuario');

        window.localStorage.setItem('token', token);

        const nomeUsuario = data.nomeUsuario || '';
        const tipo = data.tipo || '';

        if (nomeUsuario) {
          window.localStorage.setItem('nomeUsuario', String(nomeUsuario));
        }
        if (tipo) {
          window.localStorage.setItem('tipo', String(tipo));
          window.localStorage.setItem('tipoUsuario', String(tipo));
        }

        window.dispatchEvent(new Event('auth-changed'));
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
    <main className="min-h-screen bg-gradient-to-br from-[#F89D13]/30 to-[#8F1D14]/10 pt-28 pb-12">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white/95 rounded-2xl shadow-2xl px-8 py-10 backdrop-blur-md">
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
              <label
                className="block text-sm text-gray-700 mb-1"
                htmlFor="email"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F89D13]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="seuemail@email.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use o mesmo e-mail informado no momento do cadastro.
              </p>
            </div>

            <div>
              <label
                className="block text-sm text-gray-700 mb-1"
                htmlFor="senha"
              >
                Senha
              </label>
              <input
                id="senha"
                type="password"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F89D13]"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-sm gap-3 flex-wrap">
              <label className="inline-flex items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Lembrar de mim
              </label>

              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="px-3 py-1.5 rounded-lg border border-[#F89D13]/40 text-[#8F1D14] font-semibold hover:bg-[#F89D13]/5 transition"
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
              className="w-full bg-[#8F1D14] text-white py-3 rounded-lg font-semibold mt-2 hover:bg-[#a2261b] transition disabled:opacity-70"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-700">
            <span>Ainda não tem conta?</span>
            <button
              type="button"
              onClick={() => router.push('/cadastro')}
              className="inline-flex items-center px-3 py-1.5 ml-2 rounded-full bg-[#F89D13] text-white text-xs sm:text-sm font-semibold shadow-sm hover:bg-[#d57f10] transition"
            >
              Cadastre-se
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
