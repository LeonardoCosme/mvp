// frontend/src/app/servicos/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getToken } from '../../utils/auth';

type Perfil = 'Contratante' | 'Prestador' | 'Visitante';

type TipoServico = {
  id: number;
  nomeServico?: string; // vem do backend como alias de 'nome'
  nome?: string;        // fallback se um dia voltar a ser 'nome'
  descricao?: string;   // se o backend trouxer algo a mais
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

// ícone por tipo de serviço
function iconeServico(s: TipoServico): string {
  const nome = rotuloServico(s).toLowerCase();

  if (nome.includes('elétrica') || nome.includes('eletrica')) return '⚡';
  if (nome.includes('hidráulica') || nome.includes('hidraulica')) return '💧';
  if (nome.includes('pintura') || nome.includes('pintor')) return '🎨';
  if (nome.includes('marcenaria') || nome.includes('móvel') || nome.includes('moveis')) return '🪚';
  if (nome.includes('limpeza') || nome.includes('faxina')) return '🧹';
  if (nome.includes('jardim') || nome.includes('jardinagem') || nome.includes('grama')) return '🌿';
  if (nome.includes('ar condicionado') || nome.includes('ar-condicionado')) return '❄️';
  if (nome.includes('alvenaria') || nome.includes('reforma')) return '🧱';
  if (nome.includes('instalação') || nome.includes('montagem')) return '🛠️';

  // fallback genérico
  return '🔧';
}

// descrição padrão, caso queira personalizar por nome/id depois
function descricaoCurta(s: TipoServico): string {
  const nome = rotuloServico(s);
  return (
    s.descricao ||
    `Serviço de ${nome.toLowerCase()} realizado por profissionais qualificados, com foco em segurança e qualidade.`
  );
}

function descricaoLonga(s: TipoServico): string {
  const nome = rotuloServico(s);
  return (
    s.descricao ||
    `O serviço de ${nome.toLowerCase()} inclui visita do prestador no endereço informado, análise da necessidade e execução dos reparos combinados com o cliente. Os valores podem variar conforme a complexidade, tempo de execução e materiais utilizados.`
  );
}

export default function ServicosPage() {
  const [perfil, setPerfil] = useState<Perfil>('Visitante');

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

  // Modal de descrição
  const [modalAberto, setModalAberto] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<TipoServico | null>(null);

  // 🔑 verifica login e perfil só no cliente (evita erro de hydration)
  useEffect(() => {
    const hasToken = !!getToken();
    setIsLoggedIn(hasToken);

    if (typeof window === 'undefined') return;

    const tipoLocal =
      window.localStorage.getItem('tipo') ||
      window.localStorage.getItem('tipoUsuario') ||
      '';

    const tipoNorm = tipoLocal.toLowerCase().trim();
    if (tipoNorm === 'prestador') {
      setPerfil('Prestador');
    } else if (tipoNorm === 'contratante') {
      setPerfil('Contratante');
    } else {
      setPerfil('Visitante');
    }
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

  function selecionarServicoParaAgendar(s: TipoServico) {
    setForm((p) => ({
      ...p,
      tipo_servico_id: String(s.id),
      // se o usuário ainda não escreveu nada, sugerimos uma breve descrição
      descricao: p.descricao || descricaoCurta(s),
    }));
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  function abrirDescricaoServico(s: TipoServico) {
    setServicoSelecionado(s);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setServicoSelecionado(null);
  }

  const msgClass = msg.startsWith('✅') ? 'text-green-700' : 'text-red-700';

  const isPrestador = perfil === 'Prestador';

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F89D13]/30 to-[#8F1D14]/10 pb-20">
      {/* Hero */}
      <section className="pt-24 md:pt-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 md:p-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="flex-1 space-y-4">
                {/* Badge topo, mudando mensagem para prestador */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F89D13]/10 border border-[#F89D13]/40 text-xs md:text-sm text-[#8F1D14] font-semibold">
                  <span aria-hidden>🛠️</span>
                  {isPrestador ? (
                    <span>
                      Você está logado como <strong>Prestador</strong> — esta é a vitrine
                      que os clientes usam para escolher serviços.
                    </span>
                  ) : (
                    <span>
                      Serviços para casa e empresa —{' '}
                      <strong>
                        {isLoggedIn
                          ? 'você está logado e pronto para agendar.'
                          : 'faça login para agendar um serviço.'}
                      </strong>
                    </span>
                  )}
                </div>

                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-[#8F1D14]">
                    Catálogo de Serviços
                  </h1>
                  {isPrestador ? (
                    <p className="mt-3 text-gray-800">
                      Aqui você visualiza exatamente como o cliente enxerga os serviços.
                      Use este catálogo para entender a demanda e organize seu trabalho
                      pela aba{' '}
                      <span className="font-semibold text-[#F89D13]">
                        Agendamentos
                      </span>
                      , onde você aceita e acompanha os serviços.
                    </p>
                  ) : (
                    <p className="mt-3 text-gray-800">
                      Encontre o serviço ideal e agende em poucos cliques —
                      rápido, seguro e sem complicação. Você escolhe o serviço,
                      define data e endereço e nós conectamos com o prestador.
                    </p>
                  )}
                </div>

                {/* Passo a passo – versão cliente x prestador */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                  {isPrestador ? (
                    <>
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F89D13]/15 text-xs font-bold text-[#8F1D14]">
                          1
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Entenda o catálogo
                          </p>
                          <p className="text-gray-600">
                            Veja como seus serviços aparecem para o cliente e
                            quais tipos estão disponíveis na plataforma.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F89D13]/15 text-xs font-bold text-[#8F1D14]">
                          2
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Aceite serviços
                          </p>
                          <p className="text-gray-600">
                            Acesse a aba{' '}
                            <span className="font-semibold">Agendamentos</span>{' '}
                            para visualizar os serviços disponíveis e aceitar
                            aqueles que se encaixam na sua agenda.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F89D13]/15 text-xs font-bold text-[#8F1D14]">
                          3
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Construa sua reputação
                          </p>
                          <p className="text-gray-600">
                            Preste um bom atendimento, finalize o serviço pelo
                            QR code e receba avaliações positivas dos clientes.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F89D13]/15 text-xs font-bold text-[#8F1D14]">
                          1
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Escolha o serviço
                          </p>
                          <p className="text-gray-600">
                            Clique em um card para selecionar o serviço desejado.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F89D13]/15 text-xs font-bold text-[#8F1D14]">
                          2
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Informe data e endereço
                          </p>
                          <p className="text-gray-600">
                            Preencha o dia, horário e local onde o serviço será feito.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F89D13]/15 text-xs font-bold text-[#8F1D14]">
                          3
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Aguarde a confirmação
                          </p>
                          <p className="text-gray-600">
                            O prestador aceita o serviço e você acompanha tudo
                            no app.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Bloco lateral com texto institucional */}
              <aside className="w-full md:w-80">
                <div className="rounded-2xl border border-[#F89D13]/40 bg-[#FDF4E6] p-5 h-full flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#8F1D14] mb-1">
                      Marido de Aluguel
                    </h2>
                    {isPrestador ? (
                      <p className="text-sm text-gray-700">
                        Seu painel de oportunidades: acompanhe os serviços que
                        os clientes estão solicitando e organize sua rotina com
                        mais previsibilidade.
                      </p>
                    ) : (
                      <p className="text-sm text-gray-700">
                        Seu parceiro para pequenos reparos, manutenção e
                        serviços do dia a dia — com atendimento organizado e
                        registro de cada serviço realizado.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 text-xs text-gray-600">
                    <p>
                      Plataforma em desenvolvimento como projeto de TCC da
                      Fatec Ipiranga.
                    </p>
                  </div>
                </div>
              </aside>
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
                placeholder={
                  isPrestador
                    ? 'Buscar serviços como o cliente enxerga: elétrica, pintura, hidráulica…'
                    : 'Buscar por ex.: elétrica, pintura, hidráulica…'
                }
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F89D13] transition bg-white/80"
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
                  className="bg-white/80 rounded-xl h-28 animate-pulse"
                />
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
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F89D13]/20 flex items-center justify-center">
                        <span className="text-[#8F1D14]" aria-hidden>
                          {iconeServico(s)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {rotuloServico(s)}
                      </h3>
                    </div>

                    <p className="mt-2 text-xs text-gray-600 line-clamp-3">
                      {descricaoCurta(s)}
                    </p>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {!isPrestador && (
                      <button
                        type="button"
                        onClick={() => selecionarServicoParaAgendar(s)}
                        className="text-sm bg-[#F89D13] text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition"
                      >
                        Agendar
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => abrirDescricaoServico(s)}
                      className="text-sm bg-[#FDF4E6] text-[#8F1D14] px-3 py-1.5 rounded-lg border border-[#F89D13]/40 hover:bg-[#FBE7C6] transition"
                    >
                      Ver descrição
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Formulário de agendamento – só faz sentido para cliente/visitante */}
      {!isPrestador && (
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
                      setForm((p) => ({
                        ...p,
                        tipo_servico_id: e.target.value,
                      }))
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
                    placeholder="Detalhes do serviço"
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

                {msg && (
                  <p className={`text-sm mt-1 ${msgClass}`}>
                    {msg}
                  </p>
                )}
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Modal de descrição do serviço */}
      {modalAberto && servicoSelecionado && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
            <h3 className="text-xl font-bold text-[#8F1D14] mb-2">
              {rotuloServico(servicoSelecionado)}
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              {descricaoLonga(servicoSelecionado)}
            </p>

            <button
              type="button"
              onClick={fecharModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              aria-label="Fechar"
            >
              ×
            </button>

            {!isPrestador && (
              <button
                type="button"
                onClick={() => {
                  selecionarServicoParaAgendar(servicoSelecionado);
                  fecharModal();
                }}
                className="mt-2 bg-[#F89D13] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition"
              >
                Usar este serviço no agendamento
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
