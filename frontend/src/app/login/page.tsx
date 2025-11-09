'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('login', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      });

      localStorage.setItem('token', res.token);
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Falha ao realizar login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdf7f1]">
      <div className="bg-white shadow-lg p-8 rounded-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-[#8F1D14] mb-4">Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-4 py-2 rounded-lg"
            required
          />
          <input
            type="password"
            placeholder="Sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full border px-4 py-2 rounded-lg"
            required
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8F1D14] text-white py-2 rounded-lg hover:bg-[#a2261b] transition"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 text-sm text-center">
          <a href="/forgot-password" className="text-[#8F1D14] hover:underline">
            Esqueci minha senha
          </a>
        </div>
      </div>
    </div>
  );
}
