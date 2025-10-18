// src/components/Footer.tsx
export default function Footer() {
  return (
    <footer className="border-t bg-white/80">
      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
        <p>© {new Date().getFullYear()} SmartSolution (+). Todos os direitos reservados.</p>
        <div className="flex gap-4">
          <a href="/termos" className="hover:underline">Termos</a>
          <a href="/privacidade" className="hover:underline">Privacidade</a>
          <a href="/contato" className="hover:underline">Contato</a>
        </div>
      </div>
    </footer>
  );
}
