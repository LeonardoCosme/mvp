'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';
import { getToken, removeToken } from '@/utils/auth';

type User = {
  id: number;
  nomeUsuario: string;
  email: string;
  cpfUsuario: string | null;
  tipo: 'master' | 'prestador' | 'contratante';
  prestador?: { cnpjPrestador: string | null; celPrestador: string | null } | null;
  contratante?: { endereco: string | null; telefone: string | null } | null;
};

export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);

  // dados
  const [dados, setDados] = useState({ nomeUsuario: '', emailUsuario: '', cpfUsuario: '' });
  const [prest, setPrest] = useState({ cnpjPrestador: '', celPrestador: '' });
  const [contr, setContr] = useState({ endereco: '', telefone: '' });

  // controles de edição
  const [editDados, setEditDados] = useState(false);
  const [editPrest, setEditPrest] = useState(false);
  const [editContr, setEditContr] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!getToken()) {
          router.replace('/login');
          return;
        }
        const me = (await apiFetch('/user/me')) as User;
        setUser(me);
        setDados({
          nomeUsuario: me.nomeUsuario || '',
          emailUsuario: me.email || '',
          cpfUsuario: me.cpfUsuario || '',
        });
        setPrest({
          cnpjPrestador: me.prestador?.cnpjPrestador || '',
          celPrestador: me.prestador?.celPrestador || '',
        });
        setContr({
          endereco: me.contratante?.endereco || '',
          telefone: me.contratante?.telefone || '',
        });
      } catch (e: any) {
        const text = String(e?.message || '');
        if (text.toLowerCase().includes('token')) {
          removeToken?.();
          router.replace('/login');
          return;
        }
        setMsg(text || 'Erro ao carregar perfil.');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // ajuda pra resetar campos
  const resetDados = () =>
    user &&
    setDados({
      nomeUsuario: user.nomeUsuario || '',
      emailUsuario: user.email || '',
      cpfUsuario: user.cpfUsuario || '',
    });
  const resetPrest = () =>
    user &&
    setPrest({
      cnpjPrestador: user.prestador?.cnpjPrestador || '',
      celPrestador: user.prestador?.celPrestador || '',
    });
  const resetContr = () =>
    user &&
    setContr({
      endereco: user.contratante?.endereco || '',
      telefone: user.contratante?.telefone || '',
    });

  async function salvarDadosPessoais() {
    setMsg('');
    try {
      const path = user?.tipo === 'contratante' ? '/contratante' : '/prestador';
      await apiFetch(path, {
        method: 'POST',
        body: JSON.stringify({
          nomeUsuario: dados.nomeUsuario,
          emailUsuario: dados.emailUsuario,
          cpfUsuario: dados.cpfUsuario?.replace(/\D/g, '') || null,
        }),
      });
      setMsg('✅ Dados pessoais atualizados!');
      setEditDados(false);
    } catch (e: any) {
      setMsg(`❌ ${e?.message || 'Erro ao salvar dados pessoais.'}`);
    }
  }

  async function salvarPrestador() {
    setMsg('');
    try {
      await apiFetch('/prestador', {
        method: 'POST',
        body: JSON.stringify(prest),
      });
      setMsg('✅ Dados de prestador atualizados!');
      setEditPrest(false);
    } catch (e: any) {
      setMsg(`❌ ${e?.message || 'Erro ao salvar dados de prestador.'}`);
    }
  }

  async function salvarContratante() {
    setMsg('');
    try {
      await apiFetch('/contratante', {
        method: 'POST',
        body: JSON.stringify(contr),
      });
      setMsg('✅ Dados de contratante atualizados!');
      setEditContr(false);
    } catch (e: any) {
      setMsg(`❌ ${e?.message || 'Erro ao salvar dados de contratante.'}`);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F89D13]/10 text-[#8F1D14] font-semibold">
        Carregando perfil...
      </div>
    );

  if (!user) return null;

  const isPrestador = user.tipo === 'prestador';
  const isContratante = user.tipo === 'contratante';

  // 🔹 Substitui ternário aninhado por função clara
  const labelDados = (campo: string) => {
    if (campo === 'nomeUsuario') return 'Nome completo';
    if (campo === 'emailUsuario') return 'E-mail';
    return 'CPF';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F89D13]/30 to-[#8F1D14]/10 p-6">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#8F1D14]">Meu Perfil</h1>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-gray-600 capitalize">Tipo: {user.tipo}</p>
          </div>
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

        {/* DADOS PESSOAIS */}
        <section className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 space-y-3">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-[#8F1D14]">Dados pessoais</h2>
            {!editDados ? (
              <button
                onClick={() => setEditDados(true)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    resetDados();
                    setEditDados(false);
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarDadosPessoais}
                  className="px-3 py-1.5 text-sm bg-[#8F1D14] text-white rounded-lg hover:bg-[#a2261b]"
                >
                  Salvar
                </button>
              </div>
            )}
          </div>

          {['nomeUsuario', 'emailUsuario', 'cpfUsuario'].map((campo) => (
            <div key={campo}>
              <label className="block text-sm text-gray-700 mb-1">{labelDados(campo)}</label>
              <input
                type={campo === 'emailUsuario' ? 'email' : 'text'}
                disabled={!editDados}
                className={`w-full border rounded-lg px-3 py-2 ${
                  !editDados ? 'bg-gray-50' : ''
                }`}
                value={dados[campo as keyof typeof dados]}
                onChange={(e) => setDados({ ...dados, [campo]: e.target.value })}
              />
            </div>
          ))}
        </section>

        {/* PRESTADOR */}
        {isPrestador && (
          <section className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 space-y-3">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-[#8F1D14]">Dados de prestador</h2>
              {!editPrest ? (
                <button
                  onClick={() => setEditPrest(true)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Editar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      resetPrest();
                      setEditPrest(false);
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={salvarPrestador}
                    className="px-3 py-1.5 text-sm bg-[#F89D13] text-white rounded-lg hover:bg-[#e68a11]"
                  >
                    Salvar
                  </button>
                </div>
              )}
            </div>

            {Object.entries(prest).map(([campo, valor]) => (
              <div key={campo}>
                <label className="block text-sm text-gray-700 mb-1">
                  {campo === 'cnpjPrestador' ? 'CNPJ' : 'Celular'}
                </label>
                <input
                  disabled={!editPrest}
                  className={`w-full border rounded-lg px-3 py-2 ${
                    !editPrest ? 'bg-gray-50' : ''
                  }`}
                  value={valor}
                  onChange={(e) =>
                    setPrest({ ...prest, [campo]: e.target.value })
                  }
                />
              </div>
            ))}
          </section>
        )}

        {/* CONTRATANTE */}
        {isContratante && (
          <section className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 space-y-3">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-[#8F1D14]">Dados de contratante</h2>
              {!editContr ? (
                <button
                  onClick={() => setEditContr(true)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Editar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      resetContr();
                      setEditContr(false);
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={salvarContratante}
                    className="px-3 py-1.5 text-sm bg-[#F89D13] text-white rounded-lg hover:bg-[#e68a11]"
                  >
                    Salvar
                  </button>
                </div>
              )}
            </div>

            {Object.entries(contr).map(([campo, valor]) => (
              <div key={campo}>
                <label className="block text-sm text-gray-700 mb-1">
                  {campo === 'endereco' ? 'Endereço' : 'Telefone'}
                </label>
                <input
                  disabled={!editContr}
                  className={`w-full border rounded-lg px-3 py-2 ${
                    !editContr ? 'bg-gray-50' : ''
                  }`}
                  value={valor}
                  onChange={(e) =>
                    setContr({ ...contr, [campo]: e.target.value })
                  }
                />
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
