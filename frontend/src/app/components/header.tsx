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
    if (typeof window !== 'undefined') {
      setNome(localStorage.getItem('nomeUsuario'));
    }
  };

  useEffect(() => {
    syncAuthState();
  }, [pathname]);

  useEffect(() => {
    const handler = () => syncAuthState();
    window.addEventListener('auth-changed', handler);
    return () => window.removeEventListener('auth-changed', handler);
  }, []);

  function logout() {
    removeToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tipo');
      localStorage.removeItem('nomeUsuario');
      window.dispatchEvent(new Event('auth-changed'));
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
    <header className="sticky top-0 left-0 right-0 bg-white shadow-md z-50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="font-extrabold text-[#8F1D14] text-lg tracking-tight hover:opacity-90 transition"
        >
          Marido de Aluguel
        </Link>

        <nav className="flex items-center gap-2 md:gap-3 relative">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <div key={link.href} className="relative px-2">
                <Link
                  href={link.href}
                  className={`relative z-10 px-3 py-1.5 rounded-lg transition-all duration-200 font-medium ${
                    active
                      ? 'text-[#8F1D14]'
                      : 'text-gray-700 hover:text-[#8F1D14] hover:bg-[#F89D13]/10'
                  }`}
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
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="absolute inset-0 bg-[#F89D13]/25 rounded-lg -z-0 shadow-sm"
                    />
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {logged && (
            <button
              onClick={logout}
              className="text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all font-medium"
            >
              Sair {nome ? `(${nome.split(' ')[0]})` : ''}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
