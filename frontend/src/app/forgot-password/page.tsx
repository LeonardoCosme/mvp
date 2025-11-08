'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!email.trim()) {
      setError('Informe um e-mail válido.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage('Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.');
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar o e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F89D13]/20 to-[#8F1D14]/10 p-6">
      <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl w-full max-w-md p-8 text-center animate-[fadeIn_0.5s_ease-in]">
        <h1 className="text-2xl font-bold text-[#8F1D14] mb-2">Esqueceu sua senha?</h1>
        <p className="text-gray-600 mb-6 text-sm">
          Informe seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F89D13]"
            required
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {message && <p className="text-green-700 text-sm">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8F1D14] text-white py-2 rounded-lg font-semibold hover:bg-[#a2261b] transition shadow-md"
          >
            {loading ? 'Enviando...' : 'Enviar link de redefinição'}
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