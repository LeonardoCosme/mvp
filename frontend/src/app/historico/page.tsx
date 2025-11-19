'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../utils/api';
import { getToken } from '../../utils/auth';

type Agendamento = {
  id: number;
  tipoServico?: string;
  data?: string;
  hora?: string;
  endereco?: string;
  descricao?: string | null;
  status?: string;
};

export default function HistoricoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login?next=/historico');
      return;
    }

    const carregar = async () => {
      try {
        setLoading(true);
        setError(null);

        // 🔁 AJUSTE AQUI PARA O ENDPOINT CORRETO DO SEU BACKEND
        // Ex.: '/agendamentos/me', '/agendamentos/cliente', etc.
        const data = await apiFetch('/agendamentos/me', {
          method: 'GET',
        });

        setAgendamentos(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('Erro ao carregar histórico:', err);
        if (err?.status === 401) {
          // token inválido/expirado: manda pro login
          router.replace('/login?next=/historico');
        } else {
          setError(
            err?.message || 'Não foi possível carregar seus agendamentos.'
          );
        }
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f4f4f4] to-[#e9e3dc]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-red-800">
          Meus agendamentos
        </h1>

        {loading && <p>Carregando...</p>}

        {error && !loading && (
          <p className="text-red-600 mb-4">{error}</p>
        )}

        {!loading && !error && agendamentos.length === 0 && (
          <p>Você ainda não possui agendamentos.</p>
        )}

        <div className="space-y-4">
          {agendamentos.map((ag) => (
            <div
              key={ag.id}
              className="rounded-xl shadow-md bg-white p-4 border border-gray-200 flex flex-col gap-2"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-red-800">
                  {ag.tipoServico || 'Serviço'}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    ag.status === 'AGUARDANDO'
                      ? 'bg-yellow-100 text-yellow-800'
                      : ag.status === 'CONFIRMADO'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {ag.status || 'AGUARDANDO'}
                </span>
              </div>

              <div className="text-sm text-gray-700">
                {ag.data && (
                  <p>
                    <strong>Data:</strong>{' '}
                    {new Date(ag.data).toLocaleDateString('pt-BR')}{' '}
                    {ag.hora && `às ${ag.hora}`}
                  </p>
                )}
                {ag.endereco && (
                  <p>
                    <strong>Endereço:</strong> {ag.endereco}
                  </p>
                )}
                {ag.descricao && (
                  <p>
                    <strong>Descrição:</strong> {ag.descricao}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
