// frontend/src/components/Header/index.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, removeToken } from '../../utils/auth';
import { apiFetch } from '../../utils/api';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [logged, setLogged] = useState(false);
  const [nome, setNome] = useState<string | null>(null);
  const [tipo, setTipo] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const syncAuthState = async () => {
    const hasToken = !!getToken();
    setLogged(hasToken);

    if (typeof window === 'undefined' || !hasToken) return;

    // tenta carregar do localStorage
    let nomeLocal = window.localStorage.getItem('nomeUsuario');
    let tipoLocal =
      window.localStorage.getItem('tipo') ||
      window.localStorage.getItem('tipoUsuario');

    if (nomeLocal) setNome(nomeLocal);
    if (tipoLocal) setTipo(tipoLocal);

    // se faltou alguma info, busca na API /user/me
    if (!nomeLocal || !tipoLocal) {
      try {
        const me: any = await apiFetch('/user/me');
        const nomeApi: string | null =
          me?.nomeUsuario || me?.nome || null;
        const tipoApi: string | null =
          me?.tipo || me?.tipoUsuario || null;

        if (nomeApi) {
          setNome(nomeApi);
          window.localStorage.setItem('nomeUsuario', nomeApi);
        }
        if (tipoApi) {
          setTipo(tipoApi);
          window.localStorage.setItem('tipo', tipoApi);
        }
      } catch (e) {
        console.error('Erro ao carregar /user/me no Header:', e);
      }
    }
  };

  useEffect(() => {
    syncAuthState();
    // ao trocar de rota, fecha o menu mobile
    setMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setMenuOpen(false);
    router.push('/login');
  };

  const goToPerfil = () => {
    setMenuOpen(false);
    router.push('/perfil');
  };

  const isActive = (href: string) => {
    const base =
      'text-sm font-medium transition-colors';
    const active =
      'text-[#8F1D14]';
    const inactive =
      'text-gray-600 hover:text-[#8F1D14]';
    return `${base} ${pathname === href ? active : inactive}`;
  };

  // ---- Estilos do botão de perfil conforme o tipo ----
  const tipoNorm = (tipo || '').toLowerCase().trim();
  const basePerfilBtn =
    'flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full shadow-sm transition-colors';

  let perfilBtnClass =
    basePerfilBtn + ' bg-gray-200 text-gray-800 hover:bg-gray-300';

  if (tipoNorm === 'contratante') {
    perfilBtnClass =
      basePerfilBtn +
      ' bg-[#F89D13] text-white hover:bg-[#e68a11]';
  } else if (tipoNorm === 'prestador') {
    perfilBtnClass =
      basePerfilBtn +
      ' bg-[#2563eb] text-white hover:bg-[#1d4ed8]';
  } else if (tipoNorm === 'master') {
    perfilBtnClass =
      basePerfilBtn +
      ' bg-gray-800 text-white hover:bg-gray-700';
  }

  const displayName = nome || 'Usuário';
  const initial = displayName[0]?.toUpperCase() || 'U';
  const tipoLabel =
    tipoNorm === 'contratante'
      ? 'Contratante'
      : tipoNorm === 'prestador'
      ? 'Prestador'
      : tipoNorm === 'master'
      ? 'Master'
      : '';

  return (
    <header className="w-full bg-white/95 shadow-sm fixed top-0 left-0 right-0 z-30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between py-3 md:py-4">
          {/* Logo / nome do sistema */}
          <Link href="/home" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-[#F89D13]/10 flex items-center justify-center border border-[#F89D13]/40">
              <span className="text-lg" aria-hidden>
                🛠️
              </span>
            </div>
            <div className="leading-tight">
              <span className="block text-[11px] font-semibold tracking-[0.14em] uppercase text-[#F89D13]">
                Plataforma
              </span>
              <span className="block text-[18px] md:text-[20px] font-extrabold text-[#3b2210]">
                Marido de{' '}
                <span className="text-[#8F1D14]">
                  Aluguel
                </span>
              </span>
            </div>
          </Link>

          {/* Botão mobile (hambúrguer) */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-full border border-gray-200 p-2 text-gray-700 hover:bg-gray-50"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Abrir menu"
          >
            <span className="sr-only">Abrir menu</span>
            {/* Ícone hambúrguer simples */}
            <div className="space-y-1">
              <span className={`block h-0.5 w-5 rounded-full bg-gray-700 transition-transform ${menuOpen ? 'translate-y-1.5 rotate-45' : ''}`} />
              <span className={`block h-0.5 w-5 rounded-full bg-gray-700 transition-opacity ${menuOpen ? 'opacity-0' : 'opacity-100'}`} />
              <span className={`block h-0.5 w-5 rounded-full bg-gray-700 transition-transform ${menuOpen ? '-translate-y-1.5 -rotate-45' : ''}`} />
            </div>
          </button>

          {/* Navegação + usuário (desktop) */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-5">
              <Link href="/home" className={isActive('/home')}>
                Home
              </Link>
              <Link
                href="/agendamento"
                className={isActive('/agendamento')}
              >
                Agendamentos
              </Link>
              <Link
                href="/servicos"
                className={isActive('/servicos')}
              >
                Serviços
              </Link>
            </nav>

            {/* Usuário / login */}
            <div className="flex items-center gap-3">
              {!logged ? (
                <>
                  <Link
                    href="/login"
                    className="px-3 py-1.5 rounded-full border border-[#8F1D14]/40 text-[#8F1D14] text-sm font-semibold hover:bg-[#8F1D14]/5"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/cadastro"
                    className="px-3 py-1.5 rounded-full bg-[#8F1D14] text-white text-sm font-semibold hover:bg-[#a2261b]"
                  >
                    Cadastre-se
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={goToPerfil}
                    className={perfilBtnClass}
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold uppercase">
                      {initial}
                    </span>
                    <div className="flex flex-col leading-tight text-left">
                      <span className="text-sm truncate max-w-[140px]">
                        {displayName}
                      </span>
                      {tipoLabel && (
                        <span className="text-[10px] opacity-90">
                          {tipoLabel}
                        </span>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-full bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
                  >
                    Sair
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Menu mobile expandido */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/98 pb-3">
            <nav className="flex flex-col gap-2 pt-2">
              <Link
                href="/home"
                className={`${isActive('/home')} px-1`}
                onClick={() => setMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/agendamento"
                className={`${isActive('/agendamento')} px-1`}
                onClick={() => setMenuOpen(false)}
              >
                Agendamentos
              </Link>
              <Link
                href="/servicos"
                className={`${isActive('/servicos')} px-1`}
                onClick={() => setMenuOpen(false)}
              >
                Serviços
              </Link>
            </nav>

            <div className="mt-3 flex flex-col gap-2">
              {!logged ? (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-center px-3 py-2 rounded-full border border-[#8F1D14]/40 text-[#8F1D14] text-sm font-semibold hover:bg-[#8F1D14]/5"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/cadastro"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-center px-3 py-2 rounded-full bg-[#8F1D14] text-white text-sm font-semibold hover:bg-[#a2261b]"
                  >
                    Cadastre-se
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={goToPerfil}
                    className={`${perfilBtnClass} w-full justify-start`}
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold uppercase">
                      {initial}
                    </span>
                    <div className="flex flex-col leading-tight text-left">
                      <span className="text-sm truncate">
                        {displayName}
                      </span>
                      {tipoLabel && (
                        <span className="text-[10px] opacity-90">
                          {tipoLabel}
                        </span>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-center px-3 py-2 rounded-full bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
                  >
                    Sair
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
