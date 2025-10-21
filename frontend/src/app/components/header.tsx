'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, removeToken } from '@/utils/auth';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [logged, setLogged] = useState(false);
  const [nome, setNome] = useState<string | null>(null);

  const syncAuthState = () => {
    const hasToken = !!getToken();
    setLogged(hasToken);

    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      setNome(globalThis.localStorage.getItem('nomeUsuario'));
    }
  };

  useEffect(() => {
    syncAuthState();
  }, [pathname]);

  useEffect(() => {
    const handler = () => syncAuthState();

    if (typeof globalThis !== 'undefined' && globalThis.addEventListener) {
      globalThis.addEventListener('auth-changed', handler);
      return () => globalThis.removeEventListener('auth-changed', handler);
    }

    return undefined;
  }, []);

  function logout() {
    removeToken();

    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      globalThis.localStorage.removeItem('tipo');
      globalThis.localStorage.removeItem('nomeUsuario');
      globalThis.dispatchEvent(new Event('auth-changed'));
    }

    setLogged(false);
    setNome(null);
    router.push('/login');
  }

  const agendamentoHref = logged ? '/agendamento' : '/login?next=/agendamento';

  const links = [
    { href: '/home', label: 'Home' },
    { href: agendamentoHref, label: 'Agendamentos' },
    { href: '/servicos', label: 'Serviços' },
    !logged && { href: '/login', label: 'Login' },
    !logged && { href: '/cadastro', label: 'Cadastro' },
    logged && { href: '/perfil', label: nome ? nome.split(' ')[0] : 'Meu Perfil' },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/"
            className="min-w-0 shrink font-extrabold text-[#8F1D14] text-base sm:text-lg tracking-tight hover:opacity-90 transition leading-tight"
          >
            <span className="block sm:hidden">
              Marido de<br />Aluguel
            </span>
            <span className="hidden sm:block">Marido de Aluguel</span>
          </Link>

          <nav className="min-w-0 w-full sm:w-auto flex flex-wrap sm:flex-nowrap items-center justify-start sm:justify-end gap-1 sm:gap-2">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <div key={link.href} className="relative">
                  <Link
                    href={link.href}
                    className={[
                      'relative z-10 px-3 py-1.5 rounded-lg transition-all duration-200 font-medium',
                      'text-sm sm:text-base',
                      'whitespace-normal',
                      active
                        ? 'text-[#8F1D14]'
                        : 'text-gray-700 hover:text-[#8F1D14] hover:bg-[#F89D13]/10',
                    ].join(' ')}
                  >
                    {link.label}
                  </Link>

                  <AnimatePresence>
                    {active && (
                      <motion.div
                        layoutId="activeLink"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="pointer-events-none absolute inset-0 -z-0 rounded-lg bg-[#F89D13]/25 shadow-sm"
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {logged && (
              <button
                onClick={logout}
                className="max-w-[40vw] sm:max-w-none truncate text-red-600 text-sm sm:text-base px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all font-medium"
                title={nome ? `Sair (${nome.split(' ')[0]})` : 'Sair'}
              >
                <span className="sm:hidden">Sair</span>
                <span className="hidden sm:inline">
                  Sair {nome ? `(${nome.split(' ')[0]})` : ''}
                </span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
