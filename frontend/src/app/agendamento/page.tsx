// frontend/src/app/agendamento/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';
import { getToken } from '@/utils/auth';

type Perfil = 'Contratante' | 'Prestador' | 'Usuário';

type AgendamentoResumo = {
  id: number;
  status: string;
  tipo_nome: string | null;
  data_servico: string;
  hora_servico: string;
  endereco: string;
  avaliacao?: {
    nota?: number | null;
    comentario?: string | null;
  } | null;
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

export default function AgendamentoPage() {
  const router = useRouter();

  const [perfil, setPerfil] = useState<Perfil>('Usuário');
  const [agendamentos, setAgendamentos] = useState<AgendamentoResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login?next=/agendamento');
      return;
    }

    let cancelado = false;

    async function carregar() {
      try {
        setLoading(true);
        setErro('');

        // 1) pega o usuário logado
        const user = await apiFetch('/user/me');
        if (cancelado) return;

        const tipoRaw = (user?.tipo || '').toString().toLowerCase();

        const isContratante =
          tipoRaw === 'contratante' ||
          tipoRaw === 'cliente' ||
          !!user?.Contratante;

        const isPrestador =
          tipoRaw === 'prestador' ||
          tipoRaw === 'fornecedor' ||
          !!user?.Prestador;

        const perfilDetectado: Perfil = isContratante
          ? 'Contratante'
          : isPrestador
          ? 'Prestador'
          : 'Usuário';

        setPerfil(perfilDetectado);

        // 2) busca agendamentos conforme o perfil
        let lista: AgendamentoResumo[] = [];

        if (isContratante) {
          lista = await apiFetch('/agendamentos/cliente');
        } else if (isPrestador) {
          lista = await apiFetch('/agendamentos/prestador');
        } else {
          lista = [];
        }

        if (!cancelado) {
          console.log('[AGENDAMENTOS] lista =>', lista);
          setAgendamentos(Array.isArray(lista) ? lista : []);
        }
      } catch (err: any) {
        console.error('❌ Erro ao carregar agendamentos:', err);
        if (err?.status === 401) {
          router.push('/login?next=/agendamento');
          return;
        }
        if (!cancelado) {
          setErro(
            err?.body?.message ||
              err?.message ||
              'Erro ao carregar seus agendamentos.'
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

  // --- ações de ACEITAR / RECUSAR (para prestador) ---
  async function atualizarStatus(id: number, acao: 'aceitar' | 'recusar') {
    try {
      setUpdatingId(id);
      setErro('');

      // 🟡 CONFERE SE AS ROTAS BATEM COM O TEU BACKEND:
      // aqui estou assumindo:
      //   PATCH /agendamentos/:id/aceitar
      //   PATCH /agendamentos/:id/recusar
      await apiFetch(`/agendamentos/${id}/${acao}`, {
        method: 'PATCH',
      });

      // atualiza a lista em memória
      setAgendamentos((prev) =>
        prev.map((ag) =>
          ag.id === id
            ? {
                ...ag,
                status: acao === 'aceitar' ? 'ACEITO' : 'RECUSADO',
              }
            : ag
        )
      );
    } catch (err: any) {
      console.error('❌ Erro ao atualizar status:', err);
      const body = err?.body || {};
      setErro(
        body.message ||
          body.error ||
          err.message ||
          'Erro ao atualizar o status do agendamento.'
      );
    } finally {
      setUpdatingId(null);
    }
  }

  // status que consideramos "pendente" para mostrar os botões ao prestador
  function podeResponder(status: string) {
    const s = status.toUpperCase();
    return s === 'PENDENTE' || s === 'AGUARDANDO_CONFIRMACAO';
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#4b2506] to-[#2b1304] pb-16">
      <section className="pt-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white/95 rounded-2xl shadow-lg p-6 md:p-8">
            {/* Cabeçalho */}
            <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#8F1D14]">
                  Agendamentos
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Perfil: <span className="font-semibold">{perfil}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/home"
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  ← Voltar para a home
                </Link>

                <Link
                  href="/historico"
                  className="px-4 py-2 rounded-lg bg-[#8F1D14] text-white text-sm font-semibold hover:bg-[#a2261b]"
                >
                  Histórico de avaliações
                </Link>
              </div>
            </header>

            {/* Info / erro */}
            {erro && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            {/* Link para criar novo (relevante pro contratante) */}
            {perfil === 'Contratante' && (
              <div className="mb-6 rounded-xl bg-[#F89D13]/10 border border-[#F89D13]/30 px-4 py-3 text-sm text-gray-800 flex flex-wrap items-center justify-between gap-2">
                <span>
                  Para criar um novo agendamento, escolha o serviço no catálogo.
                </span>
                <Link
                  href="/servicos"
                  className="px-3 py-1.5 rounded-lg bg-[#F89D13] text-white text-xs font-semibold hover:opacity-90"
                >
                  Ir para Catálogo de Serviços
                </Link>
              </div>
            )}

            {/* Lista de agendamentos */}
            <section>
              <h2 className="text-lg font-bold text-[#8F1D14] mb-3">
                Meus agendamentos
              </h2>

              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 rounded-xl bg-gray-100 animate-pulse"
                    />
                  ))}
                </div>
              ) : agendamentos.length === 0 ? (
                <p className="text-sm text-gray-600">
                  Você ainda não possui agendamentos cadastrados.
                </p>
              ) : (
                <div className="space-y-3">
                  {agendamentos.map((ag) => (
                    <article
                      key={ag.id}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {ag.tipo_nome || 'Serviço'}{' '}
                          <span className="text-xs text-gray-500">
                            #{ag.id}
                          </span>
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {formatDateBR(ag.data_servico)} às{' '}
                          {formatHora(ag.hora_servico)} — {ag.endereco}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 capitalize">
                          Status:{' '}
                          <span className="font-medium text-gray-800">
                            {ag.status.replace('_', ' ')}
                          </span>
                        </p>

                        {/* se já tiver avaliação, mostra um resuminho */}
                        {ag.avaliacao?.nota != null && (
                          <p className="text-xs text-emerald-700 mt-0.5">
                            ⭐ Avaliação: {ag.avaliacao.nota}/5
                          </p>
                        )}
                      </div>

                      {/* Ações do prestador */}
                      {perfil === 'Prestador' && podeResponder(ag.status) && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={updatingId === ag.id}
                            onClick={() => atualizarStatus(ag.id, 'aceitar')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {updatingId === ag.id && '...'}
                            {updatingId !== ag.id && 'Aceitar'}
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === ag.id}
                            onClick={() => atualizarStatus(ag.id, 'recusar')}
                            className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-60"
                          >
                            {updatingId === ag.id && '...'}
                            {updatingId !== ag.id && 'Recusar'}
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
