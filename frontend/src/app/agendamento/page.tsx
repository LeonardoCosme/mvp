'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';
import { getToken, removeToken } from '@/utils/auth';

// componentes auxiliares
import Modal from '@/app/components/modal';
import QrDisplay from '@/app/components/QrDisplay';

type TUser = {
  id: number;
  nomeUsuario: string;
  email: string;
  tipo: 'master' | 'prestador' | 'contratante';
};

type TTipoServico = { id: number; nomeServico: string };

type TAgendamento = {
  id: number;
  prestador_id: number | null;
  contratante_id: number;
  tipo_servico_id: number;
  descricao: string | null;
  data_servico: string | null;
  hora_servico: string | null;
  duracao_horas?: number | null;
  endereco: string | null;
  status: 'pendente' | 'aceita' | 'concluida' | 'cancelada';
  created_at?: string;

  // trilhas QR
  checkin_at?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  checkin_used?: 0 | 1 | boolean;
  start_used?: 0 | 1 | boolean;
  end_used?: 0 | 1 | boolean;
};

type FormNovo = {
  tipo_servico_id: string;
  data: string;
  hora: string;
  endereco: string;
  descricao: string;
  duracao_horas?: string;
};

type QRPhase = 'checkin' | 'start' | 'end';

/* ===== Helpers (escopo externo) ===== */

function fmtData(d?: string | null) {
  if (!d || typeof d !== 'string') return '--';
  const parts = d.split('-');
  if (parts.length < 3) return d;
  const [y, m, day] = parts.map(Number); // arrow era equivalente a Number
  if (!y || !m || !day) return d;
  return new Date(y, m - 1, day).toLocaleDateString('pt-BR');
}

function fmtHora(h?: string | null) {
  if (!h || typeof h !== 'string') return '--';
  const parts = h.split(':');
  if (parts.length < 2) return h;
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
}

