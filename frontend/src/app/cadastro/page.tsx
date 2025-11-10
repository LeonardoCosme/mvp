'use client';

import { useState, useMemo } from 'react';
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

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
  const senhaForte = useMemo(() => passwordRegex.test(form.password), [form.password]);
  const senhasBatendo = useMemo(
    () => form.confirmPassword === '' || form.password === form.confirmPassword,
    [form.password, form.confirmPassword]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!senhaForte) {
      setError('A senha deve ter no mínimo 8 caracteres com maiúscula, minúscula, número e símbolo.');
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
          tipo: form.tipo,
          cpfUsuario: form.cpfUsuario.trim(),
        }),
      });

      setSuccess('Cadastro realizado com sucesso!');
      setTimeout(() => router.push('/login'), 2000);
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
          Preencha seus dados para começar a usar o <span className="text-[#F89D13] font-semibold">Marido de Aluguel</span>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="nomeUsuario" className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input id="nomeUsuario" name="nomeUsuario" value={form.nomeUsuario} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13]" placeholder="Ex: João Silva" />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13]" placeholder="seuemail@email.com" />
          </div>

          <div>
            <label htmlFor="cpfUsuario" className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
            <input id="cpfUsuario" name="cpfUsuario" type="text" value={form.cpfUsuario} onChange={handleChange} maxLength={11} inputMode="numeric" placeholder="Somente números" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13]" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13]" placeholder="••••••••" />
            {!senhaForte && form.password && <p className="text-xs text-red-600 mt-1">A senha não atende aos requisitos mínimos.</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
            <input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13]" placeholder="Repita a senha" />
            {!!form.confirmPassword && !senhasBatendo && <p className="text-xs text-red-600 mt-1">As senhas não conferem.</p>}
          </div>

          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">Tipo de usuário</label>
            <select id="tipo" name="tipo" value={form.tipo} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F89D13]">
              <option value="contratante">Cliente</option>
              <option value="prestador">Prestador</option>
            </select>
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          {success && <p className="text-green-600 text-sm text-center">{success}</p>}

          <button type="submit" disabled={loading} className="w-full bg-[#8F1D14] text-white py-3 rounded-lg font-semibold hover:bg-[#a2261b] transition mt-4">
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
