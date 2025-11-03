'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/utils/api';

export default function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';

  const [status, setStatus] = useState<'validating' | 'success' | 'error'>('validating');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function verify() {
      if (!token || token.length < 10) {
        setStatus('error');
        setMessage('Token inválido ou ausente.');
        return;
      }

      try {
        await apiFetch('user/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        setStatus('success');
        setMessage('✅ E-mail verificado com sucesso!');
        setTimeout(() => router.push('/login'), 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.message || 'Erro ao verificar e-mail. O link pode ter expirado.');
      }
    }

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F89D13]/20 to-[#8F1D14]/10 p-6">
      <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl w-full max-w-md p-8 text-center animate-[fadeIn_0.5s_ease-in]">
        <h1 className="text-2xl font-bold text-[#8F1D14] mb-3">Verificação de E-mail</h1>
        <p className="text-gray-600 mb-6 text-sm">
          {status === 'validating' && 'Validando seu token...'}
          {status !== 'validating' && message}
        </p>
        {status === 'error' && (
          <button
            onClick={() => router.push('/login')}
            className="text-sm text-[#8F1D14] hover:underline"
          >
            Voltar ao login
          </button>
        )}
      </div>
    </div>
  );
}