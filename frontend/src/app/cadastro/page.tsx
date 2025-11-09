'use client';
import { useState } from 'react';
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

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
          senha: form.password,
          tipo: form.tipo,
          cpfUsuario: form.cpfUsuario?.trim(),
        }),
      });

      setSuccess('✅ Cadastro realizado com sucesso!');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar usuário.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdf7f1] p-6">
      <div className="bg-white/90 shadow-2xl rounded-2xl w-full max-w-lg p-8">
        <h1 className="text-3xl font-bold text-[#8F1D14] text-center mb-6">Crie sua conta</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="nomeUsuario"
            placeholder="Nome completo"
            value={form.nomeUsuario}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="E-mail"
            value={form.email}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg"
            required
          />
          <input
            type="text"
            name="cpfUsuario"
            placeholder="CPF (somente números)"
            value={form.cpfUsuario}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg"
          />
          <input
            type="password"
            name="password"
            placeholder="Senha"
            value={form.password}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg"
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirmar senha"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg"
            required
          />
          <select
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg"
          >
            <option value="contratante">Cliente</option>
            <option value="prestador">Prestador</option>
          </select>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          {success && <p className="text-green-600 text-sm text-center">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8F1D14] text-white py-3 rounded-lg font-semibold hover:bg-[#a2261b] transition mt-4"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
