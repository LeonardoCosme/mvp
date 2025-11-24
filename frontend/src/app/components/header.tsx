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
        // se der erro, não quebra o header
        console.error('Erro ao carregar /user/me no Header:', e);
      }
    }
  };

  useEffect(() => {
    // sempre que trocar de rota, revalida estado de login
    syncAuthState();
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
    router.push('/login');
  };

  const goToPerfil = () => {
    router.push('/perfil');
  };

  const isActive = (href: string) =>
    pathname === href ? 'text-[#8F1D14] font-semibold' : 'text-gray-700';

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
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo / nome do sistema */}
        <Link href="/home" className="flex items-center gap-2">
          <span className="text-lg font-extrabold text-[#8F1D14] leading-tight">
            Marido de
            <span className="block text-sm text-gray-800">
              Aluguel
            </span>
          </span>
        </Link>

        {/* Navegação */}
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/home" className={isActive('/home')}>
            Home
          </Link>
          <Link
            href="/agendamento"
            className={isActive('/agendamento')}
          >
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
              {/* Botão de perfil colorido conforme o tipo */}
              <button
                type="button"
                onClick={goToPerfil}
                className={perfilBtnClass}
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold uppercase">
                  {initial}
                </span>
                <div className="flex flex-col leading-tight text-left">
                  <span className="text-xs opacity-90">
                    Meu perfil
                  </span>
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
