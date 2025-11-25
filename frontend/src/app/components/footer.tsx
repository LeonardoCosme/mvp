// src/components/Footer.tsx
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t bg-[#1f0e03]">
      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-gray-200">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 sm:h-9 sm:w-9">
            <Image
              src="/logo-smart.jpeg" // coloque aqui o nome que você salvar em /public
              alt="Logo Smart Solutions+"
              fill
              className="object-contain"
            />
          </div>
          <p className="leading-snug">
            Plataforma <span className="font-semibold">Marido de Aluguel</span> •
            Desenvolvida por <span className="font-semibold">Smart Solutions+</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="/contato"
            className="text-[#F89D13] hover:text-[#ffd089] font-medium"
          >
            Contato da equipe
          </a>
        </div>
      </div>
    </footer>
  );
}
