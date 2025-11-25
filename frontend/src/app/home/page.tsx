// frontend/src/app/home/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getToken } from '../../utils/auth';

const slides = [
  { id: 1, src: '/carrossel1.jpg', alt: 'Profissionais', legenda: 'Serviços rápidos e de confiança' },
  { id: 2, src: '/carrossel2.jpg', alt: 'Elétrica', legenda: 'Encontre o profissional certo' },
  { id: 3, src: '/carrossel3.jpg', alt: 'Pintura', legenda: 'Praticidade e segurança' },
];

export default function LandingPage() {
  const [index, setIndex] = useState(0);
  const [logged, setLogged] = useState(false);
  const [nome, setNome] = useState<string | null>(null);

  useEffect(() => {
    const has = !!getToken();
    setLogged(has);
    if (typeof window !== 'undefined') {
      setNome(localStorage.getItem('nomeUsuario'));
    }
  }, []);

  useEffect(() => {
    const t = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      5000
    );
    return () => clearInterval(t);
  }, []);

  const primeiroNome = nome ? nome.split(' ')[0] : null;

  return (
    <main className="min-h-screen bg-[#F89D13]/10 flex flex-col items-center justify-start">
      {/* Carrossel */}
      <section className="relative w-full h-[70vh] overflow-hidden">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.src}
              alt={s.alt}
              className="w-full h-full object-cover"
            />
            {/* overlay com título do slide */}
            <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center">
              <h2 className="text-white text-3xl md:text-5xl font-bold text-center px-6 drop-shadow-lg">
                {s.legenda}
              </h2>
            </div>
          </div>
        ))}

        {/* Setas – acima do overlay */}
        <button
          onClick={() =>
            setIndex((index - 1 + slides.length) % slides.length)
          }
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white px-3 py-2 rounded-full z-20 shadow-md hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/60"
          aria-label="Slide anterior"
          type="button"
        >
          ‹
        </button>
        <button
          onClick={() => setIndex((index + 1) % slides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white px-3 py-2 rounded-full z-20 shadow-md hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/60"
          aria-label="Próximo slide"
          type="button"
        >
          ›
        </button>

        {/* Indicadores – acima do overlay */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              className={`w-3 h-3 rounded-full border border-white shadow ${
                i === index ? 'bg-white' : 'bg-white/40'
              }`}
              aria-label={`Ir para slide ${i + 1}`}
              aria-current={i === index}
              type="button"
            />
          ))}
        </div>
      </section>

      {/* Bloco de boas-vindas */}
      <section className="w-full bg-[#2b1304] text-center py-14 md:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#f97359] mb-4">
            {logged && primeiroNome
              ? `Bem-vindo, ${primeiroNome}!`
              : 'Bem-vindo ao Marido de Aluguel'}
          </h1>

          {/* Caixa clara para o texto descritivo */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-md px-5 py-4 md:px-7 md:py-5 inline-block max-w-2xl">
            <p className="text-sm md:text-base text-gray-800 leading-relaxed">
              Encontre profissionais de confiança para serviços rápidos,
              práticos e seguros. Você agenda pelo sistema e acompanha
              cada etapa com mais organização e tranquilidade.
            </p>
          </div>

          {/* Botões de ação */}
          <nav className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            {logged ? (
              <>
                <Link
                  href="/servicos"
                  className="bg-[#b91c1c] text-white px-6 py-2.5 rounded-lg shadow-md hover:bg-[#991b1b] transition text-sm md:text-base text-center"
                >
                  Explorar serviços
                </Link>

                <Link
                  href="/perfil"
                  className="bg-white border border-[#8F1D14]/40 text-[#8F1D14] px-6 py-2.5 rounded-lg shadow-md hover:bg-[#fef3e7] transition text-sm md:text-base text-center"
                >
                  Meu perfil
                </Link>

                <Link
                  href="/agendamento"
                  className="bg-[#F89D13] text-white px-6 py-2.5 rounded-lg shadow-md hover:bg-[#e68a11] transition text-sm md:text-base text-center"
                >
                  Meus agendamentos
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="bg-[#8F1D14] text-white px-6 py-2.5 rounded-lg shadow-md hover:bg-[#a2261b] transition text-sm md:text-base text-center"
                >
                  Login
                </Link>
                <Link
                  href="/cadastro"
                  className="bg-white border border-[#8F1D14]/40 text-[#8F1D14] px-6 py-2.5 rounded-lg shadow-md hover:bg-[#fef3e7] transition text-sm md:text-base text-center"
                >
                  Cadastro
                </Link>
                <Link
                  href="/servicos"
                  className="bg-[#F89D13] text-white px-6 py-2.5 rounded-lg shadow-md hover:bg-[#e68a11] transition text-sm md:text-base text-center"
                >
                  Catálogo de Serviços
                </Link>
              </>
            )}
          </nav>
        </div>
      </section>
    </main>
  );
}
