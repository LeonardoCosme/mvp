'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando seu e-mail...');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    async function verify() {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('Token inválido ou ausente.');
        return;
      }

      try {
        const res = await fetch(`http://localhost:3001/api/user/verify-email?token=${token}`);
        if (!res.ok) throw new Error('Erro ao verificar o e-mail.');
        const text = await res.text();

        // Se o backend retornar HTML (página própria), mostramos direto
        if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
          document.open();
          document.write(text);
          document.close();
        } else {
          setStatus('success');
          setMessage('Seu e-mail foi verificado com sucesso!');
          setTimeout(() => router.push('/login'), 3000);
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Erro ao verificar o e-mail.');
      }
    }

    verify();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F89D13]/20 to-[#8F1D14]/10 p-6">
      <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl w-full max-w-md p-8 text-center animate-[fadeIn_0.4s_ease-in]">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-[#8F1D14] border-gray-200 mx-auto mb-6"></div>
            <h1 className="text-xl font-semibold text-gray-800">{message}</h1>
            <p className="text-gray-500 mt-2">Aguarde um momento...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold text-[#8F1D14] mb-4">✅ E-mail verificado!</h1>
            <p className="text-gray-700 mb-4">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-[#8F1D14] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#a2261b] transition shadow-md"
            >
              Ir para o Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Erro na verificação</h1>
            <p className="text-gray-700 mb-4">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-[#8F1D14] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#a2261b] transition shadow-md"
            >
              Voltar ao Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
