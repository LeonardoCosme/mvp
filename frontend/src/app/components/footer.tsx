// src/components/Footer.tsx
export default function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="border-t bg-white/95 mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-gray-500">
        <p className="text-center sm:text-left">
          © {ano} Marido de Aluguel. Desenvolvido por SmartSolution (+).
        </p>

        <div className="flex items-center gap-3">
          <a
            href="/contato"
            className="font-medium text-[#8F1D14] hover:text-[#a2261b] hover:underline"
          >
            Fale conosco
          </a>
        </div>
      </div>
    </footer>
  );
}
