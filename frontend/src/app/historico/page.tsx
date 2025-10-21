// src/app/historico/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';
import { getToken, removeToken } from '@/utils/auth';
import AvaliacaoModal from '@/app/components/avaliacaomodal';

type ItemHistorico = {
  id: number;
  tipo_servico_id: number | null;
  tipo_nome: string | null;
  data_servico: string | null;  // YYYY-MM-DD
  hora_servico: string | null;  // HH:MM:SS
  duracao_horas: number | null;
  endereco: string | null;
  descricao: string | null;
  prestador_id: number | null;
  prestador_nome: string | null;
  prestador_email: string | null;
  checkin_at: string | null;
  start_at: string | null;
  end_at: string | null;
  avaliacao: null | {
    id: number;
    nota: number;
    comentario: string | null;
    created_at: string;
  };
};

function fmtData(d?: string | null) {
  if (!d) return '--';
  const [y, m, day] = d.split('-').map(Number);
  if (!y || !m || !day) return d;
  return new Date(y, m - 1, day).toLocaleDateString('pt-BR');
}

function fmtHora(h?: string | null) {
  if (!h) return '--';
  const [hh = '00', mm = '00'] = h.split(':');
  return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
}

function fmtDateTime(dt?: string | null) {
  if (!dt) return null;
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
  const dia = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia} ${hora}`;
}

export default function HistoricoClientePage() {
  const router = useRouter();
  const token = useMemo(() => getToken(), []);
  const [redirecting, setRedirecting] = useState(false);

  const [itens, setItens] = useState<ItemHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string>('');

  // modal de avaliação
  const [evalOpen, setEvalOpen] = useState(false);
  const [evalAgId, setEvalAgId] = useState<number | null>(null);
  const [evalCtx, setEvalCtx] = useState<{ prestadorNome: string | null; servicoNome: string | null }>({
    prestadorNome: null,
    servicoNome: null,
  });

  // redirect se não houver token
  useEffect(() => {
    if (!token) {
      setRedirecting(true);
      router.replace('/login');
    }
  }, [token, router]);

  async function carregar() {
    setMsg('');
    try {
      const data = (await apiFetch('/historico/cliente', { auth: true })) as ItemHistorico[];

      // ordena do mais recente para o mais antigo
      const itensOrdenados = [...(Array.isArray(data) ? data : [])].sort((a, b) => {
        const aKey = a.end_at ?? (a.data_servico && a.hora_servico ? `${a.data_servico}T${a.hora_servico}` : '');
        const bKey = b.end_at ?? (b.data_servico && b.hora_servico ? `${b.data_servico}T${b.hora_servico}` : '');
        return new Date(bKey).getTime() - new Date(aKey).getTime();
      });

      setItens(itensOrdenados);
    } catch (e: any) {
      const text = String(e?.message || '');
      if (text.toLowerCase().includes('token')) {
        removeToken();
        router.replace('/login');
        return;
      }
      setMsg(text || 'Erro ao carregar histórico.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    carregar();
  }, [token]);

  function abrirAvaliacao(item: ItemHistorico) {
    setEvalAgId(item.id);
    setEvalCtx({ prestadorNome: item.prestador_nome, servicoNome: item.tipo_nome });
    setEvalOpen(true);
  }

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F89D13]/10">
        Redirecionando para login…
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F89D13]/10">
        Carregando histórico…
      </div>
    );
  }

  const chipBase = 'px-2 py-1 rounded-full border';
  const chipOn = 'bg-green-50 text-green-700 border-green-200';
  const chipOff = 'bg-gray-50 text-gray-600 border-gray-200';

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F89D13]/30 to-[#8F1D14]/10 p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#8F1D14]">Histórico de serviços</h1>
            <p className="text-gray-600">Serviços concluídos e avaliações.</p>
          </div>
          <Link href="/agendamento" className="text-[#8F1D14] underline hover:opacity-80 text-sm">
            ← Voltar aos agendamentos
          </Link>
        </header>

        {msg && (
          <div
            className={`rounded-xl p-3 text-sm ${
              msg.startsWith('✅')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {msg}
          </div>
        )}

        <section className="bg-white/90 rounded-2xl shadow-lg p-6">
          {itens.length === 0 ? (
            <p className="text-gray-600">Você ainda não possui serviços concluídos.</p>
          ) : (
            <ul className="grid gap-4">
              {itens.map((item) => {
                const dtFim = fmtDateTime(item.end_at);
                const temAvaliacao = !!item.avaliacao;
                return (
                  <li key={item.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold">
                          {item.tipo_nome || 'Serviço'}{' '}
                          <span className="text-gray-500 text-sm">#{item.id}</span>
                        </p>
                        <p className="text-gray-700">
                          {fmtData(item.data_servico)} · {fmtHora(item.hora_servico)}
                          {item.duracao_horas ? ` · ${item.duracao_horas}h` : ''}
                        </p>
                        {item.endereco && <p className="text-gray-600">{item.endereco}</p>}
                        {item.descricao && <p className="text-gray-600 italic">“{item.descricao}”</p>}

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                          <span className={`${chipBase} ${item.checkin_at ? chipOn : chipOff}`}>
                            Check-in {item.checkin_at ? `(${fmtDateTime(item.checkin_at)})` : ''}
                          </span>
                          <span className="text-gray-300">→</span>
                          <span className={`${chipBase} ${item.start_at ? chipOn : chipOff}`}>
                            Início {item.start_at ? `(${fmtDateTime(item.start_at)})` : ''}
                          </span>
                          <span className="text-gray-300">→</span>
                          <span className={`${chipBase} ${item.end_at ? chipOn : chipOff}`}>
                            Término {dtFim ? `(${dtFim})` : ''}
                          </span>
                        </div>

                        <div className="pt-2 text-sm text-gray-700">
                          <p>
                            Prestador:{' '}
                            <span className="font-medium">{item.prestador_nome || '—'}</span>{' '}
                            {item.prestador_email && (
                              <span className="text-gray-500">({item.prestador_email})</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-[220px] mt-2 md:mt-0">
                        {temAvaliacao ? (
                          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
                            <p className="font-medium">Sua avaliação: {item.avaliacao?.nota} ★</p>
                            {item.avaliacao?.comentario && (
                              <p className="text-gray-700 mt-1">“{item.avaliacao.comentario}”</p>
                            )}
                            {item.avaliacao?.created_at && (
                              <p className="text-xs text-gray-500 mt-1">
                                {fmtDateTime(item.avaliacao.created_at)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => abrirAvaliacao(item)}
                            className="w-full px-4 py-2 rounded-lg bg-[#8F1D14] text-white hover:bg-[#a2261b] transition"
                          >
                            Avaliar agora
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Modal de avaliação */}
      <AvaliacaoModal
        agendamentoId={evalAgId ?? 0}
        open={evalOpen && !!evalAgId}
        prestadorNome={evalCtx.prestadorNome}
        servicoNome={evalCtx.servicoNome}
        onClose={() => setEvalOpen(false)}
        onSuccess={() => {
          setEvalOpen(false);
          setEvalAgId(null);
          carregar(); // refaz o fetch para refletir a avaliação
        }}
      />
    </main>
  );
}
