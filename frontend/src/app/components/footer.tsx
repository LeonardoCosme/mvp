// src/components/Footer.tsx
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-gray-600">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 sm:h-9 sm:w-9">
            <Image
              src="/logo-smart.jpeg"
              alt="Logo Smart Solutions+"
              fill
              className="object-contain"
            />
          </div>
          <p className="leading-snug">
            Plataforma <span className="font-semibold">Marido de Aluguel</span> •
            desenvolvida por <span className="font-semibold">Smart Solutions+</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="/contato"
            className="text-[#8F1D14] hover:text-[#F89D13] font-medium"
          >
            Contato da equipe
          </a>
        </div>
      </div>
    </footer>
  );
}
