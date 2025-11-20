// frontend/src/app/historico/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';
import { getToken } from '@/utils/auth';

type HistoricoItem = {
  id: number;
  tipo_nome?: string | null;
  data_servico?: string | null;
  hora_servico?: string | null;
  endereco?: string | null;
  nota?: number | null;
  comentario?: string | null;
  status?: string | null;
};

function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

function formatHora(h?: string | null): string {
  if (!h) return '';
  return h.slice(0, 5);
}

export default function HistoricoPage() {
  const router = useRouter();

  const [itens, setItens] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.push('/login?next=/historico');
      return;
    }

    let cancelado = false;

    async function carregar() {
      try {
        setLoading(true);
        setErro('');

        // ✅ Bate na rota /api/historico/cliente
        const data = await apiFetch('/historico/cliente');
        if (!cancelado) {
          console.log('[HISTÓRICO] itens =>', data);
          setItens(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        console.error('❌ Erro ao carregar histórico:', err);
        if (err?.status === 401) {
          router.push('/login?next=/historico');
          return;
        }
        if (!cancelado) {
          setErro(
            err?.body?.message ||
              err?.message ||
              'Erro ao carregar o histórico de avaliações.'
          );
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    carregar();

    return () => {
      cancelado = true;
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#4b2506] to-[#2b1304] pb-16">
      <section className="pt-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white/95 rounded-2xl shadow-lg p-6 md:p-8">
            <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#8F1D14]">
                  Histórico de avaliações
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Veja os serviços já atendidos e suas avaliações.
                </p>
              </div>

              <Link
                href="/agendamento"
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ← Voltar aos agendamentos
              </Link>
            </header>

            {erro && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : itens.length === 0 ? (
              <p className="text-sm text-gray-600">
                Ainda não há avaliações registradas.
              </p>
            ) : (
              <div className="space-y-3">
                {itens.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex flex-col gap-1"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {item.tipo_nome ?? 'Serviço'}{' '}
                          <span className="text-xs text-gray-500">
                            #{item.id}
                          </span>
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {formatDateBR(item.data_servico)} às{' '}
                          {formatHora(item.hora_servico)} — {item.endereco}
                        </p>
                      </div>

                      {item.nota != null && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          ⭐ {item.nota}/5
                        </span>
                      )}
                    </div>

                    {item.comentario && (
                      <p className="text-xs text-gray-700 mt-1">
                        <span className="font-semibold">Comentário: </span>
                        {item.comentario}
                      </p>
                    )}

                    {item.status && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        Status:{' '}
                        <span className="font-medium">
                          {item.status.replace('_', ' ')}
                        </span>
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
