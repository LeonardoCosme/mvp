'use client';

import { JSX, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../utils/api';
import { getToken } from '../../utils/auth';

type TipoServico = {
  id: number;
  nome: string; // ✅ agora só "nome"
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

  const skeletonIds = useMemo(() => ['sk1', 'sk2', 'sk3', 'sk4', 'sk5'], []);

  // 🔄 Carrega tipos de serviço
  useEffect(() => {
    (async () => {
      try {
        const r = await apiFetch('/tipos-servico');
        const itens = Array.isArray(r) ? r : r?.itens || [];
        setServicos(itens);
      } catch (err) {
        console.error('❌ Erro ao carregar serviços:', err);
      } finally {
        setLoadingServicos(false);
      }
    })();
  }, []);

  // 🔍 Filtro de busca
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return servicos;
    return servicos.filter((s) => s.nome.toLowerCase().includes(q));
  }, [servicos, busca]);

  // 📨 Envia agendamento
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');

    if (!getToken()) return setMsg('❌ Faça login para agendar um serviço.');
    if (!form.tipo_servico_id) return setMsg('❌ Selecione um tipo de serviço.');
    if (!form.data) return setMsg('❌ Informe a data.');
    if (!form.hora) return setMsg('❌ Informe a hora.');
    if (!form.endereco.trim()) return setMsg('❌ Informe o endereço.');

    setLoading(true);
    try {
      await apiFetch('/agendamentos', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setMsg('✅ Agendamento criado como pendente!');
      setForm({ tipo_servico_id: '', data: '', hora: '', endereco: '', descricao: '' });
    } catch (err: any) {
      setMsg(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // 🎨 Renderização do catálogo
  let catalogoContent: JSX.Element;
  if (loadingServicos) {
    catalogoContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {skeletonIds.map((id) => (
          <div key={id} className="bg-white/70 h-24 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  } else if (filtrados.length === 0) {
    catalogoContent = (
      <div className="bg-white/90 p-6 text-gray-600 rounded-xl shadow">
        Nenhum serviço encontrado.
      </div>
    );
  } else {
    catalogoContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map((s) => (
          <article
            key={s.id}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F89D13]/20">
                <span className="text-[#8F1D14]" aria-hidden>🔧</span>
              </div>
              <h3 className="font-semibold text-gray-900">{s.nome}</h3>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, tipo_servico_id: String(s.id) }))}
                className="text-sm bg-[#F89D13] text-white px-3 py-1.5 rounded-lg hover:opacity-90"
              >
                Agendar
              </button>
              <Link
                href={`/servicos?tipo=${s.id}`}
                className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                Ver detalhes
              </Link>
            </div>
          </article>
        ))}
      </div>
    );
  }

  const msgClass = msg.startsWith('✅') ? 'text-green-700' : 'text-red-700';

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F89D13]/30 to-[#8F1D14]/10 pb-20">
      <section className="pt-24 md:pt-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white/90 p-8 rounded-2xl shadow-lg">
            <h1 className="text-3xl font-extrabold text-[#8F1D14]">Catálogo de Serviços</h1>
            <p className="mt-2 text-gray-700">
              Encontre o serviço ideal e agende em poucos cliques — rápido, seguro e sem complicação.
            </p>
            <input
              id="busca"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por ex.: elétrica, pintura, hidráulica…"
              className="mt-4 w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#F89D13] outline-none"
            />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="max-w-6xl mx-auto px-4">{catalogoContent}</div>
      </section>

      <section className="mt-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white/90 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-[#8F1D14] mb-4">Agendar um serviço</h2>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div>
                <label htmlFor="tipo_servico_id" className="block text-sm mb-1">Tipo de serviço</label>
                <select
                  id="tipo_servico_id"
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.tipo_servico_id}
                  onChange={(e) => setForm({ ...form, tipo_servico_id: e.target.value })}
                  required
                >
                  <option value="">Selecione</option>
                  {servicos.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="data" className="block text-sm mb-1">Data</label>
                  <input
                    id="data"
                    type="date"
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="hora" className="block text-sm mb-1">Hora</label>
                  <input
                    id="hora"
                    type="time"
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.hora}
                    onChange={(e) => setForm({ ...form, hora: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="endereco" className="block text-sm mb-1">Endereço</label>
                <input
                  id="endereco"
                  placeholder="Rua, nº, bairro"
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.endereco}
                  onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="descricao" className="block text-sm mb-1">Descrição (opcional)</label>
                <textarea
                  id="descricao"
                  rows={3}
                  placeholder="Detalhes do serviço"
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#8F1D14] text-white px-5 py-2 rounded-lg font-semibold hover:bg-[#a2261b]"
                >
                  {loading ? 'Enviando…' : 'Agendar serviço'}
                </button>

                {!getToken() && (
                  <Link href="/login?next=/servicos" className="text-[#8F1D14] underline">
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
