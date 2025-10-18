'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getToken } from '@/utils/auth';

const slides = [
  { id: 1, src: '/carrossel1.jpg', alt: 'Profissionais', legenda: 'Serviços rápidos e de confiança' },
  { id: 2, src: '/carrossel2.jpg', alt: 'Elétrica',      legenda: 'Encontre o profissional certo' },
  { id: 3, src: '/carrossel3.jpg', alt: 'Pintura',       legenda: 'Praticidade e segurança' },
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
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

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
            <img src={s.src} alt={s.alt} className="w-full h-full object-cover" />
            {/* overlay abaixo das setas/indicadores */}
            <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center">
              <h2 className="text-white text-3xl md:text-5xl font-bold text-center px-6 drop-shadow-lg">
                {s.legenda}
              </h2>
            </div>
          </div>
        ))}

        {/* Setas – acima do overlay */}
        <button
          onClick={() => setIndex((index - 1 + slides.length) % slides.length)}
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

      {/* Conteúdo abaixo */}
      <section className="flex flex-col items-center justify-center p-6 mt-10 text-center">
        <h1 className="text-4xl font-bold text-[#8F1D14] mb-4">
          {logged && nome ? `Bem-vindo, ${nome.split(' ')[0]}!` : 'Bem-vindo ao InterServ'}
        </h1>
        <p className="text-gray-700 max-w-md mb-10">
          Encontre profissionais de confiança para serviços rápidos, práticos e seguros.
        </p>

        <nav className="flex flex-col sm:flex-row gap-4">
          {logged ? (
            <>
              <Link
                href="/home"
                className="bg-[#8F1D14] text-white px-6 py-3 rounded-lg shadow-md hover:bg-[#a2261b] transition text-center"
              >
                Explorar serviços
              </Link>
              <Link
                href="/perfil"
                className="bg-white border border-[#8F1D14] text-[#8F1D14] px-6 py-3 rounded-lg shadow-md hover:bg-[#8F1D14] hover:text-white transition text-center"
              >
                Meu perfil
              </Link>
              <Link
                href="/servicos"
                className="bg-[#F89D13] text-white px-6 py-3 rounded-lg shadow-md hover:bg-[#e68a11] transition text-center"
              >
                Catálogo de Serviços
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="bg-[#8F1D14] text-white px-6 py-3 rounded-lg shadow-md hover:bg-[#a2261b] transition text-center"
              >
                Login
              </Link>
              <Link
                href="/cadastro"
                className="bg-white border border-[#8F1D14] text-[#8F1D14] px-6 py-3 rounded-lg shadow-md hover:bg-[#8F1D14] hover:text-white transition text-center"
              >
                Cadastro
              </Link>
              <Link
                href="/servicos"
                className="bg-[#F89D13] text-white px-6 py-3 rounded-lg shadow-md hover:bg-[#e68a11] transition text-center"
              >
                Catálogo de Serviços
              </Link>
            </>
          )}
        </nav>
      </section>
    </main>
  );
}