function fmtDateTime(dt?: string | null) {
  if (!dt) return null;
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt; // prefer Number.isNaN
  const dia = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia} ${hora}`;
}

/* ==================================== */

export default function AgendamentosPage() {
  const router = useRouter();

  const [user, setUser] = useState<TUser | null>(null);
  const [tipos, setTipos] = useState<TTipoServico[]>([]);
  // duas listas para o prestador
  const [pendentes, setPendentes] = useState<TAgendamento[]>([]);
  const [meusAceitos, setMeusAceitos] = useState<TAgendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string>('');

  // formulário (só para contratante)
  const [form, setForm] = useState<FormNovo>({
    tipo_servico_id: '',
    data: '',
    hora: '',
    endereco: '',
    descricao: '',
    duracao_horas: '',
  });
  const [sending, setSending] = useState(false);

  // modal QR (contratante)
  const [qrOpen, setQrOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrFor, setQrFor] = useState<{ id: number; phase: QRPhase; token: string } | null>(null);

  const isPrestador = useMemo(() => user?.tipo === 'prestador', [user]);
  const isContratante = useMemo(() => user?.tipo === 'contratante', [user]);

  useEffect(() => {
    (async () => {
      try {
        if (!getToken()) {
          router.replace('/login');
          return;
        }

        // 1) usuário
        const me = (await apiFetch('/user/me')) as TUser;
        setUser(me);

        // 2) tipos de serviço
        const resTipos = (await apiFetch('/tipos-servico')) as { itens?: TTipoServico[] } | TTipoServico[];
        const itens = Array.isArray(resTipos) ? resTipos : resTipos?.itens || [];
        setTipos(itens);

        // 3) listas conforme perfil
        if (me.tipo === 'prestador') {
          const [pend, meus] = await Promise.all([
            apiFetch('/agendamentos/pendentes') as Promise<TAgendamento[]>,
            apiFetch('/agendamentos/prestador') as Promise<TAgendamento[]>, // “aceitos/concluídos” do prestador
          ]);
          setPendentes(Array.isArray(pend) ? pend : []);
          setMeusAceitos(Array.isArray(meus) ? meus : []);
        } else {
          const meus = (await apiFetch('/agendamentos/cliente')) as TAgendamento[];
          setPendentes([]);
          setMeusAceitos(Array.isArray(meus) ? meus : []);
        }
      } catch (e: any) {
        const text = String(e?.message || '');
        if (text.toLowerCase().includes('token')) {
          removeToken?.();
          router.replace('/login');
          return;
        }
        setMsg(text || 'Erro ao carregar agendamentos.');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  function labelStatus(s: TAgendamento['status']) {
    if (s === 'pendente') return 'Pendente';
    if (s === 'aceita') return 'Aceita';
    if (s === 'concluida') return 'Concluída';
    return 'Cancelada';
  }

  async function criarAgendamento(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setSending(true);
    try {
      const payload = {
        tipo_servico_id: Number(form.tipo_servico_id),
        data: form.data,
        hora: form.hora,
        endereco: form.endereco.trim(),
        descricao: form.descricao.trim(),
        duracao_horas: form.duracao_horas ? Number(form.duracao_horas.replace(',', '.')) : undefined,
      };
      await apiFetch('/agendamentos', { method: 'POST', body: JSON.stringify(payload) });
      setMsg('✅ Agendamento criado como pendente! Um prestador poderá aceitá-lo em breve.');

      // recarregar lista do cliente
      const meus = (await apiFetch('/agendamentos/cliente')) as TAgendamento[];
      setMeusAceitos(Array.isArray(meus) ? meus : []);

      // limpar form
      setForm({ tipo_servico_id: '', data: '', hora: '', endereco: '', descricao: '', duracao_horas: '' });
    } catch (e: any) {
      setMsg(`❌ ${e?.message || 'Erro ao criar agendamento.'}`);
    } finally {
      setSending(false);
    }
  }

  async function aceitar(id: number) {
    setMsg('');
    try {
      const r = await apiFetch(`/agendamentos/${id}/aceitar`, { method: 'POST' });
      if (r?.id) {
        router.push(`/agendamento/${r.id}/scanner`);
        return;
      }
      setMsg('✅ Agendamento aceito!');
      const [pend, meus] = await Promise.all([
        apiFetch('/agendamentos/pendentes') as Promise<TAgendamento[]>,
        apiFetch('/agendamentos/prestador') as Promise<TAgendamento[]>,
      ]);
      setPendentes(Array.isArray(pend) ? pend : []);
      setMeusAceitos(Array.isArray(meus) ? meus : []);
    } catch (e: any) {
      setMsg(`❌ ${e?.message || 'Erro ao aceitar agendamento.'}`);
    }
  }

  async function abrirQr(agId: number, phase: QRPhase) {
    try {
      setQrLoading(true);
      setQrOpen(true);
      setQrFor(null);

      const r = (await apiFetch(`/agendamentos/${agId}/qrcode?phase=${phase}`)) as {
        id: number;
        phase: QRPhase;
        token: string;
        url?: string;
      };

      setQrFor({ id: r.id, phase: r.phase, token: r.token });
    } catch (e: any) {
      setMsg(`❌ ${e?.message || 'Falha ao gerar QR.'}`);
      setQrOpen(false);
    } finally {
      setQrLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F89D13]/10">
        Carregando agendamentos...
      </div>
    );
  }

  if (!user) return null;

  // estilos de chip
  const chipBase = 'px-2 py-1 rounded-full border';
  const chipOn = 'bg-green-50 text-green-700 border-green-200';
  const chipOff = 'bg-gray-50 text-gray-600 border-gray-200';

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F89D13]/30 to-[#8F1D14]/10 p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#8F1D14]">Agendamentos</h1>
            <p className="text-gray-600 capitalize">Perfil: {user.tipo}</p>
          </div>
          <div className="text-sm">
            <Link href="/home" className="text-[#8F1D14] underline hover:opacity-80">
              ← Voltar para a home
            </Link>
          </div>
        </header>

        {/* Mensagem */}
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

        {/* CONTRATANTE: Form novo agendamento */}
        {isContratante && (
          <section className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-[#8F1D14] mb-4">Novo agendamento</h2>
            <form onSubmit={criarAgendamento} className="grid gap-3">
              <div>
                <label htmlFor="tipo_servico_id" className="block text-sm text-gray-700 mb-1">
                  Tipo de serviço
                </label>
                <select
                  id="tipo_servico_id"
                  required
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.tipo_servico_id}
                  onChange={(e) => setForm((p) => ({ ...p, tipo_servico_id: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  {tipos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nomeServico}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="data" className="block text-sm text-gray-700 mb-1">
                    Data
                  </label>
                  <input
                    id="data"
                    type="date"
                    required
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.data}
                    onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="hora" className="block text-sm text-gray-700 mb-1">
                    Hora
                  </label>
                  <input
                    id="hora"
                    type="time"
                    required
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.hora}
                    onChange={(e) => setForm((p) => ({ ...p, hora: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="duracao_horas" className="block text-sm text-gray-700 mb-1">
                    Duração (h) — opcional
                  </label>
                  <input
                    id="duracao_horas"
                    type="number"
                    step="0.5"
                    min="0.5"
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.duracao_horas}
                    onChange={(e) => setForm((p) => ({ ...p, duracao_horas: e.target.value }))}
                    placeholder="ex.: 1.5"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="endereco" className="block text-sm text-gray-700 mb-1">
                  Endereço
                </label>
                <input
                  id="endereco"
                  required
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.endereco}
                  onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
                  placeholder="Rua, nº, bairro"
                />
              </div>

              <div>
                <label htmlFor="descricao" className="block text-sm text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  id="descricao"
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.descricao}
                  onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
                  placeholder="Detalhes do serviço"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="self-start bg-[#8F1D14] text-white px-5 py-2 rounded-lg shadow hover:bg-[#a2261b] transition"
              >
                {sending ? 'Enviando...' : 'Criar agendamento'}
              </button>
            </form>
          </section>
        )}

        {/* PRESTADOR: PENDENTES */}
        {isPrestador && (
          <section className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-[#8F1D14] mb-3">Agendamentos pendentes</h2>
            {pendentes.length === 0 ? (
              <p className="text-gray-600">Nenhum pendente.</p>
            ) : (
              <ul className="grid gap-3">
                {pendentes.map((ag) => (
                  <li key={ag.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {tipos.find((t) => t.id === ag.tipo_servico_id)?.nomeServico || 'Serviço'} —{' '}
                          <span className="text-gray-600">{labelStatus(ag.status)}</span>
                        </p>
                        <p className="text-gray-700">
                          {fmtData(ag.data_servico)} · {fmtHora(ag.hora_servico)}
                          {ag.duracao_horas ? ` · ${ag.duracao_horas}h` : ''}
                        </p>
                        {ag.endereco && <p className="text-gray-600">{ag.endereco}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => aceitar(ag.id)}
                        className="bg-[#F89D13] text-white px-4 py-2 rounded-lg hover:bg-[#e68a11] transition"
                      >
                        Aceitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* PRESTADOR: MEUS ACEITOS */}
        {isPrestador && (
          <section className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-[#8F1D14] mb-3">Meus agendamentos aceitos</h2>
            {meusAceitos.length === 0 ? (
              <p className="text-gray-600">Você ainda não aceitou nenhum.</p>
            ) : (
              <ul className="grid gap-3">
                {meusAceitos.map((ag) => {
                  const stepCheckin = !!(ag.checkin_at || ag.checkin_used);
                  const stepStart = !!(ag.start_at || ag.start_used);
                  const stepEnd = !!(ag.end_at || ag.end_used);

                  return (
                    <li key={ag.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {tipos.find((t) => t.id === ag.tipo_servico_id)?.nomeServico || 'Serviço'} —{' '}
                            <span className="text-gray-600">{labelStatus(ag.status)}</span>
                          </p>
                          <p className="text-gray-700">
                            {fmtData(ag.data_servico)} · {fmtHora(ag.hora_servico)}
                            {ag.duracao_horas ? ` · ${ag.duracao_horas}h` : ''}
                          </p>
                          {ag.endereco && <p className="text-gray-600">{ag.endereco}</p>}

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                            <span className={`${chipBase} ${stepCheckin ? chipOn : chipOff}`}>
                              Check-in {ag.checkin_at ? `(${fmtDateTime(ag.checkin_at)})` : ''}
                            </span>
                            <span className="text-gray-300">→</span>
                            <span className={`${chipBase} ${stepStart ? chipOn : chipOff}`}>
                              Início {ag.start_at ? `(${fmtDateTime(ag.start_at)})` : ''}
                            </span>
                            <span className="text-gray-300">→</span>
                            <span className={`${chipBase} ${stepEnd ? chipOn : chipOff}`}>
                              Término {ag.end_at ? `(${fmtDateTime(ag.end_at)})` : ''}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/agendamento/${ag.id}/scanner`}
                          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                        >
                          Abrir scanner
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* CONTRATANTE: lista */}
        {isContratante && (
          <section className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-[#8F1D14] mb-3">Meus agendamentos</h2>
            {meusAceitos.length === 0 ? (
              <p className="text-gray-600">Nenhum agendamento para mostrar.</p>
            ) : (
              <ul className="grid gap-3">
                {meusAceitos.map((ag) => {
                  const stepCheckin = !!(ag.checkin_at || ag.checkin_used);
                  const stepStart = !!(ag.start_at || ag.start_used);
                  const stepEnd = !!(ag.end_at || ag.end_used);

                  return (
                    <li key={ag.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {tipos.find((t) => t.id === ag.tipo_servico_id)?.nomeServico || 'Serviço'} —{' '}
                            <span className="text-gray-600">{labelStatus(ag.status)}</span>
                          </p>
                          <p className="text-gray-700">
                            {fmtData(ag.data_servico)} · {fmtHora(ag.hora_servico)}
                            {ag.duracao_horas ? ` · ${ag.duracao_horas}h` : ''}
                          </p>
                          {ag.endereco && <p className="text-gray-600">{ag.endereco}</p>}
                          {ag.descricao && <p className="text-gray-600 mt-1">“{ag.descricao}”</p>}

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                            <span className={`${chipBase} ${stepCheckin ? chipOn : chipOff}`}>
                              Check-in {ag.checkin_at ? `(${fmtDateTime(ag.checkin_at)})` : ''}
                            </span>
                            <span className="text-gray-300">→</span>
                            <span className={`${chipBase} ${stepStart ? chipOn : chipOff}`}>
                              Início {ag.start_at ? `(${fmtDateTime(ag.start_at)})` : ''}
                            </span>
                            <span className="text-gray-300">→</span>
                            <span className={`${chipBase} ${stepEnd ? chipOn : chipOff}`}>
                              Término {ag.end_at ? `(${fmtDateTime(ag.end_at)})` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => abrirQr(ag.id, 'checkin')}
                            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                          >
                            QR Check-in
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirQr(ag.id, 'start')}
                            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                          >
                            QR Início
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirQr(ag.id, 'end')}
                            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                          >
                            QR Término
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>

      {/* Modal do QR (contratante) */}
      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="QR code do agendamento" maxWidthClass="max-w-md">
        {qrLoading && <p className="text-sm text-gray-600">Gerando QR…</p>}
        {!qrLoading && qrFor && (
          <div className="space-y-3">
            {(() => {
              let phaseLabel = 'término';
              if (qrFor.phase === 'checkin') phaseLabel = 'check-in';
              else if (qrFor.phase === 'start') phaseLabel = 'início';
              return (
                <p className="text-sm text-gray-700">
                  Mostre este QR ao prestador para registrar: <strong>{phaseLabel}</strong>.
                </p>
              );
            })()}

            <QrDisplay
              text={JSON.stringify({ id: qrFor.id, phase: qrFor.phase, token: qrFor.token })}
              size={256}
            />

            <code className="block text-xs bg-gray-50 border border-gray-200 rounded p-2 break-all">
              {JSON.stringify({ id: qrFor.id, phase: qrFor.phase, token: qrFor.token })}
            </code>
          </div>
        )}
      </Modal>
    </main>
  );
}
