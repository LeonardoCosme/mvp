// frontend/src/components/Header/index.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, removeToken } from '../../utils/auth';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [logged, setLogged] = useState(false);
  const [nome, setNome] = useState<string | null>(null);
  const [tipo, setTipo] = useState<string | null>(null);

  const syncAuthState = () => {
    const hasToken = !!getToken();
    setLogged(hasToken);

    if (typeof window !== 'undefined') {
      setNome(window.localStorage.getItem('nomeUsuario') || null);
      const t =
        window.localStorage.getItem('tipo') ||
        window.localStorage.getItem('tipoUsuario');
      setTipo(t);
    }
  };

  useEffect(() => {
    syncAuthState();
  }, [pathname]);

  const handleLogout = () => {
    removeToken();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('nomeUsuario');
      window.localStorage.removeItem('tipo');
      window.localStorage.removeItem('tipoUsuario');
    }
    setLogged(false);
    setNome(null);
    setTipo(null);
    router.push('/login');
  };

  const goToPerfil = () => {
    router.push('/perfil');
  };

  const isActive = (href: string) =>
    pathname === href ? 'text-[#8F1D14] font-semibold' : 'text-gray-700';

  return (
    <header className="w-full bg-white/95 shadow-sm fixed top-0 left-0 right-0 z-30">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo / nome do sistema */}
        <Link href="/home" className="flex items-center gap-2">
          <span className="text-lg font-extrabold text-[#8F1D14] leading-tight">
            Marido de
            <span className="block text-sm text-gray-800">Aluguel</span>
          </span>
        </Link>

        {/* Navegação */}
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/home" className={isActive('/home')}>
            Home
          </Link>
          <Link href="/agendamento" className={isActive('/agendamento')}>
            Agendamentos
          </Link>
          <Link href="/servicos" className={isActive('/servicos')}>
            Serviços
          </Link>
        </nav>

        {/* Usuário / login */}
        <div className="flex items-center gap-3">
          {!logged ? (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg border border-[#8F1D14]/40 text-[#8F1D14] text-sm hover:bg-[#8F1D14]/5"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="px-3 py-1.5 rounded-lg bg-[#8F1D14] text-white text-sm hover:bg-[#a2261b]"
              >
                Cadastre-se
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={goToPerfil}
                className="flex items-center gap-2 text-sm text-gray-800 hover:text-[#8F1D14]"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F89D13]/20 text-[#8F1D14] font-semibold">
                  {nome?.[0]?.toUpperCase() || 'U'}
                </span>
                <div className="text-left leading-tight">
                  <div className="font-semibold">
                    {nome || 'Meu perfil'}
                  </div>
                  {tipo && (
                    <div className="text-xs text-gray-500 capitalize">
                      {tipo.toLowerCase()}
                    </div>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
              >
                Sair
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
