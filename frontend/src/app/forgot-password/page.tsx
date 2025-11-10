'use client';

import { useState } from 'react';
import { apiFetch } from '@/utils/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      await apiFetch('forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage('Link de redefinição enviado com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F89D13]/30 to-[#8F1D14]/10 p-6">
      <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center text-[#8F1D14] mb-4">Esqueceu sua senha?</h1>
        <p className="text-center text-gray-600 mb-6">
          Informe seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="voce@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13]"
          />

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          {message && <p className="text-green-600 text-sm text-center">{message}</p>}

          <button type="submit" disabled={loading} className="w-full bg-[#8F1D14] text-white py-3 rounded-lg font-semibold hover:bg-[#a2261b] transition">
            {loading ? 'Enviando...' : 'Enviar link de redefinição'}
          </button>
        </form>
      </div>
    </div>
  );
}
