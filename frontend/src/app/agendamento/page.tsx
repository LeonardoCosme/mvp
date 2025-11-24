'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../utils/api';
import { getToken } from '../../utils/auth';

type Perfil = 'Contratante' | 'Prestador' | 'Usuário';

type AgendamentoResumo = {
  id: number;
  status: string;
  tipo_nome: string | null;
  data_servico: string | null;
  hora_servico: string | null;
  endereco: string;
  avaliacao?: {
    nota?: number | null;
    comentario?: string | null;
  } | null;
  duracao_horas?: number | string | null;
  start_usado?: boolean;
  end_usado?: boolean;
  // vem do backend (relato_servico no DTO)
  relato_servico?: string | null;
};

type AgendamentoDisponivel = AgendamentoResumo & {
  contratante_nome?: string | null;
};

type QrStatus = {
  id: number;
  status: string;
  start: {
    code: string | null;
    used: boolean;
    usedAt?: string | null;
  };
  end: {
    code: string | null;
    used: boolean;
    usedAt?: string | null;
  };
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

  // estado para QRs
  const [qrcodes, setQrcodes] = useState<Record<number, QrStatus>>({});
  const [qrLoadingId, setQrLoadingId] = useState<number | null>(null);
  const [scanLoadingId, setScanLoadingId] = useState<number | null>(null);

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

        // 1) Descobre o usuário logado
        const user = await apiFetch('/user/me');
        if (cancelado) return;

        console.log('DEBUG /user/me =>', user);

        const tipoBruto =
          user?.tipo ?? user?.tipoUsuario ?? user?.perfil ?? '';

        const tipoNorm = String(tipoBruto).toLowerCase().trim();
        const hasContratanteObj = !!user?.Contratante || !!user?.contratante;
        const hasPrestadorObj = !!user?.Prestador || !!user?.prestador;

        const isContratante =
          hasContratanteObj ||
          tipoNorm === 'contratante' ||
          tipoNorm === 'cliente';

        const isPrestador = hasPrestadorObj || tipoNorm === 'prestador';

        const perfilDetectado: Perfil = isContratante
          ? 'Contratante'
          : isPrestador
          ? 'Prestador'
          : 'Usuário';

        console.log('DEBUG tipoBruto =>', tipoBruto);
        console.log('DEBUG perfilDetectado =>', perfilDetectado);

        setPerfil(perfilDetectado);

        // 2) Busca agendamentos conforme o perfil
        if (perfilDetectado === 'Contratante') {
          const lista = (await apiFetch(
            '/agendamentos/cliente'
          )) as AgendamentoResumo[];
          if (!cancelado) {
            setAgendamentos(Array.isArray(lista) ? lista : []);
            setDisponiveis([]);
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
            err?.body?.error ||
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

  async function carregarMeusAgendamentosSePrestador() {
    if (perfil !== 'Prestador') return;
    try {
      const meus = (await apiFetch(
        '/agendamentos/prestador'
      )) as AgendamentoResumo[];
      setAgendamentos(Array.isArray(meus) ? meus : []);
    } catch (err) {
      console.error('❌ Erro ao recarregar agendamentos do prestador:', err);
    }
  }

  async function carregarMeusAgendamentosSeContratante() {
    if (perfil !== 'Contratante') return;
    try {
      const lista = (await apiFetch(
        '/agendamentos/cliente'
      )) as AgendamentoResumo[];
      setAgendamentos(Array.isArray(lista) ? lista : []);
    } catch (err) {
      console.error('❌ Erro ao recarregar agendamentos do contratante:', err);
    }
  }

  async function handleAceitar(id: number) {
    try {
      setAcaoCarregando(id);
      await apiFetch(`/agendamentos/${id}/aceitar`, {
        method: 'POST',
      });

      // remove da lista de disponíveis
      setDisponiveis((lista) => lista.filter((item) => item.id !== id));
      // recarrega "meus agendamentos" do prestador
      await carregarMeusAgendamentosSePrestador();
    } catch (err: any) {
      console.error('❌ Erro ao aceitar agendamento:', err);
      alert(
        err?.body?.error ||
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
        err?.body?.error ||
          err?.body?.message ||
          err?.message ||
          'Não foi possível recusar este serviço.'
      );
    } finally {
      setAcaoCarregando(null);
    }
  }

  // --------- QR CODES ---------

  async function toggleQr(ag: AgendamentoResumo) {
    const id = ag.id;

    // se já está carregado, esconde
    if (qrcodes[id]) {
      setQrcodes((prev) => {
        const clone = { ...prev };
        delete clone[id];
        return clone;
      });
      return;
    }

    try {
      setQrLoadingId(id);
      const info = (await apiFetch(
        `/agendamentos/${id}/qrcode`
      )) as QrStatus;
      setQrcodes((prev) => ({ ...prev, [id]: info }));
    } catch (err: any) {
      console.error('❌ Erro ao carregar QR codes:', err);
      alert(
        err?.body?.error ||
          err?.body?.message ||
          err?.message ||
          'Erro ao carregar QR codes deste agendamento.'
      );
    } finally {
      setQrLoadingId(null);
    }
  }

  async function handleScanQr(ag: AgendamentoResumo, tipo: 'start' | 'end') {
    const codigo = window.prompt(
      tipo === 'start'
        ? 'Cole aqui o código lido do QR de INÍCIO:'
        : 'Cole aqui o código lido do QR de FINALIZAÇÃO:'
    );
    if (!codigo) return;

    // se for QR de finalização, pergunta o relato do serviço
    let relato: string | undefined;
    if (tipo === 'end') {
      const texto = window.prompt(
        'Descreva brevemente o serviço realizado (opcional):',
        ''
      );
      if (texto && texto.trim()) {
        relato = texto.trim();
      }
    }

    try {
      setScanLoadingId(ag.id);

      const body: any = { code: codigo, tipo };
      if (relato) {
        body.relato = relato; // backend aceita "relato"
      }

      const resp = await apiFetch(`/agendamentos/${ag.id}/scan`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      console.log('DEBUG scan resp =>', resp);

      // atualiza lista de agendamentos do prestador
      await carregarMeusAgendamentosSePrestador();

      // se os QRs desse agendamento estão abertos, recarrega o estado deles
      if (qrcodes[ag.id]) {
        try {
          const info = (await apiFetch(
            `/agendamentos/${ag.id}/qrcode`
          )) as QrStatus;
          setQrcodes((prev) => ({ ...prev, [ag.id]: info }));
        } catch (err) {
          console.error('Erro ao recarregar QR após scan:', err);
        }
      }

      alert(
        tipo === 'start'
          ? 'Check-in do serviço registrado com sucesso.'
          : 'Finalização do serviço registrada com sucesso.'
      );
    } catch (err: any) {
      console.error('❌ Erro ao registrar leitura do QR:', err);
      alert(
        err?.body?.error ||
          err?.body?.message ||
          err?.message ||
          'Não foi possível registrar a leitura do QR code.'
      );
    } finally {
      setScanLoadingId(null);
    }
  }

  // ------------ CONTRATANTE: EDITAR / CANCELAR / AVALIAR ------------

  function podeEditarOuCancelar(status: string) {
    const st = (status || '').toLowerCase();
    return (
      st.includes('pendente') ||
      st.includes('aguardando') ||
      st.includes('disponível') ||
      st.includes('disponivel')
    );
  }

  async function handleEditarAgendamento(ag: AgendamentoResumo) {
    try {
      const novaData = window.prompt(
        'Nova data (formato AAAA-MM-DD):',
        ag.data_servico || ''
      );
      if (novaData === null) return;

      const novaHora = window.prompt(
        'Novo horário (formato HH:MM):',
        ag.hora_servico || ''
      );
      if (novaHora === null) return;

      const novoEndereco = window.prompt(
        'Endereço (deixe em branco para manter):',
        ag.endereco || ''
      );

      const observacao = window.prompt('Observação (opcional):', '');

      const body: any = {
        data_servico: novaData,
        hora_servico: novaHora,
      };
      if (novoEndereco && novoEndereco.trim()) {
        body.endereco = novoEndereco.trim();
      }
      if (observacao && observacao.trim()) {
        body.observacao = observacao.trim();
      }

      const atualizado = (await apiFetch(`/agendamentos/${ag.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      })) as AgendamentoResumo;

      setAgendamentos((lista) =>
        lista.map((item) => (item.id === ag.id ? atualizado : item))
      );
      alert('Agendamento atualizado com sucesso!');
    } catch (err: any) {
      console.error('❌ Erro ao editar agendamento:', err);
      alert(
        err?.body?.error ||
          err?.body?.message ||
          err?.message ||
          'Não foi possível editar o agendamento.'
      );
    }
  }

  async function handleCancelarAgendamento(ag: AgendamentoResumo) {
    if (
      !window.confirm(
        `Tem certeza que deseja cancelar o serviço #${ag.id}?`
      )
    ) {
      return;
    }

    try {
      await apiFetch(`/agendamentos/${ag.id}`, {
        method: 'DELETE',
      });

      setAgendamentos((lista) => lista.filter((item) => item.id !== ag.id));
      alert('Agendamento cancelado com sucesso.');
    } catch (err: any) {
      console.error('❌ Erro ao cancelar agendamento:', err);
      alert(
        err?.body?.error ||
          err?.body?.message ||
          err?.message ||
          'Não foi possível cancelar o agendamento.'
      );
    }
  }

  // PRESTADOR: editar relato depois de concluído
  async function handleEditarRelato(ag: AgendamentoResumo) {
    const texto = window.prompt(
      'Descreva o serviço realizado (isso fica salvo no histórico):',
      ag.relato_servico || ''
    );

    if (texto === null) return; // cancelou

    const body = {
      relato_servico: texto.trim() || null,
    };

    try {
      await apiFetch(`/agendamentos/${ag.id}/relato`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      // recarrega lista do prestador pra pegar o texto atualizado
      await carregarMeusAgendamentosSePrestador();

      alert('Relato do serviço atualizado com sucesso.');
    } catch (err: any) {
      console.error('❌ Erro ao salvar relato do serviço:', err);
      alert(
        err?.body?.error ||
          err?.body?.message ||
          err?.message ||
          'Não foi possível salvar o relato do serviço.'
      );
    }
  }

  // CONTRATANTE: registrar avaliação após conclusão
  async function handleAvaliarAgendamento(ag: AgendamentoResumo) {
    if (ag.avaliacao?.nota != null) {
      alert('Este serviço já foi avaliado.');
      return;
    }

    const notaStr = window.prompt(
      'Dê uma nota de 1 a 5 para o serviço:',
      '5'
    );
    if (notaStr === null) return;

    const nota = Number(notaStr);
    if (!Number.isFinite(nota) || nota < 1 || nota > 5) {
      alert('Informe uma nota válida entre 1 e 5.');
      return;
    }

    const comentario =
      window.prompt('Comentário sobre o serviço (opcional):', '') ?? '';

    try {
      await apiFetch('/avaliacoes', {
        method: 'POST',
        body: JSON.stringify({
          agendamentoId: ag.id,
          nota,
          comentario: comentario.trim() || null,
        }),
      });

      // recarrega os agendamentos do contratante para refletir a avaliação
      await carregarMeusAgendamentosSeContratante();

      alert('Avaliação registrada com sucesso!');
    } catch (err: any) {
      console.error('❌ Erro ao registrar avaliação:', err);
      alert(
        err?.body?.error ||
          err?.body?.message ||
          err?.message ||
          'Não foi possível registrar a avaliação.'
      );
    }
  }

  // ---------------------- RENDER ----------------------

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

            {/* Mensagem de erro */}
            {erro && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            {/* Aviso para criar novo agendamento (cliente) */}
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
                  {agendamentos.map((ag) => {
                    const qrInfo = qrcodes[ag.id];
                    const statusLower = ag.status.toLowerCase();

                    // serviço considerado “finalizado” para efeitos de QR
                    const jaFinalizado =
                      statusLower.includes('concluida') || !!ag.end_usado;

                    // CONTRATANTE: só vê QR enquanto está ACEITO e ainda não finalizado
                    const podeMostrarQrContratante =
                      perfil === 'Contratante' &&
                      statusLower.includes('aceita') &&
                      !jaFinalizado;

                    // PRESTADOR: só vê leitura de QR enquanto ainda há algo a registrar
                    const podeLerQrPrestador =
                      perfil === 'Prestador' &&
                      !jaFinalizado &&
                      (statusLower.includes('aceita') ||
                        statusLower.includes('concluida'));

                    const duracaoNumero =
                      typeof ag.duracao_horas === 'number'
                        ? ag.duracao_horas
                        : ag.duracao_horas
                        ? Number(ag.duracao_horas)
                        : null;

                    const podeAvaliarContratante =
                      perfil === 'Contratante' &&
                      statusLower.includes('concluida') &&
                      !ag.avaliacao?.nota;

                    return (
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
                          {duracaoNumero != null &&
                            !Number.isNaN(duracaoNumero) && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                Duração: {duracaoNumero.toFixed(2)} h
                              </p>
                            )}

                          {/* Relato do prestador, visível para o contratante */}
                          {ag.relato_servico && (
                            <p className="text-xs text-gray-600 mt-0.5">
                              <span className="font-semibold">
                                Relato do serviço:{' '}
                              </span>
                              {ag.relato_servico}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                          {ag.avaliacao?.nota != null && (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              ⭐ Avaliado ({ag.avaliacao.nota}/5)
                            </span>
                          )}

                          {/* Botões editar/cancelar (contratante) */}
                          {perfil === 'Contratante' &&
                            podeEditarOuCancelar(ag.status) && (
                              <div className="flex gap-2 mt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditarAgendamento(ag)
                                  }
                                  className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-50"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCancelarAgendamento(ag)
                                  }
                                  className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-xs font-semibold hover:bg-red-50"
                                >
                                  Cancelar
                                </button>
                              </div>
                            )}

                          {/* Contratante: botão para avaliar serviço concluído */}
                          {podeAvaliarContratante && (
                            <button
                              type="button"
                              onClick={() => handleAvaliarAgendamento(ag)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                            >
                              Avaliar serviço
                            </button>
                          )}

                          {/* Contratante: visualizar QRs */}
                          {podeMostrarQrContratante && (
                            <div className="flex flex-col items-end gap-1 mt-1 w-full md:w-auto">
                              <button
                                type="button"
                                onClick={() => toggleQr(ag)}
                                disabled={qrLoadingId === ag.id}
                                className="px-3 py-1.5 rounded-lg border border-[#8F1D14]/40 text-[#8F1D14] text-xs font-semibold hover:bg-[#8F1D14]/5 disabled:opacity-60"
                              >
                                {qrLoadingId === ag.id
                                  ? 'Carregando QRs...'
                                  : qrInfo
                                  ? 'Esconder QR codes'
                                  : 'Ver QR codes'}
                              </button>

                              {qrInfo && (
                                <div className="mt-2 flex flex-col gap-1 w-full max-w-xs">
                                  <div
                                    className={`rounded-md px-2 py-1 border text-[11px] break-all ${
                                      qrInfo.start.used
                                        ? 'bg-red-50 border-red-300 text-red-700'
                                        : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                    }`}
                                  >
                                    <span className="font-semibold mr-1">
                                      QR início:
                                    </span>
                                    <code>{qrInfo.start.code}</code>
                                  </div>
                                  <div
                                    className={`rounded-md px-2 py-1 border text-[11px] break-all ${
                                      qrInfo.end.used
                                        ? 'bg-red-50 border-red-300 text-red-700'
                                        : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                    }`}
                                  >
                                    <span className="font-semibold mr-1">
                                      QR finalização:
                                    </span>
                                    <code>{qrInfo.end.code}</code>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Prestador: ler QRs (apenas enquanto não finalizado) */}
                          {podeLerQrPrestador && (
                            <div className="flex flex-wrap gap-2 mt-1 justify-end w-full md:w-auto">
                              {/* QR de início: só se ainda não foi usado */}
                              {!ag.start_usado && (
                                <button
                                  type="button"
                                  onClick={() => handleScanQr(ag, 'start')}
                                  disabled={scanLoadingId === ag.id}
                                  className="px-3 py-1.5 rounded-lg border border-blue-300 text-blue-700 text-xs font-semibold hover:bg-blue-50 disabled:opacity-60"
                                >
                                  {scanLoadingId === ag.id
                                    ? 'Registrando início...'
                                    : 'Ler QR de início'}
                                </button>
                              )}

                              {/* QR de finalização: só se já iniciou e ainda não finalizou */}
                              {ag.start_usado && !ag.end_usado && (
                                <button
                                  type="button"
                                  onClick={() => handleScanQr(ag, 'end')}
                                  disabled={scanLoadingId === ag.id}
                                  className="px-3 py-1.5 rounded-lg border border-purple-300 text-purple-700 text-xs font-semibold hover:bg-purple-50 disabled:opacity-60"
                                >
                                  {scanLoadingId === ag.id
                                    ? 'Registrando fim...'
                                    : 'Ler QR de finalização'}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Prestador: serviço finalizado -> botão de editar relato */}
                          {perfil === 'Prestador' && jaFinalizado && (
                            <button
                              type="button"
                              onClick={() => handleEditarRelato(ag)}
                              className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 text-xs font-semibold hover:bg-emerald-50"
                            >
                              {ag.relato_servico
                                ? 'Editar relato do serviço'
                                : 'Adicionar relato do serviço'}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
