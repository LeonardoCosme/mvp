// src/app/servicos/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
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
  endereco: string;
  descricao: string;
};

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
  const [debugMsg, setDebugMsg] = useState<string>('');

  // 🔑 verifica login só no cliente (evita erro de hydration)
  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  // 🚀 carrega os tipos de serviço DIRETO da API Railway
  useEffect(() => {
    async function carregarServicos() {
      try {
        setDebugMsg('Buscando /api/tipos-servico na Railway...');
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
          console.error('[TIPOS-SERVICO] ERRO HTTP', resp.status, txt);
          setDebugMsg(
            `ERRO HTTP ${resp.status} ao buscar /api/tipos-servico: ${txt}`
          );
          throw new Error(`Erro ao buscar serviços (${resp.status})`);
        }

        const data = (await resp.json()) as TipoServico[] | any;

        // garante que é array
        const itens: TipoServico[] = Array.isArray(data) ? data : [];

        console.log('[TIPOS-SERVICO] dados recebidos =>', itens);
        setDebugMsg(
          `OK! Recebidos ${itens.length} itens de /api/tipos-servico. Veja abaixo.`
        );

        setServicos(itens);
      } catch (err: any) {
        console.error('❌ Erro ao carregar serviços:', err);
        setDebugMsg(`❌ Erro no useEffect: ${String(err?.message || err)}`);
        setServicos([]);
      } finally {
        setLoadingServicos(false);
      }
    }

    carregarServicos();
  }, []);

  // DEBUG VISUAL: mostra o que veio da API na própria página
  const debugServicos = JSON.stringify(servicos, null, 2);

  // 🔍 filtro de busca pelo nome
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return servicos;
    return servicos.filter((s) => (s.nome || '').toLowerCase().includes(q));
  }, [servicos, busca]);

  // 🧾 envio do agendamento
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
        ...form,
        tipo_servico_id: Number(form.tipo_servico_id),
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

      console.log('📦 Resposta do agendamento:', result);

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
        endereco: '',
        descricao: '',
      });
    } catch (err: any) {
      setMsg(`❌ Erro: ${err?.message || 'Falha ao criar agendamento.'}`);
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

            {/* DEBUG VISUAL */}
            <div className="mt-4 bg-black/80 text-green-300 text-xs font-mono p-3 rounded-lg overflow-x-auto max-h-40">
              <div className="font-bold mb-1">DEBUG /api/tipos-servico:</div>
              <div className="mb-1 text-yellow-300">{debugMsg}</div>
              <pre>{debugServicos}</pre>
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
                      {s.nome || 'Serviço'}
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
                      {s.nome || 'Serviço'}
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
