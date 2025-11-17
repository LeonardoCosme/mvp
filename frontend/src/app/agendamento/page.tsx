// src/app/agendamento/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getToken } from '@/utils/auth';

type TipoServico = {
  id: number;
  nome: string;
};

type FormAgendamento = {
  tipo_servico_id: string;
  data: string;
  hora: string;
  duracao?: string;
  endereco: string;
  descricao: string;
};

export default function AgendamentoPage() {
  const [tiposServico, setTiposServico] = useState<TipoServico[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(true);

  const [form, setForm] = useState<FormAgendamento>({
    tipo_servico_id: '',
    data: '',
    hora: '',
    duracao: '',
    endereco: '',
    descricao: '',
  });

  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Verifica se está logado (só no cliente)
  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  // Carrega tipos de serviço direto da API
  useEffect(() => {
    async function carregarTipos() {
      try {
        const resp = await fetch(
          'https://mvp-marido-aluguel.up.railway.app/api/tipos-servico',
          {
            method: 'GET',
            headers: { Accept: 'application/json' },
            cache: 'no-store',
          }
        );

        if (!resp.ok) {
          const txt = await resp.text();
          console.error('[AGENDAMENTO] ERRO HTTP /tipos-servico', resp.status, txt);
          throw new Error(`Erro ao buscar tipos de serviço (${resp.status})`);
        }

        const data = (await resp.json()) as TipoServico[] | any;
        const itens: TipoServico[] = Array.isArray(data) ? data : [];

        console.log('[AGENDAMENTO] tipos =>', itens);

        setTiposServico(itens);
      } catch (err) {
        console.error('❌ Erro ao carregar tipos de serviço:', err);
        setTiposServico([]);
      } finally {
        setLoadingTipos(false);
      }
    }

    carregarTipos();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');

    if (!getToken()) {
      setMsg('❌ Faça login para agendar um serviço.');
      return;
    }
    if (!form.tipo_servico_id) return setMsg('❌ Selecione um tipo de serviço.');
    if (!form.data) return setMsg('❌ Informe a data.');
    if (!form.hora) return setMsg('❌ Informe a hora.');
    if (!form.endereco.trim()) return setMsg('❌ Informe o endereço.');

    setLoading(true);
    try {
      const payload = {
        tipo_servico_id: Number(form.tipo_servico_id),
        data: form.data,
        hora: form.hora,
        duracao: form.duracao || null,
        endereco: form.endereco.trim(),
        descricao: form.descricao.trim(),
      };

      const resp = await fetch(
        'https://mvp-marido-aluguel.up.railway.app/api/agendamentos',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await resp.json().catch(() => ({}));
      console.log('[AGENDAMENTO] resposta =>', result);

      if (!resp.ok) {
        throw new Error(
          (result && (result.message as string)) ||
            `Erro HTTP ${resp.status}`
        );
      }

      setMsg('✅ Agendamento criado com sucesso!');
      setForm({
        tipo_servico_id: '',
        data: '',
        hora: '',
        duracao: '',
        endereco: '',
        descricao: '',
      });
    } catch (err: any) {
      setMsg(`❌ Erro ao criar agendamento: ${err?.message || 'Falha desconhecida.'}`);
    } finally {
      setLoading(false);
    }
  }

  const msgClass = msg.startsWith('✅') ? 'text-green-700' : 'text-red-700';

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F89D13]/30 to-[#8F1D14]/10 pb-20">
      <section className="pt-24 md:pt-28">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 md:p-8">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#8F1D14]">
                  Agendamentos
                </h1>
                <p className="text-sm text-gray-600">
                  Perfil: Contratante
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/home"
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition"
                >
                  ← Voltar para a home
                </Link>
                <Link
                  href="/agendamentos/historico"
                  className="px-4 py-2 text-sm rounded-lg bg-[#8F1D14] text-white hover:bg-[#a2261b] transition"
                >
                  Histórico de avaliações
                </Link>
              </div>
            </header>

            <h2 className="text-lg md:text-xl font-bold text-[#8F1D14] mb-3">
              Novo agendamento
            </h2>

            <form onSubmit={handleSubmit} className="grid gap-4">
              {/* Tipo de serviço */}
              <div>
                <label
                  htmlFor="tipo_servico_id"
                  className="block text-sm text-gray-700 mb-1"
                >
                  Tipo de serviço
                </label>
                <select
                  id="tipo_servico_id"
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.tipo_servico_id}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tipo_servico_id: e.target.value }))
                  }
                  required
                  disabled={loadingTipos}
                >
                  <option value="">
                    {loadingTipos ? 'Carregando...' : 'Selecione'}
                  </option>
                  {tiposServico.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome || 'Serviço'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data e hora */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="data" className="block text-sm text-gray-700 mb-1">
                    Data
                  </label>
                  <input
                    id="data"
                    type="date"
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.data}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, data: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label htmlFor="hora" className="block text-sm text-gray-700 mb-1">
                    Hora
                  </label>
                  <input
                    id="hora"
                    type="time"
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.hora}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, hora: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label htmlFor="duracao" className="block text-sm text-gray-700 mb-1">
                    Duração (h) — opcional
                  </label>
                  <input
                    id="duracao"
                    placeholder="ex.: 1.5"
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.duracao}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, duracao: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Endereço */}
              <div>
                <label htmlFor="endereco" className="block text-sm text-gray-700 mb-1">
                  Endereço
                </label>
                <input
                  id="endereco"
                  placeholder="Rua, nº, bairro"
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.endereco}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, endereco: e.target.value }))
                  }
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <label htmlFor="descricao" className="block text-sm text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  id="descricao"
                  rows={3}
                  placeholder="Detalhes do serviço"
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.descricao}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, descricao: e.target.value }))
                  }
                />
              </div>

              {/* Botão + aviso de login */}
              <div className="flex flex-col md:flex-row md:items-center gap-3 mt-2">
                <button
                  type="submit"
                  disabled={loading || loadingTipos}
                  className="bg-[#8F1D14] text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-[#a2261b] transition disabled:opacity-60"
                >
                  {loading ? 'Enviando…' : 'Criar agendamento'}
                </button>

                {!isLoggedIn && (
                  <p className="text-sm text-gray-600">
                    Para agendar, faça{' '}
                    <Link
                      href="/login?next=/agendamento"
                      className="text-[#8F1D14] underline"
                    >
                      login
                    </Link>
                    .
                  </p>
                )}
              </div>

              {msg && <p className={`text-sm mt-1 ${msgClass}`}>{msg}</p>}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
