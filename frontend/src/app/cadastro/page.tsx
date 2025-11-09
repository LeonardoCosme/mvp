'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nomeUsuario: '',
    email: '',
    password: '',
    confirmPassword: '',
    tipo: 'contratante',
    cpfUsuario: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // regra forte de senha
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

  const senhaForte = useMemo(() => passwordRegex.test(form.password), [form.password]);
  const senhasBatendo = useMemo(
    () => form.confirmPassword.length === 0 || form.password === form.confirmPassword,
    [form.password, form.confirmPassword]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!senhaForte) {
      setError('A senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, minúscula, número e caractere especial.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('register', {
        method: 'POST',
        body: JSON.stringify({
          nomeUsuario: form.nomeUsuario.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          confirmPassword: form.confirmPassword, // recomendado validar também no backend
          tipo: form.tipo,
          cpfUsuario: form.cpfUsuario?.trim(),
        }),
      });

      setSuccess('Cadastro realizado com sucesso!');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F89D13]/30 to-[#8F1D14]/10 flex items-center justify-center p-6">
      <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl w-full max-w-lg p-8">
        <h1 className="text-3xl font-bold text-center text-[#8F1D14] mb-1">Crie sua conta</h1>
        <p className="text-center text-gray-600 mb-8">
          Preencha seus dados para começar a usar o <span className="font-semibold text-[#F89D13]">Marido de Aluguel</span>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="nomeUsuario" className="block font-medium text-gray-700 mb-1">Nome completo</label>
            <input
              id="nomeUsuario"
              type="text"
              name="nomeUsuario"
              value={form.nomeUsuario}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F89D13] transition"
              placeholder="Ex: João Silva"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block font-medium text-gray-700 mb-1">E-mail</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F89D13] transition"
              placeholder="seuemail@email.com"
            />
          </div>

          <div>
            <label htmlFor="cpfUsuario" className="block font-medium text-gray-700 mb-1">CPF</label>
            <input
              id="cpfUsuario"
              type="text"
              name="cpfUsuario"
              value={form.cpfUsuario}
              onChange={handleChange}
              inputMode="numeric"
              maxLength={11}
              placeholder="Somente números"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F89D13] transition"
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="password" className="block font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="w-full px-4 py-2 border rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-[#F89D13] transition"
                placeholder="••••••••"
                aria-describedby="passwordHelp"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800 px-2 py-1"
                aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPass ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <p id="passwordHelp" className="text-xs text-gray-500 mt-1">
              8+ caracteres, com letra maiúscula, minúscula, número e símbolo.
            </p>
            {!senhaForte && form.password.length > 0 && (
              <p className="text-xs text-red-600 mt-1">A senha não atende aos requisitos mínimos.</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block font-medium text-gray-700 mb-1">Confirmar senha</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="w-full px-4 py-2 border rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-[#F89D13] transition"
                placeholder="Repita a senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800 px-2 py-1"
                aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}
              >
                {showConfirm ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {!!form.confirmPassword && !senhasBatendo && (
              <p className="text-xs text-red-600 mt-1">As senhas não conferem.</p>
            )}
          </div>

          <div>
            <label htmlFor="tipo" className="block font-medium text-gray-700 mb-1">Tipo de usuário</label>
            <select
              id="tipo"
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F89D13] transition"
            >
              <option value="contratante">Cliente</option>
              <option value="prestador">Prestador</option>
            </select>
          </div>

          {error && <p className="text-red-600 text-sm text-center" aria-live="assertive">{error}</p>}
          {success && <p className="text-green-600 text-sm text-center">{success}</p>}

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
          <a href="/login" className="text-[#8F1D14] font-medium hover:underline">Faça login</a>
        </p>
      </div>
    </div>
  );
}