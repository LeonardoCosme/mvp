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

type AgendamentoDisponivel = AgendamentoResumo & {
  contratante_nome?: string | null;
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
  const [disponiveis, setDisponiveis] = useState<AgendamentoDisponivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [acaoCarregando, setAcaoCarregando] = useState<number | null>(null);

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

        // 1) Tenta descobrir o perfil pelo localStorage (fonte mais estável)
        let perfilDetectado: Perfil = 'Usuário';

        if (typeof window !== 'undefined') {
          const storedTipo =
            window.localStorage.getItem('tipo') ||
            window.localStorage.getItem('tipoUsuario');

          if (storedTipo) {
            const t = storedTipo.toLowerCase();
            if (t.includes('contrat')) perfilDetectado = 'Contratante';
            else if (t.includes('prest')) perfilDetectado = 'Prestador';
          }
        }

        // 2) Opcionalmente, refina usando /user/me (caso o backend mande relações)
        try {
          const user = await apiFetch('/user/me');
          console.log('[AGENDAMENTOS] /user/me =>', user);

          const hasContratante =
            !!user?.Contratante || !!user?.contratante;
          const hasPrestador =
            !!user?.Prestador || !!user?.prestador;

          if (hasContratante) perfilDetectado = 'Contratante';
          else if (hasPrestador) perfilDetectado = 'Prestador';
        } catch (innerErr) {
          console.warn(
            '[AGENDAMENTOS] Não foi possível ler /user/me, usando apenas localStorage',
            innerErr
          );
        }

        if (cancelado) return;

        setPerfil(perfilDetectado);

        // 3) Busca agendamentos conforme o perfil
        if (perfilDetectado === 'Contratante') {
          const lista = (await apiFetch(
            '/agendamentos/cliente'
          )) as AgendamentoResumo[];

          if (!cancelado) {
            setAgendamentos(Array.isArray(lista) ? lista : []);
            setDisponiveis([]); // contratante não vê "disponíveis"
          }
        } else if (perfilDetectado === 'Prestador') {
          const [meus, disp] = (await Promise.all([
            apiFetch('/agendamentos/prestador'),
            apiFetch('/agendamentos/disponiveis'),
          ])) as [AgendamentoResumo[], AgendamentoDisponivel[]];

          if (!cancelado) {
            setAgendamentos(Array.isArray(meus) ? meus : []);
            setDisponiveis(Array.isArray(disp) ? disp : []);
          }
        } else {
          // Usuário genérico: não mostra nada
          if (!cancelado) {
            setAgendamentos([]);
            setDisponiveis([]);
          }
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

  async function handleAceitar(id: number) {
    try {
      setAcaoCarregando(id);
      await apiFetch(`/agendamentos/${id}/aceitar`, {
        method: 'POST',
      });

      setDisponiveis((lista) => lista.filter((item) => item.id !== id));
      setAgendamentos((lista) => {
        const aceito = disponiveis.find((item) => item.id === id);
        if (!aceito) return lista;
        return [
          ...lista,
          {
            ...aceito,
            status: 'Aceita',
          },
        ];
      });
    } catch (err: any) {
      console.error('❌ Erro ao aceitar agendamento:', err);
      alert(
        err?.body?.message ||
          err?.message ||
          'Não foi possível aceitar este serviço.'
      );
    } finally {
      setAcaoCarregando(null);
    }
  }

  async function handleRecusar(id: number) {
    try {
      setAcaoCarregando(id);
      await apiFetch(`/agendamentos/${id}/recusar`, {
        method: 'POST',
      });

      setDisponiveis((lista) => lista.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error('❌ Erro ao recusar agendamento:', err);
      alert(
        err?.body?.message ||
          err?.message ||
          'Não foi possível recusar este serviço.'
      );
    } finally {
      setAcaoCarregando(null);
    }
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
                  Perfil:{' '}
                  <span className="font-semibold">
                    {perfil}
                  </span>
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

            {/* Erro */}
            {erro && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            {/* Aviso para contratante */}
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

            {/* Prestador: serviços disponíveis */}
            {perfil === 'Prestador' && (
              <section className="mb-8">
                <h2 className="text-lg font-bold text-[#8F1D14] mb-3">
                  Serviços disponíveis para você
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
                ) : disponiveis.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    Não há serviços disponíveis no momento.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {disponiveis.map((ag) => (
                      <article
                        key={ag.id}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-start gap-2">
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
                            {ag.contratante_nome && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                Cliente:{' '}
                                <span className="font-medium">
                                  {ag.contratante_nome}
                                </span>
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 min-w-[160px] items-stretch">
                            <button
                              type="button"
                              onClick={() => handleAceitar(ag.id)}
                              disabled={acaoCarregando === ag.id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {acaoCarregando === ag.id
                                ? 'Aceitando...'
                                : 'Aceitar serviço'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRecusar(ag.id)}
                              disabled={acaoCarregando === ag.id}
                              className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-xs font-semibold hover:bg-red-50 disabled:opacity-60"
                            >
                              {acaoCarregando === ag.id
                                ? 'Recusando...'
                                : 'Recusar'}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Meus agendamentos */}
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
                      </div>

                      {ag.avaliacao?.nota != null && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          ⭐ Avaliado ({ag.avaliacao.nota}/5)
                        </span>
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
