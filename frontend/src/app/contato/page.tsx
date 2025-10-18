// src/app/contato/page.tsx
'use client';

import Link from 'next/link';

type Member = {
  name: string;
  role?: string;
  linkedin: string;
  // Coloque a foto em /public/team/<arquivo>. Ex.: /public/team/leonardo.jpg
  // Deixe em branco para mostrar as iniciais com um degradê.
  photo?: string;
  initials: string; // fallback quando não houver foto
};

const team: Member[] = [
  {
    name: 'Leonardo Cosme',
    role: 'Dev • Backend',
    linkedin: 'https://www.linkedin.com/in/leonardo-cosme-b565ba19b/',
    photo: '/team/leonardo.jpeg',
    initials: 'LC',
  },
  {
    name: 'Caio Cézar Devido',
    role: 'Dev • Frontend',
    linkedin: 'https://www.linkedin.com/in/caio-c%C3%A9zar-devido-778a84198/',
    photo: '/team/caio.jpeg',
    initials: 'CD',
  },
  {
    name: 'Carlos Roberto F. Santos',
    role: 'Dev • Fullstack',
    linkedin: 'https://www.linkedin.com/in/carlos-rf-santos/',
    photo: '/team/carlos.jpeg',
    initials: 'CS',
  },
];

export default function ContatoPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F89D13]/30 to-[#8F1D14]/10 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#8F1D14]">Contato</h1>
          <p className="text-gray-700 mt-2">
            Conecte-se com os membros do nosso time no LinkedIn.
          </p>
        </header>

        {/* Cards do time */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((m) => (
            <article
              key={m.linkedin}
              className="bg-white/90 backdrop-blur-md rounded-2xl shadow-md p-6 flex flex-col items-center text-center transition hover:shadow-lg"
            >
              {/* Avatar circular com foto (ou fallback de iniciais) */}
              <div className="relative w-28 h-28 mb-4">
                {m.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.photo}
                    alt={`Foto de ${m.name}`}
                    className="w-28 h-28 rounded-full object-cover border-4 border-white shadow"
                    onError={(e) => {
                      // se a imagem falhar, esconde e mostra o fallback abaixo
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                      const fallback = document.getElementById(`fallback-${m.initials}`);
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}

                {/* Fallback com iniciais */}
                <div
                  id={`fallback-${m.initials}`}
                  style={{ display: m.photo ? 'none' : 'flex' }}
                  className="absolute inset-0 rounded-full items-center justify-center text-white font-bold text-2xl shadow"
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-[#F89D13] to-[#8F1D14] flex items-center justify-center">
                    {m.initials}
                  </div>
                </div>
              </div>

              {/* Nome e função */}
              <h2 className="text-lg font-semibold text-gray-900">{m.name}</h2>
              {m.role && <p className="text-gray-600 text-sm mb-4">{m.role}</p>}

              {/* Botões */}
              <div className="flex flex-col gap-2 w-full">
                <a
                  href={m.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full gap-2 bg-[#0A66C2] text-white rounded-xl py-2 shadow hover:opacity-90 transition"
                  aria-label={`Abrir LinkedIn de ${m.name}`}
                  title="Abrir LinkedIn"
                >
                  {/* Ícone simples de LinkedIn (SVG) */}
                  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0V8zm7.5 0h4.8v2.2h.1c.7-1.3 2.4-2.7 4.9-2.7 5.2 0 6.2 3.4 6.2 7.8V24h-5V16c0-1.9 0-4.4-2.7-4.4-2.7 0-3.1 2.1-3.1 4.2V24h-5V8z"
                    />
                  </svg>
                  LinkedIn
                </a>

                <Link
                  href="/home"
                  className="inline-flex items-center justify-center w-full gap-2 bg-white border border-[#F89D13] text-[#8F1D14] rounded-xl py-2 shadow-sm hover:bg-[#F89D13]/10 transition"
                >
                  Voltar para a Home
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
