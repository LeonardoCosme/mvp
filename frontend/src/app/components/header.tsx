'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getToken, removeToken } from '@/utils/auth';

type TipoUsuario = 'contratante' | 'prestador' | null;

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [logged, setLogged] = useState(false);
  const [nome, setNome] = useState<string | null>(null);
  const [tipo, setTipo] = useState<TipoUsuario>(null);

  // sincroniza estado de autenticação sempre que a rota muda
  useEffect(() => {
    const token = getToken();
    setLogged(!!token);

    if (typeof window !== 'undefined') {
      const nomeLocal = window.localStorage.getItem('nomeUsuario');
      const tipoLocal =
        (window.localStorage.getItem('tipo') ||
          window.localStorage.getItem('tipoUsuario')) as TipoUsuario | null;

      setNome(nomeLocal);
      setTipo(tipoLocal);
    }
  }, [pathname]);

  function handleLogout() {
    removeToken();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('nomeUsuario');
      window.localStorage.removeItem('tipo');
      window.localStorage.removeItem('tipoUsuario');
    }
    setLogged(false);
    router.push('/login');
  }

  const perfilHref =
    tipo === 'prestador'
      ? '/perfil/prestador'
      : tipo === 'contratante'
      ? '/perfil/contratante'
      : '/perfil';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="font-bold text-[#8F1D14]">
          Marido de <span className="font-extrabold">Aluguel</span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/"
            className={
              isActive(pathname, '/')
                ? 'font-semibold text-[#8F1D14]'
                : 'text-gray-700 hover:text-[#8F1D14]'
            }
          >
            Home
          </Link>

          <Link
            href="/agendamento"
            className={
              isActive(pathname, '/agendamento')
                ? 'font-semibold text-[#8F1D14]'
                : 'text-gray-700 hover:text-[#8F1D14]'
            }
          >
            Agendamentos
          </Link>

          <Link
            href="/servicos"
            className={
              isActive(pathname, '/servicos')
                ? 'font-semibold text-[#8F1D14]'
                : 'text-gray-700 hover:text-[#8F1D14]'
            }
          >
            Serviços
          </Link>

          {!logged ? (
            <>
              <Link
                href="/login"
                className="px-3 py-1 rounded-lg border border-[#8F1D14] text-[#8F1D14] hover:bg-[#8F1D14]/5"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="px-3 py-1 rounded-lg bg-[#8F1D14] text-white hover:bg-[#a2261b]"
              >
                Cadastrar
              </Link>
            </>
          ) : (
            <>
              {/* LINK PARA PERFIL – NÃO DESLOGA */}
              <Link
                href={perfilHref}
                className="px-3 py-1 rounded-full bg-[#F89D13]/15 text-[#8F1D14] font-medium max-w-[180px] truncate"
              >
                {nome || 'Meu perfil'}
                {tipo ? ` • ${tipo}` : ''}
              </Link>

              {/* BOTÃO SAIR – ÚNICO QUE CHAMA LOGOUT */}
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1 rounded-lg bg-[#8F1D14] text-white hover:bg-[#a2261b]"
              >
                Sair
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
