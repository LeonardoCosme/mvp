// src/components/Footer.tsx
export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
        <p>
          © {new Date().getFullYear()} Marido de Aluguel • Smart Solutions+. Todos os
          direitos reservados.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center">
          <span className="text-xs text-gray-500 text-center sm:text-left">
            Plataforma desenvolvida em parceria com Fatec Ipiranga.
          </span>
          <a
            href="/contato"
            className="hover:underline text-[#8F1D14] font-medium"
          >
            Contato
          </a>
        </div>
      </div>
    </footer>
  );
}
