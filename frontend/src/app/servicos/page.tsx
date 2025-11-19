// src/app/servicos/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/utils/api';
import { getToken } from '@/utils/auth';

type TipoServico = {
  id: number;
  // no backend o alias costuma vir como "nomeServico",
  // mas deixamos "nome" como fallback
  nomeServico?: string;
  nome?: string;
};

type FormAgendamento = {
  tipo_servico_id: string;
  data: string;
  hora: string;
  endereco: string;
  descricao: string;
};

function rotuloServico(s: TipoServico): string {
  return s.nomeServico || s.nome || 'Serviço';
}

export default function ServicosPage() {
  const [servicos, setServicos] = useState<TipoServico[]>([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState<FormAgendamento>({
    tipo_servico_id: '',
    data: '',
    hora: '',
    endereco: '',
    descricao: '',
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingServicos, setLoadingServicos] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 🔑 verifica login só no cliente
  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  // 🚀 carrega os tipos de serviço da API
  useEffect(() => {
    async function carregarServicos() {
      try {
        const data = await apiFetch('/tipos-servico', { noAuth: true });
        const itens: TipoServico[] = Array.isArray(data) ? data : [];

        console.log('[TIPOS-SERVICO] dados recebidos =>', itens);
        setServicos(itens);
      } catch (err) {
        console.error('❌ Erro ao carregar serviços:', err);
        setServicos([]);
      } finally {
        setLoadingServicos(false);
      }
    }

    carregarServicos();
  }, []);

  // 🔍 filtro de busca
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return servicos;
    return servicos.filter((s) =>
      rotuloServico(s).toLowerCase().includes(q)
    );
  }, [servicos, busca]);

  // 🧾 envio do agendamento
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');

    const token = getToken();

    if (!token) {
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
        ...form,
        tipo_servico_id: Number(form.tipo_servico_id),
        endereco: form.endereco.trim(),
        descricao: form.descricao.trim(),
      };

      const result = await apiFetch('/agendamentos', {
        method: 'POST',
        body: payload,
      });

      console.log('📦 Resposta do agendamento:', result);

      setMsg('✅ Agendamento criado com sucesso!');
      setForm({
        tipo_servico_id: '',
        data: '',
        hora: '',
        endereco: '',
        descricao: '',
      });
    } catch (err: any) {
      const msgErro =
        err?.body?.message ||
        err?.body?.error ||
        err?.message ||
        'Falha ao criar agendamento.';
      setMsg(`❌ Erro: ${msgErro}`);
      console.error('❌ Erro ao criar agendamento:', err);
    } finally {
      setLoading(false);
    }
  }

  const msgClass = msg.startsWith('✅') ? 'text-green-700' : 'text-red-700';

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F89D13]/30 to-[#8F1D14]/10 pb-20">
      {/* Hero */}
      <section className="pt-24 md:pt-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 md:p-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-extrabold text-[#8F1D14]">
                  Catálogo de Serviços
                </h1>
                <p className="mt-3 text-gray-700">
                  Encontre o serviço ideal e agende em poucos cliques — rápido,
                  seguro e sem complicação.
                </p>
              </div>
              <div className="w-full md:w-80">
                <div className="aspect-[4/3] w-full bg-[#F89D13]/20 rounded-xl flex items-center justify-center">
                  <span className="text-[#8F1D14] font-semibold">InterServ</span>
                </div>
              </div>
            </div>

            {/* Campo de busca */}
            <div className="mt-6">
              <label htmlFor="busca" className="sr-only">
                Buscar serviço
              </label>
              <input
                id="busca"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por ex.: elétrica, pintura, hidráulica…"
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F89D13] transition"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo */}
      <section className="mt-8">
        <div className="max-w-6xl mx-auto px-4">
          {loadingServicos ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/80 rounded-xl h-24 animate-pulse" />
              ))}
            </div>
          ) : filtrados.length === 0 ? (
            <div className="bg-white/90 rounded-xl p-6 text-gray-600 shadow">
              Nenhum serviço encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtrados.map((s) => (
                <article
                  key={s.id}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F89D13]/20 flex items-center justify-center">
                      <span className="text-[#8F1D14]" aria-hidden>
                        🔧
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      {rotuloServico(s)}
                    </h3>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({ ...p, tipo_servico_id: String(s.id) }))
                      }
                      className="text-sm bg-[#F89D13] text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition"
                    >
                      Agendar
                    </button>
                    <Link
                      href={`/servicos?tipo=${s.id}`}
                      className="text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Formulário de agendamento */}
      <section className="mt-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-[#8F1D14] mb-4">
              Agendar um serviço
            </h2>

            <form onSubmit={handleSubmit} className="grid gap-4">
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
                >
                  <option value="">Selecione</option>
                  {servicos.map((s) => (
                    <option key={s.id} value={s.id}>
                      {rotuloServico(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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
              </div>

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

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#8F1D14] text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-[#a2261b] transition disabled:opacity-60"
                >
                  {loading ? 'Enviando…' : 'Agendar serviço'}
                </button>

                {!isLoggedIn && (
                  <Link
                    href="/login?next=/servicos"
                    className="text-[#8F1D14] underline hover:opacity-80"
                  >
                    Fazer login para agendar
                  </Link>
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
