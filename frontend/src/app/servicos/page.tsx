// frontend/src/app/servicos/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { getToken } from '../../utils/auth';

type TipoServico = {
  id: number;
  nomeServico?: string; // vem do backend como alias de 'nome'
  nome?: string; // fallback se um dia voltar a ser 'nome'
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

// Escolhe um ícone de acordo com o tipo de serviço
function iconServico(s: TipoServico): string {
  const nome = rotuloServico(s);
  const lower = nome.toLowerCase();

  if (lower.includes('elétric') || lower.includes('eletric')) {
    return '⚡'; // elétrica
  }

  if (lower.includes('hidrául') || lower.includes('hidraul') || lower.includes('encan') || lower.includes('vazamento')) {
    return '💧'; // hidráulica / encanamento
  }

  if (lower.includes('pintur')) {
    return '🎨'; // pintura
  }

  if (lower.includes('montagem') || lower.includes('móvel') || lower.includes('moveis') || lower.includes('móveis')) {
    return '🧰'; // montagem de móveis
  }

  if (lower.includes('reforma') || lower.includes('alvenaria') || lower.includes('parede')) {
    return '🧱'; // pequenos reparos / reforma
  }

  // genérico
  return '🔧';
}

// Gera uma descrição amigável a partir do nome do serviço
function descricaoServico(s: TipoServico): string {
  const nome = rotuloServico(s);
  const lower = nome.toLowerCase();

  if (lower.includes('elétric') || lower.includes('eletric')) {
    return (
      'Serviço de manutenção elétrica para sua casa ou empresa. ' +
      'Inclui verificação de disjuntores, troca de tomadas, interruptores, luminárias e pequenos reparos ' +
      'para garantir segurança e bom funcionamento da rede elétrica.'
    );
  }

  if (lower.includes('hidrául') || lower.includes('hidraul') || lower.includes('encan') || lower.includes('vazamento')) {
    return (
      'Serviço de manutenção hidráulica: conserto de vazamentos, troca de torneiras, registro, sifão, ' +
      'chuveiro, descarga e demais ajustes na parte de encanamento, sempre que possível sem quebra de parede.'
    );
  }

  if (lower.includes('pintur')) {
    return (
      'Serviço de pintura e retoques: preparação da parede (limpeza leve, correção de pequenos furos), ' +
      'aplicação de tinta em ambientes internos, portas ou grades, conforme combinado previamente.'
    );
  }

  if (lower.includes('montagem') || lower.includes('móvel') || lower.includes('moveis') || lower.includes('móveis')) {
    return (
      'Serviço de montagem e desmontagem de móveis: guarda-roupas, mesas, camas, estantes e outros itens, ' +
      'seguindo o manual do fabricante sempre que disponível, garantindo estabilidade e bom acabamento.'
    );
  }

  if (lower.includes('reforma') || lower.includes('alvenaria')) {
    return (
      'Serviço de pequenos reparos e reformas: ajustes em paredes, rejuntes, pequenos acabamentos, ' +
      'correção de imperfeições e melhorias pontuais conforme a necessidade do ambiente.'
    );
  }

  // Genérico
  return (
    'Serviço prestado por profissional especializado, com foco em pequenos reparos, ajustes e manutenção. ' +
    'Os detalhes podem ser combinados na descrição do agendamento para que o prestador entenda exatamente o que você precisa.'
  );
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
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  // Modal de descrição
  const [servicoDetalhe, setServicoDetalhe] = useState<TipoServico | null>(null);

  // ref para rolar até o formulário
  const formRef = useRef<HTMLDivElement | null>(null);

  // 🔑 verifica login só no cliente (evita erro de hydration)
  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  // 🚀 carrega os tipos de serviço DIRETO da API Railway
  useEffect(() => {
    async function carregarServicos() {
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
          console.error('[TIPOS-SERVICO] ERRO HTTP', resp.status, txt);
          throw new Error(`Erro ao buscar serviços (${resp.status})`);
        }

        const data = (await resp.json()) as TipoServico[] | any;
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

  // 🔍 filtro de busca usando rotuloServico
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return servicos;
    return servicos.filter((s) =>
      rotuloServico(s).toLowerCase().includes(q)
    );
  }, [servicos, busca]);

  // Seleciona um serviço e rola até o formulário
  function handleSelecionarServico(s: TipoServico) {
    setSelectedServiceId(s.id);
    setForm((p) => ({
      ...p,
      tipo_servico_id: String(s.id),
      // Se o usuário ainda não escreveu nada, sugerimos uma frase inicial:
      descricao: p.descricao || `Serviço de ${rotuloServico(s)}.`,
    }));

    // rola até o formulário
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Abre modal de descrição
  function handleVerDescricao(s: TipoServico) {
    setServicoDetalhe(s);
  }

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
      setSelectedServiceId(null);
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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F89D13]/10 border border-[#F89D13]/30 text-xs font-semibold text-[#8F1D14] mb-2">
                  <span>🔧 Serviços para casa e empresa</span>
                  {isLoggedIn ? (
                    <span className="hidden sm:inline text-[11px] text-emerald-700">
                      Você está logado e pronto para agendar.
                    </span>
                  ) : (
                    <span className="hidden sm:inline text-[11px] text-red-700">
                      Faça login para concluir o agendamento.
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-[#8F1D14]">
                  Catálogo de Serviços
                </h1>
                <p className="mt-3 text-gray-700">
                  Encontre o serviço ideal e agende em poucos cliques — rápido,
                  seguro e sem complicação. Você escolhe o serviço, define data
                  e endereço e nós conectamos com o prestador.
                </p>

                {/* Como funciona */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs md:text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#F89D13]/20 flex items-center justify-center text-[11px] font-bold text-[#8F1D14]">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        Escolha o serviço
                      </p>
                      <p className="text-gray-600">
                        Clique em um card para selecionar o serviço desejado.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#F89D13]/20 flex items-center justify-center text-[11px] font-bold text-[#8F1D14]">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        Informe data e endereço
                      </p>
                      <p className="text-gray-600">
                        Preencha o dia, horário e local onde o serviço será feito.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#F89D13]/20 flex items-center justify-center text-[11px] font-bold text-[#8F1D14]">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        Aguarde a confirmação
                      </p>
                      <p className="text-gray-600">
                        O prestador aceita o serviço e você acompanha tudo no app.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-80">
                <div className="aspect-[4/3] w-full bg-[#F89D13]/20 rounded-xl flex flex-col items-center justify-center gap-2 border border-[#F89D13]/40">
                  <span className="text-[#8F1D14] font-semibold text-lg">
                    Marido de Aluguel
                  </span>
                  <p className="text-xs text-gray-700 max-w-[220px] text-center">
                    Seu parceiro para pequenos reparos, manutenção e serviços
                    do dia a dia.
                  </p>
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
                <div
                  key={i}
                  className="bg-white/80 rounded-xl h-24 animate-pulse"
                />
              ))}
            </div>
          ) : filtrados.length === 0 ? (
            <div className="bg-white/90 rounded-xl p-6 text-gray-600 shadow">
              Nenhum serviço encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtrados.map((s) => {
                const selected = selectedServiceId === s.id;
                return (
                  <article
                    key={s.id}
                    onClick={() => handleSelecionarServico(s)}
                    className={`cursor-pointer bg-white rounded-xl p-4 shadow-sm border transition 
                      ${
                        selected
                          ? 'border-[#F89D13] shadow-md bg-[#FFF8ED]'
                          : 'border-gray-100 hover:shadow-md hover:border-[#F89D13]/60'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F89D13]/20 flex items-center justify-center">
                        <span className="text-xl" aria-hidden>
                          {iconServico(s)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {rotuloServico(s)}
                          </h3>
                          {selected && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F89D13]/10 text-[#8F1D14] border border-[#F89D13]/40">
                              Selecionado
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                          {descricaoServico(s)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelecionarServico(s);
                        }}
                        className="text-sm bg-[#F89D13] text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition"
                      >
                        Agendar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerDescricao(s);
                        }}
                        className="text-sm bg-[#FFF0DA] border border-[#F89D13]/40 text-[#8F1D14] px-3 py-1.5 rounded-lg hover:bg-[#FFE2B8] transition"
                      >
                        Ver descrição
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Formulário de agendamento */}
      <section className="mt-10">
        <div className="max-w-6xl mx-auto px-4">
          <div
            ref={formRef}
            className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 md:p-8"
          >
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
                  onChange={(e) => {
                    const id = e.target.value;
                    setForm((p) => ({ ...p, tipo_servico_id: id }));
                    setSelectedServiceId(id ? Number(id) : null);
                  }}
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
                  <label
                    htmlFor="data"
                    className="block text-sm text-gray-700 mb-1"
                  >
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
                  <label
                    htmlFor="hora"
                    className="block text-sm text-gray-700 mb-1"
                  >
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
                <label
                  htmlFor="endereco"
                  className="block text-sm text-gray-700 mb-1"
                >
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
                <label
                  htmlFor="descricao"
                  className="block text-sm text-gray-700 mb-1"
                >
                  Descrição (opcional)
                </label>
                <textarea
                  id="descricao"
                  rows={3}
                  placeholder="Detalhes do serviço (ex.: trocar tomada da sala, verificar vazamento na pia do banheiro...)"
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.descricao}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, descricao: e.target.value }))
                  }
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
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
                    className="text-[#8F1D14] underline hover:opacity-80 text-sm"
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

      {/* Modal de descrição do serviço */}
      {servicoDetalhe && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-5 relative">
            <button
              type="button"
              onClick={() => setServicoDetalhe(null)}
              className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Fechar
            </button>
            <h3 className="text-lg font-bold text-[#8F1D14] mb-2">
              {rotuloServico(servicoDetalhe)}
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {descricaoServico(servicoDetalhe)}
            </p>
            <p className="mt-3 text-[11px] text-gray-500">
              Dica: se precisar de algo mais específico, descreva no campo
              &quot;Descrição&quot; do agendamento para que o prestador chegue
              preparado.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
