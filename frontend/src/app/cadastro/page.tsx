'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: '',
    email: '',
    cpf: '',
    senha: '',
    confirmSenha: '',
    tipo: 'contratante',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ✅ Regras de senha forte
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
  const senhaForte = useMemo(() => passwordRegex.test(form.senha), [form.senha]);
  const senhasBatendo = useMemo(
    () => form.confirmSenha.length === 0 || form.senha === form.confirmSenha,
    [form.senha, form.confirmSenha]
  );

  // ✅ Atualiza os campos dinamicamente
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  // ✅ Envio do formulário
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!senhaForte) {
      setError('A senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, minúscula, número e símbolo.');
      return;
    }

    if (form.senha !== form.confirmSenha) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('register', {
        method: 'POST',
        body: JSON.stringify({
          nome: form.nome.trim(),
          email: form.email.trim().toLowerCase(),
          cpf: form.cpf?.trim(),
          senha: form.senha,
          tipo: form.tipo,
        }),
      });

      console.log('✅ Resposta do cadastro:', res);
      setSuccess('Cadastro realizado com sucesso!');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      console.error('❌ Erro ao cadastrar:', err);
      setError(err.message || 'Erro ao cadastrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F89D13]/30 to-[#8F1D14]/10 flex items-center justify-center p-6">
      <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl w-full max-w-lg p-8">
        <h1 className="text-3xl font-bold text-center text-[#8F1D14] mb-1">Crie sua conta</h1>
        <p className="text-center text-gray-600 mb-8">
          Preencha seus dados para começar a usar o{' '}
          <span className="font-semibold text-[#F89D13]">Marido de Aluguel</span>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Nome */}
          <div>
            <label htmlFor="nome" className="block font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <input
              id="nome"
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              required
              placeholder="Ex: João Silva"
              autoComplete="name"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13]"
            />
          </div>

          {/* E-mail */}
          <div>
            <label htmlFor="email" className="block font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="seuemail@email.com"
              autoComplete="email"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13]"
            />
          </div>

          {/* CPF */}
          <div>
            <label htmlFor="cpf" className="block font-medium text-gray-700 mb-1">
              CPF
            </label>
            <input
              id="cpf"
              type="text"
              name="cpf"
              value={form.cpf}
              onChange={handleChange}
              inputMode="numeric"
              maxLength={11}
              placeholder="Somente números"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13]"
            />
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="senha" className="block font-medium text-gray-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                id="senha"
                type={showPass ? 'text' : 'password'}
                name="senha"
                value={form.senha}
                onChange={handleChange}
                required
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full px-4 py-2 border rounded-lg pr-12 focus:ring-2 focus:ring-[#F89D13]"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800"
              >
                {showPass ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {!senhaForte && form.senha && (
              <p className="text-xs text-red-600 mt-1">
                A senha deve conter letra maiúscula, minúscula, número e símbolo.
              </p>
            )}
          </div>

          {/* Confirmar senha */}
          <div>
            <label htmlFor="confirmSenha" className="block font-medium text-gray-700 mb-1">
              Confirmar senha
            </label>
            <div className="relative">
              <input
                id="confirmSenha"
                type={showConfirm ? 'text' : 'password'}
                name="confirmSenha"
                value={form.confirmSenha}
                onChange={handleChange}
                required
                placeholder="Repita a senha"
                className="w-full px-4 py-2 border rounded-lg pr-12 focus:ring-2 focus:ring-[#F89D13]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800"
              >
                {showConfirm ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {!senhasBatendo && (
              <p className="text-xs text-red-600 mt-1">As senhas não conferem.</p>
            )}
          </div>

          {/* Tipo de usuário */}
          <div>
            <label htmlFor="tipo" className="block font-medium text-gray-700 mb-1">
              Tipo de usuário
            </label>
            <select
              id="tipo"
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13]"
            >
              <option value="contratante">Cliente</option>
              <option value="prestador">Prestador</option>
            </select>
          </div>

          {/* Mensagens */}
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          {success && <p className="text-green-600 text-sm text-center">{success}</p>}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading || !senhaForte || !senhasBatendo}
            className="w-full bg-[#8F1D14] text-white py-3 rounded-lg font-semibold hover:bg-[#a2261b] transition mt-4 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6 text-sm">
          Já tem uma conta?{' '}
          <a href="/login" className="text-[#8F1D14] font-medium hover:underline">
            Faça login
          </a>
        </p>
      </div>
    </div>
  );
}
