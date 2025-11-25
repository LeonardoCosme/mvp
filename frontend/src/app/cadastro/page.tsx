'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../utils/api';

export default function CadastroPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    nomeUsuario: '',
    email: '',
    senha: '',
    confirmSenha: '',
    tipo: 'contratante',
    cpfUsuario: '',
    endereco: '',
    telefone: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔒 Validação de senha forte
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
  const senhaForte = useMemo(
    () => passwordRegex.test(form.senha),
    [form.senha]
  );
  const senhasBatendo = useMemo(
    () => form.confirmSenha === '' || form.senha === form.confirmSenha,
    [form.senha, form.confirmSenha]
  );

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!senhaForte) {
      setError(
        'A senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.'
      );
      return;
    }
    if (form.senha !== form.confirmSenha) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      const body: any = {
        nomeUsuario: form.nomeUsuario.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.senha,
        tipo: form.tipo, // 'contratante' ou 'prestador'
        cpfUsuario: form.cpfUsuario.trim(),
      };

      // Se for contratante, já enviamos endereço e telefone junto
      if (form.tipo === 'contratante') {
        body.endereco = form.endereco.trim();
        body.telefone = form.telefone.trim();
      }

      const response = await apiFetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      console.log('✅ Resposta API:', response);

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
    <main className="min-h-screen bg-gradient-to-br from-[#F89D13]/30 to-[#8F1D14]/10 pt-28 pb-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl w-full p-8">
          <h1 className="text-3xl font-bold text-center text-[#8F1D14] mb-1">
            Crie sua conta
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Preencha seus dados para começar a usar o{' '}
            <span className="text-[#F89D13] font-semibold">
              Marido de Aluguel
            </span>
            .
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="nomeUsuario"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nome completo
              </label>
              <input
                id="nomeUsuario"
                name="nomeUsuario"
                value={form.nomeUsuario}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13] focus:outline-none"
                placeholder="Ex: João Silva"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13] focus:outline-none"
                placeholder="seuemail@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="cpfUsuario"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                CPF
              </label>
              <input
                id="cpfUsuario"
                name="cpfUsuario"
                type="text"
                value={form.cpfUsuario}
                onChange={handleChange}
                maxLength={11}
                inputMode="numeric"
                placeholder="Somente números"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="senha"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Senha
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                value={form.senha}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13] focus:outline-none"
                placeholder="••••••••"
              />
              {!senhaForte && form.senha && (
                <p className="text-xs text-red-600 mt-1">
                  A senha deve conter pelo menos 8 caracteres, incluindo letra
                  maiúscula, minúscula, número e símbolo.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmSenha"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirmar senha
              </label>
              <input
                id="confirmSenha"
                name="confirmSenha"
                type="password"
                value={form.confirmSenha}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13] focus:outline-none"
                placeholder="Repita a senha"
              />
              {!!form.confirmSenha && !senhasBatendo && (
                <p className="text-xs text-red-600 mt-1">
                  As senhas não conferem.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="tipo"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tipo de usuário
              </label>
              <select
                id="tipo"
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13] focus:outline-none"
              >
                <option value="contratante">Contratante</option>
                <option value="prestador">Prestador</option>
              </select>
            </div>

            {/* Dados adicionais para contratante */}
            {form.tipo === 'contratante' && (
              <div className="space-y-4 pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-700 font-medium">
                  Dados de contratante
                </p>

                <div>
                  <label
                    htmlFor="endereco"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Endereço
                  </label>
                  <input
                    id="endereco"
                    name="endereco"
                    value={form.endereco}
                    onChange={handleChange}
                    required={form.tipo === 'contratante'}
                    placeholder="Rua, número, bairro, cidade"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="telefone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Telefone
                  </label>
                  <input
                    id="telefone"
                    name="telefone"
                    type="tel"
                    value={form.telefone}
                    onChange={handleChange}
                    required={form.tipo === 'contratante'}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}
            {success && (
              <p className="text-green-600 text-sm text-center">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8F1D14] text-white py-3 rounded-lg font-semibold hover:bg-[#a2261b] transition mt-4 disabled:opacity-60"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
