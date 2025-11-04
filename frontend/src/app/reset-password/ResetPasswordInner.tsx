'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';

export default function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);

  useEffect(() => {
    if (!token || token.length < 10) {
      setIsTokenValid(false);
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!password.trim() || !confirm.trim()) {
      setError('Preencha todos os campos.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('user/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, novaSenha: password }),
      });

      setMessage('✅ Senha redefinida com sucesso! Você será redirecionado para o login...');
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: any) {
      setError(err?.message || 'Erro ao redefinir a senha. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#F89D13]/20 to-[#8F1D14]/10 p-6">
        <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl w-full max-w-md p-8 text-center animate-[fadeIn_0.5s_ease-in]">
          <h1 className="text-2xl font-bold text-[#8F1D14] mb-3">Link inválido ou expirado</h1>
          <p className="text-gray-600 mb-6 text-sm">
            O link de redefinição de senha pode ter expirado ou já foi utilizado.
          </p>
          <button
            onClick={() => router.push('/forgot-password')}
            className="bg-[#8F1D14] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#a2261b] transition shadow-md"
          >
            Solicitar novo link
          </button>
          <div className="mt-4">
            <button
              onClick={() => router.push('/login')}
              className="text-sm text-[#8F1D14] hover:underline"
            >
              Voltar ao login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F89D13]/20 to-[#8F1D14]/10 p-6">
      <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl w-full max-w-md p-8 text-center animate-[fadeIn_0.5s_ease-in]">
        <h1 className="text-2xl font-bold text-[#8F1D14] mb-2">Redefinir senha</h1>
        <p className="text-gray-600 mb-6 text-sm">
          Digite e confirme sua nova senha para continuar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="novaSenha" className="block text-left font-medium text-gray-700 mb-1">
              Nova senha
            </label>
            <input
              id="novaSenha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua nova senha"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F89D13]"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmarSenha" className="block text-left font-medium text-gray-700 mb-1">
              Confirmar nova senha
            </label>
            <input
              id="confirmarSenha"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirme a nova senha"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F89D13]"
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {message && <p className="text-green-700 text-sm">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8F1D14] text-white py-2 rounded-lg font-semibold hover:bg-[#a2261b] transition shadow-md"
          >
            {loading ? 'Redefinindo...' : 'Redefinir senha'}
          </button>
        </form>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-sm text-[#8F1D14] hover:underline"
          >
            Voltar para o login
          </button>
        </div>
      </div>
    </div>
  );
}