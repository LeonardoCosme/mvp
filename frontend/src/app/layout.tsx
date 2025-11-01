import type { Metadata } from 'next';
import './globals.css';
import Header from './components/header';
import Footer from './components/footer';
import ClientWatcher from './ClientWatcher'; // 👈 componente de cliente separado

export const metadata: Metadata = {
  title: 'InterServ',
  description: 'Encontre profissionais de confiança',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Ícone fallback */}
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F89D13]/10">
        {/* 🔸 Script client-side para autenticação */}
        <ClientWatcher />

        {/* 🔹 Estrutura da página */}
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
